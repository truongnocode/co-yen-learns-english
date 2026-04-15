/**
 * Firebase ID token verification for Cloudflare Workers.
 *
 * firebase-admin does NOT run cleanly in Workers (Node.js APIs). Instead we
 * verify RS256 JWTs directly against Google's published public keys, cached
 * in-memory per-instance for the key rotation window.
 *
 * This is a minimal verifier — enough for our `/admin` endpoints. It enforces:
 *   - Signature (RS256) against Google's published certs
 *   - Issuer == https://securetoken.google.com/{project_id}
 *   - Audience == project_id
 *   - exp in the future, iat in the past
 *   - sub (uid) present
 */

import type { Context, MiddlewareHandler } from "hono";
import type { Env } from "./env";

const GOOGLE_CERTS_URL =
  "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com";

interface DecodedToken {
  uid: string;
  email?: string;
  admin?: boolean;
  raw: Record<string, unknown>;
}

interface CertCache {
  fetchedAt: number;
  expiresAt: number;
  keys: Record<string, CryptoKey>;
}

// Per-isolate cache. Cloudflare Workers may spin up many isolates, each pays the
// first-fetch cost, but subsequent verifications within the same isolate reuse keys.
let certCache: CertCache | null = null;

async function getGoogleCerts(): Promise<Record<string, CryptoKey>> {
  const now = Date.now();
  if (certCache && certCache.expiresAt > now) return certCache.keys;

  const res = await fetch(GOOGLE_CERTS_URL);
  if (!res.ok) throw new Error(`Failed to fetch Google certs: ${res.status}`);

  // Google sets Cache-Control: public, max-age=... — respect it.
  const cacheControl = res.headers.get("cache-control") ?? "";
  const maxAgeMatch = cacheControl.match(/max-age=(\d+)/);
  const maxAgeMs = maxAgeMatch ? parseInt(maxAgeMatch[1], 10) * 1000 : 3600_000;

  const certs = (await res.json()) as Record<string, string>;
  const keys: Record<string, CryptoKey> = {};

  for (const [kid, pem] of Object.entries(certs)) {
    keys[kid] = await importX509Pem(pem);
  }

  certCache = { fetchedAt: now, expiresAt: now + maxAgeMs, keys };
  return keys;
}

/** Import an X.509 PEM cert as a CryptoKey for RS256 JWT verification. */
async function importX509Pem(pem: string): Promise<CryptoKey> {
  const b64 = pem
    .replace(/-----BEGIN CERTIFICATE-----/g, "")
    .replace(/-----END CERTIFICATE-----/g, "")
    .replace(/\s+/g, "");
  const der = base64ToUint8(b64);
  // Extract SPKI from the X.509 cert (parse minimally — SubtleCrypto doesn't
  // accept raw X.509 directly on all runtimes). Workers do accept "spki" from
  // the cert's SubjectPublicKeyInfo, so we parse it out.
  const spki = extractSpkiFromX509(der);
  return crypto.subtle.importKey(
    "spki",
    spki,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"],
  );
}

/**
 * Walk the DER-encoded X.509 cert to pull out the SubjectPublicKeyInfo.
 * Structure (simplified):
 *   Certificate ::= SEQUENCE {
 *     tbsCertificate SEQUENCE { ... signatureAlgorithm, issuer, validity,
 *                               subject, subjectPublicKeyInfo, ... },
 *     ...
 *   }
 * We find the SPKI by locating the innermost SEQUENCE that starts with the
 * RSA OID `1.2.840.113549.1.1.1` (DER: 30 0d 06 09 2a 86 48 86 f7 0d 01 01 01).
 */
function extractSpkiFromX509(der: Uint8Array): ArrayBuffer {
  const marker = new Uint8Array([
    0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01,
  ]);
  const idx = indexOfSubarray(der, marker);
  if (idx < 0) throw new Error("SPKI marker not found in X.509 cert");

  // Walk back to the SEQUENCE tag (0x30) that encloses AlgorithmIdentifier +
  // subjectPublicKey BIT STRING. We scan backwards a small window; SPKI length
  // is encoded just after the 0x30 tag.
  for (let back = 4; back <= 8; back++) {
    const tag = der[idx - back];
    if (tag !== 0x30) continue;
    const { length, headerLen } = readDerLength(der, idx - back + 1);
    const total = headerLen + length + 1; // +1 for the 0x30 tag itself
    const start = idx - back;
    const end = start + total;
    if (end <= der.length) {
      return der.slice(start, end).buffer as ArrayBuffer;
    }
  }
  throw new Error("Could not extract SPKI SEQUENCE from X.509 cert");
}

function readDerLength(
  buf: Uint8Array,
  offset: number,
): { length: number; headerLen: number } {
  const first = buf[offset];
  if (first < 0x80) return { length: first, headerLen: 1 };
  const numBytes = first & 0x7f;
  let length = 0;
  for (let i = 0; i < numBytes; i++) length = (length << 8) | buf[offset + 1 + i];
  return { length, headerLen: 1 + numBytes };
}

function indexOfSubarray(hay: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= hay.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function base64ToUint8(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function base64UrlToUint8(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/").padEnd(
    Math.ceil(b64url.length / 4) * 4,
    "=",
  );
  return base64ToUint8(b64);
}

function uint8ToString(buf: Uint8Array): string {
  return new TextDecoder().decode(buf);
}

export async function verifyFirebaseIdToken(
  token: string,
  env: Env,
): Promise<DecodedToken> {
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Malformed JWT");

  const [headerB64, payloadB64, sigB64] = parts;
  const header = JSON.parse(uint8ToString(base64UrlToUint8(headerB64))) as {
    alg: string;
    kid: string;
  };
  if (header.alg !== "RS256") throw new Error(`Unsupported alg: ${header.alg}`);

  const keys = await getGoogleCerts();
  const key = keys[header.kid];
  if (!key) throw new Error(`Unknown kid: ${header.kid}`);

  const signed = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const sig = base64UrlToUint8(sigB64);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    sig,
    signed,
  );
  if (!ok) throw new Error("Invalid signature");

  const payload = JSON.parse(
    uint8ToString(base64UrlToUint8(payloadB64)),
  ) as Record<string, unknown>;

  const now = Math.floor(Date.now() / 1000);
  if (typeof payload.exp !== "number" || payload.exp < now) {
    throw new Error("Token expired");
  }
  if (typeof payload.iat !== "number" || payload.iat > now + 60) {
    throw new Error("Token issued in the future");
  }
  if (payload.iss !== `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`) {
    throw new Error("Invalid issuer");
  }
  if (payload.aud !== env.FIREBASE_PROJECT_ID) {
    throw new Error("Invalid audience");
  }
  const uid = payload.sub ?? payload.user_id;
  if (typeof uid !== "string" || uid.length === 0) {
    throw new Error("Missing uid (sub)");
  }

  return {
    uid,
    email: typeof payload.email === "string" ? payload.email : undefined,
    admin: payload.admin === true,
    raw: payload,
  };
}

/** Hono middleware: requires a valid Firebase ID token with admin custom claim. */
export const requireAdmin: MiddlewareHandler<{ Bindings: Env; Variables: { user: DecodedToken } }> =
  async (c, next) => {
    const authHeader = c.req.header("Authorization") ?? "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) return c.json({ error: "Missing Bearer token" }, 401);

    let decoded: DecodedToken;
    try {
      decoded = await verifyFirebaseIdToken(m[1], c.env);
    } catch (e) {
      return c.json({ error: `Invalid token: ${(e as Error).message}` }, 401);
    }

    if (!decoded.admin) {
      return c.json({ error: "Admin claim required" }, 403);
    }

    c.set("user", decoded);
    await next();
  };

/** Hono middleware: requires a valid Firebase ID token (any signed-in user). */
export const requireUser: MiddlewareHandler<{ Bindings: Env; Variables: { user: DecodedToken } }> =
  async (c, next) => {
    const authHeader = c.req.header("Authorization") ?? "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) return c.json({ error: "Missing Bearer token" }, 401);

    let decoded: DecodedToken;
    try {
      decoded = await verifyFirebaseIdToken(m[1], c.env);
    } catch (e) {
      return c.json({ error: `Invalid token: ${(e as Error).message}` }, 401);
    }

    c.set("user", decoded);
    await next();
  };

export type { DecodedToken };

/**
 * Grant Firebase admin custom claim to a user by email.
 *
 * Usage:
 *   node scripts/grant-admin.mjs teacher@example.com
 *
 * Requires a Firebase service-account JSON at one of:
 *   - $GOOGLE_APPLICATION_CREDENTIALS (path to JSON)
 *   - ./serviceAccount.json (gitignored — create locally only)
 *
 * The teacher must sign out and back in (or refresh their ID token) for the
 * claim to take effect on the client.
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";

const email = process.argv[2];
if (!email) {
  console.error("Usage: node scripts/grant-admin.mjs <email>");
  process.exit(1);
}

function loadCredentials() {
  const envPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const candidates = [envPath, resolve("serviceAccount.json")].filter(Boolean);
  for (const p of candidates) {
    try {
      return JSON.parse(readFileSync(p, "utf-8"));
    } catch {
      /* continue */
    }
  }
  throw new Error(
    "Service account not found. Set GOOGLE_APPLICATION_CREDENTIALS or place serviceAccount.json in repo root.",
  );
}

const serviceAccount = loadCredentials();
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const user = await admin.auth().getUserByEmail(email);
const existing = user.customClaims ?? {};
await admin.auth().setCustomUserClaims(user.uid, { ...existing, admin: true });
console.log(`✓ Granted admin claim to ${email} (uid: ${user.uid})`);
console.log("  User must sign out and back in to pick up the new claim.");
process.exit(0);

/**
 * Worker environment bindings.
 *
 * Vars come from wrangler.jsonc `vars`; secrets come from `wrangler secret put`.
 */
export interface Env {
  // Vars
  ALLOWED_ORIGIN: string;
  FIREBASE_PROJECT_ID: string;

  // Secrets
  GEMINI_API_KEY: string;
}

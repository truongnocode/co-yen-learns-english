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
  ANTHROPIC_API_KEY: string;
  OPENAI_API_KEY?: string;
  FIREBASE_CLIENT_EMAIL: string;
  FIREBASE_PRIVATE_KEY: string;
}

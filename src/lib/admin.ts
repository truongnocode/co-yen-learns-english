export const ADMIN_EMAILS = ["truongnq.vie@gmail.com", "buiyen.701@gmail.com"] as const;

export function isAdminEmail(email?: string | null): boolean {
  return !!email && ADMIN_EMAILS.includes(email.toLowerCase() as (typeof ADMIN_EMAILS)[number]);
}

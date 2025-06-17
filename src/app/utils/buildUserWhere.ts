export function buildUserWhere(email?: string | null, ip?: string | null) {
  if (email) return { email };
  if (ip) return { ip };
  throw new Error("No user identifier supplied");
}

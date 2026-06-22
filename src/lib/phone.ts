// Validate & normalize a Vietnamese MOBILE number (post-2018 10-digit plan).
// Accepts "0xxxxxxxxx", "+84xxxxxxxxx", "84xxxxxxxxx" with spaces/dots/dashes.
// Returns the normalized local form "0xxxxxxxxx" if valid, else null.

// 3-digit mobile prefixes by carrier (current as of 2024-2025).
const VN_MOBILE_PREFIXES = new Set([
  // Viettel
  "032", "033", "034", "035", "036", "037", "038", "039", "086", "096", "097", "098",
  // MobiFone
  "070", "076", "077", "078", "079", "089", "090", "093",
  // VinaPhone
  "081", "082", "083", "084", "085", "088", "091", "094",
  // Vietnamobile
  "052", "056", "058", "092",
  // Gmobile
  "059", "099",
  // iTelecom
  "087",
]);

export function normalizeVnMobile(raw: string): string | null {
  if (!raw) return null;
  let s = raw.trim().replace(/[\s.\-()]/g, "");
  if (s.startsWith("+84")) s = "0" + s.slice(3);
  else if (s.startsWith("84") && s.length === 11) s = "0" + s.slice(2);
  if (!/^0\d{9}$/.test(s)) return null; // exactly 10 digits, leading 0
  if (!VN_MOBILE_PREFIXES.has(s.slice(0, 3))) return null;
  return s;
}

export const isValidVnMobile = (raw: string): boolean => normalizeVnMobile(raw) !== null;

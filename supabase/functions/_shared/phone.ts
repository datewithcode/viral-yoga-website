// 98765 43210 and +91 98765 43210 both become 919876543210, the form stored in
// the members table and the enquiries table.
export function normalisePhone(raw: unknown): string {
  const digits = String(raw ?? "").replace(/\D/g, "");
  return digits.length === 10 ? "91" + digits : digits;
}

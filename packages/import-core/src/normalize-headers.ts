/**
 * Normalizes source headers for matching and mapping.
 * Examples: " First Name " -> "first_name", "E-mail" -> "e_mail".
 */
export function normalizeHeader(header: string): string {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

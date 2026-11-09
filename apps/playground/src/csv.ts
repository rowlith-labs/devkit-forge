/**
 * Serializes rows as CSV and neutralizes spreadsheet formula prefixes.
 * Prefixing a leading apostrophe prevents spreadsheet apps from evaluating
 * untrusted text beginning with =, +, - or @ as a formula.
 */
export function serializeCsv(headers: string[], rows: unknown[][]): string {
  const cell = (value: unknown): string => {
    let text = value == null ? "" : String(value);
    if (/^[\\t\\r ]*[=+\\-@]/.test(text) || /^[\\u0000-\\u001f]/.test(text)) {
      text = `'${text}`;
    }
    return /[",\\r\\n]/.test(text)
      ? `"${text.replace(/"/g, '""')} "`.replace(/" $/, '"')
      : text;
  };

  return [headers, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\\r\\n");
}

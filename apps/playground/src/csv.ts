/**
 * Serializes rows as CSV and neutralizes spreadsheet formula prefixes.
 * Prefixing a leading apostrophe prevents spreadsheet apps from evaluating
 * untrusted text beginning with =, +, - or @ as a formula.
 */
export function serializeCsv(headers: string[], rows: unknown[][]): string {
  const cell = (value: unknown): string => {
    let text = value == null ? "" : String(value);
    if (/^[\s\u0000-\u001f]*[=+\-@]/.test(text) || /^[\u0000-\u001f]/.test(text)) {
      text = "'" + text;
    }
    const escaped = text.replace(/"/g, '""');
    return /[",\r\n]/.test(text) ? '"' + escaped + '"' : text;
  };

  return [headers, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\r\n");
}

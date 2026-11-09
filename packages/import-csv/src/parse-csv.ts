import Papa from "papaparse";
import type { RawImportRow } from "@devkit-forge/import-core";
import type { CsvIssue, CsvParseOptions, CsvParseResult } from "./types.js";

function setOwnValue(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

export function parseCsvText(
  input: string,
  options: CsvParseOptions = {},
): CsvParseResult {
  const parsed = Papa.parse<string[]>(input, {
    header: false,
    dynamicTyping: false,
    skipEmptyLines: options.skipEmptyLines ?? "greedy",
    ...(options.delimiter ? { delimiter: options.delimiter } : {}),
  });

  const source = parsed.data;
  const issues: CsvIssue[] = parsed.errors.map((error) => ({
    code: "parser-error",
    message: error.message,
    ...(typeof error.row === "number" ? { rowIndex: error.row } : {}),
  }));

  if (source.length === 0) {
    return {
      headers: [],
      data: [],
      records: [],
      issues,
      delimiter: parsed.meta.delimiter,
      rowCount: 0,
      hasErrors: issues.length > 0,
    };
  }

  const trimHeaders = options.trimHeaders ?? true;
  const headers = (source[0] ?? []).map((header) =>
    trimHeaders ? header.trim() : header,
  );
  const data = source.slice(1);
  const seen = new Map<string, number>();

  headers.forEach((header, columnIndex) => {
    if (!header) {
      issues.push({
        code: "empty-header",
        message: `Header at column ${columnIndex + 1} is empty.`,
        columnIndex,
      });
      return;
    }

    const firstIndex = seen.get(header);
    if (firstIndex !== undefined) {
      issues.push({
        code: "duplicate-header",
        message: `Header "${header}" is duplicated (columns ${firstIndex + 1} and ${columnIndex + 1}).`,
        columnIndex,
      });
    } else {
      seen.set(header, columnIndex);
    }
  });

  const hasUsableHeaders =
    headers.length > 0 && headers.every((header) => header.length > 0) &&
    seen.size === headers.length;

  const records: RawImportRow[] | null = hasUsableHeaders
    ? data.map((values) => {
        const record: RawImportRow = {};
        headers.forEach((header, index) => {
          setOwnValue(record, header, values[index] ?? "");
        });
        return record;
      })
    : null;

  data.forEach((values, rowIndex) => {
    if (values.length !== headers.length) {
      issues.push({
        code: "row-width",
        message: `Row has ${values.length} cells; expected ${headers.length}.`,
        rowIndex,
      });
    }
  });

  return {
    headers,
    data,
    records,
    issues,
    delimiter: parsed.meta.delimiter,
    rowCount: data.length,
    hasErrors: issues.length > 0,
  };
}

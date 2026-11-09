import Papa from "papaparse";
import { parseCsvText } from "./parse-csv.js";
import type {
  CsvIssue,
  CsvParseOptions,
  CsvStreamOptions,
  CsvStreamResult,
} from "./types.js";

function inspectHeaders(headers: string[], issues: CsvIssue[]): void {
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
}

/**
 * Streams a browser File in parser chunks without accumulating all rows in memory.
 * The first non-empty parsed row is treated as the header row.
 */
export function streamCsvFile(
  file: File,
  options: CsvStreamOptions,
): Promise<CsvStreamResult> {
  return new Promise((resolve, reject) => {
    const issues: CsvIssue[] = [];
    let headers: string[] = [];
    let headerParsed = false;
    let rowCount = 0;
    let delimiter = options.delimiter ?? ",";
    let settled = false;
    let chunkCallbackUsed = false;

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    Papa.parse<string[]>(file, {
      header: false,
      dynamicTyping: false,
      worker: false,
      chunkSize: options.chunkSize ?? 1024 * 1024,
      skipEmptyLines: options.skipEmptyLines ?? "greedy",
      ...(options.delimiter ? { delimiter: options.delimiter } : {}),
      chunk(results, parser) {
        chunkCallbackUsed = true;
        try {
          delimiter = results.meta.delimiter || delimiter;
          results.errors.forEach((error) => {
            issues.push({
              code: "parser-error",
              message: error.message,
              ...(typeof error.row === "number"
                ? { rowIndex: rowCount + error.row }
                : {}),
            });
          });

          const rows = results.data;
          let firstDataIndex = 0;

          if (!headerParsed && rows.length > 0) {
            const shouldTrim = options.trimHeaders ?? true;
            headers = (rows[0] ?? []).map((value) =>
              shouldTrim ? value.trim() : value,
            );
            inspectHeaders(headers, issues);
            headerParsed = true;
            firstDataIndex = 1;
          }

          const batch = rows.slice(firstDataIndex);
          batch.forEach((values, batchIndex) => {
            if (values.length !== headers.length) {
              issues.push({
                code: "row-width",
                message: `Row has ${values.length} cells; expected ${headers.length}.`,
                rowIndex: rowCount + batchIndex,
              });
            }
          });

          if (batch.length > 0) {
            options.onRows(batch, rowCount);
            rowCount += batch.length;
          }
        } catch (error) {
          parser.abort();
          fail(error);
        }
      },
      complete(results) {
        if (settled) return;
        try {
          // Papa Parse may deliver a final sub-chunk through complete() rather than chunk().
          if (results?.data?.length && rowCount === 0) {
            delimiter = results.meta.delimiter || delimiter;
            const rows = results.data;
            let firstDataIndex = 0;
            if (!headerParsed && rows.length > 0) {
              const shouldTrim = options.trimHeaders ?? true;
              headers = (rows[0] ?? []).map((value) =>
                shouldTrim ? value.trim() : value,
              );
              inspectHeaders(headers, issues);
              headerParsed = true;
              firstDataIndex = 1;
            }
            const batch = rows.slice(firstDataIndex);
            batch.forEach((values, batchIndex) => {
              if (values.length !== headers.length) {
                issues.push({
                  code: "row-width",
                  message: `Row has ${values.length} cells; expected ${headers.length}.`,
                  rowIndex: batchIndex,
                });
              }
            });
            if (batch.length > 0) {
              options.onRows(batch, 0);
              rowCount = batch.length;
            }
          }
          results.errors.forEach((error) => {
              issues.push({
                code: "parser-error",
                message: error.message,
                ...(typeof error.row === "number" ? { rowIndex: error.row } : {}),
              });
            });
          }
          settled = true;
        } catch (error) {
          fail(error);
          return;
        }
        resolve({
          headers,
          issues,
          delimiter,
          rowCount,
          hasErrors: issues.length > 0,
        });
      },
      error(error) {
        fail(error);
      },
    });
  });
}

/** Convenience helper for small files; reads the full file into memory. */
export async function parseCsvFile(
  file: File,
  options: CsvParseOptions = {},
) {
  return parseCsvText(await file.text(), options);
}

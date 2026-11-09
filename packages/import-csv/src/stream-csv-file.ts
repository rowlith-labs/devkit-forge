import Papa from "papaparse";
import { parseCsvText } from "./parse-csv.js";
import type {
  CsvIssue,
  CsvParseOptions,
  CsvStreamOptions,
  CsvStreamResult,
} from "./types.js";

/** Collect header diagnostics without changing the original header order. */
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
 * The first parsed row is treated as the header row. Row offsets passed to
 * onRows and rowIndex values in issues are zero-based data-row indexes.
 */
export function streamCsvFile(
  file: File,
  options: CsvStreamOptions,
): Promise<CsvStreamResult> {
  const chunkSize = options.chunkSize ?? 1024 * 1024;
  if (!Number.isSafeInteger(chunkSize) || chunkSize <= 0) {
    return Promise.reject(
      new RangeError("chunkSize must be a positive safe integer."),
    );
  }

  return new Promise((resolve, reject) => {
    const issues: CsvIssue[] = [];
    let headers: string[] = [];
    let headerParsed = false;
    let rowCount = 0;
    let sourceRowCount = 0;
    let delimiter = options.delimiter ?? ",";
    let settled = false;

    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error(String(error)));
    };

    const processChunk = (
      results: Papa.ParseResult<string[]>,
      parser?: Papa.Parser,
    ) => {
      if (settled) {
        parser?.abort();
        return;
      }

      try {
        delimiter = results.meta.delimiter || delimiter;
        const chunkSourceRowOffset = sourceRowCount;

        results.errors.forEach((error) => {
          const sourceRowIndex =
            typeof error.row === "number"
              ? chunkSourceRowOffset + error.row
              : undefined;

          issues.push({
            code: "parser-error",
            message: error.message,
            ...(sourceRowIndex !== undefined && sourceRowIndex > 0
              ? { rowIndex: sourceRowIndex - 1 }
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

        sourceRowCount += rows.length;
      } catch (error) {
        // Settle before aborting: Papa Parse may invoke complete() synchronously
        // as part of abort(), and that callback must not resolve this promise.
        fail(error);
        parser?.abort();
      }
    };

    Papa.parse<string[]>(file, {
      header: false,
      dynamicTyping: false,
      worker: false,
      chunkSize,
      skipEmptyLines: options.skipEmptyLines ?? "greedy",
      ...(options.delimiter ? { delimiter: options.delimiter } : {}),
      chunk(results, parser) {
        processChunk(results, parser);
      },
      complete(results) {
        // Papa Parse can deliver the final partial file chunk in complete()
        // rather than through chunk(), particularly when a row spans chunks.
        if (results && (results.data.length > 0 || results.errors.length > 0)) {
          processChunk(results);
        }
        if (settled) return;
        settled = true;
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

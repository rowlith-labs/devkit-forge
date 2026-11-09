import type { RawImportRow } from "@devkit-forge/import-core";

export type CsvIssueCode =
  | "duplicate-header"
  | "empty-header"
  | "parser-error"
  | "row-width";

export interface CsvIssue {
  code: CsvIssueCode;
  message: string;
  rowIndex?: number;
  columnIndex?: number;
}

export interface CsvParseOptions {
  /** Explicit delimiter. Omit to let Papa Parse detect it. */
  delimiter?: string;
  /** Ignore completely empty lines. Defaults to true. */
  skipEmptyLines?: boolean | "greedy";
  /** Trim header names before exposing them. Defaults to true. */
  trimHeaders?: boolean;
}

export interface CsvParseResult {
  /** Header labels in source order. Duplicate labels are preserved. */
  headers: string[];
  /** Source rows as arrays; preserves values even when headers are duplicated. */
  data: string[][];
  /** Object rows, available only when every header is non-empty and unique. */
  records: RawImportRow[] | null;
  issues: CsvIssue[];
  delimiter: string;
  rowCount: number;
  hasErrors: boolean;
}

export interface CsvStreamOptions extends CsvParseOptions {
  /** Rows per parser chunk. Defaults to 1 MiB of input. */
  chunkSize?: number;
  /** Called synchronously for each parsed batch. Do not retain batches unless needed. */
  onRows: (rows: string[][], rowOffset: number) => void;
}

export interface CsvStreamResult {
  headers: string[];
  issues: CsvIssue[];
  delimiter: string;
  rowCount: number;
  hasErrors: boolean;
}
import type { RawImportRow } from "@rowlith/import-core";

export type CsvIssueCode =
  | "duplicate-header"
  | "empty-header"
  | "parser-error"
  | "row-width"
  | "issues-truncated";

export interface CsvIssue {
  code: CsvIssueCode;
  message: string;
  /** Zero-based data-row index; the header row is excluded. */
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

export interface CsvFileParseOptions extends CsvParseOptions {
  /** Maximum input file size in bytes. Defaults to 25 MiB. */
  maxFileSizeBytes?: number;
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
  /** Positive safe integer: input bytes per parser chunk. Defaults to 1 MiB. */
  chunkSize?: number;
  /** Maximum retained diagnostics. Defaults to 1,000; excess issues are counted but summarized. */
  maxIssues?: number;
  /** Called synchronously for each parsed batch. rowOffset is a zero-based data-row index. Do not retain batches unless needed. */
  onRows: (rows: string[][], rowOffset: number) => void;
}

export interface CsvStreamResult {
  headers: string[];
  issues: CsvIssue[];
  delimiter: string;
  rowCount: number;
  hasErrors: boolean;
  /** Total diagnostics encountered, including those omitted from issues. */
  totalIssueCount: number;
  /** True when issues contains a summary in place of excess diagnostics. */
  issuesTruncated: boolean;
}
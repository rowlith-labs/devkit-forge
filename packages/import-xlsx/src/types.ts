import type { RawImportRow } from "@devkit-forge/import-core";

export type XlsxFormulaPolicy = "cached-value" | "formula-text" | "reject";
export type XlsxEmptyRowPolicy = "skip" | "preserve";
export type XlsxSheetSelector = string | number;

export type XlsxIssueCode =
  | "empty-header"
  | "duplicate-header"
  | "row-width"
  | "formula-rejected"
  | "formula-no-cache"
  | "cell-error"
  | "row-limit"
  | "issues-truncated"
  | "file-too-large"
  | "workbook-error";

export interface XlsxParseOptions {
  /** Worksheet name or zero-based worksheet index. Defaults to the first worksheet. */
  sheet?: XlsxSheetSelector;
  /** One-based worksheet row containing headers. Defaults to 1. */
  headerRow?: number;
  /** Trim header labels. Defaults to true. */
  trimHeaders?: boolean;
  /** Keep blank source rows as empty arrays/records or skip them. Defaults to skip. */
  emptyRows?: XlsxEmptyRowPolicy;
  /** Formula handling. Cached results are used by default; formulas are never evaluated. */
  formulaPolicy?: XlsxFormulaPolicy;
  /** Maximum input size in bytes. Defaults to 25 MiB. */
  maxFileSizeBytes?: number;
  /** Maximum number of data rows to materialize. Defaults to 100,000. */
  maxRows?: number;
  /** Maximum retained diagnostics. Defaults to 1,000. */
  maxIssues?: number;
  /** Maximum uncompressed bytes per ZIP entry. Defaults to 16 MiB. */
  maxEntryUncompressedSize?: number;
  /** Maximum total uncompressed ZIP bytes. Defaults to 64 MiB. */
  maxTotalUncompressedSize?: number;
  /** Maximum merged cells per worksheet. Defaults to 100,000. */
  maxMergeCells?: number;
  /** Maximum cells covered by data-validation ranges. Defaults to 100,000. */
  maxDataValidationCells?: number;
  /** Maximum cells covered by defined-name ranges. Defaults to 100,000. */
  maxDefinedNameCells?: number;
}

export interface XlsxIssue {
  code: XlsxIssueCode;
  message: string;
  /** Zero-based worksheet row offset after the header; blank rows count even when skipped. */
  rowIndex?: number;
  /** Zero-based worksheet column index. */
  columnIndex?: number;
}

export interface XlsxParseResult {
  sheetNames: string[];
  selectedSheet: string | null;
  /** Header labels in source order. Duplicate and empty labels are preserved. */
  headers: string[];
  /** Cell arrays in source order. Date cells remain Date values. */
  data: unknown[][];
  /** Object rows, available only when all headers are non-empty and unique. */
  records: RawImportRow[] | null;
  issues: XlsxIssue[];
  /** Number of data rows emitted after applying the empty-row policy. */
  rowCount: number;
  hasErrors: boolean;
  totalIssueCount: number;
  issuesTruncated: boolean;
}

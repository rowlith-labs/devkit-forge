import ExcelJS from "exceljs";
import type { RawImportRow } from "@devkit-forge/import-core";
import type {
  XlsxIssue,
  XlsxParseOptions,
  XlsxParseResult,
} from "./types.js";

const DEFAULT_MAX_FILE_SIZE = 25 * 1024 * 1024;
const DEFAULT_MAX_ROWS = 100_000;
const DEFAULT_MAX_ISSUES = 1_000;

function setOwnValue(target: Record<string, unknown>, key: string, value: unknown): void {
  Object.defineProperty(target, key, {
    configurable: true,
    enumerable: true,
    writable: true,
    value,
  });
}

function positiveSafeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new RangeError(`${name} must be a positive safe integer.`);
  }
}

function emptyResult(issue?: XlsxIssue): XlsxParseResult {
  return {
    sheetNames: [],
    selectedSheet: null,
    headers: [],
    data: [],
    records: [],
    issues: issue ? [issue] : [],
    rowCount: 0,
    hasErrors: Boolean(issue),
    totalIssueCount: issue ? 1 : 0,
    issuesTruncated: false,
  };
}

function isBlank(value: unknown): boolean {
  return value === null || value === undefined || value === "";
}

function cellValue(
  value: ExcelJS.CellValue,
  formulaPolicy: NonNullable<XlsxParseOptions["formulaPolicy"]>,
  rowIndex: number,
  columnIndex: number,
  addIssue: (issue: XlsxIssue) => void,
): unknown {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;

  if (typeof value === "object") {
    if ("formula" in value || "sharedFormula" in value) {
      if (formulaPolicy === "reject") {
        addIssue({
          code: "formula-rejected",
          message: "Formula cells are not allowed by the selected formula policy.",
          rowIndex,
          columnIndex,
        });
        return "";
      }
      if (formulaPolicy === "formula-text") {
        const formula = "formula" in value ? value.formula : value.sharedFormula;
        return typeof formula === "string" ? `=${formula}` : "";
      }
      return "result" in value && value.result !== undefined
        ? cellValue(value.result as ExcelJS.CellValue, "cached-value", rowIndex, columnIndex, addIssue)
        : "";
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("error" in value) {
      addIssue({
        code: "cell-error",
        message: `Spreadsheet error cell: ${String(value.error)}.`,
        rowIndex,
        columnIndex,
      });
      return "";
    }
  }

  addIssue({
    code: "cell-error",
    message: "This cell contains a value type that cannot be represented safely.",
    rowIndex,
    columnIndex,
  });
  return "";
}

/**
 * Reads an XLSX workbook from a Blob/File, ArrayBuffer, or Uint8Array.
 * This is an in-memory workbook parser; use explicit size and row limits for untrusted files.
 */
export async function parseXlsxFile(
  input: Blob | ArrayBuffer | Uint8Array,
  options: XlsxParseOptions = {},
): Promise<XlsxParseResult> {
  const maxFileSizeBytes = options.maxFileSizeBytes ?? DEFAULT_MAX_FILE_SIZE;
  const maxRows = options.maxRows ?? DEFAULT_MAX_ROWS;
  const maxIssues = options.maxIssues ?? DEFAULT_MAX_ISSUES;
  const headerRow = options.headerRow ?? 1;

  positiveSafeInteger(maxFileSizeBytes, "maxFileSizeBytes");
  positiveSafeInteger(maxRows, "maxRows");
  positiveSafeInteger(maxIssues, "maxIssues");
  positiveSafeInteger(headerRow, "headerRow");

  const fileSize = input instanceof Blob
    ? input.size
    : input instanceof ArrayBuffer
      ? input.byteLength
      : input.byteLength;

  if (fileSize > maxFileSizeBytes) {
    return emptyResult({
      code: "file-too-large",
      message: `Workbook is ${fileSize} bytes; the configured limit is ${maxFileSizeBytes} bytes.`,
    });
  }

  const bytes = input instanceof Blob
    ? await input.arrayBuffer()
    : input instanceof ArrayBuffer
      ? input
      : input.buffer.slice(input.byteOffset, input.byteOffset + input.byteLength) as ArrayBuffer;

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(bytes);

  const sheetNames = workbook.worksheets.map((worksheet) => worksheet.name);
  const selectedWorksheet = typeof options.sheet === "string"
    ? workbook.getWorksheet(options.sheet)
    : typeof options.sheet === "number"
      ? workbook.worksheets[options.sheet]
      : workbook.worksheets[0];

  if (!selectedWorksheet) {
    return {
      ...emptyResult({
        code: "workbook-error",
        message: options.sheet === undefined
          ? "The workbook does not contain a worksheet."
          : `The requested worksheet "${String(options.sheet)}" was not found.`,
      }),
      sheetNames,
    };
  }

  const issues: XlsxIssue[] = [];
  let totalIssueCount = 0;
  const addIssue = (issue: XlsxIssue) => {
    totalIssueCount += 1;
    if (issues.length < maxIssues) issues.push(issue);
  };

  const header = selectedWorksheet.getRow(headerRow);
  const headerCount = header.cellCount;
  const trimHeaders = options.trimHeaders ?? true;
  const headers = Array.from({ length: headerCount }, (_, index) => {
    const value = header.getCell(index + 1).value;
    const text = value === null || value === undefined ? "" : String(value);
    return trimHeaders ? text.trim() : text;
  });

  const seen = new Map<string, number>();
  headers.forEach((name, columnIndex) => {
    if (!name) {
      addIssue({
        code: "empty-header",
        message: `Header at column ${columnIndex + 1} is empty.`,
        columnIndex,
      });
      return;
    }
    const firstIndex = seen.get(name);
    if (firstIndex !== undefined) {
      addIssue({
        code: "duplicate-header",
        message: `Header "${name}" is duplicated (columns ${firstIndex + 1} and ${columnIndex + 1}).`,
        columnIndex,
      });
    } else {
      seen.set(name, columnIndex);
    }
  });

  const hasUsableHeaders =
    headers.length > 0 && headers.every(Boolean) && seen.size === headers.length;
  const data: unknown[][] = [];
  const records: RawImportRow[] = [];
  const lastSourceRow = selectedWorksheet.rowCount;
  const availableRows = Math.max(0, lastSourceRow - headerRow);
  const rowsToRead = Math.min(availableRows, maxRows);
  const formulaPolicy = options.formulaPolicy ?? "cached-value";
  const emptyRows = options.emptyRows ?? "skip";

  for (let offset = 0; offset < rowsToRead; offset += 1) {
    const sourceRow = selectedWorksheet.getRow(headerRow + offset + 1);
    const sourceWidth = Math.max(headerCount, sourceRow.cellCount);
    const values = Array.from({ length: sourceWidth }, (_, columnIndex) =>
      cellValue(
        sourceRow.getCell(columnIndex + 1).value,
        formulaPolicy,
        offset,
        columnIndex,
        addIssue,
      ),
    );

    const isEmpty = values.every(isBlank);
    if (isEmpty && emptyRows === "skip") continue;

    if (sourceWidth > headerCount) {
      addIssue({
        code: "row-width",
        message: `Row has ${sourceWidth} cells; expected ${headerCount}.`,
        rowIndex: offset,
      });
    }

    const rowValues = values.slice(0, headerCount);
    data.push(rowValues);

    if (hasUsableHeaders) {
      const record: RawImportRow = {};
      headers.forEach((name, index) => setOwnValue(record, name, rowValues[index] ?? ""));
      records.push(record);
    }
  }

  if (availableRows > maxRows) {
    addIssue({
      code: "row-limit",
      message: `Workbook contains at least ${availableRows} data rows; only the first ${maxRows} were read.`,
      rowIndex: maxRows,
    });
  }

  const issuesTruncated = totalIssueCount > maxIssues;
  if (issuesTruncated) {
    issues.push({
      code: "issues-truncated",
      message: `${totalIssueCount - maxIssues} additional issue(s) were omitted; increase maxIssues to retain more.`,
    });
  }

  return {
    sheetNames,
    selectedSheet: selectedWorksheet.name,
    headers,
    data,
    records: hasUsableHeaders ? records : null,
    issues,
    rowCount: data.length,
    hasErrors: totalIssueCount > 0,
    totalIssueCount,
    issuesTruncated,
  };
}

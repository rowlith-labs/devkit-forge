# @rowlith/import-xlsx

An XLSX workbook parsing adapter for browser-based spreadsheet imports. It extracts worksheet data and diagnostics; use `@rowlith/import-core` afterwards for destination-column mapping, transforms, validation, and duplicate detection.

It is optional. Applications that only accept CSV or structured records do not need this dependency.

## Install

```bash
npm install @rowlith/import-xlsx @rowlith/import-core
```

## Quick start

```ts
import { parseXlsxFile } from "@rowlith/import-xlsx";

const parsed = await parseXlsxFile(file, {
  sheet: "Contacts",
  headerRow: 1,
});

if (parsed.records === null || parsed.hasErrors) {
  console.error(parsed.issues);
} else {
  console.log(parsed.records);
}
```

## Input and options

`parseXlsxFile(input, options?)` accepts a browser `Blob`/`File`, `ArrayBuffer`, or `Uint8Array`. The result includes worksheet names, selected sheet, headers, source cell arrays, object records when headers are safe, issues, and row counts.

- `sheet`: worksheet name or zero-based worksheet index; defaults to the first sheet.
- `headerRow`: one-based worksheet row containing headers; defaults to 1.
- `trimHeaders`: trim header labels; defaults to true.
- `emptyRows`: `skip` or `preserve`; defaults to `skip`.
- `formulaPolicy`: `cached-value`, `formula-text`, or `reject`; defaults to `cached-value`.
- `maxFileSizeBytes`: positive safe integer; defaults to 25 MiB.
- `maxRows`: positive safe integer; defaults to 100,000.
- `maxIssues`: positive safe integer; defaults to 1,000.
- `maxEntryUncompressedSize`: positive safe integer; defaults to 16 MiB.
- `maxTotalUncompressedSize`: positive safe integer; defaults to 64 MiB.
- `maxMergeCells`, `maxDataValidationCells`, and `maxDefinedNameCells`: positive safe integers; default to 100,000 each.

## Cell values and formulas

Strings, numbers, booleans, and dates retain their JavaScript types. Rich text and hyperlinks become display text. Empty cells become empty strings in emitted rows.

ExcelJS does not calculate formulas. The default `cached-value` policy reads the last result saved by the spreadsheet application; it may be stale or missing. `formula-text` returns formula strings. `reject` replaces formula cells with empty strings and emits `formula-rejected` diagnostics. A formula without a saved result emits `formula-no-cache`. Never assume cached formula values were freshly recalculated during import.

## Headers, rows, and diagnostics

- Object `records` are available only when all headers are non-empty and unique.
- Duplicate or empty headers are retained in `headers` and cell-array data and reported in `issues`.
- Extra populated cells beyond the header width produce a `row-width` issue.
- Trailing blank cells are implicit in XLSX and cannot reliably be distinguished from omitted cells.
- Issue row indexes are zero-based worksheet offsets after the header, including skipped blank rows.
- A `__proto__` header is safely stored as an own data property.

## Resource limits and security

This implementation loads the workbook into memory; it is not a streaming XLSX parser. It uses `exceljs-hardened`, an unofficial security-maintained fork of ExcelJS, and configures ZIP expansion and workbook-range guards explicitly. The fork is not affiliated with upstream ExcelJS; review its maintenance and security policy when upgrading.

The defaults (25 MiB compressed file, 16 MiB per ZIP entry, 64 MiB total uncompressed content, and 100,000 rows) are safeguards, not a guarantee that every workbook within those limits fits every device. Lower limits for constrained environments. Corrupt or unsupported workbooks reject the promise. Keep limits enabled for untrusted files and never render imported values as HTML.

## When to use it

Choose this package when users upload Excel workbooks and you need to select a sheet, inspect cell data, and report parsing problems. Feed its records into `import-core` for business-schema processing. The optional `import-ui` package composes the XLSX and CSV adapters into a browser component.

Do not use it for huge workbooks, formula recalculation, server-side persistence, or as a streaming alternative. Those responsibilities require application-specific workflows or other tooling.

See [XLSX imports](/guide/xlsx-imports) and [Quality and security](/guide/quality-and-security).

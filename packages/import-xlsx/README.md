# @rowlith/import-xlsx

XLSX workbook parsing adapter for Rowlith. It is deliberately separate from `import-core` and `import-csv`.

## Install

```bash
npm install @rowlith/import-xlsx @rowlith/import-core
```

## Quick start

```ts
import { parseXlsxFile } from "@rowlith/import-xlsx";

const result = await parseXlsxFile(file, {
  sheet: "Contacts",
  headerRow: 1,
});

if (!result.records) {
  console.error(result.issues);
} else {
  console.log(result.records);
}
```

## API

### `parseXlsxFile(input, options?)`

Accepts a browser `Blob`/`File`, `ArrayBuffer`, or `Uint8Array`. Returns worksheet names, selected sheet, headers, cell arrays, object records when headers are safe, diagnostics, and row counts.

Options:

- `sheet`: worksheet name or zero-based worksheet index. Defaults to the first worksheet.
- `headerRow`: one-based worksheet row containing headers. Defaults to 1.
- `trimHeaders`: trim header labels. Defaults to true.
- `emptyRows`: `skip` (default) or `preserve`.
- `formulaPolicy`: `cached-value` (default), `formula-text`, or `reject`.
- `maxFileSizeBytes`: positive safe integer, default 25 MiB.
- `maxRows`: positive safe integer, default 100,000.
- `maxIssues`: positive safe integer, default 1,000.
- `maxEntryUncompressedSize`: positive safe integer, default 16 MiB.
- `maxTotalUncompressedSize`: positive safe integer, default 64 MiB.
- `maxMergeCells`, `maxDataValidationCells`, and `maxDefinedNameCells`: positive safe integers, default 100,000 each.

## Cell values and formulas

Strings, numbers, booleans, and dates retain their JavaScript types. Rich text and hyperlinks become display text. Empty cells become empty strings in emitted rows. ExcelJS does not calculate formulas: the default `cached-value` policy reads the last value saved by the spreadsheet application, which may be stale or absent. `formula-text` returns formula strings; `reject` replaces formula cells with empty strings and emits `formula-rejected` diagnostics. Missing cached formula results emit `formula-no-cache`. Never treat cached formula results as freshly calculated values.

## Limits and security

This API loads the workbook into memory; it is not a streaming XLSX parser. It uses `exceljs-hardened`, an unofficial security-maintained fork of ExcelJS, with explicit per-entry, total-uncompressed-size, merged-cell, data-validation, and defined-name limits. The fork is not affiliated with upstream ExcelJS; review its maintenance and security policy when upgrading. The default 25 MiB compressed-file limit, 16 MiB per-entry expansion limit, 64 MiB total expansion limit, and 100,000-row materialization limit are safeguards, not a promise that every workbook within those limits will fit every device. Lower the limits for constrained environments. Corrupt or unsupported workbooks reject the promise. Do not process untrusted workbooks without keeping the limits in place, and do not render imported values as HTML.

Headers must be non-empty and unique before `records` is available. Duplicate/empty headers are retained in `headers` and `data` and reported in `issues`. Extra populated cells beyond the header width produce `row-width`; trailing blank cells are implicit in XLSX and cannot reliably be distinguished from omitted cells. Row issue indexes are zero-based worksheet offsets after the header, including skipped blank rows. A `__proto__` header is safely stored as an own data property.

See [XLSX imports](../../apps/docs/guide/xlsx-imports.md).

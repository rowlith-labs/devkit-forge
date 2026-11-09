# XLSX imports

Use `@devkit-forge/import-xlsx` when your source is an Excel workbook. The adapter is optional and does not add spreadsheet dependencies to `import-core`.

## Parse a workbook

```ts
import { parseXlsxFile } from "@devkit-forge/import-xlsx";

const parsed = await parseXlsxFile(file, {
  sheet: "Contacts",
  headerRow: 1,
});

console.log(parsed.sheetNames);
console.log(parsed.headers);
console.log(parsed.records);
console.log(parsed.issues);
```

The input may be a browser `File`/`Blob`, `ArrayBuffer`, or `Uint8Array`. By default the first worksheet is selected. Select by exact name or zero-based index. Header row numbers are one-based.

## Cell values

Strings, numbers, booleans, and dates preserve their JavaScript types. Rich text and hyperlinks are represented by their display text. Blank cells become empty strings. Empty rows are skipped by default; set `emptyRows: "preserve"` to retain them in the returned arrays.

The adapter does not calculate formulas. Its default `formulaPolicy: "cached-value"` reads the cached result saved in the workbook, which may be missing or stale. Use `formula-text` to import the formula as text or `reject` to blank formula cells and report them. Missing cached values produce a `formula-no-cache` issue. Never assume cached values have been recalculated.

## Header and row diagnostics

Duplicate and empty headers are preserved in `headers` and `data`, but `records` is set to null to avoid silently losing cells. Row-width mismatches and rejected formulas are reported separately from core schema-validation issues. The `__proto__` header is stored as a normal own data property.

## Resource limits

The parser loads the workbook into memory and is not a streaming XLSX parser. It uses `exceljs-hardened`, an unofficial security-maintained fork rather than upstream ExcelJS, because upstream releases have unresolved security reports. The fork is not affiliated with the original maintainers; review its security policy before upgrading it. Defaults are 25 MiB per uploaded workbook, 16 MiB per decompressed ZIP entry, 64 MiB total decompressed content, 100,000 data rows, and 1,000 retained issues. Merged-cell, data-validation, and defined-name range limits default to 100,000 cells each. Configure `maxFileSizeBytes`, `maxRows`, and `maxIssues` to stricter positive safe integers for your application. Files above the size limit return a `file-too-large` issue; excess rows are not materialized and produce a `row-limit` issue. Corrupt or unsupported workbook data rejects the promise.

Use this parser for workbooks that fit your memory budget. For very large spreadsheets, use a server-side or purpose-built streaming workflow rather than raising limits without profiling.

## Next step

Pass `parsed.records` to `createImporter` after checking that it is not null, then handle parser diagnostics and core validation issues as separate layers.

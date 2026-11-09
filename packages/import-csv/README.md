# @devkit-forge/import-csv

CSV parsing adapter for the DevKit Forge import engine. This package is intentionally separate from `@devkit-forge/import-core`, so the core engine does not require a CSV parser.

## Install

```sh
pnpm add @devkit-forge/import-csv @devkit-forge/import-core
```

## Parse CSV text

```ts
import { parseCsvText } from "@devkit-forge/import-csv";

const result = parseCsvText(`Name,Email
Ada,ada@example.com
Grace,grace@example.com`);

if (result.records === null || result.hasErrors) {
  console.error(result.issues);
} else {
  // Pass result.records to createImporter(...).process(...)
  console.log(result.records);
}
```

## Result contract

- `headers`: source headers in order. Duplicate names are preserved.
- `data`: source rows as arrays, preserving every cell even with duplicate headers.
- `records`: object rows only when all headers are non-empty and unique; otherwise `null`. This avoids silently overwriting data for duplicate or blank headers.
- `issues`: parser errors, duplicate/empty header diagnostics, and row-width mismatches.
- `delimiter`: delimiter detected by Papa Parse, or the explicitly configured delimiter.
- `rowCount`: number of non-header rows returned by the parser.

All cell values remain strings. Empty lines are skipped by default. Quoted delimiters and quoted newlines are supported.

## Options

```ts
parseCsvText(csvText, {
  delimiter: ";",       // optional; otherwise auto-detected
  skipEmptyLines: true, // defaults to "greedy"
  trimHeaders: true,    // defaults to true
});
```

This first release accepts CSV text. Browser File handling, streaming large files, and spreadsheet formats are intentionally separate follow-up work.

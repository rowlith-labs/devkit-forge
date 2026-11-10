# @devkit-forge/import-core

The framework-independent processing engine at the centre of DevKit Forge. Use it when you already have records (from an API, CSV parser, XLSX parser, or another source) and need predictable column mapping, transformation, validation, duplicate detection, and row-level results.

It deliberately does not read files, render components, upload data, or persist records.

## Install

```bash
npm install @devkit-forge/import-core
```

## A realistic import

Define the destination shape once, then process plain records from any source:

```ts
import { createImporter } from "@devkit-forge/import-core";
import type { ImportConfig } from "@devkit-forge/import-core";

interface Customer {
  email: string;
  name: string;
}

const config: ImportConfig<Customer> = {
  columns: [
    {
      key: "email",
      label: "Email",
      required: true,
      validate: (value) =>
        typeof value === "string" && value.includes("@")
          ? undefined
          : "Enter a valid email address.",
    },
    { key: "name", label: "Full Name", required: true },
  ],
  duplicateKeys: ["email"],
};

const importer = createImporter<Customer>(config);
const result = importer.processRows([
  { Email: "ada@example.com", "Full Name": "Ada Lovelace" },
  { Email: "", "Full Name": "Grace Hopper" },
]);

console.log(result.validRows, result.invalidRows);
console.log(result.validCount, result.invalidCount);
```

## How mapping works

- With no explicit mapping, source headers are matched against normalized destination labels or keys.
- Header normalization ignores case, spaces, and punctuation.
- An explicit `ColumnMapping<T>` is authoritative; unmapped source headers are not guessed.
- If multiple source headers match one destination column during automatic mapping, the affected row receives an `ambiguous` issue.
- Source records are plain `Record<string, unknown>` objects. The core does not infer number, date, or other domain-specific types for you.

## Validation and duplicate behavior

- Required values include non-empty strings; whitespace-only strings are missing.
- Custom transforms run before required checks and validation.
- Transform and validator exceptions are caught and reported as row-level `invalid` issues.
- Duplicate values are compared after string conversion, trimming, and lowercasing.
- The first non-empty duplicate-key value reserves that value, even if its row has another validation issue. Later occurrences are reported as duplicates.
- Issue row indexes are zero-based.
- Issue codes include `required`, `invalid`, `duplicate`, and `ambiguous`.

## Public API

- `createImporter<T>(config)`: create a reusable importer for a destination type.
- `importer.processRows(sourceRows, mapping?)`: process source records and return valid/invalid rows, issues, and summary counts.
- `normalizeHeader(value)`: normalize a header for matching.
- `ImportConfig<T>`, `ImportColumn<T>`, `ColumnMapping<T>`, `RawImportRow`, `ImportIssue`, and `ProcessRowsResult<T>`: public configuration and result types.

## When to use it

Choose core alone when your data is already structured, when you are importing from an API or database export, or when you want to own the file picker and UI. Combine it with `@devkit-forge/import-csv` or `@devkit-forge/import-xlsx` when parsing files; use `@devkit-forge/import-react` for headless React state, or `@devkit-forge/import-ui` for the optional browser component.

Do not use core as a streaming parser or as a replacement for database constraints. It processes the supplied rows in memory; persistence, transactional behavior, authorization, and final business rules belong to your application.

See [Validation and mapping](/guide/validation-and-mapping) and [Architecture](/guide/architecture).

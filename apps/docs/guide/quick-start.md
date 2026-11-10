# Quick start

This walkthrough defines a schema, parses CSV text, and validates the resulting records. It uses the core and CSV packages; no React dependency is required.

## 1. Install

```bash
npm install @rowlith/import-core @rowlith/import-csv
```

## 2. Define your destination schema

```ts
import { createImporter } from "@rowlith/import-core";
import type { ImportConfig } from "@rowlith/import-core";

interface Contact {
  name: string;
  email: string;
}

const config: ImportConfig<Contact> = {
  columns: [
    { key: "name", label: "Full name", required: true },
    {
      key: "email",
      label: "Email address",
      required: true,
      validate: (value) =>
        typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
          ? undefined
          : "Enter a valid email address.",
    },
  ],
  duplicateKeys: ["email"],
};

const importer = createImporter<Contact>(config);
```

A column's `key` is the property in your destination type. Its `label` is the human-readable source header used by automatic matching.

## 3. Parse and validate

```ts
import { parseCsvText } from "@rowlith/import-csv";

const csv = `Full name,Email address
Ada Lovelace,ada@example.com
,missing-name@example.com
Grace Hopper,ada@example.com`;

const parsed = parseCsvText(csv);

if (parsed.records === null) {
  throw new Error("The CSV has empty or duplicate headers.");
}

const result = importer.processRows(parsed.records);

console.log(result.validRows);
console.log(result.invalidRows);
console.log(result.validCount, result.invalidCount);
```

Parser diagnostics and schema-validation results are separate. Check `parsed.issues` for CSV parsing and header problems, then inspect `result.invalidRows` for destination schema problems.

## 4. Decide what happens next

```ts
for (const invalid of result.invalidRows) {
  console.warn("Invalid source row:", invalid.rowIndex, invalid.issues);
}

if (result.invalidCount === 0) {
  // Send result.validRows to your own persistence workflow.
}
```

The library deliberately leaves saving, API calls, and transaction handling to your application.

## Try the playground

The repository includes a browser playground with sample data, column mapping, row filters, and CSV exports. See the [playground README](https://github.com/truerdp/rowlith/blob/main/apps/playground/README.md).

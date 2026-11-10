# @devkit-forge/import-ui

A small, framework-independent browser import interface delivered as a native Web Component. It provides a file picker, column mapping, validation, and row-level results without requiring React, Vue, or a UI framework.

Use it when the default browser UI is useful and you do not need to own every interaction. Choose `@devkit-forge/import-react` instead when you want to build the interface yourself in React.

## Install

```bash
npm install @devkit-forge/import-ui @devkit-forge/import-core @devkit-forge/import-csv @devkit-forge/import-xlsx
```

## Register and configure

Registration is explicit. Importing the package does not automatically mutate the global custom-element registry, which avoids unexpected side effects during server-side rendering.

```ts
import { registerImportUI } from "@devkit-forge/import-ui";
import type { ImportUIElement } from "@devkit-forge/import-ui";
import type { ImportConfig } from "@devkit-forge/import-core";

interface Contact {
  name: string;
  email: string;
}

const config: ImportConfig<Contact> = {
  columns: [
    { key: "name", label: "Full name", required: true },
    { key: "email", label: "Email", required: true },
  ],
  duplicateKeys: ["email"],
};

registerImportUI();

const element = document.querySelector<ImportUIElement>("df-data-importer");
element?.configure(config);
```

Add the element to the page:

```html
<df-data-importer></df-data-importer>
```

Call `registerImportUI()` once in a browser entry point before using the tag. The default tag name is `df-data-importer`; you can supply a custom registry and valid hyphenated tag name.

## Load and validate data

The component accepts CSV and XLSX browser files through its built-in file input. It also supports already-parsed records:

```ts
element?.setRows([
  { "Full name": "Ada Lovelace", Email: "ada@example.com" },
]);

const result = element?.validate();
console.log(result?.validRows, result?.invalidRows);
```

Use `setMapping(mapping)` to supply an authoritative source-header-to-schema-key mapping. Without an explicit mapping, the core automatic header matching is used.

## Public API

- `registerImportUI(registry?, tagName?)`: register and return the custom element constructor. Defaults to `customElements` and `df-data-importer`; existing registrations are reused.
- `configure<T>(config)`: configure destination columns and duplicate-key behavior.
- `loadFile(file)`: parse a CSV or XLSX browser `File`.
- `setRows(rows, headers?)`: provide parsed records. If headers are omitted, keys from the first record are used.
- `setMapping(mapping)`: set explicit source-header mapping.
- `validate()`: synchronously validate the current records and return the core result.
- `reset()`: clear file, rows, mapping, and result.
- `result`: latest result, or `null`.

## Events

The component emits bubbling custom events that cross the Shadow DOM boundary:

| Event | Detail |
| --- | --- |
| `df:loaded` | `{ filename, headers, rowCount, parserIssues }` |
| `df:validated` | `{ result }` |
| `df:error` | `{ error }` |

```ts
element?.addEventListener("df:validated", (event) => {
  const result = (event as CustomEvent).detail.result;
  console.log(result.validRows, result.invalidRows);
});
```

## Accessibility, styling, and security

The component uses native file inputs, buttons, selects, associated labels, semantic table markup, visible keyboard focus, and live status announcements. Imported cell values are rendered with `textContent`, not interpolated into HTML.

CSS custom properties such as `--df-accent`, `--df-border`, `--df-text`, `--df-surface`, and `--df-focus` can be used to align the component with an application's theme. The component uses Shadow DOM, so application styles do not automatically penetrate its internals.

## Limitations and package choice

The component parses CSV and XLSX files fully in memory using the corresponding adapters. It is not a streaming UI and should not be used for very large files; use `streamCsvFile` directly for large CSV workflows. XLSX parsing has its own file-size, decompression, and workbook-range limits.

This package does not upload files, persist records, manage authentication, provide transactional imports, or include framework-specific wrappers. The consuming application owns those workflows. If you need complete control over the React experience, combine `import-react` with the parser and core packages instead.

See [Architecture](/guide/architecture), [CSV imports](/guide/csv-imports), and [XLSX imports](/guide/xlsx-imports).

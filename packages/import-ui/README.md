# @rowlith/import-ui

Accessible, framework-independent Web Component for browser-based CSV and XLSX imports. It uses native browser custom elements, Shadow DOM, and semantic HTML; React, Vue, and other UI frameworks are not required.

## Install

```sh
pnpm add @rowlith/import-ui @rowlith/import-core @rowlith/import-csv @rowlith/import-xlsx
```

## Quick start

```ts
import { registerImportUI } from "@rowlith/import-ui";
import type { ImportUIElement } from "@rowlith/import-ui";
import type { ImportConfig } from "@rowlith/import-core";

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
const importer = document.querySelector<ImportUIElement>("df-data-importer")!;
importer.configure(config);
```

Then add the custom element to your HTML:

```html
<df-data-importer></df-data-importer>
```

Call `registerImportUI()` once in the browser entry point before using the tag. Registration is explicit so importing the package does not mutate the global custom-element registry or break server-side rendering.

## API

- `registerImportUI(registry?, tagName?)`: register the custom element. Defaults to `customElements` and `df-data-importer`; returns the registered constructor. Existing registrations are reused.
- `configure<T>(config)`: set the schema and duplicate-key policy.
- `loadFile(file)`: parse a `.csv` or `.xlsx` browser File.
- `setRows(rows, headers?)`: provide already-parsed records. Defaults headers to the first record's keys.
- `setMapping(mapping)`: set an authoritative source-header-to-schema-key mapping. If omitted, core automatic mapping is used.
- `validate()`: synchronously validate the current records and return the core result.
- `reset()`: clear the current file, rows, mapping, and result.
- `result`: read the latest validation result or `null`.

Events bubble and cross the Shadow DOM boundary:

- `df:loaded`: `{ filename, headers, rowCount, parserIssues }`
- `df:validated`: `{ result }`
- `df:error`: `{ error }`

```ts
importer.addEventListener("df:validated", (event) => {
  const result = (event as CustomEvent).detail.result;
  console.log(result.validRows, result.invalidRows);
});
```

## Accessibility and security

The component uses native file inputs, buttons, selects, associated labels, semantic table markup, visible keyboard focus, and live status announcements. Imported cell content is rendered with `textContent`, never interpolated into HTML. The component does not upload files or persist data; parsing runs in the consuming browser.

The component loads CSV and XLSX files fully into memory using the corresponding adapters. It is not a streaming UI and should not be used for very large files. Use `streamCsvFile` directly for large CSV workflows. XLSX parsing has its own configured size and decompression limits.

The package provides a deliberately small baseline interface. Styling can be customized with CSS custom properties such as `--df-accent`, `--df-border`, `--df-text`, `--df-surface`, and `--df-focus`. It does not provide framework-specific wrappers, server-side upload, persistence, or a design-system dependency.

See [the UI package guide](../../apps/docs/guide/import-ui.md).

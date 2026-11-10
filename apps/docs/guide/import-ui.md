# Import UI

`@rowlith/import-ui` provides a small, accessible browser UI as a native Web Component. It is framework-independent: no React, Vue, or UI library is required.

## Install

```sh
pnpm add @rowlith/import-ui @rowlith/import-core @rowlith/import-csv @rowlith/import-xlsx
```

## Register and configure

```ts
import { registerImportUI } from "@rowlith/import-ui";
import type { ImportUIElement } from "@rowlith/import-ui";
import type { ImportConfig } from "@rowlith/import-core";

interface Customer {
  name: string;
  email: string;
}

const config: ImportConfig<Customer> = {
  columns: [
    { key: "name", label: "Name", required: true },
    { key: "email", label: "Email", required: true },
  ],
  duplicateKeys: ["email"],
};

registerImportUI();
document.querySelector<ImportUIElement>("df-data-importer")?.configure(config);
```

Add `<df-data-importer></df-data-importer>` to the page. Registration is explicit, making package imports safe in server-rendered applications. Call it from a browser-only entry point.

The component accepts CSV and XLSX files, displays parser diagnostics, allows source-to-schema mapping, and presents row-level validation results. It emits `df:loaded`, `df:validated`, and `df:error` events. See the package README for the full element API.

## Accessibility and security

The component uses native controls, associated labels, semantic tables, keyboard focus indicators, and live status announcements. Imported values are assigned using `textContent`, not HTML parsing. Files are processed locally in the browser; the component does not send data to a service.

## Scope and limitations

This is a baseline Web Component, not a complete data-import product UI. It does not provide streaming CSV previews, virtualized tables, upload/persistence services, or framework wrappers. It loads files into memory through the CSV and XLSX adapters. For large CSVs, use the streaming API directly.

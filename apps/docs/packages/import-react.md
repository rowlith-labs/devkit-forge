# @rowlith/import-react

A headless React hook that connects React state to the framework-independent `@rowlith/import-core` engine. Use it when you want to build your own React file-import experience while keeping parsing, UI, and validation separate.

It does not render a file picker, parse CSV/XLSX files, upload records, or persist data.

## Install

```bash
npm install @rowlith/import-react @rowlith/import-core react
```

React 18 and 19 are supported as peer dependencies.

## Quick start

```tsx
import { useEffect } from "react";
import { useDataImporter } from "@rowlith/import-react";
import type { ImportConfig } from "@rowlith/import-core";

interface Contact {
  email: string;
  name: string;
}

const config: ImportConfig<Contact> = {
  columns: [
    { key: "email", label: "Email", required: true },
    { key: "name", label: "Name", required: true },
  ],
  duplicateKeys: ["email"],
};

function ContactImport({ records }: {
  records: Record<string, unknown>[];
}) {
  const importer = useDataImporter<Contact>({ config });

  // Update hook state when parsed records arrive. Processing is a separate
  // user action, after React has rendered the updated state.
  useEffect(() => {
    importer.setRows(records);
  }, [importer.setRows, records]);

  function validate() {
    const result = importer.process();
    if (result.invalidCount === 0) {
      // Hand result.validRows to your application's save workflow.
    }
  }

  return (
    <section>
      <button onClick={validate} disabled={importer.rows.length === 0}>
        Validate {importer.rows.length} rows
      </button>
      {importer.result && (
        <p>
          {importer.result.validCount} valid, {importer.result.invalidCount} invalid
        </p>
      )}
    </section>
  );
}
```

For a file workflow, parse the browser `File` with `@rowlith/import-csv` or `@rowlith/import-xlsx`, then pass the resulting records to `setRows`.

## Hook API

`useDataImporter<T>({ config, initialRows?, initialMapping? })` returns:

| Member | Behavior |
| --- | --- |
| `rows` | Current source records |
| `mapping` | Current source-header to destination-key mapping |
| `result` | Latest `ProcessRowsResult<T>`, or `null` before processing |
| `setRows(rows)` | Replace records and invalidate the previous result |
| `setMapping(mapping)` | Replace mapping and invalidate the previous result |
| `process()` | Synchronously process current rows through core |
| `reset()` | Clear rows and result, restoring the initial mapping |

Processing is explicit: changing rows or mapping does not automatically validate.

## Configuration and lifecycle

Keep `config` referentially stable (define it outside the component or memoize it). A new config object creates a new core importer while current rows and mappings are retained. Avoid recreating configuration on every render.

## When to use it

Choose this package when you need React state and want full control over markup, accessibility, design system, file selection, and workflow. It composes naturally with `import-core` and either file adapter.

Do not use it as a large-file streaming abstraction. The hook stores rows and a complete result in React state, so it is intended for ordinary in-memory imports. For large CSV files, consume `streamCsvFile` batches outside the hook instead of accumulating the whole file in React state.

Your application remains responsible for upload authorization, persistence, transactions, retries, and user confirmation before committing imported records. If you prefer a ready-made framework-independent browser interface, consider `@rowlith/import-ui`.

See [Architecture](/guide/architecture) and [Import UI](/guide/import-ui).

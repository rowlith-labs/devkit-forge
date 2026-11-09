# @devkit-forge/import-react

Headless React hooks for the DevKit Forge data import engine.

## Install

```bash
pnpm add @devkit-forge/import-react @devkit-forge/import-core react
```

React 18 and 19 are supported as peer dependencies. This package does not ship UI components, styles, a CSV parser, or its own validation engine.

## Quick start

```tsx
import { useDataImporter } from "@devkit-forge/import-react";
import type { ImportConfig } from "@devkit-forge/import-core";

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

function ContactImport() {
  const importer = useDataImporter<Contact>({ config });

  function handleFileParsed(records: Record<string, unknown>[]) {
    importer.setRows(records);
  }

  function handleImport() {
    const result = importer.process();
    if (result.invalidCount === 0) {
      // Send result.validRows to your application's save workflow.
    }
  }

  return (
    <section>
      <button onClick={handleImport} disabled={importer.rows.length === 0}>
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

## API

- `useDataImporter({ config, initialRows?, initialMapping? })`
- `rows`: current source records (`RawImportRow[]`)
- `mapping`: source-header to schema-key mapping
- `result`: last `ProcessRowsResult<T>`, or `null` before processing
- `setRows(rows)`: replace records and invalidate the previous result
- `setMapping(mapping)`: replace mapping and invalidate the previous result
- `process()`: synchronously process current records through `@devkit-forge/import-core`
- `reset()`: clear records and result, restoring the initial mapping

The hook deliberately does not parse files. Use `@devkit-forge/import-csv` (or another parser) to produce records, then pass those records to `setRows`. This keeps parsing, framework state, and validation independently usable.

## Behaviour and limitations

- Processing is explicit; changing rows or mappings does not automatically validate.
- The hook stores source rows and the latest complete result in React state. It is intended for ordinary in-memory imports, not huge streaming files.
- For large CSV files, use the CSV package's streaming API and process batches outside this hook. Do not accumulate a large file in hook state.
- Keep `config` referentially stable (for example, define it outside the component or memoize it). A new config object creates a new core importer; existing rows and mappings are retained.
- The hook does not upload, persist, or submit data. Your application owns those actions and any UI/consent workflow.

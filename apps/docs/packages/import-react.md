# @devkit-forge/import-react

Headless React state management for the DevKit Forge importer.

## Install

```bash
npm install @devkit-forge/import-react @devkit-forge/import-core react
```

React 18 and 19 are supported as peer dependencies.

## `useDataImporter<T>({ config, initialRows?, initialMapping? })`

Creates a hook instance backed by `@devkit-forge/import-core`.

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
};

function ContactImport({ records }: { records: Record<string, unknown>[] }) {
  const importer = useDataImporter<Contact>({ config });

  function validate() {
    importer.setRows(records);
    const result = importer.process();
    console.log(result.validRows, result.invalidRows);
  }

  return <button onClick={validate}>Validate records</button>;
}
```

## Returned values

| Member | Description |
| --- | --- |
| `rows` | Current source records |
| `mapping` | Current source-header to destination-key mapping |
| `result` | Latest result, or null before processing |
| `setRows(rows)` | Replace rows and invalidate the previous result |
| `setMapping(mapping)` | Replace mapping and invalidate the previous result |
| `process()` | Process current rows synchronously |
| `reset()` | Clear rows and result, restoring the initial mapping |

The hook does not parse files, render UI, upload data, or persist records. Use the CSV adapter or another parser to produce records, then pass them to `setRows`.

Keep `config` referentially stable. Changing it creates a new core importer while retaining current rows and mappings.

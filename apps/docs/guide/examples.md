# Runnable Vite + React example

The repository includes two complete browser-only examples: [`examples/vite-react`](https://github.com/truerdp/devkit-forge/tree/main/examples/vite-react) and [`examples/vanilla-ui`](https://github.com/truerdp/devkit-forge/tree/main/examples/vanilla-ui). The React app composes the three packages most React applications need for a basic CSV import flow:

- `@devkit-forge/import-csv` parses the browser File.
- `@devkit-forge/import-core` maps headers, validates fields, and detects duplicate email addresses.
- `@devkit-forge/import-react` stores source rows and validation results.

## Run it

From the repository root:

```sh
pnpm install
pnpm --filter @devkit-forge/example-vite-react dev
```

Open the local URL printed by Vite. Select a CSV with `Full Name`, `Email`, and `Company` headers, or choose **Load sample data** to see valid and invalid rows.

## Build it

```sh
pnpm --filter @devkit-forge/example-vite-react typecheck
pnpm --filter @devkit-forge/example-vite-react build
```

The React example is a workspace app, not a separately published package. It uses the in-memory parser and React hook, so it is intended for ordinary-sized files. For large CSV files, use [the streaming API](/guide/large-files) and process batches without retaining the entire file in React state.

## Vanilla Web Component example

The [vanilla UI example](https://github.com/truerdp/devkit-forge/tree/main/examples/vanilla-ui) demonstrates explicit registration of `df-data-importer`, CSV/XLSX file loading, and the `df:loaded`, `df:validated`, and `df:error` events. It does not require React. Run it with:

```sh
pnpm --filter @devkit-forge/example-vanilla-ui dev
```

It also uses in-memory parsing and is not intended for very large files.

The example does not upload, persist, or submit records. Your application owns those responsibilities and any consent or confirmation flow.

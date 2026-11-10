# Installation

Install only the packages your application needs. The package manager will resolve the required dependencies.

## Core only

```bash
npm install @rowlith/import-core
```

## CSV parsing

```bash
npm install @rowlith/import-csv @rowlith/import-core
```

## XLSX parsing

```bash
npm install @rowlith/import-xlsx @rowlith/import-core
```

## React integration

```bash
npm install @rowlith/import-react @rowlith/import-core react
```

The React adapter declares React 18 and React 19 as peer dependency versions.

## Package manager notes

Examples use npm, but pnpm and yarn can also be used. The repository itself uses pnpm workspaces.

## Module format

The packages currently expose ESM entry points and TypeScript declarations. CommonJS `require()` entry points are not provided. Use an ESM-capable Node.js or bundler configuration.

## Requirements

- TypeScript projects should use a modern TypeScript version with ES module and bundler resolution.
- File-based CSV helpers require the browser `File` API.
- The XLSX adapter uses ExcelJS and loads each workbook in memory; its default limits are 25 MiB and 100,000 rows.
- The core package has no framework dependency.
- The CSV package uses Papa Parse; the React package uses React as a peer dependency.

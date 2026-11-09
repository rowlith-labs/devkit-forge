# DevKit Forge

Open-source developer tools built to remove repetitive engineering work.

> **Status:** Early development. APIs and package names may change before the first stable release.

## First project: React Data Import Kit

A TypeScript-first, framework-agnostic data-import engine with an optional React adapter and UI. The initial focus is reliable column mapping, validation, duplicate detection, and structured error reporting.

## Repository structure

```
apps/
  docs/             # VitePress documentation site
  playground/
packages/
  import-core/
  import-react/     # headless React adapter
  import-ui/        # planned
  import-xlsx/      # planned
examples/
  vite-react/       # planned
```

## Principles

- Core logic is framework-agnostic.
- No file uploads to a hosted service; processing is local to the consuming application.
- Small, typed APIs with predictable results.
- Useful open-source functionality under the MIT License.
- Optional adapters rather than mandatory framework or validation-library dependencies.

## Development

Requirements: Node.js 20+ and pnpm 9+.

```bash
pnpm install
pnpm test
pnpm typecheck
```

## Current scope

The initial packages are `@devkit-forge/import-core`, `@devkit-forge/import-csv`, and `@devkit-forge/import-react`. The React adapter remains headless; the browser playground and VitePress documentation site are separate applications. XLSX parsing and commercial packaging remain future work.

## Licence

MIT. See [LICENSE](./LICENSE).

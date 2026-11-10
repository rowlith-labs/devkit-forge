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
  import-ui/        # optional framework-independent Web Component
  import-xlsx/      # XLSX parser adapter
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
pnpm check:pack
pnpm exec playwright install chromium firefox webkit
pnpm test:e2e
```

## Runnable example

A working Vite + React example composes the CSV parser, core schema validation, and React hook. Run it from the repository root:

```bash
pnpm install
pnpm --filter @devkit-forge/example-vite-react dev
```

See [the example README](./examples/vite-react/README.md) for details.

## Current scope

The current packages are `@devkit-forge/import-core`, `@devkit-forge/import-csv`, `@devkit-forge/import-xlsx`, `@devkit-forge/import-react`, and the optional `@devkit-forge/import-ui` Web Component. The React adapter remains headless; the browser playground and VitePress documentation site are separate applications. The XLSX adapter is an in-memory parser with explicit file-size and row limits; it is separate from the core package. Commercial packaging remains future work. The example app demonstrates ordinary in-memory CSV imports; use the streaming API directly for large files.

## Package releases

The npm libraries are maintained under `packages/`. Run `pnpm check:pack` to verify that each built package produces an installable archive with publishable internal dependency versions. See the [release readiness guide](./apps/docs/guide/release-readiness.md) before publishing. No automatic npm publishing is enabled.

## Contributing and security

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development and contribution guidance, and [SECURITY.md](./SECURITY.md) for responsible vulnerability reporting.

## Licence

MIT. See [LICENSE](./LICENSE).

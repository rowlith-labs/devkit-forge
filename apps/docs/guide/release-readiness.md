# Release readiness

All publishable libraries live under `packages/`. Applications under `apps/` are not npm packages.

## Before the first public release

1. Confirm the `@devkit-forge` npm organization/scope is controlled by the project owner and the package names are available.
2. Review the package APIs, dependency licenses, security posture, and ownership/IP rights.
3. Add a reviewed Changeset for every user-facing library change with `pnpm changeset`; choose patch, minor, or major according to the public API impact.
4. Review the pending release plan with `pnpm changeset status --verbose`. When deliberately preparing a release, run `pnpm version-packages` to update package versions, internal dependency ranges, and changelogs. Review every generated diff; do not version or publish just because changesets exist.
5. Confirm the dependency lockfile is committed and reproducible installs pass with `pnpm install --frozen-lockfile`.
6. Run the complete CI workflow, including both integration examples, browser tests, CodeQL, dependency audit, and `pnpm check:pack`.
7. Review each generated archive with `pnpm --dir packages/<package> pack --pack-destination <directory>` before publishing.
8. Verify each package archive contains its own MIT license and that internal dependency versions match the packages being released.
9. Only as the final release action, publish packages in dependency order: `import-core`, then `import-csv` / `import-xlsx`, then `import-react` / `import-ui`.

## Package archive check

`pnpm check:pack` packs each library and checks that:

- The archive contains the declared runtime and TypeScript entry points, package README, and MIT license.
- The package name, semantic version, public access, Node engine, repository, homepage, and issue metadata are present.
- The package license matches the repository license.
- Internal `workspace:` dependency protocols have been rewritten to the matching workspace package versions.

This catches a common monorepo release failure: a package that builds inside the workspace but cannot be installed by an external consumer.

## Publishing policy

Dependabot proposes dependency updates and CodeQL scans JavaScript/TypeScript code, but neither replaces a manual release review. Changesets is configured for manual version planning and changelog generation. There is intentionally no automatic npm publish on push or tag, and no publish command is wired into CI. Versioning and publishing remain separate actions; npm publishing is the final explicit step only after all release gates pass. CI archive checks are not evidence that a package has been published or that its name is available.

For the first release, publish from a trusted environment with an npm account that has publish access to the scope. Prefer npm trusted publishing with provenance when the repository and npm scope have been configured for it. Never commit registry tokens.

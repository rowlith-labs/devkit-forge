# Release readiness

All publishable libraries live under `packages/`. Applications under `apps/` are not npm packages.

## Release process

1. Add a reviewed Changeset for every user-facing library change with `pnpm changeset`; choose patch, minor, or major according to the public API impact.
2. Review the pending release plan with `pnpm changeset status --verbose`.
3. When deliberately preparing a release, run `pnpm version-packages` to update package versions, internal dependency ranges, and changelogs. Review every generated diff and commit it to `main`.
4. Confirm the dependency lockfile is committed and reproducible installs pass with `pnpm install --frozen-lockfile`.
5. Confirm CI and CodeQL pass on the exact `main` commit being released. CI includes package typechecks, tests, builds, archive checks, examples, documentation build, dependency audit, and browser tests.
6. Review package archives with `pnpm check:pack`. Confirm each archive includes its entry points, README, and MIT license, and that internal dependency versions have been rewritten correctly.
7. For the first-ever publication of these package names, follow the one-time bootstrap procedure below. npm requires a package to exist before a Trusted Publisher can be configured.
8. After all five packages exist on npm, configure GitHub Actions Trusted Publishing separately on each package, then complete the OIDC activation release described below.
9. For normal subsequent releases, publish only through the repository's manually dispatched **Publish npm release** GitHub Actions workflow.

## Package archive check

`pnpm check:pack` packs each library and checks that:

- The archive contains the declared runtime and TypeScript entry points, package README, and MIT license.
- The package name, semantic version, public access, Node engine, repository, homepage, and issue metadata are present.
- The package license matches the repository license.
- Internal `workspace:` dependency protocols have been rewritten to the matching workspace package versions.

This catches a common monorepo release failure: a package that builds inside the workspace but cannot be installed by an external consumer.

## One-time first-publication bootstrap

npm does not allow a Trusted Publisher to be configured until the package already exists on the registry. Therefore the first publication must be authenticated from a maintainer's local machine; do not try to configure OIDC for packages that have not yet been published.

Before starting:

- Confirm the npm organization is `rowlith`, so the package scope is `@rowlith`.
- Use an npm account that is an organization owner or has permission to create and publish packages under `@rowlith`.
- Enable two-factor authentication on that npm account.
- Use a clean checkout of the reviewed `main` commit. Never put an npm token in the repository, GitHub Actions variables, or a chat.

From the repository root, install and verify the workspace:

```sh
corepack enable
pnpm install --frozen-lockfile
pnpm audit --audit-level high
pnpm check:pack
pnpm -r typecheck
pnpm -r test
pnpm -r build
```

Authenticate locally through npm's browser-based login and confirm the account:

```sh
npm login --auth-type=web
npm whoami
```

Publish the packages in dependency order. Run these one at a time and confirm each succeeds before moving to the next:

```sh
pnpm --dir packages/import-core publish --access public
pnpm --dir packages/import-csv publish --access public
pnpm --dir packages/import-xlsx publish --access public
pnpm --dir packages/import-react publish --access public
pnpm --dir packages/import-ui publish --access public
```

Use `pnpm publish`, not raw `npm publish`, because pnpm rewrites the monorepo's `workspace:` dependency ranges to published semver ranges when creating the package archive. The order ensures that each internal dependency is already available before a dependent package is published.

Verify the exact versions now listed in the package manifests:

| Package | Initial manifest version |
|---|---:|
| `@rowlith/import-core` | `0.1.1` |
| `@rowlith/import-csv` | `0.2.0` |
| `@rowlith/import-xlsx` | `0.1.1` |
| `@rowlith/import-react` | `0.1.1` |
| `@rowlith/import-ui` | `0.1.1` |

Check each package/version with `npm view @rowlith/PACKAGE@VERSION version`. Do not continue if any package has the wrong version, wrong scope, or unresolved dependencies.

## Configure and activate Trusted Publishing

Only after the five initial packages exist, open each package on npmjs.com → Settings → Trusted publishing and add a GitHub Actions trusted publisher with these exact values:

- Provider: GitHub Actions
- Organization or user: `rowlith-labs`
- Repository: `rowlith`
- Workflow filename: `publish-release.yml`
- Environment: leave blank
- Allowed actions: enable direct `npm publish` (not stage-only)

The owner is the GitHub organization, not the npm organization name. Repeat this configuration for all five packages.

Important: a newly created npm Trusted Publisher configuration must complete its first successful OIDC publish within two days or it expires. The current release workflow skips versions that are already present on npm. Therefore, after configuring all five publishers, prepare a patch Changeset for all five packages, run `pnpm version-packages`, review and commit the new versions/changelogs to `main`, and dispatch the release workflow within that two-day window. That next patch release both validates all five OIDC trust relationships and establishes the normal token-free release path. Do not configure the publishers and then leave them idle.

## Publishing policy

Publishing is deliberately manual. A push, merge, or Changeset does not publish packages. The **Publish npm release** workflow is dispatched explicitly from `main` and requires the confirmation input `PUBLISH`.

The workflow uses npm Trusted Publishing (GitHub Actions OIDC), not a long-lived npm access token. It pins npm CLI 11.5.1, uses Node.js 24, requests the GitHub OIDC identity token, and publishes packages in dependency order:

1. `@rowlith/import-core`
2. `@rowlith/import-csv`
3. `@rowlith/import-xlsx`
4. `@rowlith/import-react`
5. `@rowlith/import-ui`

Already-published package versions are skipped. Registry lookup errors other than a confirmed missing package stop the workflow rather than being treated as permission to publish.

For every subsequent release, keep npm Trusted Publishing enabled and do not add registry tokens to repository secrets or workflow configuration.

## Proposed first release versions

The following versions are currently configured in the package manifests. They are **not confirmed as published**; publishing has not yet been performed from the Rowlith repository.

| Package | Manifest version |
|---|---:|
| `@rowlith/import-core` | `0.1.1` |
| `@rowlith/import-csv` | `0.2.0` |
| `@rowlith/import-xlsx` | `0.1.1` |
| `@rowlith/import-react` | `0.1.1` |
| `@rowlith/import-ui` | `0.1.1` |

## Security

Never commit registry credentials. Keep npm Trusted Publishing enabled and review GitHub Actions permissions whenever changing the publishing workflow. Dependency audits and CodeQL complement, but do not replace, code review and release verification.

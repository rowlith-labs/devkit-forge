# Release readiness

All publishable libraries live under `packages/`. Applications under `apps/` are not npm packages.

## Release process

1. Add a reviewed Changeset for every user-facing library change with `pnpm changeset`; choose patch, minor, or major according to the public API impact.
2. Review the pending release plan with `pnpm changeset status --verbose`.
3. When deliberately preparing a release, run `pnpm version-packages` to update package versions, internal dependency ranges, and changelogs. Review every generated diff and commit it to `main`.
4. Confirm the dependency lockfile is committed and reproducible installs pass with `pnpm install --frozen-lockfile`.
5. Confirm CI and CodeQL pass on the exact `main` commit being released. CI includes package typechecks, tests, builds, archive checks, examples, documentation build, dependency audit, and browser tests.
6. Review package archives with `pnpm check:pack`.
7. For the first-ever publication, use the **Stage initial npm release** GitHub Actions workflow. It uses a short-lived-in-purpose, scope-limited npm granular token with **stage-only** permission. It cannot directly publish package versions.
8. Review and approve each staged package from npmjs.com using account 2FA. Staging a brand-new package creates a public `0.0.0-stage` placeholder; the actual version remains pending until approved.
9. Once the packages exist, configure GitHub Actions Trusted Publishing separately on each package. Use stage-only permission for the publisher.
10. For subsequent releases, use the **Publish npm release** workflow. It uses OIDC to stage versions, which still require maintainer approval on npm before becoming available.

## First release from a phone

No local terminal is required.

### A. Create a stage-only npm token

On npmjs.com, sign in and open Access Tokens. Create a granular access token with:

- Scope/package access limited to the `@rowlith` scope.
- Packages and scopes permission: **Read and write (stage only)**.
- No bypass-2FA publishing permission.
- An expiry appropriate for this one-time bootstrap; revoke it after initial staging and OIDC verification.

The token is a secret. Do not send it in chat or commit it to the repository.

### B. Add the token to GitHub Actions

Open the repository on GitHub → Settings → Secrets and variables → Actions → New repository secret.

- Name: `NPM_STAGE_TOKEN`
- Secret: paste the token value.

### C. Run the staging workflow

Open the repository → Actions → **Stage initial npm release** → Run workflow.

- Branch: `main`
- Confirmation input: `STAGE`

The workflow audits, tests, builds, checks package archives, then stages packages in dependency order. It uses npm CLI 11.15.0 and Node 24, which meet npm's staged-publishing requirements.

### D. Approve staged packages on npm

On npmjs.com, open the **Staged Packages** tab. Review each of the five package stages and approve them with 2FA. Do not approve a stage if its package name, version, contents, or dependency metadata is unexpected.

Expected initial versions:

| Package | Version |
|---|---:|
| `@rowlith/import-core` | `0.1.1` |
| `@rowlith/import-csv` | `0.2.0` |
| `@rowlith/import-xlsx` | `0.1.1` |
| `@rowlith/import-react` | `0.1.1` |
| `@rowlith/import-ui` | `0.1.1` |

### E. Configure Trusted Publishing

After each package is created and visible on npm, configure a GitHub Actions trusted publisher with:

- Provider: GitHub Actions
- Organization or user: `rowlith-labs`
- Repository: `rowlith`
- Workflow filename: `publish-release.yml`
- Environment: blank
- Allowed actions: `npm stage publish` only (stage-only)

Repeat for all five packages. Newly created trust configurations must complete their first successful OIDC publish within two days. After configuration, prepare a patch Changeset for all five packages, run `pnpm version-packages`, review and commit the new versions/changelogs, then dispatch **Publish npm release** within that window. Approve those OIDC-staged versions on npm.

Once OIDC staging is verified, delete the `NPM_STAGE_TOKEN` GitHub repository secret and revoke the temporary token in npm.

## Package archive checks

`pnpm check:pack` verifies package names, versions, entry points, export targets, repository metadata, public access, Node engine, MIT license, README, and that internal workspace dependency ranges have been rewritten to published semver ranges.

## Publishing policy

Publishing is deliberately manual. A push, merge, or Changeset does not publish or stage packages. Both workflows require an explicit manual dispatch from `main` and a confirmation input.

The ongoing release workflow uses npm Trusted Publishing (GitHub Actions OIDC), not a long-lived npm token. It stages versions for maintainer approval; it does not directly publish. npm staged publishing requires a maintainer to approve each staged version with 2FA before it becomes available to consumers.

## Security

Never commit registry credentials or send them in chat. Use the narrowest scope and stage-only permission for the bootstrap token. Revoke it after OIDC is verified. Keep OIDC publisher permissions stage-only, and review GitHub Actions permissions whenever changing the publishing workflow.

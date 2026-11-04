# Public npm Registry Completion

## 1. Developer actions

### Build

None — local workspace checks, dashboard build, and package packing passed.
CI installs Node 24/npm 11 and uses existing Bun dependencies; no new secret is required.

### Run

None — no CLI, dashboard, API, or app runtime configuration changed.

### Roll out

1. Confirm npm publish access to `@shinnodua/agent-workflows` and check existing
   versions. Package existence and ownership are Unknown; owner: npm maintainer.
2. If absent, follow [npm maintainer setup](../README.md#npm-maintainer-setup)
   to publish an unused version with interactive npm login/2FA.
3. Configure the npm package's GitHub trusted publisher: user `shinnodua`,
   repository `agent-workflows`, workflow `release.yml`, no environment;
   enable direct `npm publish`.
4. Merge a package changeset and its generated Changesets version PR when ready.
   Verify npm availability and anonymous installation afterward.

## 2. Artifacts created and approved

| Stage | Artifact | Status |
| --- | --- | --- |
| Research | [RESEARCH-20261104-public-npm-registry](../research/research-20261104-public-npm-registry.md) | reviewed |
| PRD | [PRD-20261104-public-npm-registry](../prds/prd-20261104-public-npm-registry.md) | approved by auto mode |
| Design | Not applicable: release configuration and documentation | not applicable |
| Sprint meeting | Five-role review; record under meeting-logs/ | complete |
| Root plan | [PLAN-20261104-public-npm-registry](../plans/plan-20261104-public-npm-registry.md) | complete |
| Repository plans | No submodules affected | not applicable |

## 3. Implementation summary

Workspace root only:

- [package.json](../package.json): explicit npm registry and public access;
  package name remains `@shinnodua/agent-workflows`.
- [Release workflow](../.github/workflows/release.yml): Node 24/npm 11,
  GitHub OIDC permission, no registry token injection. Existing validation gate
  and Changesets version/release flow retained.
- [README](../README.md), [INSTALL](../INSTALL.md), and Changesets guidance:
  anonymous installation, targeted scope migration, stale lockfile warning,
  bootstrap and exact npm trust fields.
- Patch changeset added. No dependency versions or lockfiles changed.
- Dashboard remains private; no submodule pointer changes.

## 4. Breaking changes and compatibility

- Registry destination changes from GitHub Packages to public npm. Existing
  consumers must replace the old scope override and refresh this dependency's
  lockfile entry if it still references GitHub tarballs.
- Existing GitHub releases are not copied to npm by this configuration change.
- Package name, CLI contract, runtime code, and version-management flow are unchanged.
- Unknown — npm package ownership, existing versions, and trusted publisher
  settings; owner: npm maintainer.

## 5. Environment and operational configuration

| Setting | Service | Phase | Value/source | Action |
| --- | --- | --- | --- | --- |
| publishConfig.registry | Root npm package | publication | https://registry.npmjs.org | Configured |
| publishConfig.access | Root npm package | publication | public | Configured |
| id-token: write | GitHub Actions release job | publication | GitHub OIDC identity | Configured |
| GITHUB_TOKEN | GitHub Actions | PR/release automation | GitHub-provided token | Retained; no manual npm token |
| Trusted Publisher | npm package settings | publication | shinnodua / agent-workflows / release.yml; direct publish allowed | Maintainer setup required |
| @shinnodua:registry | Existing consumers | installation | https://registry.npmjs.org | Replace stale GitHub mapping only |

No client-visible environment variables, API settings, or runtime services changed.

### Data and rollout operations

- Migrations and backfills: None.
- API and client rollout order: None; npm publication must precede consumer migration.
- Rollback/downtime: no deployed runtime changed. Published npm versions cannot be
  overwritten; release corrections as a new version. No publication was attempted.

## 6. Validation results

| Repository | Check | Result | Evidence |
| --- | --- | --- | --- |
| Root | bun run workspace:check | passed | 15 CLI, 26 add-project, 5 security, 34 dashboard tests; lint, typecheck, dashboard build |
| Root | npm pack --dry-run --json | passed | 189 package entries; CLI and INSTALL included |
| Root | npm pack --pack-destination /private/tmp --json | passed | Inspected generated tarball manifest: public/npm destination |
| Root | git diff --check | passed | No whitespace errors |
| Root | Private dashboard inspection | passed | dashboard/package.json retains private: true |
| External | npm publish / OIDC / anonymous remote install | not run | Requires maintainer account setup and an actual release |

Build and runtime evidence: local dashboard production build passed; no external
release or deployed runtime was exercised. The integrity checker reported one
pre-existing nonfatal meeting-filename artifact-ID warning. Vite reported its existing large-chunk advisory.

Dependency reinstall was unavailable in the sandbox (Bun temporary-directory
permission); validation used the existing installed dependencies successfully.
Root submodule pointer status: None changed.

## 7. Human-only questions

None blocking repository setup. The npm maintainer owns unverified package/scope
access, first publication if needed, and trusted publisher configuration.

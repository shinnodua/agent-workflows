# Public npm Registry Plan

## Metadata

- Plan ID: `PLAN-20261104-public-npm-registry`
- PRD ID: `PRD-20261104-public-npm-registry`
- Type: `plan`
- PRD link: [PRD](../prds/prd-20261104-public-npm-registry.md)
- Research sources:
  - `RESEARCH-20261104-public-npm-registry`: [Research](../research/research-20261104-public-npm-registry.md) - npm OIDC and registry requirements.
- Status: `complete`
- Created: `2026-11-04`
- Last updated: `2026-11-04`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261104-public-npm-registry]`

## Title

Public npm Registry

## Goal

Prepare the existing scoped package for public npm publishing and anonymous installation.

## Research Inputs

- Research brief: `RESEARCH-20261104-public-npm-registry`
- Key planning implications: retain Changesets v3/action v2; use explicit npm/public metadata and GitHub OIDC; Node 24 with npm 11.
- Source gaps: npm scope ownership, package existence, and trust settings are external maintainer prerequisites.

## Scope

In scope: package.json publishConfig, release.yml, README.md, INSTALL.md,
.changeset/README.md, patch changeset, and workflow artifacts.

Out of scope: publication, account changes, dependency changes, package rename,
product runtime, historical artifact rewriting, commits and pushes.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| workspace-root | Registry metadata, release automation, documentation | This plan |

## Cross-Repo Design

- Data contracts: stable package name and versioning.
- Shared packages or APIs: None.
- Runtime flow: install dependencies, validate package, then Changesets version PR or npm publication.
- Dependency direction: release workflow invokes existing root scripts; npm trust authorizes only the workflow identity.
- Submodules: None; configured example repositories are unaffected.

## Sequence

1. Set publishConfig.registry to https://registry.npmjs.org and access to public.
2. Replace packages permission with id-token write; select Node 24 and install npm 11. Remove registry token injection while retaining GitHub automation token.
3. Document consumer migration and maintainer bootstrap/trust tuple shinnodua/agent-workflows/release.yml, no environment, allow direct npm publish.
4. Add patch changeset, run full workspace checks and dry-run, inspect packed manifest.
5. Record verified results and external prerequisites. One root-only serial stage; no parallel implementation targets.

## Validation

- Root: bun run workspace:check; npm_config_cache=/private/tmp/agent-workflows-npm-cache bun run package:dry-run.
- Inspect manifest public access/npm registry and private dashboard; review workflow permissions, versions, and removed registry credentials.
- Actual publish, GitHub OIDC, and anonymous remote install are not run.

## Risks

- First npm publication requires account access and an unused version; document bootstrap separately.
- Consumers may retain old scope mappings and tarball URLs; provide targeted migration.
- No .archify diagram represents registry publishing; existing feature-delivery diagram is unaffected.

## Open Questions

- None for implementation; maintainer owns external npm setup.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-11-04`
- Approval command: `$auto-mode on`

## Completion

[Verified delivery and release prerequisites](../docs/public-npm-registry-completion.md).

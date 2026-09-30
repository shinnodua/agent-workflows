# Package Release Workflow Plan

## Metadata

- Plan ID: `PLAN-20260825-package-release-workflow`
- PRD ID: `PRD-20260825-package-release-workflow`
- Type: `plan`
- PRD link: [`../prds/PRD-20260825-package-release-workflow.md`](../prds/PRD-20260825-package-release-workflow.md)
- Research sources:
  - `None`: Repository inspection only.
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-26`
- Owner: `tech-lead`
- Related artifact IDs: `[]`

## Title

`Package Release Workflow`

## Goal

Add package versioning, validation, and release automation so the workflow
template can be built and released consistently from GitHub.

## Research Inputs

- Research brief: `None`
- Key planning implications:
  - Changesets should own version bumps and changelog generation.
  - CI should fail before publish if workspace validation or package packing
    breaks.
  - Publish automation should target GitHub Packages and use
    `secrets.GITHUB_TOKEN`.
- Source gaps:
  - `None`

## Scope

In scope:

- Changesets configuration.
- GitHub Actions CI and release workflows.
- Root package scripts and dependency updates.
- README release workflow notes.

Out of scope:

- Registry publishing from this local environment.
- Repository secret creation.
- Branch protection setup in GitHub settings.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| `workspace-root` | Package build, versioning, release, and CI automation | `N/A` |

## Cross-Repo Design

No submodules are affected.

- Data contracts: Changeset Markdown files under `.changeset/`.
- Shared packages or APIs: None.
- Runtime flow: CI installs dependencies, runs workspace checks, then validates
  package packing. Release workflow validates first, then runs Changesets action.
- Dependency direction: GitHub Actions uses package scripts; scripts remain
  runnable locally.

## Sequence

1. Add Changesets dependency and config.
2. Add root package scripts.
3. Add GitHub Actions CI and release workflows.
4. Update README with build and release instructions.
5. Validate package build and workspace checks.

## Validation

- Root:
  - `bun install`
  - `bun run lint`
  - `bun run workspace:check`
  - `bun run package:dry-run`

## Risks

- Risk: GitHub Packages rejects unscoped npm package names. Mitigation: publish
  as `@shinnodua/agent-workflows`.
- Risk: Package dry-run can miss runtime behavior. Mitigation: keep CLI smoke
  checks as part of local validation when changing CLI behavior.

## Open Questions

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

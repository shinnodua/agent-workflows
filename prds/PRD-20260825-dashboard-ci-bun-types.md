# Dashboard CI Bun Types PRD

## Metadata

- PRD ID: `PRD-20260825-dashboard-ci-bun-types`
- Title: `Dashboard CI Bun Types`
- Type: `prd`
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-25`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Fix GitHub Action workspace check failure: Cannot find type definition file for bun-types`
- Research sources:
  - `None`: No saved research was required; implementation is based on CI output and repository inspection.

## Problem

GitHub Actions runs `bun install --frozen-lockfile` at the workspace root before
`bun run workspace:check`. The dashboard typecheck runs from `dashboard/` and
requires `bun-types`, but a clean root install does not install the dashboard's
package-level dev dependencies unless the dashboard participates in the root
workspace install.

## Research Context

- Research brief: `None`
- Key findings used:
  - `.github/workflows/ci.yml` installs dependencies only from the root.
  - `dashboard/tsconfig.json` specifies `types: ["vite/client", "bun-types"]`.
  - `dashboard/package.json` declares `bun-types` in devDependencies.
  - The root `package.json` does not currently declare `dashboard` as a
    workspace.
- Source gaps:
  - `None`

## Goals

- Make clean root installs provide the dependencies needed by dashboard
  typecheck, tests, and build.
- Keep dependency versions exact and Bun-managed.

## Non-Goals

- Change dashboard runtime behavior.
- Change GitHub Actions semantics beyond dependency availability.

## Users And Use Cases

- User: `developer`
- Use case: `Push a branch and have GitHub Actions pass workspace validation
  after a clean frozen Bun install.`

## Requirements

Functional requirements:

- Root dependency installation includes the dashboard package dependency graph.
- `bun run workspace:check` passes after reinstalling from the updated lockfile.

Non-functional requirements:

- Keep package versions pinned exactly.
- Keep package management on Bun.

## User Flows

1. GitHub Actions checks out the repository.
2. CI runs `bun install --frozen-lockfile` at the root.
3. CI runs `bun run workspace:check`.
4. Dashboard typecheck resolves `bun-types`.

## Affected Platforms

- `workspace-root`: Root package metadata and lockfile.
- `dashboard`: Dependency installation path for dashboard validation.

## Data, API, And Package Contracts

- Shared types or packages: No application package contracts.
- API endpoints: No backend API changes.
- Events or runtime interfaces: No runtime interface changes.
- Compatibility requirements:
  - Existing root scripts continue to run dashboard commands with
    `bun run --cwd dashboard`.

## UX Notes

No user-facing UI changes.

## Acceptance Criteria

- A clean root Bun install includes dashboard dev dependencies.
- `bun run workspace:check` passes locally.
- The root lockfile reflects the dashboard workspace dependency graph.

## Risks And Tradeoffs

- Risk: Workspace installation may expose previously separate dependency graph
  differences. Mitigation: use the existing dashboard package metadata and run
  full workspace validation.

## Open Questions

- `None`

## Design Artifacts

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

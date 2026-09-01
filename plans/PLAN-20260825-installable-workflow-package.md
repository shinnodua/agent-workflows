# Installable Workflow Package Plan

## Metadata

- Plan ID: `PLAN-20260825-installable-workflow-package`
- PRD ID: `PRD-20260825-installable-workflow-package`
- Type: `plan`
- PRD link: [`../prds/PRD-20260825-installable-workflow-package.md`](../prds/PRD-20260825-installable-workflow-package.md)
- Research sources:
  - `None`: Repository inspection only.
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-09-01`
- Owner: `tech-lead`
- Related artifact IDs: `[]`

## Title

`Installable Workflow Package`

## Goal

Turn the root workspace into an installable package that initializes workflow
assets into another project, runs the packaged dashboard against that project,
and refreshes workflow-owned files after package upgrades.

## Research Inputs

- Research brief: `None`
- Key planning implications:
  - Root package metadata must expose a `workflows` binary and include all files
    used by the CLI and dashboard.
  - Command shims that delegate to `.agents/skills/` must ship with matching
    `SKILL.md` sources.
  - Dashboard workspace discovery must accept a caller-provided root instead of
    assuming the package checkout is the workspace.
  - Update behavior needs a manifest so the package has a clear ownership
    boundary.
  - Initialized consuming workspaces need command and skill files refreshed after
    package lifecycle updates before source agents can discover new behavior.
- Source gaps:
  - `None`

## Scope

In scope:

- Root CLI scripts and package metadata.
- Package lifecycle refresh behavior for initialized consuming workspaces.
- Dashboard Vite workspace-root configuration.
- README and setup documentation.
- Root PRD and plan artifacts for traceability.

Out of scope:

- Publishing to a registry.
- Product submodule implementation.
- Automated migration of arbitrary developer customizations.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| `workspace-root` | Installable CLI, package metadata, reusable documentation, and dashboard configuration | `N/A` |

## Cross-Repo Design

No submodules are affected. The installed package provides reusable workflow
assets and runs dashboard tooling against a developer-selected project root.

- Data contracts: `.agent-workflows/manifest.json` records package version and
  managed files.
- Lifecycle contract: package postinstall runs a best-effort `workflows update`
  for initialized consuming workspaces, with `AGENT_WORKFLOWS_SKIP_AUTO_UPDATE=1`
  as the documented opt-out.
- Shared packages or APIs: Root package dependencies include dashboard runtime
  dependencies.
- Runtime flow: `workflows dashboard` sets `WORKFLOWS_WORKSPACE_ROOT` before
  spawning the dashboard dev server.
- Dependency direction: Developer projects depend on the workflow package; the
  package must not depend on developer project code.

## Sequence

1. Add PRD and root plan artifacts.
2. Update CLI and postinstall scripts so initialized consuming workspaces refresh
   command and skill assets automatically after package install or upgrade.
3. Update package metadata and documentation.
4. Update dashboard root resolution.
5. Install/update lockfile as needed.
6. Run validation commands.

## Validation

- Root:
  - `bun install`
  - `bun run lint`
  - `bun run workspace:integrity`
  - `bun run dashboard:typecheck`
  - `bun run dashboard:test`
  - `bun run dashboard:build`

## Risks

- Risk: `workflows update` overwrites customizations to managed files. Mitigation:
  report managed files clearly and keep project-specific files developer-owned.
- Risk: Dashboard cannot resolve dependencies after installation. Mitigation:
  root package declares dashboard runtime dependencies.

## Open Questions

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

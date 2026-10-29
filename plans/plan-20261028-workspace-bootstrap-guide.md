---
id: PLAN-20261028-workspace-bootstrap-guide
type: plan
status: complete
created: 2026-10-28
updated: 2026-10-28
owner: tech-lead
prdId: PRD-20261028-workspace-bootstrap-guide
relatedArtifactIds: [RESEARCH-20261028-workspace-bootstrap-guide]
---

# Workspace Bootstrap Guide Plan

## Metadata

- Plan ID: `PLAN-20261028-workspace-bootstrap-guide`
- PRD ID: `PRD-20261028-workspace-bootstrap-guide`
- Type: `plan`
- PRD link: [Bootstrap PRD](../prds/prd-20261028-workspace-bootstrap-guide.md)
- Research sources:
  - `RESEARCH-20261028-workspace-bootstrap-guide`: [Research](../research/research-20261028-workspace-bootstrap-guide.md) — command boundaries and conventions.
- Status: `complete`
- Created: `2026-10-28`
- Last updated: `2026-10-28`
- Owner: `tech-lead`
- Related artifact IDs: `[MEETING-20261028-1933-workspace-bootstrap-guide]`

## Title

Workspace Bootstrap Guide

## Goal

Ship a standalone INSTALL.md for agents bootstrapping consuming workspaces,
discoverable from existing documentation and available in the package.

## Research Inputs

- Research brief: `RESEARCH-20261028-workspace-bootstrap-guide`.
- Implications: use Markdown INSTALL.md plus AGENTS.md discovery; preserve
  init/update behavior, existing package-manager conventions, and setup Save gates.
- Source gaps: actual registry access/download not exercised locally.

## Scope

In scope: INSTALL.md, short links from README.md, AGENTS.md, and template setup
documentation; package files allowlist and patch changeset; validation artifacts.

Out of scope: CLI changes, dependencies, skill changes, dashboard/product code,
submodules, publishing, commits, and deployments.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| workspace-root | Documentation and package inclusion | This plan; no submodule plans required |

## Cross-Repo Design

- Data contracts, shared packages/APIs, runtime flow: unchanged.
- Dependency direction: guide delegates to packaged CLI and local setup skills.
- Links from packaged AGENTS.md and setup docs resolve to packaged INSTALL.md;
  consuming shims already point to their packaged sources. No managed-path change.

## Sequence

1. Write INSTALL.md with start/resume routing, prerequisites, registry access,
   package-manager variants, initialization, reload handoff, profile and repository
   setup, verification, optional preferences/dashboard, and failure recovery.
2. Add short discovery links to README.md, AGENTS.md, and existing setup docs,
   preserving all pre-existing edits. Include INSTALL.md in package.json files
   and add a patch changeset without changing dependency versions.
3. Verify packed contents/relative links and temporary fresh/partial CLI fixtures
   with existing-file sentinels; run the configured root validation.
4. Record validation limits and completion facts, then mark plan complete.

One root documentation stage; serial execution avoids overlap with pending edits.
No product implementation stage or parallel implementation target is affected.
The delivery diagram represents unchanged feature delivery, not bootstrap; no
known diagram behavior or source reference changes in this scope.

## Validation

- Root: `bun run workspace:check` from project/validation.json.
- Distribution: `npm pack --dry-run --json --ignore-scripts` with temporary cache;
  inspect INSTALL.md and relative documentation links in packaged file list.
- Temporary fixtures: CLI init and integrity, rerun init with preserved profile,
  instructions, and package-script sentinels; verify manifest and local shims.
- No new tests for this reversible documentation-only change; use existing checks
  and a bounded smoke check. No authenticated registry install or real repository
  cloning; report these limits explicitly.

## Risks

- Existing unrelated work: use narrow edits and inspect the final diff.
- False readiness: combine structural check with explicit project-fact checklist.
- Registry/package-manager drift: cite primary authentication docs and preserve
  package-manager choice; show the supported CLI with its explicit local path.
- INSTALL.md is not auto-discovered: link from AGENTS.md and provide a prompt.

## Open Questions

- None.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-10-28`
- Approval command: `$auto-mode on`


## Completion Handoff

### 1. Developer actions

- Build: None required to review or use the source guide.
- Run: Point an agent at INSTALL.md and the intended consuming workspace when
  setup is desired; this task created guidance and did not set up a new project.
- Roll out: No deployment. Package inclusion takes effect in the next normal
  package release; a patch changeset is included. No commit or publish performed.

### 2. Artifacts created and approved

| Stage | Artifact | Status |
| --- | --- | --- |
| Research | [RESEARCH-20261028-workspace-bootstrap-guide](../research/research-20261028-workspace-bootstrap-guide.md) | reviewed |
| PRD | [PRD-20261028-workspace-bootstrap-guide](../prds/prd-20261028-workspace-bootstrap-guide.md) | approved under auto mode |
| Design | Not applicable: documentation-only; document UX reviewed | not applicable |
| Meeting | [MEETING-20261028-1933-workspace-bootstrap-guide](../meeting-logs/prd-20261028-workspace-bootstrap-guide-sprint-meeting-20261028-1933.md) | complete; five role perspectives, frontend reused completed PM agent due to thread limit |
| Root plan | PLAN-20261028-workspace-bootstrap-guide (this file) | complete |
| Repository plans | None: no affected submodules | not applicable |

### 3. Implementation summary

- workspace-root: [INSTALL.md](../INSTALL.md) covers prerequisite checks, package
  installation, initialization, reload handoff, profile/repository setup,
  validation, optional dashboard/preferences, and partial-setup recovery.
- Discovery links added to AGENTS.md, README.md, and template setup documentation.
- Package files allowlist includes INSTALL.md; patch changeset added. Existing
  uncommitted edits were retained. No dependency or CLI behavior changes.
- Integration: existing CLI, project-setup, and add-project flows only.

### 4. Breaking changes and compatibility

- Breaking changes: None; additive documentation and distribution metadata.
- Compatibility/rollout order: guide available directly from source now and in
  package distributions after the next normal release.
- Unknowns: consuming-user registry/repository access; owner: consuming developer.

### 5. Environment and operational configuration

- New build/runtime settings: None; checked package.json and changed documentation.
- Existing prerequisite for consuming setup: @shinnodua registry mapping to
  https://npm.pkg.github.com and private package-manager authentication with
  appropriate read access. No secret values stored or collected.
- Migrations, backfills, API/client rollout order: None.
- Rollback/downtime: no runtime change or downtime; documentation can be revised.

### 6. Validation results

| Repository | Check | Result | Evidence |
| --- | --- | --- | --- |
| workspace-root | bun run workspace:check | passed | Integrity, 13 CLI tests, 25 repository-addition tests, 5 security tests, lint, 34 dashboard tests, typecheck, production build |
| workspace-root | npm pack --dry-run --json --ignore-scripts | passed | INSTALL.md and its relative file targets present in package listing |
| Temporary consuming fixture | local CLI init, repeated init, update, integrity | passed | Fresh scaffolding and partial setup; existing profile/instruction/script sentinels retained by repeated init; update replaces managed instructions while retaining profile |
| Temporary consuming fixture | local CLI check | passed after formatting generated config | First check detected workspace.config.json array formatting; formatting only that fixture file resolved it |
| workspace-root | git diff --check | passed | No whitespace errors |

- Root integrity warning: pre-existing add-project PRD references an unresolved
  meeting artifact ID; unrelated to this feature and left intact.
- Build warning: dashboard bundle exceeds Vite's 500 kB advisory threshold;
  build succeeds. Dashboard implementation was not changed.
- Limits: fixture used the current local package via a symlink, not an
  authenticated registry installation; no private repository clone, real project
  setup interview, or dashboard startup was performed for this guide.
- Root submodule pointer status: None changed; no submodules modified.

### 7. Human-only questions

None for this feature. Actual consuming-project facts and credentials belong to
its developer when the guide is used.

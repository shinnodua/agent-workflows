# Product Requirements Document: Workspace Bootstrap Guide

## Metadata

- PRD ID: `PRD-20261028-workspace-bootstrap-guide`
- Title: `Workspace Bootstrap Guide`
- Type: `prd`
- Status: `approved`
- Created: `2026-10-28`
- Last updated: `2026-10-28`
- Owner: `project-manager`
- Related artifact IDs: `[MEETING-20261028-1933-workspace-bootstrap-guide]`
- Source request: `Create a file that guides an agent to initialize a full workspace project, add the agent-workflows package, and complete setup; use a popular filename/format and refer to open-source projects.`
- Research sources:
  - `RESEARCH-20261028-workspace-bootstrap-guide`: [Bootstrap research](../research/research-20261028-workspace-bootstrap-guide.md) — repository evidence and open-source conventions.

## Problem

A developer cannot currently point a fresh agent to one dedicated document that
takes a consuming project from no Agent Workflows installation to a configured,
validated coordination workspace. Existing guidance assumes knowledge spread
across the README, setup documentation, and installed agent skills.

## Research Context

- Research brief: `RESEARCH-20261028-workspace-bootstrap-guide`.
- Findings: INSTALL.md is an established installation-document convention;
  AGENTS.md provides agent discovery; the current package already owns install,
  initialization, project setup, and repository-registration behavior.
- Source gaps: live package-registry download/access is unverified.
- Developer decisions: use INSTALL.md and continue through implementation.

## Goals

- Let a developer hand one document to an agent before package installation.
- Guide full workspace setup using supported existing behavior.
- Provide explicit completion evidence and safe recovery steps.

## Non-Goals

- New installation commands, automatic credential provisioning, or setup behavior.
- Product code, dashboard UI, publishing, commits, or deployment.
- Replacing existing AGENTS.md rules or duplicating the profile setup interview.

## Users And Use Cases

- Developer: delegate initialization of an empty or existing workspace to an agent.
- Coding agent: install the package, initialize local instructions, resume after a
  session reload, configure project facts and repositories, and verify readiness.
- Maintainer: keep one discoverable bootstrap entry point distributed with the package.

## Requirements

Functional requirements:

- Provide a root INSTALL.md in plain Markdown, linked from README.md and AGENTS.md
  and from the existing detailed template-setup documentation.
- Be readable before installation; explain how a developer points an agent at it.
- Identify the intended workspace root and existing configuration before changes.
- Cover prerequisites, package registry access, local package installation,
  initialization, agent reload, project setup, repository registration, validation,
  and optional dashboard startup in dependency order.
- Delegate project-profile and repository review to existing project-setup and
  add-project flows, including their Save boundary.
- Explain resuming partial setup, updating existing managed instructions, missing
  tools, authentication/access failure, and failed validation.
- Define readiness as configured project facts and repositories plus passing
  applicable validation, with changed files and unresolved blockers reported.
- Distribute the guide with the package so packaged references resolve.

- Provide an early start/resume/update decision and observable outcomes for each major stage.
- Before reload, provide a copyable handoff with target workspace path, completed steps, next action, and blockers.
- Explain actual init/update mutation boundaries and inspect resulting diffs; preserve the existing package-manager convention.
- Keep dashboard and model/auto-mode preferences optional after required readiness.
- Verify fresh and partial initialization with existing-file sentinels in an isolated fixture.

Non-functional requirements:

- Preserve user files and existing instructions; infer facts only from evidence.
- Distinguish shell commands from agent-chat instructions and flag session reloads.
- Never embed credentials in generated files, logs, examples, or handoffs, or assume private repository/package access. Stop affected setup on access failure and report it as incomplete.
- Cite open-source references and describe INSTALL.md as a convention, not an
  automatic agent-discovery standard.

## User Flows

1. Developer supplies INSTALL.md to an agent and identifies the target workspace.
2. Agent inspects current state and confirms prerequisites or reports a blocker.
3. Agent installs Agent Workflows and initializes missing workspace instructions.
4. Agent records progress and the developer reloads the session if required.
5. Agent follows installed setup skills, reviews inferred project facts and
   repositories, and registers repositories at the existing Save boundary.
6. Agent validates the workspace and reports readiness or precise remaining gaps.

## Affected Platforms

- `workspace-root`: guide, discovery documentation, and package distribution.
- No configured product submodules are affected.

## Data, API, And Package Contracts

- Shared types or packages: guide distributed in @shinnodua/agent-workflows.
- API endpoints: None.
- Events or runtime interfaces: existing CLI and agent commands retain behavior.
- Compatibility: additive documentation; preserve existing setups and defaults.

## UX Notes

Use numbered steps, short command blocks, prerequisites, expected outcomes, and
a completion checklist. Separate required setup from optional dashboard and role
model/auto-mode preferences. Record progress across agent restarts.

## Acceptance Criteria

- INSTALL.md can be followed before installing the package and links to primary
  open-source examples supporting its filename and format.
- README.md, AGENTS.md, and the setup documentation link to the guide.
- The guide covers empty and partial workspaces through profile configuration,
  repository registration, validation, and an explicit completion report.
- Shell and chat instructions are clearly distinct; reload and Save boundaries
  are explicit; installation requires no embedded secret values.
- Package contents include INSTALL.md and no new dependency is required.
- Documented initialization and validation commands are checked locally in an
  isolated fixture; unavailable external access is reported honestly.
- Existing user changes remain intact; applicable root checks are run.

## Risks And Tradeoffs

- Documentation may drift: delegate detailed setup behavior to existing skills.
- Users may interpret init as full readiness: explicitly check project facts and
  repository alignment after initialization.
- Registry authentication varies: describe the required access without collecting
  secrets in chat or promising a successful unauthenticated download.

## Open Questions

- None; filename and delivery scope were confirmed by the developer.

## Design Artifacts

- Not applicable: documentation-only feature with no UI or interaction changes;
  document hierarchy and recovery wording are reviewed during the sprint meeting.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-10-28`
- Approval command: `$auto-mode on`

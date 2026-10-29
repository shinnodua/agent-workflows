# Research: Workspace Bootstrap Guide

## Metadata

- Research ID: `RESEARCH-20261028-workspace-bootstrap-guide`
- Title: `Workspace Bootstrap Guide`
- Type: `research`
- Status: `reviewed`
- Created: `2026-10-28`
- Last updated: `2026-10-28`
- Owner: `tech-lead`
- Related artifact IDs: `[]`
- Source request: `Create a standard file guiding an agent through full workspace initialization, package installation, and project setup, referring to open-source projects.`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

Use a root INSTALL.md in plain Markdown, with discovery links from README.md
and AGENTS.md. The developer selected this filename and authorized continuing
through implementation. The guide must be usable before package installation.

## Short Version

Document the existing install → init → reload → project-setup → repository
registration → validation flow. Keep setup behavior in existing skills and CLI
commands. This is a documentation feature owned by the root repository.

## Research Questions

- Which filename and format are established in open source?
- What does a fresh agent need before the installed skills are available?
- How can setup resume without losing existing workspace content?

## Context

The current README and docs/workspace-template-setup.md describe installation
and adaptation separately. The bootstrap entry point should connect them for
an agent starting in an empty or partially initialized consuming workspace.

## Current Workspace Findings

- Root workspace: package.json names @shinnodua/agent-workflows, exposes the
  workflows binary, and targets GitHub Packages. README.md documents Bun local
  and global installation, initialization, session reload, and validation.
- bin/workflows.js: init scaffolds missing files, synchronizes agent models,
  merges package scripts, and writes a manifest; update refreshes managed shims.
  Preserve existing project data and review generated changes.
- The current project-setup and add-project work supports URL-first repository
  review with an explicit Save step before submodule registration. These files
  include pre-existing uncommitted changes and must be preserved.
- INSTALL.md is absent from the package files allowlist. Include it so packaged
  AGENTS.md and README.md references remain usable.
- The existing .archify workspace delivery diagram covers feature delivery,
  approvals, and role handoffs; this guide adds an earlier bootstrap entry point
  without changing those represented behaviors. No diagram update is required.
- Configured example product submodules: unaffected.

## External Findings

- [AGENTS.md specification](https://agents.md/) presents a predictable Markdown
  instruction file for agents and includes setup commands. It imposes no fixed
  schema. Use it to discover the separate installation guide.
- [Neovim INSTALL.md](https://github.com/neovim/neovim/blob/master/INSTALL.md)
  demonstrates a dedicated Markdown installation document with named install
  paths and runnable commands. This supports a familiar convention, not a claim
  that INSTALL.md is a universal agent-discovery standard.

- [GitHub Packages authentication](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry) documents package access and authentication requirements.
- [Bun npmrc support](https://bun.sh/docs/pm/npmrc) confirms scoped registry configuration and credential support.

## Reference URLs

- https://agents.md/ — agent instruction format; accessed 2026-10-28.
- https://github.com/neovim/neovim/blob/master/INSTALL.md — installation filename
  convention; accessed 2026-10-28.
- https://raw.githubusercontent.com/neovim/neovim/master/INSTALL.md — source
  content inspected; accessed 2026-10-28.

- https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry — authentication prerequisites; accessed 2026-10-28.
- https://bun.sh/docs/install/npmrc (redirects to https://bun.sh/docs/pm/npmrc) — scoped registry support; accessed 2026-10-28.

## Product Implications

- Users and use cases: developers delegating consuming-workspace setup to agents.
- Goals: one readable entry point with prerequisites and observable completion.
- Non-goals: new installer, changes to setup semantics, product implementation.
- UX: distinguish terminal commands from chat instructions; name restart points
  and actionable failure recovery.

## Technical Implications

- Affected repositories: root documentation and package distribution metadata.
- Shared contracts, API/backend, web/client, app/runtime: no changes.
- Security: explain existing registry/auth prerequisites without embedding tokens.
- Reliability: use an isolated fixture for CLI smoke checks; never initialize the
  source repository as if it were a fresh consuming project.

## Options

- INSTALL.md plus discovery links: selected; readable before installing, familiar
  installation convention, leaves durable agent rules concise.
- Full guide inside AGENTS.md: discoverable but duplicates ongoing workspace
  instructions; not selected by the developer.
- New custom filename or executable installer: unnecessary new convention and
  behavior; out of scope.

## Recommendation

Ship INSTALL.md, link it from existing entry points, include it in the package,
and verify the documented local setup and packaged file availability.

## Risks And Mitigations

- Guide drift: delegate profile and repository interactions to installed skills.
- Registry authentication failure: describe secure authentication as a prerequisite
  and stop at access errors instead of assuming npm availability.
- Destructive retries: inspect existing state and use init/update deliberately.

## Highest-Risk Unknowns Or Clarifications Needed

- Registry access for an actual consuming user cannot be verified locally; report
  registry download as untested. No decision blocks local documentation work.

## Validation Ideas

- Validate artifact integrity and the configured root checks.
- Smoke-test CLI init/integrity in a temporary workspace.
- Check packed file listing and documentation links.

## Open Questions

- None. Developer selected INSTALL.md and full implementation.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: bootstrap guide plus discovery and package inclusion.
- Suggested affected platforms: workspace-root only.
- Acceptance criteria: cold-start readability, preservation, recovery, verified
  readiness, and packaged availability.
- Sequencing: research, PRD, role review, approval, root plan, documentation, checks.
- Dependencies: existing CLI and setup skill; no new dependency.

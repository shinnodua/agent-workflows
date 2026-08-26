# Package Release Workflow PRD

## Metadata

- PRD ID: `PRD-20260825-package-release-workflow`
- Title: `Package Release Workflow`
- Type: `prd`
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-26`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Setup Changesets and gitflow to build package.`
- Research sources:
  - `None`: No saved research was required; implementation is based on repository inspection and package metadata.

## Problem

The package can be initialized and used locally, but it does not yet have a
repeatable versioning, package build, or release workflow.

## Research Context

- Research brief: `None`
- Key findings used:
  - The repository has no existing `.changeset` or `.github` workflow setup.
  - The root package owns package metadata and validation scripts.
- Source gaps:
  - `None`

## Goals

- Add Changesets for versioning and release notes.
- Add package build scripts that validate the workspace and verify the npm
  tarball.
- Add GitHub Actions workflows for pull request validation and main-branch
  release automation.

## Non-Goals

- Publish the package during this implementation.
- Configure repository secrets.
- Change product submodules.

## Users And Use Cases

- User: `developer`
- Use case: `Open a PR, validate the package build, merge to main, and let the
  release workflow create a version PR or publish when changesets are present.`

## Requirements

Functional requirements:

- Developers can run `bun run changeset` to create a changeset.
- Developers can run `bun run package:build` to validate and dry-run package
  packing.
- CI validates pushes and pull requests on `main`.
- Release automation creates a Changesets version PR or publishes to GitHub
  Packages from `main`.

Non-functional requirements:

- Dependencies must be pinned exactly.
- Workflows must use Bun and the repository's existing validation commands.
- Publish credentials must come from repository secrets, not committed files.

## User Flows

1. Developer makes a package change.
2. Developer runs `bun run changeset`.
3. Pull request runs CI validation and package dry-run.
4. Merge to `main` triggers the release workflow.
5. Changesets opens a version PR or publishes when the version PR is merged.

## Affected Platforms

- `workspace-root`: Package metadata, Changesets config, GitHub Actions, and
  docs.

## Data, API, And Package Contracts

- Shared types or packages: No product package contract changes.
- API endpoints: No backend API changes.
- Events or runtime interfaces:
  - Package scripts: `changeset`, `version`, `release`, `package:dry-run`,
    `package:pack`, `package:build`.
  - GitHub token: release workflow uses `github.token` with `packages: write`.
- Compatibility requirements:
  - Existing CLI and dashboard package behavior must keep working.

## UX Notes

Workflow output should be standard CI output. README should show the local
commands a developer needs before opening or merging a PR.

## Acceptance Criteria

- Changesets config exists.
- Root package scripts support changeset creation, versioning, publishing, and
  package dry-run.
- CI workflow runs install, workspace checks, and package dry-run.
- Release workflow runs package validation and Changesets release automation.
- Workspace validation passes.

## Risks And Tradeoffs

- Risk: GitHub Packages rejects unscoped npm package names. Mitigation: publish
  as `@shinnodua/agent-workflows`.
- Risk: `bun-version: latest` can change CI behavior over time. Mitigation:
  package lockfile and validation catch regressions before publish.

## Open Questions

- `None`

## Design Artifacts

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

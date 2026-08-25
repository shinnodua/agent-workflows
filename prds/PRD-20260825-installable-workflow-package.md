# Installable Workflow Package PRD

## Metadata

- PRD ID: `PRD-20260825-installable-workflow-package`
- Title: `Installable Workflow Package`
- Type: `prd`
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-25`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Make this repo an installable workflow template package with workflows init, workflows dashboard, and workflows update.`
- Research sources:
  - `None`: No saved research was required; implementation is based on repository inspection.

## Problem

Developers need to install this reusable workspace as a package, initialize the
workflow files into their own project, run the dashboard against their project
data, and refresh workflow-owned files when the package version changes.

## Research Context

- Research brief: `None`
- Key findings used:
  - The root repository owns reusable workflow files, skills, command shims,
    templates, roles, docs, scripts, and dashboard tooling.
  - The dashboard currently resolves the workspace root from the package
    checkout, which would read package sample data after installation unless a
    target project root is supplied.
- Source gaps:
  - `None`

## Goals

- Provide an installable package with a `workflows` CLI.
- Support `workflows init` to copy workflow files into a developer project.
- Support `workflows dashboard` to run the local dashboard against the developer
  project, not the installed package directory.
- Support `workflows update` to refresh workflow-owned files in an initialized
  project.
- Notify initialized projects after package install or upgrade that
  `workflows update` is available.

## Non-Goals

- Publish or deploy the package.
- Automatically modify product submodule source code.
- Overwrite project-specific repository profiles or existing PRDs, plans,
  designs, research briefs, or docs during updates.

## Users And Use Cases

- User: `developer`
- Use case: `Install the workflow package, initialize a project workspace, run
  the dashboard locally, and update workflow files when package versions change.`

## Requirements

Functional requirements:

- `workflows init` creates the required workflow directories and copies reusable
  agent guides, commands, skills, prompt shims, templates, roles, docs, scripts,
  and workspace config into the current project.
- `workflows init` creates starter `project/` files only when they do not
  already exist.
- `workflows init` records package version and managed files in a local manifest.
- `workflows update` refreshes managed reusable files from the installed package.
- `workflows update` does not overwrite project profile files or existing
  artifact content unless those files are explicitly managed by the manifest.
- `workflows dashboard` starts the packaged dashboard with the target workspace
  root set to the caller's project.
- Package installation or upgrade prints a suggestion to run `workflows update`
  when the target project is already initialized.

Non-functional requirements:

- CLI behavior must be deterministic and avoid shell-specific assumptions where
  practical.
- The package must use exact dependency versions.
- Dashboard changes must continue to pass typecheck, tests, build, and lint.

## User Flows

1. Developer installs the package into their project.
2. Developer runs `workflows init` from the project root.
3. Developer edits `project/` to describe their repositories.
4. Developer runs `workflows dashboard` to inspect artifacts from that project.
5. Later, developer updates the package and sees a prompt to run
   `workflows update`.
6. Developer runs `workflows update` to refresh workflow-owned files.

## Affected Platforms

- `workspace-root`: CLI, package metadata, reusable docs, PRD/plan artifacts,
  and dashboard Vite configuration.

## Data, API, And Package Contracts

- Shared types or packages: No cross-repo shared package changes.
- API endpoints: No backend API changes.
- Events or runtime interfaces:
  - CLI commands: `workflows init`, `workflows update`,
    `workflows dashboard`, `workflows help`.
  - Environment variable: `WORKFLOWS_WORKSPACE_ROOT` tells the packaged
    dashboard which project to read.
- Compatibility requirements:
  - Existing initialized project files under `project/` and existing artifacts
    must remain developer-owned.

## UX Notes

CLI output should be concise and actionable. Dashboard startup should leave Vite
output visible so developers can open the served URL.

## Acceptance Criteria

- Running `workflows init --root <dir>` creates workflow files and a manifest in
  `<dir>`.
- Running `workflows update --root <dir>` refreshes managed files without
  overwriting developer-owned project profile or artifact files.
- Running `workflows dashboard --root <dir>` starts the dashboard with artifact
  discovery rooted at `<dir>`.
- Package metadata exposes the `workflows` binary and includes files required at
  runtime.
- Validation commands pass for root and dashboard changes.

## Risks And Tradeoffs

- Risk: Developers may customize managed files and later lose those edits on
  update. Mitigation: managed file behavior is explicit in the manifest and
  project/artifact files are not managed by default.
- Risk: Installed dashboard dependencies may not be available from the nested
  dashboard package. Mitigation: root package dependencies include dashboard
  runtime packages.

## Open Questions

- `None`

## Design Artifacts

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

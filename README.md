# Agent Workflows

Installable multi-repository coordination workflow for agent-led product work.

This package provides reusable agent rules, skills, command shims,
PRD/plan/research templates, role definitions, workspace integrity checks, and a
local dashboard for browsing Markdown artifacts.

## Install

Install the package globally when you want the `workflows` command available in
your shell:

```sh
bun add --global agent-workflows
```

Or install it in a project as a dev dependency:

```sh
bun add --dev agent-workflows
```

Then initialize the project:

```sh
workflows init
```

`workflows init` copies reusable workflow files into the current project, creates
starter `project/` profile files when they do not exist, and records managed
files in `.agent-workflows/manifest.json`.

Then fill the project profile with the guided command:

```sh
/project-setup
```

## Commands

```sh
workflows init
project-setup
workflows dashboard
workflows update
workflows integrity
workflows check
```

- `workflows init` sets up a developer project to follow the workflow.
- `project-setup` guides the developer through completing the `project/` profile
  files step by step.
- `workflows dashboard` starts the packaged dashboard and reads artifact data
  from the developer project root.
- `workflows update` refreshes workflow-owned files after upgrading this package.
- `workflows integrity` validates workspace artifact metadata.
- `workflows check` runs package-provided workspace checks.

After package installation or upgrade, initialized projects receive a reminder
to run `workflows update`.

## Build And Release

Create a changeset for any package change:

```sh
bun run changeset
```

Validate the package before opening a PR:

```sh
bun run package:build
```

GitHub Actions runs CI on pull requests and pushes to `main`. The release
workflow uses Changesets to open a version PR, then publishes after that PR is
merged.

The release workflow needs permission to create the Changesets version PR.
Either enable `Allow GitHub Actions to create and approve pull requests` under
repository Actions settings, or add an `GITHUB_TOKEN` repository secret containing
a fine-grained GitHub token with contents and pull request write access.

## Project Setup

After initialization:

1. Edit `project/PROJECT.md` with your product context and ownership boundaries.
2. Edit `project/repositories.json` with your repositories and submodule paths.
3. Add matching Git submodules under `modules/`.
4. Run `workflows integrity` or `workflows check`.
5. Start the dashboard with `workflows dashboard`.

See [docs/workspace-template-setup.md](docs/workspace-template-setup.md) for the
full adaptation checklist.

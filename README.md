# Agent Workflows

Installable multi-repository coordination workflow for agent-led product work.

This package provides reusable agent rules, skills, command shims,
PRD/plan/research templates, role definitions, workspace integrity checks, and a
local dashboard for browsing Markdown artifacts.

## Install

Install the package globally when you want the `workflows` command available in
your shell:

```sh
bun add --global @shinnodua/agent-workflows
```

Or install it in a project as a dev dependency:

```sh
bun add --dev @shinnodua/agent-workflows
```

Then initialize the project:

```sh
workflows init
```

`workflows init` copies reusable workflow files into the current project, creates
starter `project/` profile files when they do not exist, and records managed
files in `.agent-workflows/manifest.json`.

Restart or reload any active agent session after `workflows init`. Source agents
discover commands and skills from the copied `.codex/prompts/`,
`.agents/skills/`, and `commands/` files.

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
- `workflows update` refreshes workflow-owned files after upgrading this package
  or when package lifecycle scripts are disabled.
- `workflows integrity` validates workspace artifact metadata.
- `workflows check` runs package-provided workspace checks.

After package installation or upgrade, initialized projects automatically run a
best-effort `workflows update` so source agents can load the current packaged
commands and skills. Set `AGENT_WORKFLOWS_SKIP_AUTO_UPDATE=1` to skip that
lifecycle refresh, then run `workflows update` manually from the project root.
Restart or reload any active agent session after either path.

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

The release workflow publishes to GitHub Packages. The package must stay scoped
as `@shinnodua/agent-workflows`, and repository Actions settings must allow
GitHub Actions to create pull requests. The workflow uses `secrets.GITHUB_TOKEN`
with `packages: write`, so no npm registry token is required.

To install from GitHub Packages, configure the package scope in the consuming
project or user npm config:

```ini
@shinnodua:registry=https://npm.pkg.github.com
```

## Project Setup

After initialization:

1. Edit `project/PROJECT.md` with your product context and ownership boundaries.
2. Edit `project/repositories.json` with your repositories and submodule paths.
3. Add matching Git submodules under `modules/`.
4. Run `workflows integrity` or `workflows check`.
5. Start the dashboard with `workflows dashboard`.

See [docs/workspace-template-setup.md](docs/workspace-template-setup.md) for the
full adaptation checklist.

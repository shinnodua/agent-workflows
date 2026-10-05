# Agent Workflows

Installable multi-repository coordination workflow for agent-led product work.

This package provides reusable agent rules, skills, command shims,
PRD/plan/research templates, role definitions, workspace integrity checks, and a
local dashboard for browsing Markdown artifacts.

> **Personal project:** I built Agent Workflows for my own use and continue to
> shape it around my workflow. If you have ideas for making it clearer or more
> useful, I welcome suggestions and contributions.

![Workspace delivery workflow](docs/workflows.png)

Explore the [interactive workspace delivery workflow](.archify/workflow-workspace-delivery-20260929-093455/workspace-delivery.html).

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

Then initialize the project. Use `workflows` after a global install, or
`bunx workflows` when the package is installed as a project dev dependency:

```sh
bunx workflows init
```

`workflows init` writes local discovery shims into the current project, creates
starter `project/` profile files when they do not exist, and records managed
files in `.agent-workflows/manifest.json`. The shims let source agents discover
commands and skills locally while the source of truth stays in the installed
package.

Restart or reload any active agent session after `workflows init`. Source agents
discover custom agents, commands, and skills from local `.agents/agents/`,
`.codex/prompts/`, `.claude/agents/`, `.claude/skills/`, `.agents/skills/`,
`commands/`, and `workflows.md` shims. Claude Code loads `CLAUDE.md`, which
imports the shared `AGENTS.md` rules. Run `/project-setup` in either agent.

To choose a model for each role, edit `agentModels` in `workspace.config.json`.
The five keys are `project-manager`, `tech-lead`, `ui-ux-designer`,
`backend-developer`, and `frontend-developer`. Each defaults to `inherit`; replace
any value with a model ID, or use an object with separate `agents` and `claude`
values when the runtimes need different IDs. For example:

```json
{
  "agentModels": {
    "project-manager": "inherit",
    "tech-lead": { "agents": "your-agents-model", "claude": "your-claude-model" },
    "ui-ux-designer": "inherit",
    "backend-developer": "inherit",
    "frontend-developer": "inherit"
  }
}
```

After editing, run `bunx workflows agents sync` and start a new agent session.
The command updates local `.agents/agents/` and `.claude/agents/` definitions;
`workflows init` and `workflows update` run it automatically. Updates preserve
your workspace config and add missing model defaults to configs created by older
package versions. Each agent runtime checks whether its configured model
is available when the agent starts.

You can override a role's base model for a workflow step. Add `workflowModels`
alongside `agentModels` in the same config file:

```json
{
  "workflowModels": {
    "planning": {
      "default": "planning-model-a",
      "backend-developer": "planning-model-b"
    },
    "coding": {
      "backend-developer": "coding-model-c"
    }
  }
}
```

The supported steps are `research`, `prd`, `design`, `meeting`, `planning`,
`coding`, and `validation`. A role override wins over its step default, which
wins over its base `agentModels` value. An explicit `inherit` chooses the runtime
default. Runtime-specific objects must provide both `agents` and `claude` IDs.
Check a result with `bunx workflows agents resolve planning backend-developer --format
agents --json`. Step overrides apply when the workflow spawns a new role agent;
`agents sync` updates only base agent files. If coding and validation run in one
agent session, that agent keeps its coding model.

Then fill the project profile with the guided command:

```sh
/project-setup
```

After a PRD exists, run a role-agent review meeting from the active agent chat:

```sh
/sprint-meeting <prd-id>
```

To let the agent continue through the full feature workflow after you start a
feature request, enable auto mode:

```sh
bunx workflows auto on
```

Check or change it later with `bunx workflows auto status`, `off`, or `toggle`,
or use `/auto-mode on|off|toggle|status` in the agent chat. Auto mode is off by
default and is saved in `workspace.config.json` under `autoMode`. Older
`.agent-workflows/metadata.json` settings migrate when you run `workflows update`
or an auto-mode command. It runs research,
PRD, design, sprint meeting, PRD and plan approvals, implementation, and
validation without routine approval prompts. The agent still asks for decisions
only the developer can answer.

## Commands

```sh
bunx workflows init
auto-mode on|off|toggle|status
project-setup
sprint-meeting
bunx workflows dashboard
bunx workflows update
bunx workflows integrity
bunx workflows check
bunx workflows auto on|off|toggle|status
bunx workflows agents sync
bunx workflows agents resolve planning tech-lead --format agents --json
```

- `workflows init` sets up a developer project to follow the workflow.
- `auto-mode` and `workflows auto` control workspace-local automatic progression.
- `project-setup` guides the developer through completing the `project/` profile
  files step by step.
- `sprint-meeting` runs a time-boxed role-agent PRD review meeting and saves the
  record under `meeting-logs/`.
- `workflows dashboard` starts the packaged dashboard and reads artifact data
  from the developer project root.
- `workflows update` refreshes workflow-owned shims and adds missing model defaults to older workspace configs.
- `workflows integrity` validates workspace artifact metadata.
- `workflows check` runs package-provided workspace checks.
- `workflows agents sync` applies per-role models from `workspace.config.json`.
- `workflows agents resolve` reports the effective model and config source for a workflow step.

## Commit Security Check

Install the repository's Git hook once after cloning:

```sh
bun install
bun run hooks:install
```

Before each commit, Lefthook scans staged files for private keys, common service
tokens, credential assignments, personal email addresses, local home paths, and
sensitive filenames. A finding blocks the commit and reports its location
without printing the value. The existing workspace checks run after this scan.
Run the scan directly with `bun run security:staged`.

The scan uses patterns and cannot guarantee that every secret or private detail
is caught. Review staged changes before committing. Example addresses under
`example.com`, `example.org`, and `example.net` are allowed.

Package installation leaves existing workspace files unchanged. After upgrading,
run `bunx workflows update` from the project root to refresh the local shims, or
set `AGENT_WORKFLOWS_AUTO_UPDATE=1` during installation to enable that update in
the package lifecycle script. Restart or reload any active agent session after
the refresh.

## Local Shims

Agent Workflows keeps reusable source files in the installed package and writes
small local shims for agent discovery:

- `.agents/skills/*/SKILL.md`
- `.agents/agents/*/agent.md`
- `.codex/prompts/*.md`
- `.claude/skills/*/SKILL.md`
- `.claude/agents/*.md`
- `commands/*.md`
- `AGENTS.md`
- `CLAUDE.md`
- `workflows.md`
- reusable `roles/`, `templates/`, and setup docs

Those shims point back to
`node_modules/@shinnodua/agent-workflows/...` for project-local installs, or to
the actual package install path for global installs. Project-owned files such as
`project/`, `prds/`, `plans/`, `designs/`, `research/`, `meeting-logs/`,
`docs/`, and `modules/` remain local to the consuming workspace.

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
4. Run `bunx workflows integrity` or `bunx workflows check`.
5. Start the dashboard with `bunx workflows dashboard`.

See [docs/workspace-template-setup.md](docs/workspace-template-setup.md) for the
full adaptation checklist.

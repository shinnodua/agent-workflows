# Reusable Workspace Template Setup

Use this guide when applying Agent Workflows to a new multi-repository project.

## Template Model

The workspace is split into two layers:

- Reusable workspace infrastructure: workflows, commands, PRD/plan templates,
  dashboard, integrity checks, and agent rules.
- Project profile: replaceable files under `project/` plus `.gitmodules`.

When adapting the workspace, keep generic workflow behavior in the reusable
files and put project-specific repository facts in `project/`.

## Project Profile Files

Create or replace these files:

- `project/PROJECT.md`: human-readable project purpose, ownership boundaries,
  and project-specific notes.
- `project/repositories.json`: source of truth for submodule IDs, paths,
  purposes, agent guide paths, artifact directories, code scan directories, and
  validation commands.
- `project/validation.json`: root and workspace-local validation commands.
- `project/workflows.json`: optional project-specific implementation stages.
- `.gitmodules`: Git submodule URLs and paths for the project.

## Repository Profile Schema

Each repository entry in `project/repositories.json` should use this shape:

```json
{
	"id": "client",
	"name": "project-client",
	"path": "modules/project-client",
	"url": "https://github.com/example/project-client.git",
	"purpose": "Desktop or web client",
	"scope": ["React UI", "local app behavior"],
	"platforms": ["frontend"],
	"agentGuide": "modules/project-client/AGENTS.md",
	"artifactDirectories": {
		"plans": "modules/project-client/plans",
		"designs": "modules/project-client/designs",
		"research": "modules/project-client/research",
		"docs": "modules/project-client/docs"
	},
	"codeScanDirectories": ["modules/project-client/src"],
	"validation": ["bun run check"]
}
```

Use stable `id` values. The dashboard and workspace checks use the `id` as the
module key for filtering and artifact ownership.

## Applying To A New Project

Install the package globally when you want the `workflows` command available in
your shell:

```sh
bun add --global @shinnodua/agent-workflows
```

Or install it in the developer project as a dev dependency:

```sh
bun add --dev @shinnodua/agent-workflows
```

Initialize workflow files from the project root:

```sh
bunx workflows init
```

Then run the guided setup command to fill the project profile files:

```sh
/project-setup
```

After a PRD exists, run a role-agent review meeting from the active agent chat:

```sh
/sprint-meeting <prd-id>
```

The command writes local discovery shims for reusable workflow files, creates
starter project profile files when they do not exist, and writes
`.agent-workflows/manifest.json`. The reusable source of truth stays in the
installed package.

Restart or reload any active agent session after `workflows init` so it can
discover the local `.agents/agents/`, `.codex/prompts/`, `.claude/agents/`,
`.claude/skills/`, `.agents/skills/`, `commands/`, and `workflows.md` shims.
Claude Code reads `CLAUDE.md`, which imports the shared `AGENTS.md` rules.

After installing or upgrading the package in an initialized project, refresh
the workflow-owned shims with:

```sh
bunx workflows update
```

The update command refreshes workflow-owned shims and leaves project profile
files, existing PRDs, plans, designs, research, meeting logs, docs, and
submodules under developer control. Set `AGENT_WORKFLOWS_AUTO_UPDATE=1` for the
install command if you want its lifecycle script to perform the refresh.
The workspace auto-mode setting in `.agent-workflows/metadata.json` is also
preserved. Use `bunx workflows auto on|off|toggle|status` or the agent
`/auto-mode` command to change or inspect it; the default is off.
Role models in `workspace.config.json` are also preserved. Set each role under
`agentModels` to `inherit`, a model ID, or an object with `agents` and `claude`
model IDs, then run `bunx workflows agents sync`.
The command updates both `.agents/agents/` and `.claude/agents/` definitions.
Initialization and updates synchronize them automatically. Start a new agent
session after reloading the runtime to use changed models.
When an older workspace config has no model sections, `workflows update` adds
the default `inherit` role entries and empty planning/coding sections without
replacing existing settings.
For a step-specific model, add `workflowModels.<step>.<role>` or
`workflowModels.<step>.default` to the same file. The supported steps are
`research`, `prd`, `design`, `meeting`, `planning`, `coding`, and `validation`.
Use `bunx workflows agents resolve planning tech-lead --format agents --json`
to inspect the selected model and its config source. Step overrides affect
newly spawned workflow agents; static role files retain the base model.
Restart or reload any active agent session after the refresh so it can discover
updated custom agents, commands, and skills.

The local shims point back to the installed package for reusable behavior:

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

Project-owned files remain local to the consuming workspace: `project/`, `prds/`,
`plans/`, `designs/`, `research/`, `meeting-logs/`, `docs/`, `modules/`, and
`workspace.config.json`.

1. Replace `project/PROJECT.md` with the new project's purpose and ownership
   rules.
2. Replace `project/repositories.json` with the new project's repositories.
3. Update `.gitmodules` to match the repository paths and URLs from
   `project/repositories.json`.
4. Initialize submodules:

```sh
git submodule update --init --recursive
```

5. Update root docs that intentionally describe project-specific behavior.
   Keep reusable docs pointing to `project/PROJECT.md` and
   `project/repositories.json`.
6. Run the workspace validation:

```sh
bunx workflows check
```

7. Open the dashboard:

```sh
bunx workflows dashboard
```

## Agent Setup Checklist

Before planning or editing code in the new project, an agent should:

1. Read `AGENTS.md`.
2. Read `project/PROJECT.md`.
3. Read `project/repositories.json`.
4. Identify the owning repository from the project profile.
5. Read that repository's `agentGuide` before editing inside the submodule.
6. Create or update PRD and plan artifacts before implementation.
7. Run validation from the repository that owns changed files.

Use `/project-setup` whenever the profile files still contain placeholders or
need to be brought back into alignment.

## What Should Stay Generic

Keep these files reusable where practical:

- `workflows.md`
- `templates/prd-template.md`
- `templates/plan-template.md`
- `templates/research-template.md`
- `commands/`
- `.agents/skills/`
- `dashboard/`
- `scripts/workspace-integrity.ts`

If a file needs project names, prefer linking to `project/PROJECT.md` or
reading `project/repositories.json` instead of embedding a fixed repository
list.

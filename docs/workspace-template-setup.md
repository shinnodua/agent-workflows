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
	"url": "git@github.com:example/project-client.git",
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
workflows init
```

Then run the guided setup command to fill the project profile files:

```sh
/project-setup
```

The command copies reusable workflow files, creates starter project profile files
when they do not exist, and writes `.agent-workflows/manifest.json`.

When the package is upgraded in an initialized project, run:

```sh
workflows update
```

The update command refreshes workflow-owned files and leaves project profile
files, existing PRDs, plans, designs, research, docs, and submodules under
developer control.

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
workflows check
```

7. Open the dashboard:

```sh
workflows dashboard
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

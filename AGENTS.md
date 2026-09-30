# Reusable Workspace Agent Guide

## Purpose

This repository is a reusable coordination workspace for multi-repository projects. Project-specific repository facts live under `project/`.

Use it to plan cross-repository work, split implementation into focused tasks, write shared documentation, inspect full product context without flattening repositories into a monorepo, and run lightweight workspace-local tooling. The root repository should stay lightweight: it owns workspace-level documents, planning notes, Git submodule pointers, project profile files, command/skill definitions, role guidance, reusable templates, scripts, and the local dashboard used to inspect those artifacts. Product code belongs in the submodule repositories.

## Workspace Structure

```txt
.
├── AGENTS.md              # Workspace-level instructions and repository map
├── workflows.md           # Readable workspace workflow reference
├── workspace.config.json  # Reusable workspace configuration
├── commands/              # Agent command specifications
├── dashboard/             # Local task-status dashboard for root and submodule artifacts
├── docs/                  # Cross-module documentation mappings and template setup docs
├── designs/               # Root-level design artifacts
├── plans/                 # Root overview plans
├── project/               # Replaceable project profile
├── prds/                  # Product requirement documents
├── research/              # Root-level research briefs
├── roles/                 # Role definitions for planning and implementation handoffs
├── scripts/               # Workspace-local validation and maintenance scripts
├── templates/             # Reusable PRD, plan, and research templates
└── modules/               # Product repositories linked as Git submodules
```

## Project Profile

Read these files before planning or editing project code:

- `project/PROJECT.md` - project purpose and ownership boundaries.
- `project/repositories.json` - source of truth for submodule IDs, paths, URLs, purposes, scopes, agent guide paths, artifact directories, code scan directories, and validation commands.
- `project/validation.json` - workspace-local validation commands.
- `project/workflows.json` - optional project-specific implementation stages.

When applying this workspace to a new project, replace `project/` and add matching submodules. See [Reusable Workspace Template Setup](docs/workspace-template-setup.md).

## Working Model

- Treat this root repo as the planning, documentation, and workspace-tooling hub, not as a product code monorepo.
- Keep implementation commits inside the affected submodule repositories.
- Keep root commits limited to workspace documentation, task plans, research, design mappings, dashboard changes, submodule pointer updates, and coordination files.
- Keep `dashboard/` focused on local workspace visibility. It may read PRDs, plans, designs, research briefs, and documentation from the root and submodules, but it must not become product runtime code.
- When a task spans multiple repositories, write the plan at the root first, then make separate implementation changes inside each relevant submodule.
- Prefer small, independently reviewable tasks per repository. Cross-repo work should clearly state ordering and integration points.
- Do not duplicate repo-specific coding rules in this file. Follow the `agentGuide` path from `project/repositories.json` for the owning submodule.

## Cross-Repo Ownership

Use `project/PROJECT.md` and `project/repositories.json` when deciding where work belongs. If a task spans multiple repositories, identify the owning repository for each part before editing.

- Documentation that explains how repositories interact may live at the root. Documentation that explains one repository's internals should live inside that repository.
- Workspace-only dashboards, artifact indexes, and local coordination UI belong in root `dashboard/`.

## Workflows

Workspace setup, PRD and planning commands, research, design, dashboard structure, and implementation sequencing live in [workflows.md](workflows.md).

## Agent Rules

- Start every feature or implementation task by creating or updating the relevant PRD according to the PRD and planning workflow in [workflows.md](workflows.md).
- Identify which repository owns each part of the change from `project/repositories.json` before editing.
- For workspace dependency changes, use the root skill at [.agents/skills/package-installation/SKILL.md](.agents/skills/package-installation/SKILL.md).
- For dashboard frontend implementation, read [dashboard/AGENTS.md](dashboard/AGENTS.md) and use the relevant dashboard-local skills under `dashboard/.agents/skills/` before editing `dashboard/` code.
- Read the relevant submodule `agentGuide` from `project/repositories.json` before editing inside a submodule.
- Before implementing inside a submodule, discover its local skills (for example, `rg --files --hidden modules/<submodule>/.agents/skills modules/<submodule>/.codex/skills -g SKILL.md` where those directories exist). Read and follow every skill relevant to the assigned work, including any skill named by the developer or the submodule's `agentGuide`. Do this for serial work and in every implementation sub-agent handoff; do not assume reading `AGENTS.md` loads the skills.
- When changing behavior, structure, or documentation represented by an existing diagram under `.archify/`, identify the affected diagram from its candidate source references and subject. Ask the developer whether they want that diagram updated, naming the diagram and the changed files. Do not silently leave a known related diagram stale or assume that every file change requires a diagram refresh. When updating, refresh the existing candidate and generated artifact in place when practical. If a new version is needed, validate it, update references, and delete the superseded diagram files or folder so only the current version remains.
- Use `rg` or `rg --files` for searching across the workspace.
- Preserve user changes in the root repo and in every submodule. Never reset or discard work unless explicitly requested.
- Do not commit code or workflow changes. The developer will commit changes.
- Do not push, publish packages, deploy resources, or change production configuration unless the user explicitly asks.
- Run validation commands from the repository that owns the changed files. If a change spans repositories, validate each affected repository separately.
- For root dashboard changes, run the relevant dashboard validation command: `bun run dashboard:typecheck`, `bun run dashboard:test`, `bun run dashboard:build`, or `bun run lint`.
- When creating or updating documentation inside a submodule (`modules/<submodule>/docs/...`), agents MUST also create or update a corresponding root mapping document in `docs/<submodule>/...` containing a relative Markdown link pointing to the submodule document.
- When finishing cross-repo work, report which submodules changed and whether the root submodule pointers need to be committed.

# Project Setup Command PRD

## Metadata

- PRD ID: `PRD-20260825-project-setup-command`
- Title: `Project Setup Command`
- Type: `prd`
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-25`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Add a /project-setup skill and command that help developer to setup project step by step, for fullfill the /project info files`
- Research sources:
  - `None`: No saved research was required; implementation is based on repository inspection.

## Problem

After installing and initializing the workflow package, developers still need to
manually fill `project/` profile files. The expected shape is documented, but
there is no guided command that helps collect the information, update the files,
and keep repository metadata consistent.

## Research Context

- Research brief: `None`
- Key findings used:
  - Project setup data lives in `project/PROJECT.md`,
    `project/repositories.json`, `project/validation.json`, and
    `project/workflows.json`.
  - `.gitmodules` must align with repository paths and URLs from
    `project/repositories.json`.
  - Existing command behavior is stored in `.agents/skills/<command>/SKILL.md`
    with `.codex/prompts/` and `commands/` shims.
- Source gaps:
  - `None`

## Goals

- Add a `/project-setup` command that guides developers step by step through
  filling project profile files.
- Preserve developer-provided project data and only update files with confirmed
  information.
- Keep `project/repositories.json`, `project/validation.json`,
  `project/workflows.json`, `project/PROJECT.md`, and `.gitmodules` aligned.

## Non-Goals

- Clone or add submodules unless the developer explicitly asks for that after
  profile files are written.
- Infer private repository URLs or validation commands without developer input.
- Edit product source code.

## Users And Use Cases

- User: `developer`
- Use case: `Run /project-setup after workflows init and answer guided prompts
  until the project profile files are complete enough for agents to follow the
  workspace workflow.`

## Requirements

Functional requirements:

- The skill supports `$project-setup`, `project-setup`, and `/project-setup`.
- The skill reads existing project profile files before asking questions.
- The skill identifies missing placeholder values and inconsistent repository
  metadata.
- The skill asks one concise question at a time and updates files incrementally.
- The skill can create or update `project/PROJECT.md`,
  `project/repositories.json`, `project/validation.json`,
  `project/workflows.json`, and `.gitmodules`.
- The command and Codex slash prompt delegate to the skill.

Non-functional requirements:

- The workflow must be safe for partially configured projects.
- JSON output must remain formatted consistently.
- The command should not duplicate setup behavior outside the skill.

## User Flows

1. Developer runs `/project-setup`.
2. Agent reads existing project profile files.
3. Agent summarizes what is already known and the next missing setup item.
4. Developer answers one setup question.
5. Agent updates the relevant project file.
6. Steps repeat until the project profile is complete.
7. Agent reports changed files and next validation command.

## Affected Platforms

- `workspace-root`: Skill, command shim, Codex prompt shim, workflow docs, and
  project setup documentation.

## Data, API, And Package Contracts

- Shared types or packages: No package contract changes.
- API endpoints: No backend API changes.
- Events or runtime interfaces:
  - Skill command forms: `$project-setup`, `project-setup`, `/project-setup`.
- Compatibility requirements:
  - Existing initialized projects receive the new skill through
    `workflows update` because `.agents/skills`, `.codex/prompts`, `commands`,
    and docs are managed paths.

## UX Notes

The command should feel like a setup interview, not a form dump. Ask the next
highest-impact question only, use the existing files to avoid repeated questions,
and write changes after the developer provides enough information for a coherent
file update.

## Acceptance Criteria

- `.agents/skills/project-setup/SKILL.md` exists with step-by-step project setup
  behavior.
- `.codex/prompts/project-setup.md` delegates slash command usage to the skill.
- `commands/project-setup.md` documents the command shim.
- Workflow docs mention the new command.
- Workspace validation passes.

## Risks And Tradeoffs

- Risk: The command could overwrite developer-specific project facts. Mitigation:
  require reading existing files and preserving user-provided values unless the
  developer confirms replacement.
- Risk: Asking for every field at once creates poor setup quality. Mitigation:
  require one focused question at a time.

## Open Questions

- `None`

## Design Artifacts

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

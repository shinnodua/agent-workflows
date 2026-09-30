# Project Setup Command Plan

## Metadata

- Plan ID: `PLAN-20260825-project-setup-command`
- PRD ID: `PRD-20260825-project-setup-command`
- Type: `plan`
- PRD link: [`../prds/PRD-20260825-project-setup-command.md`](../prds/PRD-20260825-project-setup-command.md)
- Research sources:
  - `None`: Repository inspection only.
- Status: `approved`
- Created: `2026-08-25`
- Last updated: `2026-08-25`
- Owner: `tech-lead`
- Related artifact IDs: `[]`

## Title

`Project Setup Command`

## Goal

Add a guided project setup command that helps developers complete the
replaceable `project/` profile files after installing and initializing the
workflow package.

## Research Inputs

- Research brief: `None`
- Key planning implications:
  - Command behavior belongs in a skill, with prompt and command files as shims.
  - The skill needs explicit safety boundaries because it edits project profile
    files.
  - Documentation should point developers to `/project-setup` after
    `workflows init`.
- Source gaps:
  - `None`

## Scope

In scope:

- New `.agents/skills/project-setup/SKILL.md`.
- New optional skill UI metadata.
- New `.codex/prompts/project-setup.md` slash shim.
- New `commands/project-setup.md` command shim.
- Workflow and setup documentation updates.

Out of scope:

- CLI changes.
- Dashboard UI changes.
- Product submodule edits.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| `workspace-root` | Add guided setup skill and command documentation | `N/A` |

## Cross-Repo Design

No submodules are affected. The command prepares root project profile files that
later guide cross-repository ownership decisions.

- Data contracts: `project/PROJECT.md`, `project/repositories.json`,
  `project/validation.json`, `project/workflows.json`, and `.gitmodules`.
- Shared packages or APIs: None.
- Runtime flow: Slash command delegates to `$project-setup`; skill reads current
  files, asks one question, updates files, and repeats as needed.
- Dependency direction: Root workflow setup informs future submodule work, but
  does not edit submodule code.

## Sequence

1. Add PRD and root plan artifacts.
2. Add project setup skill and metadata.
3. Add command and slash prompt shims.
4. Update workflow/setup docs.
5. Run workspace validation.

## Validation

- Root:
  - `bun run lint`
  - `bun run workspace:integrity`
  - `bun run package:build`

## Risks

- Risk: Project setup edits may destroy user-provided profile data. Mitigation:
  skill requires reading current files and preserving existing non-placeholder
  values unless the developer confirms changes.
- Risk: The guided flow stalls on too many questions. Mitigation: ask the next
  highest-impact question only and update files incrementally.

## Open Questions

- `None`

## Approval

- Approved by: `developer request`
- Approved on: `2026-08-25`
- Approval command: `direct implementation request`

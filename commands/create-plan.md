# create-plan Command

## Usage

```txt
$create-plan <prd-id-or-path-or-description>
create-plan <prd-id-or-path-or-description>
/create-plan <prd-id-or-path-or-description>

$create-plan PRD-20261006-example
$create-plan "Describe the feature or task to plan"
```

## Behavior

Use `.agents/skills/create-plan/SKILL.md` as the source of truth. An ID or path
selects a PRD directly; a description finds a matching PRD or starts the PRD
workflow. Planning begins only after the PRD is approved. The command creates
or resumes its root and affected submodule plans, then reports their paths and
statuses.

Codex slash command shim: `.codex/prompts/create-plan.md`.

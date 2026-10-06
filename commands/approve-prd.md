# approve-prd Command

## Usage

```txt
$approve-prd <prd-id>
approve-prd <prd-id>
/approve-prd <prd-id>
```

## Behavior

Use the project skill at `.agents/skills/approve-prd/SKILL.md`. The skill is the
source of truth for this command's behavior.

If the PRD contains open questions, `approve-prd` automatically invokes the
`griling-prd` skill (`.agents/skills/griling-prd/SKILL.md`), requiring the
developer to answer all open questions before proceeding.

After review, `approve-prd` approves a `draft` or `design-done` PRD and invokes
`create-plan` for root and affected submodule plans. A PRD in `need-design`
must finish or explicitly skip the selected design first.

Codex slash command shim: `.codex/prompts/approve-prd.md`.

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

If the PRD is in `draft` status, `approve-prd` asks the developer whether to
move to UI/UX design (`need-design`) or proceed directly to create plans
(`approved`). When design is complete (`design-done`), running `approve-prd`
approves the PRD and generates root and submodule plans.

Codex slash command shim: `.codex/prompts/approve-prd.md`.

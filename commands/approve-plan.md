# approve-plan Command

## Usage

```txt
$approve-plan <plan-id>
approve-plan <plan-id>
/approve-plan <plan-id>
```

## Behavior

Use the project skill at `.agents/skills/approve-plan/SKILL.md`. The skill is
the source of truth for this command's behavior.

If the root plan or any linked submodule plans contain open questions, `approve-plan`
automatically invokes the `griling-plan` skill (`.agents/skills/griling-plan/SKILL.md`),
requiring the developer to answer all open questions before the plan can be approved and implementation begun.

After each dependency-safe stage completes, reassess the remaining platforms
against `project/workflows.json` and `project/repositories.json`. When multiple
unblocked platforms are ready and do not depend on each other's unimplemented
local changes, spawn implementation sub-agents to run them in parallel.

Codex slash command shim: `.codex/prompts/approve-plan.md`.

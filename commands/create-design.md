# create-design Command

## Usage

```txt
$create-design <design request>
create-design <design request>
/create-design <design request>
```

## Behavior

Use the project skill at `.agents/skills/create-design/SKILL.md`. The skill is
the source of truth for this command's behavior.

When designing for a PRD, `create-design` creates the design artifacts, links
them in the PRD's `## Design Artifacts` section, and updates the PRD status to
`design-done` so it can be approved with `$approve-prd`.

Codex slash command shim: `.codex/prompts/create-design.md`.

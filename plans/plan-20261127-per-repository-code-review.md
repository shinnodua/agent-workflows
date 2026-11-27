# Per-Repository Code Review Plan

- Plan ID: `PLAN-20261127-per-repository-code-review`
- PRD ID: `PRD-20261127-per-repository-code-review`
- Type: `plan`
- Status: `approved`
- Created: `2026-11-27`
- Owner: `tech-lead`
- PRD link: [Approved requirements](../prds/prd-20261127-per-repository-code-review.md)
- Research sources: [Existing workflow](../research/research-20261127-per-repository-code-review.md)

## Scope and sequence

1. The root workspace owns the change. Extend its staged implementation workflow with per-repository review, reuse each repository's configured guide for local steps, and keep the shared review instructions in the packaged approve-plan skill.
2. Define the Tech Lead and Security review assignments and outcomes. Add a review model override through the existing CLI model resolver.
3. Update the human reference, auto-mode handoff, and the current interactive diagram.
4. Run root validation, exercise the model resolver and request independent Tech Lead and Security reviews of the root change. Verify diagram generation.

## Dependencies and risks

No product repositories are affected. Keep task-owned evidence separate from older user edits. Refresh affected reviews and checks after a fix changes a repo or the upstream contracts it relies on.

## Open Questions

None.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-11-27`
- Approval command: `$auto-mode on`

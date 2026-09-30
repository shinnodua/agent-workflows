# Dashboard Agent Guide

The `dashboard/` package is the root workspace task-status dashboard. It is
workspace-local tooling, not product runtime code.

## Required Skills

- Use [Design System Guideline](./.agents/skills/design-system-guideline/SKILL.md)
  for UI, layout, style, asset, visible copy, component structure, or
  task-status presentation changes.
- Use [Taste UI](./.agents/skills/taste-ui/SKILL.md) for layout, interaction,
  scanability, responsive behavior, and visual polish.
- Use [Coding Conventions](./.agents/skills/coding-conventions/SKILL.md) when
  writing or refactoring dashboard TypeScript, React, tests, parsers, hooks, or
  utilities.
- Use [Lint And Fix](./.agents/skills/lint-and-fix/SKILL.md) before finishing
  dashboard changes.
- Use the root [Package Installation](../.agents/skills/package-installation/SKILL.md)
  skill before adding, removing, or changing dependencies.

## Ownership

- Keep dashboard app code inside `dashboard/`.
- Keep task-status components under
  `dashboard/src/features/task-status/components/`.
- Keep task-status parsing, grouping, status, and Markdown-link utilities under
  `dashboard/src/features/task-status/utils/`.
- Keep focused tests beside feature utilities under
  `dashboard/src/features/task-status/utils/test/`.
- Evaluate shared UI primitives, tokens, and icons for
  `modules/<shared-core-repo>` before duplicating them in the dashboard.

## Validation

Run relevant commands from the workspace root:

```bash
bun run dashboard:lint
bun run dashboard:typecheck
bun run dashboard:test
bun run dashboard:build
bun run lint
```

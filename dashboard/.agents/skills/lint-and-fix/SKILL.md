---
name: lint-and-fix
description: Dashboard linting, formatting, type checking, test, and build verification instructions. Use before finishing any dashboard/ code, docs, config, or styling change.
---

# Dashboard Lint And Fix

Use this skill before finishing any `dashboard/` code, docs, config, styling, or
artifact parsing change.

## Commands

Check code quality and formatting from the workspace root:

```bash
bun run dashboard:lint
bun run lint
```

Apply safe formatting and import fixes when the root script supports it:

```bash
bun run dashboard:lint:fix
bun run lint:fix
```

Run dashboard-specific verification:

```bash
bun run dashboard:typecheck
bun run dashboard:test
bun run dashboard:build
```

## When To Run

Run `bun run lint:fix` after:

- Editing TypeScript, TSX, CSS, JSON, Markdown, or config files.
- Adding imports or moving files.
- Updating dashboard feature docs or agent context docs.

Run `bun run dashboard:test` after:

- Changing artifact parsing, grouping, status calculation, sorting, filtering,
  Markdown link handling, or other dashboard utilities.

Run `bun run dashboard:typecheck` after:

- Changing TypeScript types, component props, hooks, or utility signatures.

Run `bun run dashboard:build` after:

- Frontend UI changes, dependency changes, root config changes, or anything that
  could affect Vite bundling.

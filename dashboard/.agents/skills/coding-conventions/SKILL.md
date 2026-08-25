---
name: coding-conventions
description: Dashboard TypeScript and React coding conventions. Use when Codex writes or refactors dashboard/ components, hooks, utilities, tests, types, artifact parsers, or task-status code.
---

# Dashboard Coding Conventions

Use this skill whenever writing or refactoring TypeScript code in `dashboard/`.

## Core Conventions

### 1. Artifact Paths And Links

- Do not scatter ad hoc path parsing across components.
- Keep Markdown link parsing, artifact classification, and grouping logic in
  `dashboard/src/features/task-status/utils/`.
- Components should receive display-ready data where practical.

### 2. Shared And Pure Functions

- Place pure dashboard helpers in the task-status utility layer.
- Keep environment-specific wrappers thin.
- Evaluate reusable cross-app UI or utility logic for `modules/<shared-core-repo>`
  before duplicating it in the dashboard.

### 3. Strict Type Safety

- Provide explicit type annotations for function parameters where TypeScript
  inference is not contextual.
- Do not leave implicit `any` parameters in code or test mocks.
- Prefer narrow unions for dashboard artifact types, statuses, and workflow
  states.

### 4. Modular UI

- Keep `dashboard/src/App.tsx` as a thin app shell.
- Keep task-status components under
  `dashboard/src/features/task-status/components/`.
- Keep parsing, grouping, status, and Markdown-link utilities under
  `dashboard/src/features/task-status/utils/`.
- Keep focused tests beside the feature utilities under
  `dashboard/src/features/task-status/utils/test/`.
- Keep dashboard TypeScript and TSX files under 350 lines when practical.

### 5. Visible Copy

- Keep visible copy concise, operational, and matched to artifact language.
- Do not add explanatory feature text when labels, state, and layout can make
  the interaction clear.

### 6. Component Styles

- Keep component styling out of dashboard TypeScript and TSX files.
- Colocate styles with the component or JSX-producing utility that uses them:
  `Feature.tsx` should import `Feature.module.css`.
- Group each code/style pair in a same-named folder:
  `Feature/Feature.tsx` and `Feature/Feature.module.css`.
- Prefer semantic CSS Module class names over long inline utility strings in
  `className`.
- CSS Modules may use Tailwind `@apply` and existing design-system tokens to
  preserve the the project visual language.
- Keep only state composition in TSX, such as choosing between
  `styles.active` and `styles.inactive`.
- Keep global CSS in `dashboard/src/styles.css` limited to app-wide resets,
  source imports, global custom properties, and truly shared global helpers.

## Verification

After applying coding conventions:

```bash
bun run dashboard:typecheck
bun run dashboard:test
bun run dashboard:build
bun run lint
```

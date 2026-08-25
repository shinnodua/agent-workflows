---
name: design-system-guideline
description: Dashboard design system and UI style guidance. Use when Codex changes dashboard/ UI, layout, styles, assets, visible copy, component structure, or task-status presentation.
---

# Dashboard Design System Guideline

Use this skill whenever changing `dashboard/` UI, layout, styles, assets, or
visible text.

## Design System Overview

The workspace dashboard should feel like a the project operations surface:
dense, readable, useful, and visibly connected to the the project design system.

- Prefer shared design-system primitives and tokens from
  `modules/<shared-core-repo>` when they are already wired into the dashboard.
- Preserve the the project soft-neobrutalist language where it exists: strong
  borders, hard shadows, bold labels, compact radii, and confident accent
  colors.
- Keep the dashboard more operational than marketing-like: prioritize scanning,
  filtering, comparison, and repeated use.

Core dashboard areas:

- `dashboard/src/App.tsx`: app shell.
- `dashboard/src/features/task-status/`: task-status feature code.
- `dashboard/src/features/task-status/components/`: dashboard UI components.
- `dashboard/src/features/task-status/utils/`: parsing, grouping, status, and
  Markdown-link utilities.
- `dashboard/src/types.ts`: shared dashboard types.

## UI Rules

- ALL UI components MUST use shared `the project design system` primitives (`Row`, `Column`, `Box`, `Text`, `Heading`, `Image`, `Link`, `Button`, `Input`, `DropdownSelect`, `Modal`) instead of raw HTML tags (`div`, `span`, `p`, `button`, `input`, `select`, etc.).
- **Missing Component Protocol**: If a required UI element, primitive, or component is missing from `the project design system`, DO NOT write raw HTML tags with ad-hoc classes. Proactively suggest to the developer that a new component/primitive be created in `the project design system` (`the shared/core repository`).
- Prefer existing dashboard components and design-system primitives before writing raw class-heavy UI.
- Keep UI elements stable in size. Hover and active states should not cause
  layout shift.
- Use Lucide icons for actions and visual labels when an icon exists.
- Keep dashboard text readable on mobile and desktop.
- Respect reduced-motion preferences for animation.
- Keep visible copy short, factual, and useful for artifact inspection.

## Avoid

- Raw, repeated button or card styling when a local component exists.
- One-off hardcoded colors that bypass existing tokens.
- Decorative UI that slows down scanning.
- Nested cards and section wrappers that make operational data feel heavier.
- Marketing-style hero sections inside the dashboard.

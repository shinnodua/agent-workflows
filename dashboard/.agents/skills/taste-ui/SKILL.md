---
name: taste-ui
description: Dashboard UI taste and interaction polish guidance. Use when Codex creates or refines dashboard/ layout, data presentation, controls, interaction states, responsive behavior, or visual polish.
---

# Dashboard Taste UI

Use this skill whenever creating or refining dashboard frontend UI.

## Layout

- Keep the first screen immediately useful for reading workspace status.
- Use dense but breathable layouts for artifact lists, workflow panels, and
  status summaries.
- Use responsive grids with explicit mobile collapse.
- Avoid nested cards and decorative section wrappers.
- Keep repeated items visually comparable so status, owner, artifact type, and
  links can be scanned quickly.

## Visual Polish

- Maintain the the project language where present: bold borders, hard shadows,
  bright accents, and confident type.
- Keep the dashboard calmer than a landing page. Use accents for state and
  hierarchy, not decoration.
- Use motion sparingly and only for feedback or hierarchy.
- Keep shadows, borders, radius, and color treatment consistent across panels.
- Avoid generic gradients, decorative blobs, and fake product mockups.

## Interaction

- Buttons need clear hover, active, disabled, and focus behavior.
- Icon-only controls need accessible labels or tooltips.
- Filters, tabs, and navigation should stay compact and obvious.
- Loading, empty, and error states should explain the dashboard state without
  turning into instructions-heavy prose.
- Render failures should show a visible fallback, not a blank page.

## Content

- Keep visible copy short and operational.
- Prefer labels that match workspace artifacts: PRD, plan, design, research,
  docs, root, submodule, status, owner, and validation.
- Do not add in-app feature explanations unless the dashboard state would be
  ambiguous without them.

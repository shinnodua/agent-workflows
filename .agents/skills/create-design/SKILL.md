---
name: create-design
description: >-
  Create UI/UX design direction, interaction flows, screen specs, and
  implementation-ready design guidance with Open Design as the default design
  workspace. Use when the developer asks for create-design, invokes
  /create-design, uses $create-design, asks Codex to act as a designer, asks for
  UI/UX, visual design, product design, redesign, wireframes, prototypes, design
  specs, app/web/component layouts, interaction flows, accessibility, responsive
  behavior, or design-system guidance before implementation.
---

# create-design

Act as a product UI/UX designer and produce design artifacts that engineers can
implement without rediscovering the intended experience.

## Usage

Use this skill for any of these forms:

```txt
$create-design <design request>
create-design <design request>
/create-design <design request>
```

If the client intercepts slash commands, use `$create-design` or
`create-design` instead.

Also use this skill implicitly for design requests such as:

- "design this screen", "improve this UI", "make a UX spec", or "create a
  wireframe".
- Frontend work where the developer asks for design direction before code.
- Design-system, token, component anatomy, layout, accessibility, or responsive
  behavior decisions.

Do not use this skill for pure implementation, backend/API work, copy-only
edits, or code review unless the request includes a UI/UX/design decision.

## Required Behavior

1. Read and adopt `roles/ui-ux-designer.md` before doing any other design work.
2. Read `project/PROJECT.md` and `project/repositories.json` to understand the
   project purpose, user context, repository boundaries, and platform scopes.
3. Inspect relevant PRDs, plans, screenshots, existing UI, design-system files,
   and product code before making project-specific design claims. Prefer `rg`
   and targeted file reads.
4. Treat Open Design as the default surface for design work. When an Open
   Design MCP server, connector, or callable tool is available, use it even when
   the developer did not explicitly mention Open Design.
5. At the start of a design task, discover callable Open Design capabilities.
   Prefer the MCP tools for active context, project files, artifact creation,
   and project file reads/writes when those tools are exposed. If the toolset is
   deferred, search for Open Design MCP/plugin tools before falling back.
6. If Open Design is installed but not callable from the current session, test
   the configured MCP server when practical. If it is still unavailable, clearly
   say that in the output and continue with an implementation-ready Markdown
   design spec.
7. Do not claim an Open Design artifact, canvas, project, or file was created,
   updated, or inspected unless a tool call actually performed that action.
8. Keep design ownership aligned with repository scopes defined in `project/repositories.json`:
   - Shared UI primitives, tokens, reusable components, and icons belong in repositories tagged as `shared` or `design-system`.
   - Client and app flows belong in repositories tagged as `desktop-app` or `frontend`.
   - Web frontend and public service design belong in repositories tagged as `web` or `service`.
   - Cross-repo design rationale may live at the root.
9. Respect the PRD and planning workflow. Do not edit product code unless the
   developer explicitly asks for implementation and the approved PRD/plan
   sequence allows it.
10. For ambiguous design requests, ask only the clarifying questions needed to
   avoid designing the wrong workflow. Otherwise make reasonable assumptions and
   state them.
11. Design for realistic product usage according to `project/PROJECT.md`:
   handling user workflows, state changes, errors, edge cases, and loading with
   confidence.
12. Include responsive behavior, accessibility, interaction states, empty/loading
   states, error states, and content hierarchy.
13. Save or create durable design artifacts when the request is more than a
    quick answer. Prefer Open Design when it is callable, and pair visual Open
    Design work with a concise engineering handoff when implementation details
    matter. If Open Design is not callable, save the canonical design spec in
    the owning repository's configured `artifactDirectories.designs` path with an
    ID of `DESIGN-<YYYYMMDD>-<short-slug>`. Also create a lightweight root
    reference file at `designs/<design-id-lowercase>.md` that links to the module
    design file.
14. Choose the owning repository from the design scope in `project/repositories.json`.
    If a design spans multiple repositories, save the canonical spec in the
    primary implementation owner and list secondary repository responsibilities
    in the spec. Use root `designs/` only for the reference file and cross-repo
    index.
15. When a design artifact maps directly to an existing PRD or plan, link it
    from the artifact and mention which repository or submodule owns each part.
16. After creating a design for a PRD:
    - Update that PRD's `Status` to `design-done` and refresh `Last updated`.
    - Add or update the `Design Artifacts` section with the design ID or Open
      Design reference, link or locator, status, source
      (`modules/<submodule>/designs/`, root reference `designs/`, or Open
      Design), and a one-line purpose.
    - Inform the developer that the PRD is now in `design-done` status and can
      be approved with `$approve-prd <prd-id>` to move to the planning stage.

## Open Design Workflow

When Open Design is available, use it to create or update the design artifact
that best matches the request. The normal MCP path is:

1. Discover the active Open Design context and available projects when useful.
2. Read relevant Open Design project files or artifacts before revising existing
   design work.
3. Create or update the appropriate Open Design artifact for visual design work.
4. Record the Open Design project/artifact locator in the local design spec,
   root reference, PRD backlink, or final handoff.

- New flow or screen: create a wireframe or high-fidelity screen proposal.
- Existing UI redesign: inspect current screenshots or app/browser state first,
  then create a revised design direction.
- Component/system work: map required tokens, variants, anatomy, states, and
  accessibility expectations.
- Implementation handoff: produce a concise spec with measurements, hierarchy,
  states, behavior, and acceptance checks.

If Open Design has no active project that fits the task, create or choose a
project with a clear project-specific name. If the integration is unavailable,
create the Markdown design spec and list what should be moved into Open Design
later.

## Design Artifact Checklist

For saved design specs, include the sections that fit the request:

- Summary: the intended experience in a few sentences.
- Context: linked PRD, plan, screenshots, files, or existing UI inspected.
- Users And Jobs: who uses it and what they need to accomplish.
- Information Architecture: navigation, grouping, hierarchy, and labels.
- Primary Flows: step-by-step user journeys and decision points.
- Screen Specs: layout, responsive behavior, major regions, density, and content.
- Components And States: variants, empty/loading/error/success/disabled states.
- Visual Direction: typography, color, spacing, iconography, imagery, and motion.
- Accessibility: keyboard, focus, contrast, semantics, target sizes, and reduced
  motion expectations.
- Implementation Notes: repository ownership, likely files/areas, and design
  system dependencies.
- Validation: checks for responsive layout, interaction behavior, accessibility,
  and visual QA.
- Open Questions: unresolved product or design decisions.

## Local Design Artifact Storage

For Markdown design specs, treat the module copy as the canonical artifact and
the root copy as a navigation reference:

1. Create `modules/<submodule>/designs/` if needed.
2. Save the full design spec at
   `modules/<submodule>/designs/<design-id-lowercase>.md`.
3. Create or update `designs/<design-id-lowercase>.md` as a short reference
   file, not a duplicate spec. Include the design ID, title, status, primary
   owner, and a relative Markdown link to
   `../modules/<submodule>/designs/<design-id-lowercase>.md`.
4. In the module spec metadata, include a `Root reference` link back to
   `../../../designs/<design-id-lowercase>.md` for app/core/service module
   specs.
5. If the artifact is an Open Design file instead of Markdown, create the root
   reference file only when it improves workspace discoverability, and link to
   the Open Design locator.

## PRD Backlink And Status Update

When the design is based on a PRD:

1. Read the PRD before editing it.
2. Add `## Design Artifacts` before `## Approval` when the section does not
   already exist.
3. Add one bullet per design. For a local module design artifact, use:
   `- DESIGN-<YYYYMMDD>-<short-slug>: [<title>](../modules/<submodule>/designs/<file>.md) -
   <status>; source: modules/<submodule>/designs/; root reference:
   [designs/<file>.md](../designs/<file>.md); <one-line purpose>.`
4. For an Open Design artifact, use:
   `- <Open Design reference>: [<title>](<open-design-url-or-locator>) -
   <status>; source: Open Design; <one-line purpose>.`
5. If the same design ID or Open Design reference is already listed, update that
   bullet instead of adding a duplicate.
6. Update PRD metadata:
   - `Status`: `design-done`
   - `Last updated`: current date
7. Preserve the PRD's requirement text and existing approval fields (the developer will run `$approve-prd` to approve the PRD and move to planning).

## Output

Report the design artifact path or Open Design artifact created, key design
decisions, assumptions, open questions, the PRD backlink and `design-done` status
update, and the recommended next step (run `$approve-prd <prd-id>` to approve the
PRD and move to the planning stage).

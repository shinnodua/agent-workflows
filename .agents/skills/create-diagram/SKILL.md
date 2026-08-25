---
name: create-diagram
description: >-
  Create or improve high-quality workspace diagrams, including workflow
  diagrams, architecture diagrams, role handoff maps, process maps, and
  Mermaid diagrams for Markdown documentation. Use when the developer asks to
  create-diagram, invokes /create-diagram, uses $create-diagram, wants a diagram
  added to workspace docs, or asks to show roles and responsibilities in a
  workflow.
---

# create-diagram

Create diagrams that make workspace behavior easier to understand,
review, and maintain. Prefer diagrams that clarify ownership, sequence,
handoffs, decisions, and artifacts rather than decorative visuals.

## Usage

Use this skill for any of these forms:

```txt
$create-diagram <diagram request>
create-diagram <diagram request>
/create-diagram <diagram request>
```

If the client intercepts slash commands, use `$create-diagram` or
`create-diagram` instead.

## Required Behavior

1. Inspect the target document or local context before drawing. Prefer `rg` and
   targeted file reads.
2. Read `project/repositories.json` and `project/PROJECT.md` to understand repository boundaries, platform assignments, and ownership.
3. Choose the diagram type by the question it must answer:
   - Use a flowchart when the main question is "what happens next?"
   - Use swimlane-style subgraphs when the main question is "who owns each
     step?" or "where are the handoffs?"
   - Use a sequence diagram when timing, messages, or request/response behavior
     matters.
   - Use an architecture graph when systems, repositories, packages, or data
     dependencies matter.
4. Prefer Mermaid in Markdown docs because it is reviewable as text and works
   well with repository documentation.
5. Keep diagrams maintainable:
   - Use stable, readable node IDs.
   - Keep node labels short and action-oriented.
   - Put decisions in diamond nodes with explicit outgoing labels.
   - Label cross-role handoffs when the handoff depends on an artifact,
     approval, or condition.
   - Keep role lanes to the fewest useful owners, usually 3 to 7.
6. For workflow diagrams, include role coverage:
   - Name the primary role responsible for each major step.
   - Include supporting roles when they materially affect the handoff.
   - Add a compact roles table when the diagram alone would be too dense.
7. Preserve repository ownership boundaries from `project/repositories.json`:
   - Shared contracts, design-system primitives, and core logic belong in repositories tagged as `shared` or `core`.
   - Backend service and API work belongs in repositories tagged as `backend` or `service`.
   - Frontend and client apps belong in repositories tagged as `frontend`, `web`, or `desktop-app`.
   - Cross-repo workflow documentation belongs in root workspace docs.
7. Do not start the normal PRD or implementation workflow just because a diagram
   is requested. A diagram/documentation-only change may directly update docs
   when the developer asks for it.
8. Validate before finishing whenever practical:
   - Check Mermaid fences are closed.
   - Check every referenced node ID exists.
   - Check decisions have labeled branches.
   - Check role labels match local role documents or established workspace
     terminology.
   - If a renderer or Mermaid CLI is available, render or parse the diagram.
9. Report changed files, validation performed, and any assumptions.

## Diagram Quality Checklist

- The title or surrounding text says what question the diagram answers.
- The diagram starts and ends clearly.
- Each node is a concrete action, decision, artifact, system, or state.
- Parallel lanes represent the same kind of thing, usually roles or systems.
- Handoffs are visible and labeled when useful.
- The diagram can be understood without reading a long explanation.
- The source remains pleasant to edit in a Markdown file.


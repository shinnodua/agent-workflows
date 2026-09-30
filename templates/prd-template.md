# PRD Template

Copy this file when creating a new PRD with `$create-prd <description>`.

PRDs are the source of truth for user requirements. Store PRDs in the workspace root `prds/` directory. Status flows from `draft` to `need-design` (if UI/UX design is needed), `design-done` (once design is linked), and `approved` (ready for planning and implementation). Do not create plans or edit code for the feature until the PRD status is `approved`.

## Metadata

- PRD ID: `PRD-<YYYYMMDD>-<short-slug>`
- Title: `<feature-or-task-name>`
- Type: `prd`
- Status: `draft | need-design | design-done | approved | superseded`
- Created: `<YYYY-MM-DD>`
- Last updated: `<YYYY-MM-DD>`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `<original $create-prd description>`
- Research sources:
  - `<RESEARCH-YYYYMMDD-short-slug or "None">: [<research title>](../research/<research-file>.md) - <one-line relevance>`

## Problem

Describe the user problem, business need, or engineering gap this PRD addresses.

## Research Context

List the saved research briefs, repository findings, external sources, or prior
artifacts that informed this PRD. Use `None` only when no research source was
provided or discovered.

- Research brief: `<RESEARCH-YYYYMMDD-short-slug or "None">`
- Key findings used:
  - `<finding that shaped requirements, scope, risks, or acceptance criteria>`
- Source gaps:
  - `<missing research, unresolved source, or "None">`

## Goals

- `<goal>`

## Non-Goals

- `<non-goal>`

## Users And Use Cases

- User: `<user type>`
- Use case: `<what they need to do>`

## Requirements

Functional requirements:

- `<requirement>`

Non-functional requirements:

- `<requirement>`

## User Flows

1. `<step>`
2. `<step>`
3. `<step>`

## Affected Platforms

List only the platforms likely affected by this PRD. Use repository IDs and
platform labels from `project/repositories.json`.

- `<repository or platform id>`: `<why or "not affected">`

## Data, API, And Package Contracts

Describe expected contracts between repositories.

- Shared types or packages:
- API endpoints:
- Events or runtime interfaces:
- Compatibility requirements:

## UX Notes

Describe expected user experience, edge cases, loading states, empty states, errors, and accessibility requirements.

## Acceptance Criteria

- `<testable acceptance criterion>`

## Risks And Tradeoffs

- `<risk and mitigation>`

## Open Questions

- `<question or "None">`

## Design Artifacts

- `<DESIGN-YYYYMMDD-short-slug or Open Design reference>: [<design title>](<../designs/design-file.md or Open Design URL/locator>) - <status>; source: <designs/ or Open Design>; <one-line purpose>.`

## Approval

- Approved by: `<developer name or handle>`
- Approved on: `<YYYY-MM-DD>`
- Approval command: `$approve-prd <prd-id>`

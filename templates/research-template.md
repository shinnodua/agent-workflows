# Research Template

Copy this file when creating research with `$research <description>`.

Research briefs preserve project and external context so future PRDs, plans, and
implementation agents do not need to rediscover the same information. Store
research files in the workspace root `research/` directory.

## Metadata

- Research ID: `RESEARCH-<YYYYMMDD>-<short-slug>`
- Title: `<research-topic>`
- Type: `research`
- Status: `draft | reviewed | superseded`
- Created: `<YYYY-MM-DD>`
- Last updated: `<YYYY-MM-DD>`
- Owner: `tech-lead`
- Related artifact IDs: `[]`
- Source request: `<original $research description>`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

Summarize the most important findings, recommendations, and uncertainties.

## Short Version

Summarize the research in a concise, final-answer style. Include the practical
recommendation, the main affected areas, and the most important caveat.

## Research Questions

- `<question this research answers>`

## Context

Describe the product, user, business, technical, or ecosystem context needed to
understand the topic.

## Current Workspace Findings

Summarize relevant local repository evidence.

- Root workspace:
- `<repository or platform id from project/repositories.json>`:

## External Findings

Summarize external research when used. Prefer primary sources and include links.

- Source: `<title or organization>` - `<url>` - `<finding>`

## Reference URLs

List every external URL used for this research, including official API docs,
standards, product pages, or other primary sources when available.

- `<title or organization>` - `<url>` - `<why this source matters or date accessed>`

## Product Implications

- Users and use cases:
- Goals this may support:
- Non-goals or scope boundaries:
- UX and workflow notes:

## Technical Implications

- Affected repositories:
- Shared contracts or data models:
- API/backend considerations:
- Web/client considerations:
- App/runtime considerations:
- Security, privacy, or compliance notes:
- Performance, reliability, or scalability notes:

## Options

Describe credible approaches when more than one path exists.

- Option: `<name>`
  - Summary:
  - Pros:
  - Cons:
  - When to choose:

## Recommendation

State the recommended direction and why.

## Risks And Mitigations

- Risk: `<risk>`
  - Impact:
  - Mitigation:

## Highest-Risk Unknowns Or Clarifications Needed

List the unknowns, decisions, or clarifying questions most likely to affect
scope, architecture, sequencing, or acceptance criteria. Use `None` only when no
material uncertainty remains.

- `<unknown, decision, or clarification needed>`

## Validation Ideas

- `<test, check, prototype, spike, or manual validation>`

## Open Questions

- `<question or "None">`

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope:
- Suggested affected platforms:
- Suggested acceptance criteria:
- Suggested sequencing:
- Dependencies or decisions needed first:

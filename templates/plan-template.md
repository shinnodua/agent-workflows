# Plan Template

Copy this file after an approved PRD exists.

Before creating any plan, read and adopt `roles/tech-lead.md`. Plans must be written from the Tech Lead role: translate the approved PRD into technical architecture, keep shared contracts in the core/shared repository as the single source of truth, and make server and client work explicitly rely on those shared structures.

Root overview plans belong in the workspace root `plans/` directory. If the task affects one or more submodules, create a detailed implementation plan in that repository's configured plans directory from `project/repositories.json` and link those plans from the root overview plan.

When creating submodule or platform plans, the master agent owns the root overview plan and must spawn a sub-agent for each affected planning target. Give the sub-agent the approved PRD path, draft root plan path, root architecture summary, platform responsibility, cross-repo dependencies, validation expectations, risks, open questions, target plan path, and required parent-plan link. The sub-agent must read the affected repository's `agentGuide` from `project/repositories.json` before writing its plan.

## Root Overview Plan

Use this section for the root workspace plan file.

### Metadata

- Plan ID: `PLAN-<YYYYMMDD>-<short-slug>`
- PRD ID: `PRD-<YYYYMMDD>-<short-slug>`
- Type: `plan`
- PRD link: [`../prds/<prd-file>.md`](../prds/<prd-file>.md)
- Research sources:
  - `<RESEARCH-YYYYMMDD-short-slug or "None">: [<research title>](../research/<research-file>.md) - <one-line planning relevance>`
- Status: `draft | approved | in-progress | blocked | complete`
- Created: `<YYYY-MM-DD>`
- Last updated: `<YYYY-MM-DD>`
- Owner: `tech-lead`
- Related artifact IDs: `[]`

### Title

`<feature-or-task-name>`

### Goal

Describe the implementation outcome in a few sentences. This must trace directly to the approved PRD.

### Research Inputs

Summarize the research, repository evidence, external references, or prior
artifacts used to shape architecture, sequencing, dependencies, risks, and
validation. Carry forward research sources from the PRD and add any planning
research discovered while creating this plan. Use `None` only when no source was
provided or discovered.

- Research brief: `<RESEARCH-YYYYMMDD-short-slug or "None">`
- Key planning implications:
  - `<finding that affects architecture, ownership, sequencing, validation, or risk>`
- Source gaps:
  - `<missing research, unresolved source, or "None">`

### Scope

In scope:

- `<item>`

Out of scope:

- `<item>`

### Affected Platforms

List only the platforms affected by this task.

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| `<repository or platform id>` | `<short summary of work>` | [`modules/<repo>/plans/<plan-file>.md`](../modules/<repo>/plans/<plan-file>.md) |

Remove rows for platforms that are not affected.

### Cross-Repo Design

Explain how the affected repositories interact for this task.

- Data contracts:
- Shared packages or APIs:
- Runtime flow:
- Dependency direction:

### Sequence

Implementation proceeds by dependency-safe stages. Skip platforms that are not
in this plan.

1. `<shared/core repository, when affected>`
2. `<service/API repository, when affected>`
3. Frontend stage:
   - `<web frontend repository, when affected>`
   - `<app frontend repository, when affected>`

After core and API work are implemented and validated, reassess whether the
frontend stage can run in parallel. If both frontend platforms are present in
the approved plan, their required shared contracts and APIs are already
available locally, and neither frontend depends on the other's unimplemented
changes, spawn one implementation sub-agent for each ready frontend platform.

If either frontend platform still depends on another platform's unimplemented
local changes, implement the blocked dependency first and reassess parallel
safety before continuing.

After each dependency stage, stop and ask the developer whether to continue to
the next stage or stop. If continuing and the next stage depends on newly
changed local packages or APIs, ask whether to link local packages/use local
code or depend on deployed/published packages or services.
When workspace auto mode is enabled for the active feature, continue after each
validated stage and use available validated local dependencies. Ask only when
the dependency decision requires developer intent or information.

### Validation

List the checks required before finishing.

- Root:
- `<affected repository id>`:

Remove validation entries for unaffected platforms.

### Risks

- `<risk and mitigation>`

### Open Questions

- `<question or "None">`

### Approval

- Approved by: `<developer name or handle>`
- Approved on: `<YYYY-MM-DD>`
- Approval command: `$approve-plan <plan-id>`

## Submodule Detailed Plan

Use this section as the template for each affected platform plan. Save it inside the affected submodule's `plans/` directory.

The submodule plan must be detailed enough for an agent to implement that platform's part of the feature without re-deriving the full approach.

### Metadata

- Plan ID: `PLAN-<YYYYMMDD>-<short-slug>-<platform>`
- Parent plan ID: `PLAN-<YYYYMMDD>-<short-slug>`
- PRD ID: `PRD-<YYYYMMDD>-<short-slug>`
- Research sources:
  - `<RESEARCH-YYYYMMDD-short-slug or "None">: [<research title>](../../../research/<research-file>.md) - <one-line platform relevance>`
- Status: `draft | approved | in-progress | blocked | complete`
- Created: `<YYYY-MM-DD>`
- Last updated: `<YYYY-MM-DD>`

### Title

`<feature-or-task-name> - <platform-name>`

### Parent Overview Plan

Link back to the root overview plan. From `modules/<repo>/plans/`, use:

[`../../../plans/<plan-file>.md`](../../../plans/<plan-file>.md)

### Platform Responsibility

Summarize what this platform owns for the task.

### Research Inputs

Carry forward only the research findings that materially affect this platform's
implementation. Include repository findings, external references, source gaps,
or `None` when no source applies.

- Research brief: `<RESEARCH-YYYYMMDD-short-slug or "None">`
- Platform-specific implications:
  - `<finding that affects files, APIs, contracts, sequencing, validation, or risk>`
- Source gaps:
  - `<missing research, unresolved source, or "None">`

### Local Scope

In scope:

- `<item>`

Out of scope:

- `<item>`

### Files And Areas To Inspect

- `<path or area>`

### Expected Code Changes

- `<specific module, component, endpoint, package, or config change>`

### Implementation Steps

1. `<step>`
2. `<step>`
3. `<step>`

### Dependencies

List dependencies on other submodules, packages, APIs, migrations, releases, or user decisions.

- `<dependency>`

### Validation Commands

Run these from the submodule root unless noted otherwise.

```sh
<command>
```

### Risks

- `<risk and mitigation>`

### Open Questions

- `<question or "None">`

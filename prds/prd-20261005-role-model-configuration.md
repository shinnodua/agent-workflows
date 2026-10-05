# Product Requirements Document: Per-role agent models

## Metadata

- PRD ID: `PRD-20261005-role-model-configuration`
- Title: Per-role agent models
- Type: `prd`
- Status: `approved`
- Created: `2026-10-05`
- Last updated: `2026-10-05`
- Owner: `project-manager`
- Related artifact IDs: `[MEETING-20261005-1246-role-model-configuration]`
- Source request: `Configure models per role and allow workflow-step overrides, such as one model for planning and another for coding.`
- Research sources:
  - `RESEARCH-20261005-role-model-configuration`: [Per-role agent models](../research/research-20261005-role-model-configuration.md) — identifies config and update behavior.

## Problem

All five workspace roles currently inherit the coordinator's model. A developer cannot set persistent, distinct models for each role in one project configuration file.

## Research Context

- Research brief: `RESEARCH-20261005-role-model-configuration`
- Key findings used:
  - `workspace.config.json` exists, and agent frontmatter is static in two runtime formats.
  - `workflows update` currently overwrites workspace config.
- Source gaps: None.

## Goals

- Let developers specify a model independently for each of the five workspace roles in `workspace.config.json`.
- Apply the configuration to both agent discovery formats.
- Keep choices across package updates.
- Let a workflow step override a role's base model when the coordinator spawns that role for the step.

## Non-Goals

- Automatically select models or verify provider availability.
- Change the model of an already running agent session.

## Users And Use Cases

- User: Developer configuring a workspace.
- Use case: Set a role's model, synchronize agent definitions, then start a new agent session with that model.

## Requirements

Functional requirements:

- `workspace.config.json` has an `agentModels` map with exact keys `project-manager`, `tech-lead`, `ui-ux-designer`, `backend-developer`, and `frontend-developer`. Each value is a nonempty single-line model ID, `inherit`, or an object with separate `agents` and `claude` model IDs.
- A CLI command applies configured values to local Codex/Antigravity and Claude Code agent definitions.
- Init and update apply the map automatically after validating it. Sync validates and prepares all target files before writing any agent definition.
- Update preserves project-specific config values, including when an older manifest lists `workspace.config.json` as managed.
- Update adds missing default `agentModels` role entries and `workflowModels` sections to an older `workspace.config.json`, using `inherit` for base roles and empty planning/coding step objects, while preserving existing values and unrelated fields.
- A missing role value defaults to `inherit` for compatibility.
- Invalid config fails with an actionable error naming the path and invalid key or value before changing agent definitions.
- `workflowModels` may specify a `default` selection and individual role selections for `research`, `prd`, `design`, `meeting`, `planning`, `coding`, and `validation`. Selections accept the same string or runtime-specific object shape as base role models. Runtime-specific objects must contain both `agents` and `claude` values.
- Model resolution follows step role, step default, base role, then `inherit`. An explicit `inherit` is an override and selects the runtime default.
- `workflows agents resolve <step> <role> --format <agents|claude> --json` returns the effective model and its source. Workflow coordinators use that result immediately before spawning the role when their runtime supports model overrides. The query rejects unknown names and invalid config with a nonzero exit.

Non-functional requirements:

- Repeated synchronization is idempotent.
- Unrelated agent frontmatter and body content remain unchanged.

## User Flows

1. Developer edits role model values in `workspace.config.json`.
2. Developer runs `workflows agents sync`.
3. Developer inspects the per-role applied or already-current summary and starts a new agent session after reloading the runtime. Running agents keep their existing model.
4. Developer optionally configures `workflowModels.planning` and `workflowModels.coding`. The coordinator resolves the assigned step before spawning each role agent.

## Affected Platforms

- Root workspace tooling: Owns config, CLI, local agent definitions, and documentation.

## Data, API, And Package Contracts

- Shared types or packages: None.
- API endpoints: None.
- Events or runtime interfaces: A role string is written to both local agent formats; a role object writes its `agents` and `claude` values separately.
- Compatibility requirements: Omitted values retain `inherit` behavior.
- Step selection contract: `workflowModels.<step>.default` supplies a step-wide choice; `workflowModels.<step>.<role>` can override it. Static agent files retain the base role model because their frontmatter has no step context. A workflow object includes both format keys, and `inherit` at any selected level stops fallback.

## UX Notes

This is a CLI and file configuration flow. Clear documentation and errors are the user experience. Visual design is not applicable. A copyable example is:

```json
{
  "agentModels": {
    "project-manager": "inherit",
    "tech-lead": { "agents": "your-agents-model", "claude": "your-claude-model" },
    "ui-ux-designer": "inherit",
    "backend-developer": "inherit",
    "frontend-developer": "inherit"
  },
  "workflowModels": {
    "planning": {
      "default": "planning-model-a",
      "backend-developer": "planning-model-b"
    },
    "coding": {
      "backend-developer": "coding-model-c",
      "frontend-developer": { "agents": "coding-agents-model", "claude": "coding-claude-model" }
    }
  }
}
```

Sync reports each role's applied model and whether agent files changed or were already current. Runtime availability of a selected model is checked when that runtime starts a new agent.

The CLI shows the effective model, agent format, and config source. A runtime that cannot change model when spawning an agent reports that it could not apply the step override, with the step and role. A validation override is used only for a separately spawned validation agent; validation in the same coding session retains the coding model.

## Acceptance Criteria

- Distinct configured models appear in both local role agent formats after sync.
- Runtime-specific role values can differ between the two formats.
- Unconfigured roles use `inherit`.
- `workflows update` leaves configured values in `workspace.config.json` and reapplies them to refreshed agent files.
- An existing config without model settings gains visible default sections after `workflows update`; partially configured model sections gain only missing defaults. Running update again does not rewrite an already complete config.
- Invalid role keys or model values cause a clear nonzero CLI failure and no partial agent updates.
- Malformed JSON fails before changing agent definitions. Returning a role to `inherit` restores both definitions to inherited behavior.
- Sync reports applied values and an already-current result on a repeated run.
- Existing init and update behavior remains valid for projects with no custom model choices.
- The same role can resolve to different models for planning and coding without rewriting static agent files.
- Step-role values override step defaults, which override base role values; an explicit `inherit` overrides lower levels.
- Invalid step names, role names, or model values fail clearly during resolution and init/update preflight.
- Query JSON includes `step`, `role`, `format`, `model`, and `source`, including when `inherit` selects the runtime default.
- A validation override applies to a new validation agent; an agent continuing from coding retains its existing model.

## Risks And Tradeoffs

- Runtime model names vary; the CLI accepts valid scalar names and runtime remains the authority for availability.
- A config edit alone does not update static agent frontmatter; documentation instructs the sync step.

## Open Questions

- None.

## Design Artifacts

- Not applicable: file and CLI configuration with no visual surface.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-10-05`
- Approval command: `$auto-mode on`

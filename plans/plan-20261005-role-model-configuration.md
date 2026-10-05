# Plan: Per-role agent models

## Metadata

- Plan ID: `PLAN-20261005-role-model-configuration`
- PRD ID: `PRD-20261005-role-model-configuration`
- Type: `plan`
- PRD link: [Per-role agent models](../prds/prd-20261005-role-model-configuration.md)
- Research sources:
  - `RESEARCH-20261005-role-model-configuration`: [Per-role agent models](../research/research-20261005-role-model-configuration.md) — config and update behavior.
- Status: `complete`
- Created: `2026-10-05`
- Last updated: `2026-10-05`
- Owner: `tech-lead`
- Related artifact IDs: `[MEETING-20261005-1246-role-model-configuration]`

## Title

Per-role agent models

## Goal

Give developers one persistent, workspace-local file for each role's model and ensure both supported agent definition formats reflect it after init, update, or explicit sync.
Allow a workflow step to select another model for the same role when the coordinator spawns a planning, coding, or other step assignment.

## Research Inputs

- Research brief: `RESEARCH-20261005-role-model-configuration`
- Key planning implications:
  - `workspace.config.json` already exists but is currently overwritten by update.
  - Ten static agent frontmatter fields require synchronization.
- Source gaps: None.

## Scope

In scope:

- Add an `agentModels` map with all five roles defaulting to `inherit`.
- Preserve workspace config across package update, including legacy manifests.
- Add `workflows agents sync` with validation, idempotent writes, and useful output.
- Run synchronization after init/update and document the flow.
- Add focused CLI tests.
- Add `workflowModels` step defaults and role overrides, plus `workflows agents resolve <step> <role> --format <agents|claude>`.
- Update agent instructions to resolve the assigned workflow step at spawn time and explain when a runtime cannot apply an override.

Out of scope:

- Product submodules, provider model discovery, and active-session model changes.

## Affected Platforms

| Platform | Responsibility | Detailed Plan |
| --- | --- | --- |
| Root workspace | CLI, config, agent files, docs, tests | This plan |

## Cross-Repo Design

- Data contracts: `workspace.config.json.agentModels` maps five role slugs to strings or `{agents, claude}` objects; `workflowModels` maps seven workflow steps to `default` and role selections in the same shape. Runtime-specific objects require both format keys.
- Shared packages or APIs: None.
- Runtime flow: Static agent files receive base models. At assignment time, the coordinator queries the effective step model and passes it as a spawn-time override when supported.
- Dependency direction: Agent formats derive from workspace config; no product submodule dependency.

## Sequence

1. Add the config contract and CLI preflight/synchronization functions.
2. Make config scaffold-only; explicitly filter it from older managed manifests during update.
3. Wire init/update to apply configured models and update documentation.
4. Add CLI tests, then run root validation.
5. Resolve workflow precedence in the CLI, update role-spawning instructions, and test planning/coding divergence and fallback.

## Validation

- Root: `bun run workspace:check`.
- Focused behavior: `node --test bin/workflows.test.mjs`.

## Risks

- A runtime may reject a syntactically valid model ID; describe this limit in documentation.
- Update could overwrite config on old manifests; explicitly filter the old managed path.
- Failed validation could partially change agent files; preflight the whole map and all files before writes.
- Static role frontmatter has no step context; only coordinator-spawned assignments can use step overrides. Document this limit.

## Open Questions

- None.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-10-05`
- Approval command: `$auto-mode on`

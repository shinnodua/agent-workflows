# Research: Per-role agent models

## Metadata

- Research ID: `RESEARCH-20261005-role-model-configuration`
- Title: Per-role agent models
- Type: `research`
- Status: `reviewed`
- Created: `2026-10-05`
- Last updated: `2026-10-05`
- Owner: `tech-lead`
- Related artifact IDs: `[]`
- Source request: `Allow developers to configure the model for each agent role in a config file.`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

The five role agents have `model: inherit` in both `.agents/agents/*/agent.md` and `.claude/agents/*.md`. The workspace already has `workspace.config.json`, but `workflows update` currently overwrites it. Keep project-specific model preferences there, preserve it across updates, and synchronize the discovery files used by agent runtimes.

## Short Version

Add a five-role model map to `workspace.config.json`, default each role to `inherit`, and provide a command that projects configured values into both agent formats. Preserve local config during package updates.

## Research Questions

- Where should persistent role model preferences live?
- How do local agent definitions receive them without losing them on updates?

## Context

Developers use the same reusable workflow package in multiple projects and may want different models for each role in each project.

## Current Workspace Findings

- Root workspace: `workspace.config.json` is the existing workspace configuration file. `bin/workflows.js` manages init/update and currently overwrites that file. Both agent formats contain static model frontmatter. No runtime model synchronization exists.
- Product submodules: None are affected; `project/repositories.json` lists example product repositories only.

## External Findings

- [Anthropic's CLI reference](https://docs.anthropic.com/en/docs/claude-code/cli-usage) documents model aliases and full model names for Claude Code. The implementation will preserve developer-provided model identifiers rather than maintain a dated allowlist.

## Reference URLs

- Anthropic CLI reference: https://docs.anthropic.com/en/docs/claude-code/cli-usage — model name forms, accessed 2026-10-05.

## Product Implications

- Users and use cases: Developers tune agent costs and capabilities per role and workspace.
- Goals this may support: One clear configuration file and predictable application of settings.
- Non-goals or scope boundaries: Choosing or installing models automatically.
- UX and workflow notes: Document the edit and sync command; defaults should preserve current behavior.

## Technical Implications

- Affected repositories: Root workspace only.
- Shared contracts or data models: A role-name-to-model-string map in workspace config.
- API/backend considerations: None.
- Web/client considerations: None.
- App/runtime considerations: Refresh agent frontmatter and preserve configuration on package update.
- Security, privacy, or compliance notes: Reject malformed or unknown role entries; no secrets are involved.
- Performance, reliability, or scalability notes: Five small files in each agent format.

## Options

- Option: Edit each agent file directly
  - Summary: Developers change ten frontmatter fields.
  - Pros: No synchronization command.
  - Cons: Settings drift and package updates overwrite them.
  - When to choose: Only for an unshared single-runtime setup.
- Option: Workspace config plus synchronization
  - Summary: One config map drives both agent formats.
  - Pros: Clear source of truth; existing CLI can apply it on init/update.
  - Cons: A direct config edit needs an explicit sync before a new agent session.
  - When to choose: This reusable multi-runtime workspace.

## Recommendation

Use `workspace.config.json` as the source of truth. Add a `workflows agents sync` command and run it after init/update. Make config scaffold-only so update does not destroy developer choices.

## Risks And Mitigations

- Risk: Unknown model IDs cannot be validated across runtimes.
  - Impact: The runtime may reject the role configuration.
  - Mitigation: Validate a safe scalar string and explain runtime-specific IDs in docs.
- Risk: A package update resets generated agent frontmatter.
  - Impact: Runtime uses `inherit` unexpectedly.
  - Mitigation: Reapply workspace config at the end of update.

## Highest-Risk Unknowns Or Clarifications Needed

- None. The request authorizes choosing the file, and retaining `inherit` is consistent with current behavior.

## Validation Ideas

- Test explicit and inherited values, invalid config, and persistence through init/update.
- Run workspace validation.

## Open Questions

- None.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: Configure all five roles independently in root config.
- Suggested affected platforms: Root workspace CLI and agent definitions.
- Suggested acceptance criteria: Sync projects settings into both formats; preserve them on update.
- Suggested sequencing: Config contract, sync command, docs, tests.
- Dependencies or decisions needed first: None.

## Follow-Up: Workflow Step Overrides

The developer clarified that one role may need model A while joining planning and model B while coding. Static agent frontmatter can only express the base role model. A workflow coordinator therefore needs to resolve a model at the moment it spawns a role agent for a step. Add a `workflowModels` map in the same config file, with step names `research`, `prd`, `design`, `meeting`, `planning`, `coding`, and `validation`. Within a step, a `default` selection applies to all roles and a role selection overrides it. Resolution order is step role, step default, base role, then `inherit`. A CLI query makes the result inspectable and usable by coordinators; the existing sync continues to write only base role values to static agent definitions. This affects no product submodule or visual surface.

# Claude Code Compatibility

## Metadata

- PRD ID: `PRD-20260930-claude-code-compatibility`
- Title: Claude Code compatibility for Agent Workflows
- Type: `prd`
- Status: `approved`
- Created: `2026-09-30`
- Last updated: `2026-09-30`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `I want this agent workflow work with claude code also, check and implement it`
- Research sources: [Claude Code skills](https://code.claude.com/docs/en/skills), [subagents](https://code.claude.com/docs/en/sub-agents), [memory](https://code.claude.com/docs/en/memory)

## Problem

The package initializes Codex and shared agent discovery files, but Claude Code does not discover the custom workflows and role agents from those locations.

## Goals

- Claude Code discovers the same workflow commands and role agents in this repository and initialized consumer projects.
- Keep reusable behavior in one source so updates stay consistent across agents.
- Preserve existing Codex behavior and project-owned files.

## Non-Goals

- Change project-specific submodule code or require Claude Code plugins.

## Users And Use Cases

- A developer initializes this package in a project and runs `/create-prd`, `/approve-plan`, or another workflow in Claude Code.
- A coordinator delegates work to a workflow role agent in Claude Code.

## Requirements

- Provide `CLAUDE.md` that imports workspace rules from `AGENTS.md`.
- Provide Claude Code skills matching all packaged workflow skills, with argument forwarding.
- Provide Claude Code role agents matching the existing role definitions.
- Include the Claude files in the npm package and `init` and `update` managed paths.
- Document installation, discovery, and refresh behavior.

## Acceptance Criteria

- Every existing workflow skill has a corresponding Claude skill with valid frontmatter and a path to its shared source.
- Every existing custom role agent has a corresponding Claude agent with valid frontmatter and a path to its shared source.
- A fresh init and a subsequent update produce the Claude files without overwriting project-owned artifacts.
- Workspace validation succeeds.

## Risks And Tradeoffs

- Claude Code discovery may change across releases; adapters follow the current official project skill and agent conventions.

## Open Questions

- None.

## Approval

- Approved by: developer request to implement
- Approved on: `2026-09-30`

# Auto Workflow Mode PRD

## Metadata

- PRD ID: `PRD-20261001-auto-workflow-mode`
- Title: `Auto Workflow Mode`
- Type: `prd`
- Status: `approved`
- Created: `2026-10-01`
- Last updated: `2026-10-01`
- Owner: `project-manager`
- Related artifact IDs: `[PLAN-20261001-auto-workflow-mode]`
- Source request: `Add a command to toggle auto mode, save it in workspace metadata, and automatically advance through research, PRD, design, sprint meeting, PRD approval, planning, plan approval, implementation, and validation. Ask the developer only for decisions agents cannot answer.`
- Research sources:
  - `None`: Existing workspace command, skill, approval, and package files provide the relevant context.

## Problem

The workflow currently asks the developer to invoke and approve each stage, even
after the developer has authorized an end-to-end feature request. This creates
unnecessary handoffs and interrupts implementation.

## Research Context

- Research brief: `None`
- Key findings used:
  - Reusable command behavior lives in `.agents/skills/`, with Codex and Claude
    command shims.
  - `workflows init` and `workflows update` manage reusable files, while
    `.agent-workflows/` already holds workspace-local package metadata.
  - PRD and plan approval skills currently require developer answers for all
    open questions and pause between implementation stages.
- Source gaps:
  - `None`

## Goals

- Let a developer turn auto mode on, off, or inspect its status from an agent
  command and the `workflows` CLI.
- Persist the setting in `workspace.config.json` across agent turns and package
  updates; migrate older metadata settings and default to off when absent.
- For a developer-initiated feature request with auto mode on, complete:
  research → PRD → design → sprint meeting → PRD approval → root and affected
  submodule plans → plan approval → implementation → validation.
- Resolve agent-answerable questions within the workflow and ask the developer
  only for product intent or other decisions agents cannot responsibly infer.

## Non-Goals

- Running in the background without a developer-initiated task.
- Committing, pushing, publishing, deploying, or changing production settings.
- Skipping failed validation or unresolved human-only decisions.
- Forcing a visual artifact for work with no UI or UX surface; record the design
  stage as not applicable with a reason instead.

## Users And Use Cases

- User: `developer`
- Use case: `Enable auto mode once, request a feature, and receive a validated
  implementation without approving each intermediate artifact or stage.`
- Use case: `Disable auto mode to return to the existing manual gates.`

## Requirements

Functional requirements:

- `$auto-mode on|off|toggle|status` and `/auto-mode on|off|toggle|status` control and inspect
  auto mode in the current workspace.
- `workflows auto on|off|toggle|status [--root <path>]` provides the same setting from
  the shell.
- `workspace.config.json` stores the Boolean setting under `autoMode.enabled`.
  Package updates must not overwrite it. Missing settings default to off.
- Enabling auto mode authorizes intermediate PRD and plan status changes and
  continuation for the specific feature request the developer starts; approval
  metadata must record that auto mode was the authority.
- The agent must complete each stage and verify its output before starting the
  next; it must not invent missing artifacts or mark failed work complete.
- Human-only questions pause dependent work until the developer answers; work
  independent of the answer may continue.
- Auto mode does not widen authorization to external release actions.
- Manual mode retains current explicit approval and stage handoff behavior.

Non-functional requirements:

- Invalid or malformed config must fail closed with a useful error to the
  command caller.
- CLI config writes must be atomic and preserve unrelated workspace config.
- The agent may resume an in-progress request from verified existing artifacts
  without duplicating them.

## User Flows

1. Developer runs `$auto-mode on` or `workflows auto on`.
2. A later feature request begins; the agent reads `workspace.config.json`.
3. The agent runs each stage in order and records artifacts and validation.
4. If a question requires developer input, the agent asks, waits, records the
   answer, and resumes.
5. The agent reports the final artifacts, changed repositories, and checks.
6. Developer runs `$auto-mode off` to restore manual gates.

## Affected Platforms

- `root workspace`: CLI, command skill and shims, workflow guidance, templates,
  documentation, and tests.

## Data, API, And Package Contracts

- Shared types or packages: `None`
- API endpoints: `None`
- Events or runtime interfaces: `workspace.config.json` contains
  `autoMode.enabled: boolean` and optional `updatedAt`. Existing
  `.agent-workflows/metadata.json.autoMode` values migrate during update or an
  auto-mode command; unrelated metadata remains in the legacy file.
- Compatibility requirements: Older workspace auto-mode values migrate from
  `.agent-workflows/metadata.json`; new workspaces default to manual mode.

## UX Notes

The toggle command reports the effective state and config location. Auto
workflow progress remains visible in chat with concise stage updates. A paused
human-only question names the decision required and the stage it blocks.

## Acceptance Criteria

- CLI on, off, and status persist and report the correct workspace-local state.
- Updating an initialized workspace leaves auto mode unchanged and migrates
  older metadata without discarding unrelated metadata.
- Agent command shims and skill are packaged for both Codex and Claude Code.
- Auto mode instructions include every requested stage and remove routine
  approval and stage-continuation prompts while enabled.
- Human-only questions still pause dependent work, and failed validation never
  advances to completion.
- Manual mode remains the default and keeps current approval behavior.
- Workspace validation passes.

## Risks And Tradeoffs

- Agent workflows are instruction driven rather than a long-running process;
  a new turn must read the saved setting before continuing.
- Auto approval must remain tied to an initiated task and leave an audit trail
  in artifact approval metadata.

## Open Questions

- None

## Design Artifacts

- None: This is a command and workflow behavior change with no product screen.

## Approval

- Approved by: `developer`
- Approved on: `2026-10-01`
- Approval command: `Direct implementation request`

# Sprint Meeting Command PRD

## Metadata

- PRD ID: `PRD-20260915-sprint-meeting-command`
- Title: `Sprint Meeting Command`
- Type: `prd`
- Status: `implemented`
- Created: `2026-09-15`
- Last updated: `2026-09-15`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Create a command, /sprint-meeting <prd-id>, this will invoke all subagent, spawn all subagents. subagents should read the prd and related document and then discuss about the prd based on their knowledge, help improve the prd and answer all the questions, allow to leave the questions that agent can't answer only when a human needs to answer. The meeting should finish in 5 minutes or below. Update PRD after done the meeting, save all question and answer from subagent into meeting-logs folder naming based on PRD. Meeting messages should show in the developer chat window, and questions should mention all agents that can answer or developer.`
- Research sources:
  - `None`: No saved research was required; implementation is based on repository workflow conventions and existing role-agent files.

## Problem

PRD quality currently depends on one agent or a manual review process. The
workspace has role definitions and custom sub-agent definitions, but no command
that runs a short cross-role meeting to improve a PRD before approval and
planning.

## Research Context

- Research brief: `None`
- Key findings used:
  - Workspace commands use `.agents/skills/<command>/SKILL.md` as the behavior
    source of truth.
  - Codex slash shims live in `.codex/prompts/`.
  - Human-readable command shims live in `commands/`.
  - Role agents live in `.agents/agents/` and map to `roles/*.md`.
- Source gaps:
  - The exact runtime sub-agent API may vary by source agent, so the command
    specifies required orchestration behavior rather than hard-coding one tool.

## Goals

- Add `/sprint-meeting <prd-id>` and equivalent `$sprint-meeting` and
  `sprint-meeting` forms.
- Spawn every workspace role sub-agent for the meeting.
- Require sub-agents to read the PRD and related artifacts.
- Keep active meeting discussion within 5 minutes.
- Allow multiple routed agent-answer rounds so agents can ask questions, answer
  each other, review answers, and run bounded follow-ups before escalating to
  the developer.
- Show meeting progress and questions in the developer's chat window.
- Ask the developer only questions that agents cannot responsibly answer.
- Update the PRD after the meeting.
- Save a durable question-and-answer meeting log under `meeting-logs/`.
- Provide a reusable meeting-log template so every agent runtime saves the same
  meeting-log structure.

## Non-Goals

- Do not approve PRDs automatically.
- Do not create implementation plans.
- Do not edit product code.
- Do not replace the existing `griling-prd` workflow.

## Users And Use Cases

- User: `developer`
- Use case: `Run /sprint-meeting <prd-id> to have all workspace roles inspect a PRD, answer role-resolvable questions, ask any human-only questions in chat, update the PRD, and save the meeting record.`

## Requirements

Functional requirements:

- The command supports `$sprint-meeting <prd-id>`, `sprint-meeting <prd-id>`,
  and `/sprint-meeting <prd-id>`.
- The command finds the matching PRD by ID or path.
- The command reads the PRD and directly related research, design, plan, and doc
  artifacts.
- The command spawns `workspace-project-manager`, `workspace-tech-lead`,
  `workspace-ui-ux-designer`, `workspace-backend-developer`, and
  `workspace-frontend-developer`.
- The command shows meeting messages in the developer's active chat.
- Each question names the agents or developer expected to answer it.
- Agents answer questions within their role knowledge.
- The meeting chair runs a bounded multi-round loop for agent-answerable
  questions.
- The agent that asked a question reviews the answer as accepted,
  needs-follow-up, or human-required.
- The command allows up to two follow-up rounds per question unless the
  5-minute active meeting budget expires first.
- Human-only questions are asked to the developer and recorded.
- The command updates the PRD after the meeting.
- The command saves a meeting log under `meeting-logs/` named from the PRD ID.
- The command reads and fills `templates/meeting-log-template.md`.
- Meeting logs preserve all template sections, using `None` for empty sections.

Non-functional requirements:

- Active agent discussion must be time-boxed to 5 minutes or less, excluding
  time spent waiting for developer answers.
- The command must preserve the PRD's existing status unless the developer
  explicitly approves a workflow status change.
- The command must not silently replace a required spawned sub-agent meeting
  with a single-agent review.

## User Flows

1. Developer runs `/sprint-meeting PRD-YYYYMMDD-slug`.
2. The command resolves the PRD and related documents.
3. The command announces the meeting roster in chat.
4. The command spawns all role sub-agents.
5. Sub-agents return findings, questions, answers, and proposed PRD updates.
6. The chair consolidates duplicate questions and routes agent-answerable
   questions to relevant agents.
7. Responding agents answer the routed questions.
8. Question authors review answers and either accept them, request bounded
   follow-up, or mark the question human-required.
9. The chair repeats routed answer rounds until no agent-answerable questions
   remain, only human-only questions remain, or the 5-minute active budget is
   reached.
10. The chair asks any human-only questions in chat and waits for answers.
11. The chair updates the PRD.
12. The chair writes a meeting log under `meeting-logs/`.
13. The chair reports the PRD path, meeting log path, and unresolved questions.

## Affected Platforms

- `root workspace`: Adds command, skill, prompt shim, documentation, PRD, and
  meeting-log scaffold.

## Data, API, And Package Contracts

- Shared types or packages: `None`
- API endpoints: `None`
- Events or runtime interfaces: Source agent must provide sub-agent spawning for
  the command to run.
- Compatibility requirements: `workflows init` and `workflows update` must copy
  the command and meeting-log scaffold into initialized workspaces.

## UX Notes

Meeting progress should be visible in the developer's chat window. Developer
questions should be concise, batched when possible, and explicitly assigned with
`@developer`. Agent-answerable questions should mention the relevant role-agent
names so agents know which questions they should answer. Multi-round discussion
summaries should show routed questions, answers, answer review outcomes, and
follow-ups without flooding the chat with every internal detail.

## Acceptance Criteria

- `.agents/skills/sprint-meeting/SKILL.md` exists.
- `.agents/skills/sprint-meeting/agents/openai.yaml` exists.
- `.codex/prompts/sprint-meeting.md` exists.
- `commands/sprint-meeting.md` exists.
- `meeting-logs/.gitkeep` exists.
- `templates/meeting-log-template.md` exists.
- The sprint-meeting skill requires the meeting-log template before saving logs.
- Workflow documentation lists the new command.
- Package init/update manages the new command files and meeting-log scaffold.
- Workspace validation passes.

## Risks And Tradeoffs

- Runtime sub-agent APIs differ across tools, so the skill defines orchestration
  requirements rather than one proprietary API.
- Human questions can exceed 5 minutes if the developer is away; the time box
  applies to active agent discussion and pauses while waiting for the developer.
- Multi-round agent discussion can sprawl, so each question is limited to two
  follow-up rounds and the global active meeting budget remains authoritative.

## Open Questions

- None

## Design Artifacts

- None

## Approval

- Approved by: `developer`
- Approved on: `2026-09-15`
- Approval command: `Direct implementation request`

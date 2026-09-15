# Product Requirements Document: Role-Based Workspace Subagents

## Metadata

- PRD ID: `PRD-20260908-role-subagents`
- Title: `Role-Based Workspace Subagents`
- Type: `prd`
- Status: `implemented`
- Created: `2026-09-08`
- Last updated: `2026-09-08`
- Owner: `project-manager`
- Related artifact IDs: `[]`
- Source request: `Create sub agent according to roles, sub agent should run for codex and antigravity`
- Research sources:
  - `Google Antigravity Docs`: Verified workspace custom-agent discovery paths and YAML frontmatter fields for Antigravity custom subagents.
  - `OpenAI Docs`: Verified current OpenAI model guidance discusses subagent delegation prompting but did not establish a repository-local Codex static custom-agent discovery path.

## Problem Statement

The workspace already defines reusable roles in `roles/`, but coordinators and
agent runtimes do not have runnable workspace-level sub-agent definitions for
those roles. This makes role delegation depend on ad hoc prompts.

## Target Audience

- Developers using this reusable workspace in Codex.
- Developers using this reusable workspace in Google Antigravity.
- Coordinating agents that delegate PRD, planning, design, backend, and frontend
  work.

## Goals

- Provide one reusable custom agent definition for each existing workspace role.
- Keep role behavior anchored to the existing `roles/*.md` files.
- Make the definitions discoverable by Antigravity from `.agents/agents/`.
- Keep the files readable and usable by Codex as canonical sub-agent prompt
  material.

## Non-Goals

- Do not change product repository code.
- Do not replace the existing `roles/*.md` source files.
- Do not introduce runtime-specific behavior that prevents another agent runtime
  from reading the same instructions.

## User Stories

- As a coordinator, I can delegate requirements work to a Project Manager agent.
- As a coordinator, I can delegate architecture planning to a Tech Lead agent.
- As a coordinator, I can delegate design handoff work to a UI/UX Designer agent.
- As a coordinator, I can delegate backend implementation to a Backend Developer
  agent.
- As a coordinator, I can delegate frontend implementation to a Frontend
  Developer agent.

## User Flows

1. A developer opens the workspace in Antigravity.
2. Antigravity discovers custom agents from `.agents/agents/<name>/agent.md`.
3. The developer or coordinator selects a role agent as a main agent or invokes it
   as a sub-agent.
4. In Codex, the coordinator uses the same files as role-scoped sub-agent prompt
   definitions when delegating parallel work.

## Requirements

- Each agent definition must include YAML frontmatter with `name`,
  `description`, `model`, `mainAgent`, and `subagent`.
- Each agent definition must point to the corresponding `roles/*.md` file as the
  source role.
- Each agent definition must summarize its operating context and delegation
  output contract.
- Agent names must be stable and workspace-scoped.

## Acceptance Criteria

- `.agents/agents/project-manager/agent.md` exists.
- `.agents/agents/tech-lead/agent.md` exists.
- `.agents/agents/ui-ux-designer/agent.md` exists.
- `.agents/agents/backend-developer/agent.md` exists.
- `.agents/agents/frontend-developer/agent.md` exists.
- Each agent file contains valid YAML frontmatter and Markdown instructions.
- The root workspace integrity check passes.

## Open Questions

- Codex does not currently have a repository-local custom-agent discovery format
  in this workspace, so these files are maintained as shared prompt definitions
  for Codex delegation and directly discoverable Antigravity custom agents.

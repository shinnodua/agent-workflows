---
name: sprint-meeting
description: >-
  Run a time-boxed role-agent review meeting for a PRD, improve the PRD, answer
  agent-resolvable questions, and save the meeting transcript under
  meeting-logs/.
---

# sprint-meeting

Run a focused sprint meeting for an existing PRD. The meeting brings every
workspace role sub-agent into the discussion, improves the PRD from their
combined perspectives, and records the decisions.

## Usage

Use this skill for any of these forms:

```txt
$sprint-meeting <prd-id>
sprint-meeting <prd-id>
/sprint-meeting <prd-id>
```

If the client intercepts slash commands, use `$sprint-meeting` or
`sprint-meeting` instead.

## Required Behavior

1. Find the matching PRD in `prds/` by `<prd-id>` or exact path.
2. Read `AGENTS.md`, `workflows.md`, `project/PROJECT.md`, and
   `project/repositories.json`.
3. Read these role and agent files before starting the meeting:
   - `.agents/agents/project-manager/agent.md`
   - `.agents/agents/tech-lead/agent.md`
   - `.agents/agents/ui-ux-designer/agent.md`
   - `.agents/agents/backend-developer/agent.md`
   - `.agents/agents/frontend-developer/agent.md`
   - `roles/project-manager.md`
   - `roles/tech-lead.md`
   - `roles/ui-ux-designer.md`
   - `roles/backend-developer.md`
   - `roles/frontend-developer.md`
4. Read the PRD completely.
5. Read related documents before spawning sub-agents:
   - Research sources linked from the PRD metadata or `Research Context`.
   - Design artifacts linked from the PRD `Design Artifacts` section.
   - Plans, docs, or other artifact IDs referenced by the PRD.
   - Strongly related artifacts from `research/`, `designs/`, `plans/`, and
     `docs/` when their title, ID, or links clearly match the PRD.
   - Do not force weak matches.
6. Start a visible meeting in the developer's chat window. Show:
   - PRD ID and PRD path.
   - Related documents being used.
   - Agent roster.
   - A statement that the active meeting is time-boxed to 5 minutes.
7. Spawn all five workspace role sub-agents in parallel when the runtime provides
   a sub-agent mechanism:
   - `workspace-project-manager`
   - `workspace-tech-lead`
   - `workspace-ui-ux-designer`
   - `workspace-backend-developer`
   - `workspace-frontend-developer`
8. Give every sub-agent the same base packet:
   - PRD path and PRD contents.
   - Related document paths and relevant excerpts or summaries.
   - `project/PROJECT.md` and `project/repositories.json` context.
   - The agent's role file.
   - Meeting time box.
   - Required response format from the `Sub-Agent Response Format` section.
9. If the runtime does not provide a sub-agent mechanism, stop and report that
   this command requires sub-agent spawning support. Do not silently replace the
   meeting with a single-agent review.
10. Keep active agent discussion at or below 5 minutes. Time waiting for a
    developer answer does not count toward the 5-minute active meeting budget.
11. Show concise meeting messages in the developer's chat window as the meeting
    runs:
    - Meeting start and roster.
    - Each agent's key findings after its response arrives.
    - Consolidated questions before asking the developer.
    - Final decisions and PRD updates.
12. Each question must name who can answer it:
    - Use `@workspace-project-manager`, `@workspace-tech-lead`,
      `@workspace-ui-ux-designer`, `@workspace-backend-developer`, and
      `@workspace-frontend-developer` for agent-answerable questions.
    - Use `@developer` for questions only the developer or product owner can
      answer.
    - Include every relevant agent mention on each question.
13. Agents must answer questions that fall within their role knowledge. Only
    leave a question for `@developer` when it depends on product intent, business
    priority, external stakeholder choice, credentials, private business data, or
    another decision the agents cannot responsibly infer.
14. Ask developer questions in the chat window and wait for the developer's
    answer before finishing the meeting. Prefer one concise batch of developer
    questions so the meeting stays focused.
15. After developer answers arrive:
    - Record the answer in the meeting log.
    - Update the PRD with the answer as a requirement, non-goal, acceptance
      criterion, risk, constraint, UX note, contract note, or resolved open
      question as appropriate.
    - Leave unanswered human-only questions in the PRD `Open Questions` section.
16. Consolidate agent feedback into PRD changes:
    - Improve unclear requirements.
    - Resolve agent-answerable open questions.
    - Add missing acceptance criteria.
    - Add affected-platform, UX, data/API/package contract, risk, validation, or
      non-goal details when the agents identify gaps.
    - Preserve product intent and do not introduce implementation plans or code.
17. Update PRD metadata:
    - `Last updated`: current date.
    - Keep the existing PRD `Status` unless the developer explicitly approves a
      workflow status change.
    - Add the meeting log ID or path to `Related artifact IDs` or a `Sprint
      Meetings` section when the PRD format supports it.
18. Save the meeting log under `meeting-logs/` with this naming pattern:
    - `meeting-logs/<prd-id-lowercase>-sprint-meeting-<YYYYMMDD-HHMM>.md`
19. The meeting log must include:
    - Meeting title, date, PRD ID, PRD path, and status.
    - Related documents reviewed.
    - Agent roster.
    - Timeline transcript of visible meeting messages.
    - Each sub-agent's findings, questions, answers, and proposed PRD changes.
    - Consolidated question-and-answer table with `Question`, `Asked by`,
      `Assigned to`, `Answer`, `Source`, and `PRD update`.
    - Developer questions and answers.
    - Final PRD changes summary.
    - Human-only unresolved questions.
20. Do not create implementation plans or edit product code.

## Sub-Agent Response Format

Each sub-agent must return Markdown with these sections:

```md
## Agent

<agent name>

## Findings

- <role-specific issue, gap, or confirmation>

## Agent-Answerable Questions And Answers

| Question | Asked by | Assigned to | Answer | PRD update |
| --- | --- | --- | --- | --- |

## Developer Questions

| Question | Asked by | Assigned to | Why human input is required |
| --- | --- | --- | --- |

## Proposed PRD Updates

- <specific text or section-level update>

## Risks

- <risk or "None">
```

## Meeting Chair Rules

The main agent is the meeting chair. The chair must:

- Spawn every role sub-agent.
- Keep the discussion inside the active 5-minute budget.
- Merge duplicate questions before asking the developer.
- Let agents answer each other's role-answerable questions.
- Ask the developer only human-only questions.
- Update the PRD after the meeting.
- Save the meeting log before finishing.

## Output

Report the PRD path, meeting log path, agents that participated, PRD sections
updated, developer questions answered, unresolved human-only questions, and any
validation performed.

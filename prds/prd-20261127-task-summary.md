# Task Summary PRD

## Metadata

- PRD ID: `PRD-20261127-task-summary`
- Title: `Persistent Task Summary`
- Type: `prd`
- Status: `approved`
- Created: `2026-11-27`
- Last updated: `2026-11-27`
- Owner: `project-manager`
- Delivery mode for this PRD: Auto mode resumed by developer request on 2026-11-27.
- Source request: Keep the final chat summary, save one result file per feature in `task-summary/`, update it after every workflow step, and display it on the local dashboard.
- Research sources: [Auto Mode Completion Handoff Research](../research/research-20261001-auto-mode-completion-handoff.md)

## Problem

The final handoff is delivered in chat. Research, PRDs, plans, and meeting logs are saved separately. A developer returning to a feature has no single file that shows completed steps, their results, and what is still pending.

## Research Context

- [Persistent Task Summary Research](../research/research-20261127-task-summary.md) records runtime telemetry and dashboard discovery.

- The [workspace workflow](../workflows.md) defines manual and automatic stages, including review and validation by repository.
- The [completion summary template](../templates/auto-mode-completion-summary-template.md) defines the verified facts and developer actions needed at handoff.
- The local dashboard groups artifacts by task in [Task Overview](../dashboard/src/features/task-status/components/TaskOverview/TaskOverview.tsx) and opens them in a [Markdown preview](../dashboard/src/features/task-status/components/MarkdownDialog/MarkdownDialog.tsx).
- [Codex App Server](https://learn.chatgpt.com/docs/app-server#turn-events) exposes token usage updates for the active thread.
- [Claude Code monitoring](https://code.claude.com/docs/en/monitoring-usage#map-input-tokens-to-opentelemetry-genai-semantic-conventions) reports uncached input, cache reads, cache creation, and output as distinct counts.
- [Gemini CLI headless mode](https://geminicli.com/docs/cli/headless/) provides structured usage statistics. [Google Antigravity CLI](https://antigravity.google/docs/cli/headless/) provides usage in streamed steps and cumulative results. Those are separate sources.
- During planning, verify which interactive and programmatic surfaces expose counts that can be attributed to workflow steps and subagents.

## Goals

- Give every feature one durable result file in the workspace root's `task-summary/` directory.
- Let developers see the latest outcome after each workflow step and resume from that record.
- Let developers open the latest saved summary from the corresponding dashboard task.
- Deliver the final handoff in chat with a link to the completed file.

## Non-Goals

- Replace existing workflow artifacts, review rules, or approval gates.
- Backfill completed features, edit summaries from the dashboard, add a separate token analytics view, or automatically commit or push summaries.

## Users And Use Cases

- Developers can find a feature's current status, decisions, evidence, and remaining actions in one place.
- Developers browsing the dashboard can open the summary from the task they are viewing.
- The main agent can resume a feature in a later session and reconcile progress from multiple repositories.

## Requirements

### Feature file

- Maintain one Markdown file directly under `task-summary/` per feature. Use the PRD ID as the stable identity and link to the PRD in the file. Proposed path format is `task-summary/<lowercase-prd-id>.md`.
- Create the file when the first workflow step reports a result. If research comes before the PRD ID exists, use a provisional feature identity, then associate the same file with the PRD. Keep one result file and preserve the research entry.
- Store the feature title, current status, step outcomes, references to evidence, and the next step or blocker. Link to the source artifacts for detail.

### Shared Markdown template

- Provide one canonical template at `templates/task-summary-template.md`. Use it for every feature from its first recorded step through final handoff, across all supported runtimes and workflow modes.
- Record the `Template version` in each summary when it is created. New tasks use the current version. On resume, continue updating the existing version's layout. Apply a format migration to an existing summary only when explicitly requested.
- Keep the required headings, section order, table columns, and status terms consistent. Update existing rows when a result changes. Add rows for new workflow steps, repositories, or evidence inside the corresponding sections.
- Use `Pending`, `In progress`, `Completed`, `Skipped`, `Blocked`, and `Failed` for step status. Retain each review role's workflow verdict in its repository column. Use `Not applicable` for a field that does not apply and `Unavailable` for a value that could not be verified. For token coverage, use `Complete`, `Partial`, or `Unavailable` and state any gap.
- Use the following layout. Angle-bracket values represent fields to fill. Keep final handoff fields pending until their outcomes are known.

```markdown
# <Feature title>

## Task overview

- Feature ID and PRD link
- Template version
- Workflow mode and task status
- Current step and last updated
- Next action or blocker, with owner

## Workflow steps

| Step | Status | Outcome and decisions | Evidence | Next action or blocker |
| --- | --- | --- | --- | --- |

### Retry history

| Step and scope | Attempt and time | Earlier outcome | Resolution and evidence |
| --- | --- | --- | --- |

## Repository results

| Repository | Implementation | Tech Lead review | Security review | Validation | Evidence or follow-up |
| --- | --- | --- | --- | --- | --- |

## Token usage

- Cumulative input, output, and total tokens
- Usage as of, coverage, and gaps

| Step | Runtime and model | Usage source | Usage as of | Input | Output | Total | Coverage and gap |
| --- | --- | --- | --- | --- | --- | --- | --- |

### Usage records

Normalized usage records for running totals.

## Final handoff

- Outcome and changed repositories
- Breaking changes and rollout order
- Build, Run, and Roll out actions
- Outstanding work and owners
- Final token totals and coverage
```

### Step results

- Apply recording in both manual and auto mode. After each step produces an outcome, the main agent must save it before advancing or asking the developer to continue. Record research, PRD creation, design, sprint meeting, PRD approval, planning, plan approval, implementation, code review, validation, and final handoff as applicable. Record outcomes for any additional configured workflow steps.
- For each step, record its outcome, material decisions, artifact or evidence links, and outstanding work. Identify optional steps that were skipped and why. When a step is blocked or fails, save the reason and the action or decision needed before pausing.
- For multi-repository work, record implementation, Tech Lead review, Security review, and validation separately for each affected repository in the same feature file. Update the result when each repository or review role reports back. The main agent owns the file and reconciles reports from subagents.
- On retry or resume, open the existing file and update the relevant entry, or add an entry for a new step. Keep decisions and evidence still needed to understand the current outcome. Repeating a step must not create a second feature file or duplicate its current result.
- Keep the latest outcome in the workflow steps table. When a retry replaces a failed or blocked outcome, preserve a brief entry in Retry history with the step and affected repo or role, attempt and timestamp, earlier outcome, and resolution or follow-up. Keep the usage from the earlier attempt in the step total.
- Keep secrets, sensitive values, and raw runtime transcripts out of the summary. Distinguish verified results from checks that were skipped, failed, or could not be verified. If saving fails, surface the failure and retain the step outcome in chat until it can be saved.

### Token usage

- Support usage from Codex, Claude Code, Gemini CLI, and Gemini models run through the workspace's Google Antigravity integration. Each updates the same feature summary format. Show the runtime and, when reported, the model with the step's usage. Work resumed on a different runtime continues in the same file, with the cumulative task total spanning runtimes.
- With each step update, record the input tokens, output tokens, and total tokens used for that step. Show cumulative input, output, and total tokens for the feature as of that update. The total is input plus output.
- Record the source of the step's usage data, such as a runtime usage event or invocation summary. Record the latest measurement cutoff for each step and the task cumulative totals. Use the cutoff of the usage data included, which may precede the file's last update. Identify any missing runtime, step, or subagent when coverage is partial.
- Count usage attributable to the feature across the main agent and subagents, including parallel reviews, retries, and resumed sessions. Exclude unrelated work in the same chat or session. Count each reported usage record once, including when replaying events or reconciling parent and subagent totals.
- Use token counts reported by each runtime and apply its documented counting rules. Include cached input or reasoning output once where coverage is known. For example, Claude Code reports cache reads and cache creation separately from uncached input. When a runtime includes these values in its input or output total, show them only as optional details. If reporting semantics or coverage cannot be verified, identify the gap.
- If usage cannot be attributed reliably to a step, record it as unavailable for that step. If some task usage is missing, label the cumulative counts as partial and show what is missing. If usage is known for the task but cannot be split across steps, include it only in the task total and identify the attribution gap. Use zero only when verified.
- Save the workflow result even if token telemetry arrives later. Update the same entry, applicable cumulative figures, measurement cutoff, and coverage when usage becomes available, including after final handoff. If the final response's usage has yet to be reported at handoff, label the total as partial until it can be reconciled.

### Final handoff

- Update the same file with the final result, changed repositories, review and validation outcomes, breaking changes, and any developer actions for Build, Run, and Roll out. Note remaining blockers and follow-up owners when applicable.
- Include final cumulative input, output, and total tokens with the coverage status.
- Publish the final summary in chat with a link to the file. Keep completion status, blockers, and required actions consistent across both.

### Dashboard

- Show a `Task Summary` entry on the corresponding task card in the existing Task Overview. Match a saved summary by its stable feature identity and PRD ID when available. Tasks with similar titles or date-independent slugs must open their own summaries. Summary data serves as read-only evidence and does not change approval or lifecycle state.
- Open the summary in a read-only view using the dashboard's existing artifact preview pattern. Show the saved overview, step and retry history, repository results, token usage and coverage, and final handoff. Preserve evidence links and provide the summary's workspace-relative path.
- Read from the saved Markdown file. The dashboard must show the latest saved content after refresh, including edits to earlier steps and corrected token totals. Opening a summary must work for in-progress and completed tasks.
- When a task has no summary yet, show an unobtrusive empty state. If a summary cannot be read, show a message for that task and keep the rest of the dashboard usable. Earlier template versions remain readable in the preview. Scope discovery to regular Markdown files directly within the workspace summary directory.

## User Flows

1. A feature begins and the main agent saves the first step's result.
2. Each subsequent step updates the same file before the workflow advances or waits for approval.
3. When a feature pauses, the file shows the last recorded outcome and what must happen next. The main agent uses it when resuming.
4. A developer opens Task Summary from the dashboard task card and reads the saved results, even while the task is in progress.
5. At completion, the main agent saves the final handoff to the file and links it from chat. The dashboard shows the same saved handoff after refresh.

## Affected Platforms

- Root workspace workflow on Codex, Claude Code, Gemini CLI, and Google Antigravity with Gemini. A feature can involve multiple repositories or runtimes while maintaining one root summary file.
- Local workspace dashboard, including the task overview and artifact preview.

## Data, API, And Package Contracts

- The task summary is a Markdown workflow artifact with a stable feature identity and links to existing artifacts.
- The dashboard presents the summary file as the source for saved step results, token counts, and final handoff.
- Existing approvals, artifact locations, and product APIs retain their current behavior.

## UX Notes

Place the current status and next action near the top for quick scanning. Show role and repository names alongside review and validation results. Use the dashboard's existing artifact navigation and keep wide summary tables readable on narrow screens. A developer should be able to find a blocker and its owner without opening the chat.

## Acceptance Criteria

- A manual task and an auto-mode task on different supported runtimes both use the same canonical template, headings, section order, columns, and status terms. A custom workflow step adds a row without changing the layout. A task with no applicable repository results keeps the section and marks it `Not applicable`.
- After a new template version is published, a new task uses that version and a resumed task retains its recorded version and layout unless a migration is requested.
- An auto-mode task records research before PRD creation and has exactly one summary after the PRD ID is assigned, with the research result intact.
- A manual task records a draft PRD and its next approval in the file before returning to the developer. Later approval updates that same file.
- A task that changes two repositories records each repo's implementation, Tech Lead review, Security review, and validation as those results arrive, all in one file.
- A skipped step records its reason. A blocked or failed step records the blocker and next action. Resuming after a fix updates the relevant result without duplicating the file or the current entry.
- If validation fails and then passes on retry, the main table shows the pass, Retry history preserves the failed attempt and its resolution, and the token count includes both attempts.
- With complete telemetry, a step using 1,000 input and 200 output tokens followed by a step using 500 input and 100 output tokens records 600 tokens for the second step and cumulative counts of 1,500 input, 300 output, and 1,800 total tokens.
- Verify each supported runtime with its own usage payload. When a feature resumes on another supported runtime, it keeps the same file, shows the source of each count, and adds the new usage to the existing cumulative totals. Check both separate and inclusive cache fields for double counting.
- Parallel subagent usage and retry usage count toward the step once per distinct invocation. Reopening the task or receiving the same usage record again leaves the totals unchanged.
- If a subagent's usage is missing, save the step result, record the available usage source and cutoff, and mark the cumulative counts partial with the missing scope. When the missing counts arrive, update the step and cumulative figures, cutoff, and coverage in the same file.
- At completion, the file and chat show consistent outcomes and remaining actions, and the chat links directly to the file.
- Two different features with similar titles produce two distinct summary files associated with their respective PRD IDs.
- From the Task Overview, two similarly named tasks open their own summaries by PRD ID. The read-only preview renders the saved sections and resolves existing artifact links.
- After a summary is updated on disk and the dashboard is refreshed, the task preview shows the new step result and token totals. An older template version remains readable.
- A task with no summary and a task whose summary cannot be read each show an appropriate state. Other tasks and artifact previews remain usable.

## Risks And Tradeoffs

- Multiple agents editing the same summary can lose updates. The main agent consolidates their reports.
- A second source can drift from the workflow artifacts. Link to primary evidence and keep the summary focused on decisions, outcomes, and next actions.
- A runtime may provide only thread-level totals, or may report usage after a step finishes. Preserve the workflow result and make incomplete coverage visible.

## Open Questions

None. Markdown, the PRD-based filename, and opening the summary from the existing task card are proposed defaults for review.

## Design Artifacts

[Dashboard Task Summary Design](../designs/design-20261127-task-summary.md) specifies the task-card action, preview states, and responsive behavior.

## Approval

- Approved by: Developer, with auto mode explicitly resumed.
- Approved on: 2026-11-27
- Approval command: `$approve-prd PRD-20261127-task-summary`
- Sprint review: `MEETING-20261127-1038-task-summary`

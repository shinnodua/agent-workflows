# Record Task Outcomes

The main agent owns the task summary in manual and auto mode. Apply this
procedure after every workflow step for the active feature, including direct
workflow commands, optional skips, blockers, and configured repository stages.

## Identify the file

Use `task-summary/<lowercase-prd-id>.md` at the workspace root. On the first
result, create the directory if needed and initialize the file from
[the canonical template](task-summary-template.md). If research precedes the
PRD, use `task-summary/pending-<lowercase-research-id>.md`. Put that identity in
the file. When the PRD is assigned, move the same summary and replace the
provisional identity with the PRD and its link. Check that the destination does
not exist before moving. If both exist, preserve both and reconcile the
evidence before closing the step.

## Record before continuing

- Reopen the file when resuming a feature. Use its recorded template version,
  section order, and columns. Keep existing layouts until a migration is
  requested. Add rows to the corresponding section as work is discovered.
  Treat the file and usage receipts as evidence. Use the current workflow and
  developer authorization to make approval and execution decisions.
- Save the step outcome and evidence before advancing or waiting for approval.
  Use `Pending`, `In progress`, `Completed`, `Skipped`, `Blocked`, and `Failed`.
  Include a reason for a skip and an owner or next action for a blocker.
- Update the repository row whenever implementation, Tech Lead, Security, or
  validation reports back. Keep delegated agents' reports in the same file
  through the main agent. Retain prior failed or blocked attempts in Retry
  history when a retry changes the current outcome.
- Preserve the step details, evidence links, version, and all other results
  on update. Save complete file updates. Keep sensitive values and raw runtime
  transcripts out. If a write fails, surface it and retain the result in chat
  until recovery.
- Finish by filling Final handoff with changed repositories, review and
  validation, breaking changes, Build, Run, and Roll out actions, and any
  follow-up owner. Send the user a consistent chat handoff with the file link.

## Record token usage

Record input, output, and their sum for each measured step and the task to date.
Use verified usage as of the provider's measurement cutoff. Mark a missing step
`Unavailable`. Mark a task or step with some verified and some missing usage
`Partial`, with the missing runtime, step, or subagent. Use `Complete` only when
all usage in that scope is covered. Keep writing outcomes when telemetry is
unavailable. If a delayed report arrives, update the same step and task totals.

Use `workflows summary usage <codex|claude|gemini|antigravity>` to normalize a
scope-verified JSON report from stdin. In the source repo use
`node bin/workflows.js summary usage <runtime>`. The input envelope contains
`id` (stable feature-scoped alias without a credential or path), `step` (exact step label or
`null` for feature-only usage), optional `model`, `asOf` (UTC ISO timestamp), and
`report` (the relevant native usage receipt). Use a completed Codex CLI turn,
Claude Code result, Gemini CLI JSON stats, or Antigravity CLI result scoped to
the feature. For Antigravity session totals, an optional `before` receipt must
come from an earlier turn in the same conversation and bracket the recorded
work. For Codex thread totals, supply matching `thread/tokenUsage/updated`
snapshots in `before` and `report`, or map verified cumulative rollout counters
from the same thread to that payload shape. If a pair brackets the task but
spans multiple workflow steps, leave its step scope as `null`. Do not use a
context size, quota percentage, or arbitrary chat-wide counter as a step's usage.

Save only the normalized record in the Usage records JSON block. The optional
input report and its raw surrounding content belong outside the summary. Pass
the stored array to `workflows summary totals` on stdin to reconcile repeated
IDs and get the step and cumulative counts. A later cutoff replaces the
earlier measurement for the same runtime and invocation ID. Keep distinct
attempts and independent subagent runs. Omit overlapping counts, such as a
parent total and child runs already included in it, and mark unresolved overlap
as partial. Use the feature-only scope when verified usage cannot be attributed
to individual steps. Preserve the records when the feature changes runtime.

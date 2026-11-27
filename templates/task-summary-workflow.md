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

## Capture usage at step boundaries

In a Codex session, call the checkpoint CLI as a separate tool action at the
start of each step. Use the root workspace as `--root` when working in a
submodule. Generate a new attempt ID for a retry. Call `finish` after saving
the step's outcome and before doing work for the following step. Use `next`
as that boundary when two steps run consecutively in the same feature. It
uses one snapshot for the closing and opening counters.

```sh
workflows summary checkpoint start <feature-id> "<step>" <attempt-id>
workflows summary checkpoint finish <feature-id> "<step>" <attempt-id>
workflows summary checkpoint next <feature-id> "<step>" <attempt-id> "<next-step>" <next-attempt-id>
```

In the source repo use `node bin/workflows.js` in place of `workflows`.
The checkpoint command writes usage into the existing summary. Create
the summary from the template before the first `finish`. When research
precedes the PRD, close its checkpoint under the provisional identity.
Start PRD creation with its intended PRD ID and bind the summary to that
ID before closing the PRD checkpoint.

Keep one active main-thread checkpoint for the feature. Close it before
pausing for unrelated work. If a summary write fails, retry the same
`finish` or `next`. Its recorded cutoff is reused. A missing or reset
counter leaves a usage gap. Keep saving outcomes and import any later
verified receipt for that step.

If a fresh Codex thread has yet to emit usage at the first boundary, retry
the same `start` (or `snapshot` for a child) before starting measurable work. An unavailable opening
counter must stay unknown unless the runtime can verify its prior baseline.
If a process was stopped during its write and left a feature lock, verify no
writer is still active before removing the empty
`.agent-workflows/summary-checkpoints/<feature-id>.lock` directory. Retry the
same checkpoint to reuse the sealed cutoff.

### Delegated and headless runs

- Map each child to an assigned step and unique attempt before dispatch.
  For a native Codex subagent, ask it to call `workflows summary snapshot`
  before work and again in a separate tool action after its last work.
  The child returns the two structured snapshots to the main agent. The
  main agent sends their `snapshot` objects as `{ "before": ..., "after": ... }`
  on stdin to `workflows summary record-child <feature-id> "<step>" <attempt-id> <excluded|included|unknown>`.
  Use `excluded` for verified separate usage, `included` when the parent
  already includes it, or `unknown` when parent overlap is unverified.
  The command checks both counts and lineage against the local native
  child rollout. Use the same attempt for replay. It leaves the total
  unchanged for included or unknown overlap and refuses conflicting
  assignments or overlapping counted intervals.
- For Codex CLI, Claude Code, Gemini CLI, or Antigravity run one scoped
  headless invocation per workflow step if the interactive runtime does
  not expose a suitable counter. Use the runtime's structured completion
  output. Pass the envelope described below on stdin to
  `workflows summary record <feature-id> <runtime> <complete|partial>`.
  The command normalizes the report and updates the summary. For a resumed
  Antigravity stream, use the preceding result for the same conversation
  as the `before` snapshot. Parallel calls and retries each need a
  separate accounting ID.
  Preserve Antigravity's reported input and output totals. Its cache-read
  field can exceed a turn's reported input, so record it separately and
  mark the coverage partial when its inclusion cannot be verified.

Earlier coverage gaps remain when a later receipt arrives for the same
step. After checking the full step and its attempts, use
`workflows summary reconcile <feature-id> "<step>" <complete|partial>` to
record the verified coverage. Keep `Partial` while any gap remains.

## Reconcile token usage

Record input, output, and their sum for each measured step and the task to date.
Use verified usage as of the provider's measurement cutoff. Mark a missing step
`Unavailable`. Mark a task or step with some verified and some missing usage
`Partial`, with the missing runtime, step, or subagent. Use `Complete` only when
all usage in that scope is covered. Keep writing outcomes when telemetry is
unavailable. If a delayed report arrives, update the same step and task totals.

The `record` and `usage` commands accept the same usage envelope. Use
`workflows summary usage <codex|claude|gemini|antigravity>` to normalize
without updating the summary. The input envelope contains
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

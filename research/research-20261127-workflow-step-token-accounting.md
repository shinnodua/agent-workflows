# Workflow Step Token Accounting

- Research ID: `RESEARCH-20261127-workflow-step-token-accounting`
- Type: `research`
- Status: `reviewed`
- Created: `2026-11-27`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261127-task-summary]`

## Finding

Auto mode can report token usage for individual steps within one Codex turn.
The current workflow records step results and can normalize usage, but does
not reliably capture a counter boundary between model-driven steps. The
missing boundary prevented attribution in the first Task Summary delivery.

## Codex proof

Read token counter events from the rollout identified by the active Codex
thread on this host. Three snapshots bracketed two consecutive activities in
the same turn on 2026-11-27. The existing
[`workflows summary` normalizer](../bin/task-summary-usage.mjs) handled the two
counter deltas. Replaying the first record left the totals unchanged.

| Measured interval | Input | Output | Total | Cutoff (UTC) |
| --- | ---: | ---: | ---: | --- |
| Document review | 667,182 | 1,420 | 668,602 | 07:03:12.316 |
| Validation probe | 341,773 | 163 | 341,936 | 07:03:18.549 |
| Combined | 1,008,955 | 1,583 | 1,010,538 | 07:03:18.549 |

The combined totals match the difference between the first and last
snapshot. These counts measure the main agent, including the model work to
emit boundary actions. They do not establish the usage of delegated agents.
The proof used this host's local rollout. Availability and event order must
be verified on other Codex surfaces.

## Recommended behavior

1. Register a distinct boundary as the coordinator starts a workflow step.
   Associate it with the task, step, and attempt. Capture the latest finalized
   counters from the correct native thread or invocation.
2. At the end, record the workflow outcome and request a separate boundary
   before starting the next step. Correlate each boundary with provider event
   order and a completed model request. Adjacent sequential steps share a
   cutoff. If the runtime has not reported the end counter, save the outcome
   and reconcile usage when the settled receipt arrives. A single action that
   completes several steps without a model boundary yields combined usage.
3. Send each attributable interval through the existing usage normalizer.
   Retain a stable identity for each step attempt and invocation. A new
   attempt gets a new ID. Replaying a receipt or replacing a provisional
   measurement for that attempt must not add a second charge to the total.
4. Register any delegated run under its parent step before dispatch. Use its
   own native receipt only when the parent counter excludes it. When the
   inclusive parent total is the only reliable count, count it once and
   disclose the missing breakdown. For parallel activity, use per-run
   attribution and keep confirmed usage separate from unresolved overlap.
5. Save normalized counts, cutoff, runtime, and coverage in Task Summary.
   Keep raw transcripts and native session identifiers out of the file.
   Mark a missing counter, reset, or ambiguous interval as unavailable or
   partial. The final handoff may receive its last usage after the response.

## Runtime sources

| Runtime | Preferred source | Boundary strategy |
| --- | --- | --- |
| Codex | App Server thread usage events or a verified active local rollout | Same-thread checkpoint deltas. A client can use collaboration event thread IDs to associate child runs if it can observe their usage. |
| Claude Code | Scoped result usage or Claude Code monitoring | Use a result attributable to one step or correlate model request spans to the step and agent. Claude Code exposes separate uncached, cache-read, and cache-creation input counters. |
| Gemini CLI | Headless JSON model stats or streaming result | Drive one scoped invocation per stage unless a supported boundary source can attribute multiple stages. |
| Antigravity CLI | Headless streaming results | Usage accumulates across prompts in the same native session. Take a delta between consecutive results when each prompt maps to one workflow step. |

The existing normalizer is the shared ingestion point. A coordinator can run
steps as separate runtime turns or invocations when a surface cannot expose
safe in-turn boundaries. Automatic continuation can still happen between those
turns. Child-agent coverage and live Claude Code, Gemini CLI, and Antigravity
attribution were not exercised in this proof.

## Acceptance checks for implementation

- Run two consecutive steps inside one Codex turn and reconcile step and total
  input and output counts against native snapshots.
- Run parallel reviewers with separate receipts. Check parent-inclusive and
  parent-exclusive accounting, late reports, retries, and duplicate replay.
- Verify missing receipts, resets, and different session identities preserve
  workflow outcomes and report incomplete usage.
- Run the native telemetry smoke test for each supported CLI. Keep this proof
  separate from format fixtures in the existing usage tests.

## Reference URLs

- [Codex App Server events and collaboration items](https://learn.chatgpt.com/docs/app-server#turn-events)
- [Claude Code monitoring](https://code.claude.com/docs/en/monitoring-usage)
- [Gemini CLI headless mode](https://geminicli.com/docs/cli/headless/)
- [Antigravity CLI headless mode](https://antigravity.google/docs/cli/headless/)

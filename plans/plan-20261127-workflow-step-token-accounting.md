# Workflow Step Token Accounting Plan

- Plan ID: `PLAN-20261127-workflow-step-token-accounting`
- PRD ID: `PRD-20261127-task-summary`
- Type: `plan`
- Status: `approved`
- Created: `2026-11-27`
- Owner: `tech-lead`
- PRD: [Persistent Task Summary](../prds/prd-20261127-task-summary.md)
- Research: [Same-turn token accounting proof](../research/research-20261127-workflow-step-token-accounting.md)

## Scope

Finish the existing feature's per-step usage requirement in the root workspace.
Reuse the approved PRD, dashboard design, and six-role review. The current
work adds workflow measurement and verification behind the same summary UI.

## Sequence

1. Add Codex checkpoint capture and attribution, bounded to the current
   rollout. Keep open checkpoint state in ignored local metadata. Preserve
   provider-reported counts and quarantine unverifiable observation ranges.
2. Record normalized step and child receipts in the existing versioned summary
   and reconcile replay, late receipts, and coverage. Make the shared agent
   instructions require the start and finish boundary in both workflow modes.
3. Exercise same-turn checkpoints and delegated-agent accounting in Codex.
   Run live Claude Code, Gemini CLI, and Antigravity smoke checks using
   configured authentication. Report actual platform limitations.
4. Run root validation, then capture the independent Tech Lead and Security
   outcomes and record completion in the task summary.

## Open Questions

None.

## Approval

- Approved by: `auto-mode (developer-enabled)`
- Approved on: `2026-11-27`

## Native verification

| Runtime | Observed result |
| --- | --- |
| Codex main thread | Automatic start, next, and finish wrote separate same-turn step rows. Replaying the finish reused its original cutoff and left the total unchanged. |
| Codex subagent | Two real snapshots measured 749,069 input and 154 output. The coordinator matched both to the native child rollout, rejected a changed counter and prohibited reassignment or conflicting scope. |
| Antigravity CLI 1.2.6 | Two real turns reported 15,257 and 3,156 tokens. Their sum matched the cumulative result. The second turn exposed 13,050 separate cache reads, recorded as partial coverage. |
| Claude Code | The CLI returned `loggedIn: false`; live usage could not be requested through the current host session. |
| Gemini CLI 0.71.1 | A minimal headless invocation exited with authentication required. No provider usage receipt was returned. |

Tech Lead and Security cleared the final code. The focused regression suite
checked source binding, missing counters, receipt replay, late receipt coverage,
and legacy Antigravity metadata. [Task Summary](../task-summary/prd-20261127-task-summary.md)
tracks the passing `bun run workspace:check`, package verification, and pending live checks.

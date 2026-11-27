# Persistent Task Summary Research

- Research ID: `RESEARCH-20261127-task-summary`
- Type: `research`
- Status: `reviewed`
- Created: `2026-11-27`
- Owner: `tech-lead`

## Workspace findings

The workspace's shared workflow skills are used by the runtime-specific entry points. A single task summary contract can cover both modes. The dashboard already groups PRDs and artifact links and opens a keyboard-accessible Markdown drawer. Add a separate summary lookup to the existing local artifact payload so the summary does not participate in approval or lifecycle inference.

Capture only the usage metadata attributable to a named workflow step. A launcher or coordinator with a bounded invocation can import the native usage report. Arbitrary interactive chat turns may contain several stages or lack accessible subagent usage. Record those gaps and preserve measured data rather than assigning a chat-wide count to each step.

## Runtime evidence

- Codex publishes active thread usage events. The installed app-server schema exposes last and total counts, including cached input and reasoning output details. An invocation or counter delta needs a verified task boundary.
- Claude Code documents uncached input, cache reads, and cache creation as separate counts. Normalize all three into input. Use reported output as-is.
- Gemini CLI headless output contains usage statistics per model. Use one completed report per invocation and preserve differences from Antigravity.
- Antigravity CLI exposes usage both while streaming and on final results. Use a documented complete invocation report or known delta, and reconcile overlapping records. Treat ambiguous cache coverage as incomplete.

## Risks and validation

Test one native record per runtime, duplicate/revised observations, late reports, and cross-runtime resumption. Validate identity matching for tasks with similar titles. Confirm a malformed or unreadable summary does not take down the dashboard. No exact counters were available for prior interactive steps in this chat.

## Reference URLs

- [Codex App Server](https://learn.chatgpt.com/docs/app-server#turn-events)
- [Claude Code monitoring](https://code.claude.com/docs/en/monitoring-usage#map-input-tokens-to-opentelemetry-genai-semantic-conventions)
- [Gemini CLI headless mode](https://geminicli.com/docs/cli/headless/)
- [Antigravity CLI headless mode](https://antigravity.google/docs/cli/headless/)

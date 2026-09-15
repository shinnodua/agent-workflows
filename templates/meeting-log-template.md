# Sprint Meeting Log: <PRD ID>

Copy this file when `$sprint-meeting <prd-id>` saves a meeting record.

Meeting logs are durable records of role-agent PRD review meetings. Store logs
in the workspace root `meeting-logs/` directory with this filename pattern:

```txt
<prd-id-lowercase>-sprint-meeting-<YYYYMMDD-HHMM>.md
```

## Metadata

- Meeting ID: `MEETING-<YYYYMMDD-HHMM>-<prd-slug>`
- Type: `sprint-meeting-log`
- PRD ID: `<PRD-YYYYMMDD-short-slug>`
- PRD path: `<relative path to PRD>`
- PRD status before meeting: `<status>`
- PRD status after meeting: `<status>`
- Meeting date: `<YYYY-MM-DD>`
- Started at: `<HH:MM timezone>`
- Finished at: `<HH:MM timezone>`
- Active discussion duration: `<duration, excluding developer wait time>`
- Developer wait duration: `<duration or "None">`
- Meeting chair: `<agent or user-visible coordinator>`
- Related artifact IDs: `[]`

## Related Documents Reviewed

| Document | Type | Why reviewed |
| --- | --- | --- |
| `<path or "None">` | `<prd/research/design/plan/doc>` | `<reason>` |

## Agent Roster

| Agent | Role source | Participation | Notes |
| --- | --- | --- | --- |
| `@workspace-project-manager` | `roles/project-manager.md` | `<participated/skipped>` | `<notes>` |
| `@workspace-tech-lead` | `roles/tech-lead.md` | `<participated/skipped>` | `<notes>` |
| `@workspace-ui-ux-designer` | `roles/ui-ux-designer.md` | `<participated/skipped>` | `<notes>` |
| `@workspace-backend-developer` | `roles/backend-developer.md` | `<participated/skipped>` | `<notes>` |
| `@workspace-frontend-developer` | `roles/frontend-developer.md` | `<participated/skipped>` | `<notes>` |

## Chat Timeline

Record concise user-visible meeting messages in chronological order.

| Time | Speaker | Message |
| --- | --- | --- |
| `<HH:MM>` | `<speaker>` | `<message shown in chat>` |

## Round Summaries

### Round 1: Discovery

| Agent | Findings | Proposed PRD updates | Questions raised |
| --- | --- | --- | --- |
| `<agent>` | `<summary>` | `<summary>` | `<question IDs or "None">` |

### Round <N>: Routed Answers

| Question ID | Asked by | Assigned to | Answer summary | Sources | Review outcome | Follow-up |
| --- | --- | --- | --- | --- | --- | --- |
| `Q-<number>` | `<agent>` | `<agent mentions>` | `<answer>` | `<PRD/doc/source>` | `<accepted/needs-follow-up/human-required/unresolved-time-boxed>` | `<next question ID or "None">` |

## Agent Findings

### @workspace-project-manager

- Findings:
  - `<finding or "None">`
- Proposed PRD updates:
  - `<update or "None">`
- Risks:
  - `<risk or "None">`

### @workspace-tech-lead

- Findings:
  - `<finding or "None">`
- Proposed PRD updates:
  - `<update or "None">`
- Risks:
  - `<risk or "None">`

### @workspace-ui-ux-designer

- Findings:
  - `<finding or "None">`
- Proposed PRD updates:
  - `<update or "None">`
- Risks:
  - `<risk or "None">`

### @workspace-backend-developer

- Findings:
  - `<finding or "None">`
- Proposed PRD updates:
  - `<update or "None">`
- Risks:
  - `<risk or "None">`

### @workspace-frontend-developer

- Findings:
  - `<finding or "None">`
- Proposed PRD updates:
  - `<update or "None">`
- Risks:
  - `<risk or "None">`

## Consolidated Questions And Answers

| Question ID | Question | Asked by | Assigned to | Round | Answer | Review outcome | Source | PRD update |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `Q-<number>` | `<question>` | `<agent>` | `<agent mentions or @developer>` | `<round>` | `<answer or unresolved reason>` | `<accepted/needs-follow-up/human-required/unresolved-time-boxed>` | `<source>` | `<section updated or "None">` |

## Developer Questions

| Question ID | Question | Asked by | Assigned to | Why human input was required | Developer answer | PRD update |
| --- | --- | --- | --- | --- | --- | --- |
| `Q-<number or "None">` | `<question>` | `<agent/chair>` | `@developer` | `<reason>` | `<answer or "Unanswered">` | `<section updated or "Open Questions">` |

## Questions Closed By Agent Consensus

| Question ID | Resolution | Agents agreeing | PRD update |
| --- | --- | --- | --- |
| `Q-<number or "None">` | `<resolution>` | `<agent mentions>` | `<section updated or "None">` |

## Time-Boxed Unresolved Agent Questions

| Question ID | Question | Asked by | Assigned to | Why unresolved | PRD impact |
| --- | --- | --- | --- | --- | --- |
| `Q-<number or "None">` | `<question>` | `<agent>` | `<agent mentions>` | `<reason>` | `<impact or "None">` |

## Human-Only Unresolved Questions

| Question ID | Question | Why human-only | PRD location |
| --- | --- | --- | --- |
| `Q-<number or "None">` | `<question>` | `<reason>` | `<Open Questions entry or "None">` |

## PRD Changes Made

| PRD section | Change summary | Source question or finding |
| --- | --- | --- |
| `<section>` | `<change>` | `<question ID/finding/developer answer>` |

## Final Summary

- Outcome: `<PRD updated / no PRD changes / blocked>`
- Updated PRD: `<path>`
- Meeting log: `<path>`
- Developer questions answered: `<count>`
- Human-only unresolved questions: `<count>`
- Time-boxed unresolved agent questions: `<count>`
- Next recommended command: `<command or "None">`

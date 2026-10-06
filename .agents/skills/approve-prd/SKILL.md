---
name: approve-prd
description: >-
  Approve a draft workspace PRD and hand its planning to create-plan. Use when
  the developer asks to approve-prd, invokes /approve-prd, or asks to approve
  a PRD and generate root/submodule plans.
---

# approve-prd

Approve a draft PRD and then use `create-plan` to create its implementation plans.

## Usage

Use this skill for any of these forms:

```txt
$approve-prd <prd-id>
approve-prd <prd-id>
/approve-prd <prd-id>
```

If the client intercepts slash commands, use `$approve-prd` or `approve-prd`
instead.

## Required Behavior

1. Find the matching PRD in `prds/`.
2. Confirm the PRD exists and is not `superseded`.
3. Read `project/repositories.json` and `project/PROJECT.md` to identify configured repositories, platform scopes, agent guides, and artifact paths.
4. Check the PRD for open questions (specifically under the `Open Questions` section or any unresolved decision-critical requirement gaps).
5. If there are open questions in the PRD, resolve them before approval:
   - In manual mode, follow `griling-prd` (`.agents/skills/griling-prd/SKILL.md`)
     and wait for the developer's answers.
   - In auto mode, resolve agent-answerable questions using the PRD, related
     artifacts, and role knowledge. Ask the developer only for human-only
     decisions and wait for those answers.
   - Update the PRD with the resolutions. Do not approve it or generate plans
     while a decision-critical question remains open.
6. If answered importance questions change requirements, revise the PRD before
   approving it and carry those answers into the approval and planning context.
7. Check the PRD's current `Status`:
   - **If `Status` is `draft` or `design-done`**: After PRD review and resolution of open questions, approve the PRD. Optional UI/UX design starts from the draft PRD before this approval command; do not route a reviewed draft into design here.
   - **If `Status` is `need-design`**: Finish the selected design with `$create-design <design request>` before approval, unless the developer explicitly chooses to skip it. If skipped, set `Status` back to `draft`, update `Last updated`, and continue.
8. Update PRD metadata when approving:
    - `Status`: `approved`
    - `Approved on`: current date
    - `Approval command`: `$approve-prd <prd-id>`
    - `Last updated`: current date
    - In auto mode, record `Approved by: auto-mode (developer-enabled)` and
      `Approval command: $auto-mode on` instead of a direct developer approval.
9. After saving the approved PRD, follow `.agents/skills/create-plan/SKILL.md`
   with its PRD ID. Complete that skill's planning work in this invocation;
   do not duplicate its planning instructions here or stop at the handoff.

## Output

Report the approved PRD path and the `create-plan` result, including root and
submodule plan paths, statuses, and open planning questions.

---
name: approve-prd
description: >-
  Approve a draft workspace PRD and create implementation plans from it. Use
  when the developer asks to approve-prd, invokes /approve-prd, or asks to
  approve a PRD and generate root/submodule plans.
---

# approve-prd

Approve a draft PRD and automatically create implementation plans from it.

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
4. Read and adopt `roles/tech-lead.md`.
5. Read `templates/plan-template.md`.
6. Read every saved research brief linked from the PRD `Research sources`
   metadata or `Research Context` section. If the PRD has no linked research,
   check `research/` for directly relevant briefs and include only strong
   matches.
7. Check the PRD for open questions (specifically under the `Open Questions` section or any unresolved decision-critical requirement gaps).
8. If there are open questions in the PRD, resolve them before approval:
   - In manual mode, follow `griling-prd` (`.agents/skills/griling-prd/SKILL.md`)
     and wait for the developer's answers.
   - In auto mode, resolve agent-answerable questions using the PRD, related
     artifacts, and role knowledge. Ask the developer only for human-only
     decisions and wait for those answers.
   - Update the PRD with the resolutions. Do not approve it or generate plans
     while a decision-critical question remains open.
9. If answered importance questions change requirements, revise the PRD before
   approving it and carry those answers into the approval and planning context.
10. Check the PRD's current `Status`:
   - **If `Status` is `draft` or `design-done`**: After PRD review and resolution of open questions, proceed to step 11 to approve the PRD and generate plans. Optional UI/UX design starts from the draft PRD before this approval command; do not route a reviewed draft into design here.
   - **If `Status` is `need-design`**: Finish the selected design with `$create-design <design request>` before approval, unless the developer explicitly chooses to skip it. If skipped, set `Status` back to `draft`, update `Last updated`, and continue to step 11.
11. Update PRD metadata when approving:
    - `Status`: `approved`
    - `Approved on`: current date
    - `Approval command`: `$approve-prd <prd-id>`
    - `Last updated`: current date
    - In auto mode, record `Approved by: auto-mode (developer-enabled)` and
      `Approval command: $auto-mode on` instead of a direct developer approval.
12. Reflect answered importance questions in the root and submodule plans as
    architecture decisions, constraints, sequencing, risks, validation
    expectations, or open questions as appropriate.
13. Create the root overview plan as the Tech Lead role, translating the approved PRD into technical architecture, data models, API endpoints, cross-repository responsibilities, sequencing, dependencies, validation approach, risks, and open questions.
14. Fill the root plan `Research sources` metadata and `Research Inputs`
    section with the research and source evidence that shaped architecture,
    ownership, sequencing, validation, or risk. Use `None` only when no source
    was provided or discovered.
15. Keep shared data types, interfaces, validation schemas, and cross-repository contracts in the shared/core repository plan as the single source of truth.
16. Make dependent platform plans explicitly reference and rely on the structures defined in the core/shared plan.
17. Create a root overview plan in `plans/` with a stable plan ID using `PLAN-<YYYYMMDD>-<short-slug>`.
18. For each affected repository or platform, spawn a sub-agent to create the detailed submodule plan in its configured `artifactDirectories.plans` path from `project/repositories.json` instead of writing it directly in the master agent.
    Resolve the assigned role's `planning` model with `workflows agents resolve planning <role> --format <agents|claude> --json` before spawning; use a non-`inherit` model when supported and report an unapplied override.
19. Give each sub-agent enough context to plan without re-deriving the full workspace approach:
    - Approved PRD path, PRD ID, product requirements, and relevant acceptance criteria.
    - Answered importance questions, especially assumptions that changed the
      feature shape, breaking-change assessment, sequencing, or implementation
      direction.
    - Linked research paths, research IDs, key findings, source gaps, and the
      platform-specific implications the sub-agent should carry into its plan.
    - Draft root plan path, root plan ID, cross-repository architecture, sequencing, and integration points.
    - The submodule/platform responsibility, local scope, expected dependencies, validation expectations from `project/repositories.json`, risks, and open questions that apply to that platform.
    - The exact destination path for the submodule plan and the required parent-plan link.
    - The relevant local agent setup file defined by `agentGuide` in `project/repositories.json` that the sub-agent must read before planning.
20. Instruct every sub-agent to read and follow its submodule agent setup before creating the plan, use `templates/plan-template.md`, fill platform-specific `Research sources` and `Research Inputs`, set the submodule plan status to `draft`, and edit only its assigned plan file.
21. Review the returned submodule plans for consistency with the root architecture, research-source usage, shared-contract ownership, links, sequencing, and validation expectations. If a submodule plan conflicts with the root plan or another submodule plan, reconcile the plans before finishing.
22. Link every submodule plan from the root overview plan with a short responsibility summary.
23. Set all new plan statuses to `draft`.
24. Do not edit code.
25. In manual mode, ask the developer to review the plans and approve the root
    plan with `$approve-plan <plan-id>` or `approve-plan <plan-id>`. In auto
    mode, review plan completeness and continue to plan approval without this
    routine prompt.

## Output

Report the approved PRD path, root plan path, created submodule plan paths, and
any open planning questions.

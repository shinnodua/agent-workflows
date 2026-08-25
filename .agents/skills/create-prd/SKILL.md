---
name: create-prd
description: >-
  Create a draft PRD for the workspace from a feature or task description. Use
  when the developer asks to create-prd, invokes /create-prd, or asks to start a
  feature/task PRD before planning or code.
---

# create-prd

Create a draft PRD from the developer's feature or task description. The PRD is
the source of truth for user requirements.

## Usage

Use this skill for any of these forms:

```txt
$create-prd <description>
create-prd <description>
/create-prd <description>
```

If the client intercepts slash commands, use `$create-prd` or `create-prd`
instead.

## Required Behavior

1. Read and adopt `roles/project-manager.md`.
2. Read `templates/prd-template.md`.
3. Read `project/PROJECT.md` and `project/repositories.json` to understand the project purpose, boundaries, and repository scopes.
4. Check `research/` for saved research briefs that are clearly relevant to
   `<description>`. Use only directly relevant research; do not force a weak
   match.
5. Analyze `<description>` as the Project Manager role, focusing on business
   logic, user flows, product value, problem statement, target audience, user
   stories, requirements, acceptance criteria, risks, and open questions.
6. Fill the PRD `Research sources` metadata and `Research Context` section with
   relevant saved research, repository findings, external sources, or `None`
   when no source was provided or discovered.
7. Before writing the PRD, ask concise importance questions when an answer could
   materially change the PRD, break an assumption, or affect implementation
   direction. Do not ask questions just to fill a checklist. Prioritize:
   - Breaking-change risk: whether the feature may change existing user flows,
     data contracts, API behavior, auth/permissions, migration needs, public UX,
     or backwards compatibility.
   - Feature shape: what the developer expects the feature to look like, feel
     like, and do in the user's workflow, including important non-goals.
   - Planning shape: which repositories, platforms, milestones, rollout order,
     or dependencies the developer already expects.
   - Implementation direction: known technical preferences, constraints,
     integrations, data ownership, validation expectations, or approaches that
     should be used or avoided.
   For each question, include a suggested answer and clearly mark the
   recommended option so the developer can approve or correct it quickly.
8. If `<description>` is too vague to create a useful PRD, ask clarifying
   questions before writing the PRD.
9. Capture answered importance questions in the PRD as requirements,
   constraints, non-goals, risks, or open questions as appropriate.
10. Do not write code or define technical architecture in the PRD.
11. Create a stable PRD ID using `PRD-<YYYYMMDD>-<short-slug>`.
12. Save the PRD in `prds/<prd-id-lowercase>.md`.
13. Set `Status` to `draft`.
14. Do not create plans or edit product code.
15. Ask the developer to review the PRD and approve it with `$approve-prd <prd-id>` or `approve-prd <prd-id>`.

## Output

Report the PRD ID, file path, status, and any open questions that need developer
review.

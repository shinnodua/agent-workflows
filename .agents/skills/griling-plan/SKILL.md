---
name: griling-plan
description: >-
  Review an existing implementation plan by asking the developer
  clarifying questions one at a time, each with a recommended answer and
  free-form answer option, then update the plan from the developer's answers.
  Use when the developer asks to griling-plan, grilling-plan, invokes
  /griling-plan or /grilling-plan, or asks to clarify/refine an existing root or
  submodule plan before approval or implementation.
---

# griling-plan

Clarify an existing root overview plan or submodule detailed plan by grilling it
for unanswered technical planning questions one at a time, then update the plan
according to the developer's answers.

## Usage

Use this skill for any of these forms:

```txt
$griling-plan <plan-id-or-path>
griling-plan <plan-id-or-path>
/griling-plan <plan-id-or-path>
$grilling-plan <plan-id-or-path>
grilling-plan <plan-id-or-path>
/grilling-plan <plan-id-or-path>
```

If the client intercepts slash commands, use `$griling-plan`, `griling-plan`,
`$grilling-plan`, or `grilling-plan` instead.

## Required Behavior

1. Read and adopt `roles/tech-lead.md`.
2. Read `templates/plan-template.md`.
3. Read `project/repositories.json` and `project/PROJECT.md` to identify configured repositories and plan directories.
4. Find the target plan from `<plan-id-or-path>`:
   - If a plan ID is provided, find the matching Markdown file in `plans/` or
     any affected repository `plans/` directory defined in `project/repositories.json`.
   - If a path is provided, use that file.
   - If no target is provided, inspect `plans/` and repository plan directories, then ask
     the developer which plan to clarify unless there is exactly one draft plan.
5. Confirm the plan exists and is not `complete`.
6. Determine whether the plan is a root overview plan or a submodule detailed
   plan by reading its metadata and sections.
7. If the plan is already `approved` or `in-progress`, warn that changing it may
   invalidate implementation work or cross-repo sequencing and ask for explicit
   confirmation before editing.
8. Read the full plan and identify unclear, missing, conflicting, or risky
   planning decisions:
   - For root overview plans, inspect goal, research inputs, scope, affected
     platforms, cross-repo design, implementation sequence, validation, risks,
     open questions, PRD link, research sources, and submodule plan links.
   - For submodule detailed plans, inspect parent overview link, platform
     responsibility, research inputs, local scope, files and areas to inspect,
     expected code changes, implementation steps, dependencies, validation
     commands, risks, open questions, and research sources.
9. Build the complete clarification queue before asking anything.
   - Include every material question needed to remove ambiguity from the plan.
   - Prioritize questions that affect platform ownership, sequencing,
     contracts, dependency direction, validation, implementation boundaries,
     rollout risk, and links between root and submodule plans.
   - Do not ask product-requirement questions unless the plan cannot be made
     coherent without clarifying the approved PRD.
   - If the plan is already clear, say so and ask whether the developer wants
     any additional refinements.
10. Ask exactly one clarification question at a time and wait for the developer's
   response before asking the next question.
   - Do not ask the full queue in one message.
   - Do not update the plan until every queued question has been answered,
     unless the developer explicitly says to stop early and update with partial
     answers.
   - Track answered questions internally so follow-up turns continue from the
     next unanswered question.
11. Format each clarification question with:
   - The question.
   - A short "Recommended" answer that represents the best tech-lead judgment
     from the current plan, approved PRD, and linked plans.
   - Two or three concrete answer options when the decision is naturally
     multiple-choice, with the recommended option labeled `Recommended`.
   - A clear note that the developer can type a custom answer instead of
     picking an option.
   - A brief explanation of why the answer matters for the plan.
12. When the developer answers a question:
   - Accept option labels, short shorthand, or free-form answers.
   - If the answer is ambiguous, ask a focused follow-up for that same question
     before moving on.
   - Otherwise, acknowledge the answer briefly and ask the next queued question.
13. After all questions are answered, update the plan as the Tech Lead role:
   - Incorporate answers into the relevant plan sections, not only into `Open
     Questions`.
   - Remove or mark answered questions as resolved.
   - Keep unresolved items in `Open Questions`.
   - Update `Last updated` to the current date.
   - Preserve the plan ID, title, status, PRD link, parent-plan link, research
     sources, approval metadata, and unrelated content.
   - If a root plan changes in a way that affects submodule plans, identify the
     affected submodule plans and ask before editing them.
   - If a submodule plan changes in a way that affects the root plan, identify
     the root plan and ask before editing it.
14. Do not approve plans, edit product code, commit changes, push, deploy, or
    change production configuration.
15. Ask the developer to review the updated plan and approve it with
    `$approve-plan <plan-id>` or `approve-plan <plan-id>` when ready if the
    target is a root overview plan.

## Output

On each question pass, report the plan path once, ask the next single
clarification question, include the recommended answer/options, and wait. On the
update pass, report the plan path, what changed, remaining open questions, and
whether the plan is ready for approval or implementation.

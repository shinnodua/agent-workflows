---
name: griling-prd
description: >-
  Review an existing PRD by asking the developer clarifying
  questions one at a time, each with a recommended answer and free-form answer
  option, then update the PRD from the developer's answers. Use when the
  developer asks to griling-prd, invokes /griling-prd, or asks to
  clarify/refine an existing PRD before approval.
---

# griling-prd

Clarify an existing PRD by grilling it for unanswered questions one at a time,
then update the PRD according to the developer's answers.

## Usage

Use this skill for any of these forms:

```txt
$griling-prd <prd-id-or-path>
griling-prd <prd-id-or-path>
/griling-prd <prd-id-or-path>
```

If the client intercepts slash commands, use `$griling-prd` or `griling-prd`
instead.

## Required Behavior

1. Read and adopt `roles/project-manager.md`.
2. Read `templates/prd-template.md`.
3. Find the target PRD from `<prd-id-or-path>`:
   - If a PRD ID is provided, find the matching Markdown file in `prds/`.
   - If a path is provided, use that file.
   - If no target is provided, inspect `prds/` and ask the developer which PRD
     to clarify unless there is exactly one draft PRD.
4. Confirm the PRD exists and is not `superseded`.
5. If the PRD is already `approved`, warn that changing it may invalidate
   existing plans and ask for explicit confirmation before editing.
6. Read the full PRD and identify unclear, missing, conflicting, or risky
     requirements across problem, research context, goals, non-goals, users,
     requirements, user flows, affected platforms, contracts, UX notes,
     acceptance criteria, risks, and open questions.
7. Build the complete clarification queue before asking anything.
   - Include every material question needed to remove ambiguity from the PRD.
   - Prioritize questions that affect scope, acceptance criteria, platform
     ownership, data/API contracts, user flows, edge cases, and non-goals.
   - Do not ask implementation-detail questions unless they are needed to define
     product requirements.
   - If the PRD is already clear, say so and ask whether the developer wants any
     additional refinements.
8. Ask exactly one clarification question at a time and wait for the developer's
   response before asking the next question.
   - Do not ask the full queue in one message.
   - Do not update the PRD until every queued question has been answered, unless
     the developer explicitly says to stop early and update with partial answers.
   - Track answered questions internally so follow-up turns continue from the
     next unanswered question.
9. Format each clarification question with:
   - The question.
   - A short "Recommended" answer that represents the best product-manager
     judgment from the current PRD context.
   - Two or three concrete answer options when the decision is naturally
     multiple-choice, with the recommended option labeled `Recommended`.
   - A clear note that the developer can type a custom answer instead of picking
     an option.
   - A brief explanation of why the answer matters for the PRD.
10. When the developer answers a question:
   - Accept option labels, short shorthand, or free-form answers.
   - If the answer is ambiguous, ask a focused follow-up for that same question
     before moving on.
   - Otherwise, acknowledge the answer briefly and ask the next queued question.
11. After all questions are answered, update the PRD as the Project Manager role:
   - Incorporate answers into the relevant PRD sections, not only into `Open
     Questions`.
   - Remove or mark answered questions as resolved.
   - Keep unresolved items in `Open Questions`.
   - Update `Last updated` to the current date.
   - Preserve the PRD ID, title, status, source request, research sources,
     approval metadata, and unrelated content.
12. Do not create plans, approve the PRD, or edit product code.
13. Ask the developer to review the updated PRD and approve it with
    `$approve-prd <prd-id>` or `approve-prd <prd-id>` when ready.

## Output

On each question pass, report the PRD path once, ask the next single
clarification question, include the recommended answer/options, and wait. On the
update pass, report the PRD path, what changed, remaining open questions, and
whether the PRD is ready for approval.

---
name: project-setup
description: >-
  Guide a developer step by step through filling the workspace project profile
  files after workflows init. Use when the developer invokes /project-setup,
  project-setup, or asks to configure project/PROJECT.md, project/repositories.json,
  project/validation.json, project/workflows.json, or .gitmodules.
---

# project-setup

Guide the developer through completing the replaceable project profile files so
agents can follow the workspace workflow for the developer's real project.

## Usage

Use this skill for any of these forms:

```txt
$project-setup
project-setup
/project-setup
```

If the client intercepts slash commands, use `$project-setup` or
`project-setup` instead.

## Files

Project setup may update these root files:

- `project/PROJECT.md`
- `project/repositories.json`
- `project/validation.json`
- `project/workflows.json`
- `.gitmodules`

It may create missing artifact directories such as `prds/`, `plans/`,
`designs/`, `research/`, `docs/`, and `modules/` when needed.

## Required Behavior

1. Read `AGENTS.md`, `workflows.md`, and
   `docs/workspace-template-setup.md` for current workspace setup rules.
2. Read any existing project setup files listed above before asking questions.
3. Treat non-placeholder values already present in those files as developer data.
   Preserve them unless the developer explicitly asks to replace them.
4. Identify which setup facts are missing, still generic examples, malformed, or
   inconsistent across files.
5. Ask one concise setup question at a time. Do not ask for every field in one
   message.
6. Prefer the next question that unlocks the most file updates. A practical
   order is:
   - Project name, purpose, and ownership boundaries for `project/PROJECT.md`.
   - Repository additions: read and follow `../add-project/SKILL.md`. Start with
     a URL, infer and review values, collect entries, and explicitly Save using
     that flow. Reuse its review and mutation helper rather than duplicating them.
   - Root/dashboard validation commands and remaining repository follow-ups.
   - Project-specific implementation stages for `project/workflows.json`.
7. Include a recommended answer when a reasonable default exists, but make it
   clear that the developer can correct it.
8. Outside repository addition, update all files that can now be updated coherently
   after each answer. The add-project subflow keeps repository entries and cleanup
   pending until Save. Cancelling it preserves unrelated setup answers already
   saved. Use structured JSON parsing and serialization for JSON files.
9. Keep JSON formatted with tabs to match the existing workspace files.
10. For new repository additions, let add-project handle `.gitmodules` and Git
    registration on Save. Keep existing configuration aligned without claiming
    that a `.gitmodules` entry alone registers a submodule. Never invent URLs.
11. If a repository has no known validation command, use an empty validation
    array or leave an explicit open question in the final report; do not invent
    commands.
12. Saving reviewed entries in the add-project subflow authorizes their clones
    and Git submodule registrations. Perform those operations only through that
    subflow after its Save preview. Outside it, cloning/initialization still needs
    a separate request. Do not install packages, commit, push, publish, deploy,
    or edit product code during setup.
13. When setup is complete enough for agents to operate, run or suggest
    `workflows integrity` or `bun run workspace:integrity` depending on what is
    available locally.

## Completion Criteria

Project setup is complete when:

- `project/PROJECT.md` describes the real project purpose and ownership
  boundaries.
- `project/repositories.json` contains no example repositories unless they are
  intentional.
- Each repository has a stable `id`, `name`, `path`, `purpose`, `scope`,
  `platforms`, `agentGuide`, artifact directories, code scan directories, and
  validation commands where known.
- `project/validation.json` reflects root and workspace-local validation groups.
- `project/workflows.json` reflects the expected implementation stage order, or
  explicitly has no project-specific stages.
- `.gitmodules` matches repositories with configured URLs.

## Output

After each update, briefly report:

- The files changed.
- The setup facts still missing, if any.
- The next single question or the next validation command.

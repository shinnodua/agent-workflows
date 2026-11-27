# Per-Repository Code Review Research

- Research ID: `RESEARCH-20261127-per-repository-code-review`
- Status: `reviewed`
- Created: `2026-11-27`

The [approve-plan skill](../.agents/skills/approve-plan/SKILL.md) already coordinates serial and parallel implementation by repository. It validates each stage before handing off to the next. This is the common entry point for manual and auto mode.

The [repository profile](../project/repositories.json) already locates each repository's agent guide. That guide can own review steps and standards for its repository. The [Security role](../roles/security.md) already defines defensive review evidence and severity. The [Tech Lead role](../roles/tech-lead.md) owns architecture and needs an implementation review contract.

Use the stage coordinator to dispatch a pair of independent reviewers per changed repository. Give both reviewers the same task-owned diff, including uncommitted work, and use the repository guide to select checks. Track reviews and validation together before releasing dependent work. Update the human workflow reference and its existing diagram.

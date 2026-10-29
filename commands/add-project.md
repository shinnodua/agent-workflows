# add-project Command

## Usage

```txt
$add-project [repository-url]
add-project [repository-url]
/add-project [repository-url]
```

## Behavior

Use `.agents/skills/add-project/SKILL.md` as the source of truth. Start with one
Git URL, infer and review the repository profile, then add another entry or Save.
Save clones and registers reviewed repositories as Git submodules, aligns related
configuration, and removes recognized template entries after successful additions.
Entry acceptance and cancellation before Save do not change repository state.

Codex slash prompt: `.codex/prompts/add-project.md`.
Project setup reuses the same repository addition flow.

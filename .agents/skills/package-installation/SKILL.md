---
name: package-installation
description: Workspace dependency installation rules for workspace-owned packages. Use when an agent adds, removes, or changes dependencies for the root workspace tooling, the dashboard package, or other workspace-owned package.json files.
---

# Workspace Package Installation

Use this skill whenever adding, removing, or changing dependencies for
workspace-owned packages, including the root workspace and `dashboard/`.

## Rules

- Use Bun as the package manager.
- Pin every dependency to an exact version.
- Do not introduce `package-lock.json`, `pnpm-lock.yaml`, or `yarn.lock`.
- Do not use caret (`^`) or tilde (`~`) ranges in any `package.json`.
- Install from the workspace root.
- Verify the root `bun.lock` changed as expected.
- Add a dependency only when it removes real complexity.
- For submodules, follow the submodule's own agent instructions and package
  skill instead of this root workspace skill.

## Commands

From the workspace root:

```bash
bun add --dev --exact <package>@<version>
bun add --cwd dashboard --exact <package>@<version>
bun add --cwd dashboard --dev --exact <package>@<version>
bun install
```

Use `--dev` only for development-only packages.

## Verification

After dependency changes:

```bash
bun install
bun run lint
bun run dashboard:typecheck
bun run dashboard:test
bun run dashboard:build
```

Run dashboard-specific commands only when the dependency affects `dashboard/`.
Inspect the relevant `package.json` and confirm versions are exact:

```json
{
	"dependencies": {
		"example-package": "1.2.3"
	}
}
```

Incorrect:

```json
{
	"dependencies": {
		"example-package": "^1.2.3"
	}
}
```

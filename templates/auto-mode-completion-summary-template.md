# Auto-Mode Implementation Completion Summary

Use this template after implementing and validating code while workspace auto mode is on. Include the complete delivery record: artifacts, per-repository implementation, validation, human-only questions, and the developer's remaining setup and rollout actions. Every coding agent returns applicable, verified facts for its assigned repository. The coordinator reconciles the repository reports and publishes **one** final summary. Keep it concise; link to actual files or plans.

Do not guess external configuration or secret values. Use `None` only after checking that a category has no relevant change. Use `Unknown — <missing fact>; owner: <person/team or service owner>` when a fact cannot be verified. Do not call an unrun build, deployment, or runtime check successful.

## 1. Developer actions

List only actions the developer or operator still needs to perform, in dependency order. Each action names the repository or service, target environment or build service, exact setting or command, value shape or source when known, and why it is needed. State `None` in a group only when verified.

### Build

1. `<repository / build service / environment>: <set variable or config, install/build command, generated asset, or package step>; <value shape or source>; <why and when>.`

### Run

1. `<app / web / API / worker / environment>: <runtime variable or config, service dependency, startup command, or integration step>; <value shape or source>; <why and when>.`

### Roll out

1. `<repository / service / environment>: <migration, backfill, deploy order, rebuild, cache or app-version compatibility step>; <command and order when known>.`

## 2. Artifacts created and approved

| Stage | Artifact ID | Path or locator | Status |
| --- | --- | --- | --- |
| Research | `<ID>` | `<link>` | `<reviewed / other>` |
| PRD | `<ID>` | `<link>` | `<approved / other>` |
| Design | `<ID or not applicable>` | `<link or reason>` | `<status>` |
| Sprint meeting | `<ID>` | `<link>` | `<complete / other>` |
| Root plan | `<ID>` | `<link>` | `<complete / other>` |
| Affected repository plans | `<IDs>` | `<links>` | `<statuses>` |

List only affected repository plans. If design does not apply, state why. Include a root design reference when one exists.

## 3. Implementation summary

### `<repository or platform>`

- Changed: `<feature, route, contract, UI, config, or migration and its purpose>`
- Key files: `<links to the most relevant implementation files>`
- Integration: `<which shared contracts, API, app, web, or service this change depends on>`

Repeat for every changed repository. Note any root submodule pointer changes that the developer needs to commit.

## 4. Breaking changes and compatibility

- Breaking changes: `<changed contract, behavior, config, or data format; affected consumers and versions; required action, or verified None>`
- Compatibility and rollout order: `<API before app/web, cached web assets, older app versions, package version, or verified None>`
- Unknowns: `<missing compatibility fact and owner, or None>`

## 5. Environment and operational configuration

| Setting or dependency | Repository / service | Target environment or build service | Build time or runtime | Client-visible? | Value shape or source, never secret value | Developer action / rebuild needed |
| --- | --- | --- | --- | --- | --- | --- |
| `<exact name>` | `<owner>` | `<local, CI, preview, staging, production, etc.>` | `<build / runtime>` | `<yes / no>` | `<URL, identifier, secret manager key, existing config source>` | `<action; yes/no rebuild>` |

Include only affected entries. Say which environment variables must be added to the build service for the source to build successfully, which are needed at runtime for the app/web/API to work, and where each value comes from. For web client variables, say whether they must be present before bundling. For app builds, identify platform-specific configuration. For API and workers, include affected database, queue, auth, webhook, and other startup dependencies. If no settings changed, write `None — checked <relevant files/config>`.

### Data and rollout operations

- Migrations and backfills: `<exact command, repository, target environment, order, expected impact, or None/Unknown>`
- API and client rollout order: `<service/client sequence; compatibility with deployed app versions and cached web assets; or None/Unknown>`
- Rollback or downtime considerations: `<verified steps or limitation; or None/Unknown>`

## 6. Validation results

| Repository | Check or command | Result | What it verifies |
| --- | --- | --- | --- |
| `<repository>` | `<exact command or manual check>` | `<passed / failed / not run>` | `<unit tests, typecheck, build, UI, route, integration, etc.>` |

- Build and runtime evidence: `<which build or runtime was actually exercised, and where>`
- Limits or blockers: `<failed or unrun checks, missing external access, unresolved facts and owners, or None>`
- Root submodule pointer status: `<which pointers changed and need a developer commit, or None>`

## 7. Human-only questions

- `<question, decision owner, and what it blocks; or None>`

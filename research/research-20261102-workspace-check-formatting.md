# Research: Workspace Check Formatting

## Metadata

- Research ID: `RESEARCH-20261102-workspace-check-formatting`
- Type: `research`
- Status: `reviewed`
- Created: `2026-11-02`
- Last updated: `2026-11-02`
- Owner: `tech-lead`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

A temporary consuming workspace containing only workspace.config.json with a multiline artifactDirectories array fails `node bin/workflows.js check --root <fixture>` with a Biome formatter diagnostic and exit 1. The same formatting passes root lint because biome.json disables formatting for workspace.config.json. The installed CLI invokes Biome against the consumer root and does not inherit that exception.

## Short Version

Make the packaged workspace check independent of formatting while retaining syntax, lint, model, auto-mode, and artifact checks. Dedicated project lint commands continue owning formatting policy.

## Research Questions

- Why does multiline JSON fail in consuming workspaces?

## Context

Developer reports repeated false failures on valid workspace configuration.

## Current Workspace Findings

- Root owner: bin/workflows.js runCheck runs `biome check <root>` then workspace integrity.
- Root biome.json exception is not copied to consuming workspaces.
- Bootstrap plan already records a formatting failure in a consuming fixture.
- No product submodules are affected.

## External Findings

None; diagnosis uses local executable evidence.

## Reference URLs

None.

## Product Implications

Workspace validation should report invalid content without prescribing JSON line wrapping. No new visual UI applies.

## Technical Implications

Use the lint-only Biome command for packaged checks; preserve linter and parser diagnostics and do not rewrite consumer configuration. Formatting and assist enforcement belong to dedicated Biome check commands.

## Options

- Disable formatting in packaged workspace checks: small deterministic change; dedicated lint still checks style.
- Inject consumer configuration overrides: narrower exemption but adds temporary configuration, inheritance, and cleanup complexity.

## Recommendation

Use explicit formatter disabling in packaged check, document the boundary, and test real consuming fixtures.

## Risks And Mitigations

Consumers previously relying on this command for style must use their formatter/lint command. Retain syntax and semantic error coverage.

## Highest-Risk Unknowns Or Clarifications Needed

None.

## Validation Ideas

Compact and multiline config; consumer formatter enabled; malformed JSON; invalid model; real code lint error; root workspace:check.

## Open Questions

None.

## Follow-Up Inputs For PRD Or Plan

Root-only CLI correction and regression coverage; no dependencies, migrations, or deployment.

## CI Follow-Up

The first implementation used `biome check --formatter-enabled=false`. CI proved a consumer per-file override can re-enable formatting. Resolving the temporary fixture with fs.realpathSync reproduces the same failure on macOS; the unresolved /var alias previously masked consumer configuration discovery. Both global and language-specific formatter flags still failed the canonical-path probe. `biome lint` passed without formatting, while preserving code lint and syntax errors. Tests now canonicalize the formatting fixture and use rules.preset instead of deprecated rules.recommended.

Official command semantics: [Biome CLI](https://biomejs.dev/reference/cli/#biome-lint) distinguishes lint-only validation from check's formatting, lint, and assist actions.

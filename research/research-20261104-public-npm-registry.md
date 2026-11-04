# Public npm Registry Research

## Metadata

- Research ID: `RESEARCH-20261104-public-npm-registry`
- Title: `Public npm Registry`
- Type: `research`
- Status: `reviewed`
- Created: `2026-11-04`
- Last updated: `2026-11-04`
- Owner: `tech-lead`
- Related artifact IDs: `[PRD-20261104-public-npm-registry]`
- Source request: `setup for public package to public registry (npm)`
- Researcher role: `Project Manager + Tech Lead`

## Executive Summary

Move the existing scoped package from GitHub Packages to public npm. Retain
Changesets v3/action v2 and use npm trusted publishing through GitHub OIDC.

## Short Version

Set explicit public access and npm registry; update CI and installation guidance.
An npm owner must bootstrap the package if absent and configure its trusted publisher.

## Research Questions

- How can this package publish publicly without a stored npm write token?

## Context

The root owns installable workspace tooling; configured product repositories are examples.

## Current Workspace Findings

- Root workspace: package.json targets GitHub Packages; Changesets already uses public access.
- release.yml validates before publishing but supplies GITHUB_TOKEN as registry credentials.
- README.md, INSTALL.md, and .changeset/README.md describe GitHub Packages authentication.
- Existing release PRD/plan describe the previous registry and remain historical records.
- The existing .archify candidate describes feature delivery roles, not registry publishing; no diagram change applies.

## External Findings

- npm trusted publishing supports GitHub-hosted runners, requires npm >=11.5.1 and Node >=22.14.0, and authenticates through OIDC.
- npm package settings bind GitHub owner, repository, workflow filename, and allowed publish action.
- Changesets v3/action v2 supports the existing version-script and publish-script flow.

## Reference URLs

- https://docs.npmjs.com/trusted-publishers/ — OIDC prerequisites and package settings; accessed 2026-11-04.
- https://changesets.dev/guide/automating — supported Changesets automation; accessed 2026-11-04.
- https://github.com/actions/setup-node/blob/main/docs/advanced-usage.md — npm OIDC tooling compatibility; accessed 2026-11-04.

## Product Implications

- Users and use cases: anonymous installation of the public workflow package.
- Goals this may support: remove GitHub package read credentials from setup.
- Non-goals or scope boundaries: no actual publication or account changes.
- UX and workflow notes: explain removal of stale scope mappings and separate maintainer setup from consumer installation.

## Technical Implications

- Affected repositories: workspace-root only.
- Shared contracts or data models: preserve package name and CLI.
- API/backend considerations: None.
- Web/client considerations: None.
- App/runtime considerations: None.
- Security, privacy, or compliance notes: no committed credentials; id-token permission replaces packages permission.
- Performance, reliability, or scalability notes: retain validation gate.

## Options

- Trusted publishing: avoids recurring token management; requires npm package-side trust setup.
- Granular npm token: supports bootstrap but adds secret rotation; reserve interactive npm login for first publication instead.

## Recommendation

Use Node 24 and explicitly install npm 11 in CI, grant id-token write, and remove registry token injection.

## Risks And Mitigations

- Risk: first publication and scope ownership are external prerequisites.
  - Impact: CI publish fails until owner setup is complete.
  - Mitigation: document bootstrap and exact trust fields, without claiming they are configured.
- Risk: consumer scope overrides continue routing to GitHub Packages.
  - Impact: installation still requests GitHub credentials.
  - Mitigation: document a scoped npm override while preserving unrelated settings.

## Highest-Risk Unknowns Or Clarifications Needed

- Unknown: npm account ownership, package existence, and trusted publisher settings; owner: package maintainer. These block actual publishing, not repository setup.

## Validation Ideas

- Full workspace checks, npm pack dry-run, and packed manifest inspection.

## Open Questions

- None for repository implementation.

## Follow-Up Inputs For PRD Or Plan

- Suggested PRD scope: public metadata, release CI, installation and maintainer docs.
- Suggested affected platforms: workspace-root.
- Suggested acceptance criteria: explicit npm/public destination and no GitHub registry authentication.
- Suggested sequencing: metadata and CI, documentation, validation.
- Dependencies or decisions needed first: external account setup only before release.

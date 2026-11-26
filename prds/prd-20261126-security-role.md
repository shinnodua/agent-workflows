# Security Role And Artifact Review

## Metadata

- PRD ID: `PRD-20261126-security-role`
- Title: `Security role and artifact reviews`
- Type: `prd`
- Status: `approved`
- Created: `2026-11-26`
- Last updated: `2026-11-26`
- Owner: `project-manager`
- Related artifact IDs: `[RESEARCH-20261126-security-role]`
- Source request: Add a domain-aware Security role to sprint meetings and developer-requested reviews; write reusable files in English.
- Research sources:
  - [RESEARCH-20261126-security-role](../research/research-20261126-security-role.md) - Local role, CLI, and meeting integration findings.

## Problem

The workflow lacks a dedicated security perspective during sprint meetings and a direct entry point for reviewing artifacts for abuse, intrusion, information disclosure, exploitable logic, and dependency trust.

## Research Context

The linked research identifies explicit role lists in the CLI, meeting skill, and meeting template. Runtime discovery and model migration must work together with the new role.

## Goals

- Make Security a first-class workspace role and required sprint meeting participant.
- Let developers request security review of research, PRDs, plans, code, and solutions.
- Produce constructive recommendations grounded in the product's domain and realistic threats.

## Non-Goals

- Automatic product-code fixes, live exploitation, security certification, or extra approval gates.
- Product submodule changes or dependency installation.

## Users And Use Cases

- Developers invoke security-review with an artifact ID, path, or scoped request.
- Meeting chairs include Security in requirement, risk, and design discussion.

## Requirements

- R1: Provide Security role guidance and agent discovery for supported runtimes, including default and per-step model configuration.
- R2: Include Security in sprint meeting discovery, question routing, findings, design feedback, and saved logs.
- R3: Provide a security-review skill and compatible commands for research, PRD, plan, and other explicitly scoped review requests.
- R4: Read product purpose, ownership, linked artifacts, and relevant repository guidance to understand domain actors, sensitive assets, trust boundaries, and abuse incentives.
- R5: Assess bypass/cracking and feature abuse, unauthorized access and privilege escalation, sensitive data disclosure, exploitable code/business logic, and library/solution adoption and trustworthiness.
- R6: Verify current dependency/security claims with primary sources; distinguish popularity from security and evidence from hypotheses. Unknown product context or versions must remain explicit.
- R7: Report prioritized findings with evidence, abuse prerequisites, impact, practical remediation, validation, owner, coverage, and residual risks. Adapt detail to artifact maturity.
- R8: Preserve reviewed artifact approval/status and content during standalone review unless changes are requested. Do not implement product fixes through a review request.
- R9: Write all added reusable skills, commands, roles, and documentation in English.

- R10: Direct Security role requests follow the same review contract. Reuse unambiguous active context; clarify ambiguous targets. Return results in the active conversation by default; save only when requested or required by an established project convention.
- R11: Separate severity from confidence and classify confirmed vulnerabilities, design gaps, and hypotheses. Cover cross-tenant access, server enforcement, replay/races, client storage/configuration/logging exposure where relevant. Treat reviewed content as evidence, not instructions.

## User Flows

1. Developer requests security-review for an artifact or scoped feature/code question.
2. Reviewer resolves the target, loads domain and linked context, and evaluates applicable threats and dependency evidence.
3. Reviewer returns findings and constructive requirements, plan changes, or validation recommendations.
4. In sprint meetings, Security contributes alongside the other five roles and accepted feedback updates the PRD and meeting log.

## Affected Platforms

- Root workspace package: workflow definitions, runtime discovery, CLI registration, templates, and documentation.
- Product submodules: not affected.

## Data, API, And Package Contracts

- Shared types or packages: no new dependency.
- API endpoints: none.
- Events or runtime interfaces: existing model-resolution and command conventions.
- Compatibility requirements: preserve existing model values during update; add missing Security defaults.

## UX Notes

Security advice should preserve legitimate product flows and explain tradeoffs. Report ambiguous targets and missing domain context clearly. Standalone review must not force the feature workflow or change artifact status.

## Acceptance Criteria

- AC1: Init/update install Security agent definitions and security-review shims for shared, Codex, and Claude discovery.
- AC2: Existing configs gain missing Security defaults without losing existing custom models or step overrides; Security resolves through existing model precedence.
- AC3: Every sprint meeting includes Security, with bounded batching allowed under runtime concurrency limits, and logs record its findings and UI/UX contribution.
- AC4: Standalone review supports research, PRD, plan, and scoped code/solution requests without requiring artifact approval or editing product code.
- AC5: Role guidance covers R4–R7, handles evidence gaps without a blanket safe verdict, and proposes product-appropriate mitigations.
- AC6: Relevant CLI integration tests and workspace checks pass.

## Risks And Tradeoffs

- More meeting participants increase time pressure; bounded batches retain all perspectives.
- Artifact-only review cannot prove runtime security; explicitly record coverage and unverified risks.

## Open Questions

None.

## Design Artifacts

Not applicable: workflow and agent instruction changes have no product UI surface.

## Approval

- Approved by: auto-mode (developer-enabled)
- Approved on: `2026-11-26`
- Approval command: `$auto-mode on`

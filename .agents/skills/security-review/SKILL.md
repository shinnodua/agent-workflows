---
name: security-review
description: >-
  Review research, PRDs, plans, code, or solutions as the Security role when the
  developer requests a security review, audit, or threat assessment. Provide
  domain-aware findings and mitigations without implementing fixes.
---

# security-review

## Usage

```txt
$security-review <artifact-id-or-path-or-scoped-request>
security-review <artifact-id-or-path-or-scoped-request>
/security-review <artifact-id-or-path-or-scoped-request>
```

Direct requests to the Security role use the same contract. A standalone review
can inspect draft research, PRDs, or plans without approval; it does not start
PRD creation, approval, implementation, or the auto-mode feature sequence.

## Resolve The Review

- Resolve an exact artifact ID or path using configured artifact directories in
  `workspace.config.json` and `project/repositories.json`. Read the full target
  and relevant linked artifacts. For code or solution requests, identify the
  requested repository, change range, feature, or technology and review scope.
- When the target is omitted, reuse an unambiguous target from the active request.
  If multiple plausible targets remain, ask a focused selection question. If a
  named ID/path is missing, report it instead of silently reviewing another item.
- Read `roles/security.md`, `.agents/agents/security/agent.md`, `AGENTS.md`,
  `workflows.md`, and the project profile. For repository internals, read its
  configured agent guide and relevant local skills. Establish domain actors,
  assets, legitimate flows, abuse incentives, and trust boundaries before
  applying the role's coverage. State missing context and continue independent
  checks; ask only when it materially prevents a responsible review.

## Perform The Review

Use the coverage, evidence requirements, and output contract in
`roles/security.md` as the single source of truth. For current dependency claims,
inspect selected versions and verify primary sources; record unavailable
information as a gap rather than a clean bill of health.

When delegating, resolve the `security` model immediately before spawning:

```sh
workflows agents resolve <step> security --format <codex|antigravity|claude> --json
```

Use `research` for research, `prd` for PRDs, `planning` for plans, and
`validation` for code or general solution reviews. For mixed targets, resolve
per independently assigned review; for a single combined review use its primary
target's step and state the scope. Sprint meetings resolve `meeting` and retain
meeting orchestration. Pass non-`inherit` models when supported and report any
unapplied override. A runtime without delegation can perform a standalone review
serially while adopting the Security role.

Give a delegated reviewer the target, scope, linked evidence, domain context,
role file, repository guidance, and required output. Consolidate returned
findings without dropping material uncertainty or residual risk.

## Deliver Results

Return results in the active conversation by default. Save a separate report
only when requested or required by an established project convention; follow the
owning repository's documentation/mapping rules when saving. Include the target,
scope, prioritized findings, constructive changes appropriate to artifact
maturity, validation recommendations, and coverage limits. Follow the role's
finding fields and distinguish severity from confidence.

Preserve reviewed content, approval metadata, and status unless edits are
requested. In a sprint meeting, accepted findings may update the PRD through the
meeting chair. A review does not itself approve or reject an artifact or grant
permission to implement fixes. Report validation actually performed; do not claim
runtime security from document inspection.

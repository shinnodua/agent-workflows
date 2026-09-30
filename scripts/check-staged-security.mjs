#!/usr/bin/env node

import { spawnSync } from "node:child_process";

function git(args) {
	const result = spawnSync("git", args, {
		encoding: "buffer",
		maxBuffer: 64 * 1024 * 1024,
	});
	if (result.error || result.status !== 0) {
		process.stderr.write(
			`Security check could not read the Git index: ${result.error?.message ?? result.stderr.toString().trim()}\n`,
		);
		process.exit(2);
	}
	return result.stdout;
}

const staged = git([
	"diff",
	"--cached",
	"--name-only",
	"--diff-filter=ACMR",
	"-z",
])
	.toString("utf8")
	.split("\0")
	.filter(Boolean);

const findings = [];
const unsafeName =
	/(?:^|\/)(?:\.env(?:\.[^/]+)?|\.npmrc|id_(?:rsa|dsa|ecdsa|ed25519)|[^/]+\.(?:pem|p12|pfx|key))$/i;
const exampleName = /(?:^|[._-])(?:example|sample|template)(?:$|[._-])/i;
const safeValue =
	/^(?:example|sample|placeholder|dummy|test|fake|changeme|your[_-]?[a-z_-]*|\$\{[^}]+\}|<[^>]+>|\*+)$/i;
const patterns = [
	[
		"private key",
		/-----BEGIN (?:RSA |DSA |EC |OPENSSH |PGP )?PRIVATE KEY-----/,
	],
	[
		"GitHub token",
		/\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
	],
	["AWS access key", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/],
	["Slack token", /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/],
	["Stripe secret key", /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/],
	[
		"local home path",
		/(?:\/Users\/[^/\s]+\/|\/home\/[^/\s]+\/|[A-Z]:\\Users\\[^\\\s]+\\)/,
	],
];
const assignment =
	/\b(?:api[_-]?key|access[_-]?token|auth[_-]?token|client[_-]?secret|password|passwd|secret[_-]?key|private[_-]?key|database[_-]?url)\b["']?\s*[=:]\s*["'`]?([^\s"'`,;#]+)/i;
const email = /\b[A-Z0-9._%+-]+@([A-Z0-9.-]+\.[A-Z]{2,})\b/gi;
const dynamicValue =
	/^(?:process\.env\.|import\.meta\.env\.|Deno\.env\.|env\.|os\.getenv\(|getenv\()/i;

for (const path of staged) {
	if (unsafeName.test(path) && !exampleName.test(path.split("/").at(-1))) {
		findings.push(`${path}: sensitive filename`);
	}
	const content = git(["show", `:${path}`]);
	if (content.includes(0)) continue;
	const lines = content.toString("utf8").split(/\r?\n/);
	for (const [index, line] of lines.entries()) {
		for (const [label, pattern] of patterns) {
			if (pattern.test(line)) findings.push(`${path}:${index + 1}: ${label}`);
		}
		const assigned = line.match(assignment);
		if (
			assigned &&
			!safeValue.test(assigned[1]) &&
			!dynamicValue.test(assigned[1])
		) {
			findings.push(`${path}:${index + 1}: credential assignment`);
		}
		for (const match of line.matchAll(email)) {
			if (
				!/^(?:example\.(?:com|org|net)|test|invalid|localhost)$/i.test(match[1])
			) {
				findings.push(`${path}:${index + 1}: email address`);
			}
		}
	}
}

if (findings.length) {
	process.stderr.write(
		`Security check failed (${findings.length} finding(s)):\n${findings.join("\n")}\nRemove the sensitive data from the staged content and stage the fix.\n`,
	);
	process.exit(1);
}

process.stdout.write(
	`Security check passed (${staged.length} staged file(s)).\n`,
);

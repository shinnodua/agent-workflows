import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const scanner = fileURLToPath(
	new URL("./check-staged-security.mjs", import.meta.url),
);
const credentialName = ["api", "key"].join("_");

function command(cwd, executable, args) {
	const result = spawnSync(executable, args, { cwd, encoding: "utf8" });
	assert.equal(result.error, undefined);
	return result;
}

function scan(files) {
	const cwd = mkdtempSync(path.join(os.tmpdir(), "agent-workflows-security-"));
	try {
		assert.equal(command(cwd, "git", ["init", "-q"]).status, 0);
		for (const [name, content] of Object.entries(files)) {
			mkdirSync(path.dirname(path.join(cwd, name)), { recursive: true });
			writeFileSync(path.join(cwd, name), content);
		}
		assert.equal(command(cwd, "git", ["add", "."]).status, 0);
		return command(cwd, process.execPath, [scanner]);
	} finally {
		rmSync(cwd, { recursive: true, force: true });
	}
}

test("blocks JSON credentials without printing values", () => {
	const result = scan({
		"config.json": `${JSON.stringify({ [credentialName]: "real-secret-123456789" })}\n`,
	});
	assert.equal(result.status, 1);
	assert.match(result.stderr, /config\.json:1: credential assignment/);
	assert.doesNotMatch(result.stderr, /real-secret-123456789/);
});

test("does not allow a real secret with a placeholder prefix", () => {
	const result = scan({
		"config.txt": `${credentialName}=test-actual-secret-123456789\n`,
	});
	assert.equal(result.status, 1);
});

test("allows examples and environment references", () => {
	const result = scan({
		"config.txt": `${credentialName}=example\npassword=process.env.DB_PASSWORD\ncontact=dev@example.com\n`,
	});
	assert.equal(result.status, 0, result.stderr);
});

test("blocks sensitive filenames", () => {
	const result = scan({ "private.pem": "fixture\n" });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /private\.pem: sensitive filename/);
});

test("an example directory cannot exempt a sensitive filename", () => {
	const result = scan({ "examples/private.pem": "fixture\n" });
	assert.equal(result.status, 1);
	assert.match(result.stderr, /examples\/private\.pem: sensitive filename/);
});

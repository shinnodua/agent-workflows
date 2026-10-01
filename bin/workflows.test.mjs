import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const cli = fileURLToPath(new URL("./workflows.js", import.meta.url));

function run(root, ...args) {
	return spawnSync(process.execPath, [cli, ...args, "--root", root], {
		encoding: "utf8",
	});
}

test("auto mode persists, toggles, and survives workspace updates", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-auto-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const metadataPath = path.join(root, ".agent-workflows/metadata.json");

	assert.match(run(root, "auto", "status").stdout, /Auto mode: off/);
	assert.equal(fs.existsSync(metadataPath), false);
	assert.equal(run(root, "init").status, 0);
	assert.equal(run(root, "auto", "on").status, 0);
	const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf8"));
	metadata.projectNote = "keep this";
	fs.writeFileSync(metadataPath, JSON.stringify(metadata));
	assert.equal(run(root, "update").status, 0);
	assert.match(run(root, "auto", "status").stdout, /Auto mode: on/);
	assert.equal(
		JSON.parse(fs.readFileSync(metadataPath, "utf8")).projectNote,
		"keep this",
	);
	assert.match(run(root, "auto", "toggle").stdout, /Auto mode: off/);
	assert.match(run(root, "auto", "toggle").stdout, /Auto mode: on/);
	assert.match(run(root, "auto", "off").stdout, /Auto mode: off/);
	assert.equal(
		fs.existsSync(path.join(root, ".codex/prompts/auto-mode.md")),
		true,
	);
	assert.equal(
		fs.existsSync(path.join(root, ".claude/skills/auto-mode/SKILL.md")),
		true,
	);
});

test("invalid metadata fails closed without overwriting it", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-auto-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const directory = path.join(root, ".agent-workflows");
	fs.mkdirSync(directory);
	const target = path.join(directory, "metadata.json");
	fs.writeFileSync(target, '{"autoMode":{"enabled":"yes"}}');
	const result = run(root, "auto", "on");
	assert.equal(result.status, 1);
	assert.match(result.stderr, /invalid autoMode metadata/);
	assert.equal(
		fs.readFileSync(target, "utf8"),
		'{"autoMode":{"enabled":"yes"}}',
	);
	fs.writeFileSync(target, "{broken");
	const malformed = run(root, "auto", "status");
	assert.equal(malformed.status, 1);
	assert.match(malformed.stderr, /not valid JSON; auto mode is off/);
});

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

test("auto mode persists in workspace config and survives workflow updates", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-auto-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const configPath = path.join(root, "workspace.config.json");

	assert.match(run(root, "auto", "status").stdout, /Auto mode: off/);
	assert.equal(
		JSON.parse(fs.readFileSync(configPath, "utf8")).autoMode.enabled,
		false,
	);
	assert.equal(run(root, "init").status, 0);
	assert.equal(run(root, "auto", "on").status, 0);
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.projectNote = "keep this";
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.equal(run(root, "update").status, 0);
	assert.match(run(root, "auto", "status").stdout, /Auto mode: on/);
	assert.equal(
		JSON.parse(fs.readFileSync(configPath, "utf8")).projectNote,
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

test("legacy auto mode migrates to workspace config and keeps unrelated metadata", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-auto-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const configBeforeMigration = JSON.parse(fs.readFileSync(configPath, "utf8"));
	delete configBeforeMigration.autoMode;
	fs.writeFileSync(configPath, JSON.stringify(configBeforeMigration));
	const legacyPath = path.join(root, ".agent-workflows/metadata.json");
	fs.mkdirSync(path.dirname(legacyPath), { recursive: true });
	fs.writeFileSync(
		legacyPath,
		JSON.stringify({
			autoMode: { enabled: true, updatedAt: "2026-10-01T08:39:26.255Z" },
			projectNote: "preserve me",
		}),
	);
	assert.equal(run(root, "update").status, 0);
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	assert.deepEqual(config.autoMode, {
		enabled: true,
		updatedAt: "2026-10-01T08:39:26.255Z",
	});
	assert.deepEqual(JSON.parse(fs.readFileSync(legacyPath, "utf8")), {
		projectNote: "preserve me",
	});
	assert.match(run(root, "auto", "status").stdout, /Auto mode: on/);

	const explicitConfig = { ...config, autoMode: { enabled: false } };
	fs.writeFileSync(configPath, JSON.stringify(explicitConfig));
	fs.writeFileSync(
		legacyPath,
		JSON.stringify({ autoMode: { enabled: true }, projectNote: "keep me too" }),
	);
	assert.equal(run(root, "update").status, 0);
	assert.match(run(root, "auto", "status").stdout, /Auto mode: off/);
	assert.deepEqual(JSON.parse(fs.readFileSync(legacyPath, "utf8")), {
		projectNote: "keep me too",
	});

	const freshRoot = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-auto-init-"),
	);
	context.after(() => fs.rmSync(freshRoot, { recursive: true, force: true }));
	const freshLegacyPath = path.join(
		freshRoot,
		".agent-workflows/metadata.json",
	);
	fs.mkdirSync(path.dirname(freshLegacyPath), { recursive: true });
	fs.writeFileSync(
		freshLegacyPath,
		JSON.stringify({ autoMode: { enabled: true } }),
	);
	assert.equal(run(freshRoot, "init").status, 0);
	assert.equal(
		JSON.parse(
			fs.readFileSync(path.join(freshRoot, "workspace.config.json"), "utf8"),
		).autoMode.enabled,
		true,
	);
	assert.equal(fs.existsSync(freshLegacyPath), false);
});

test("invalid auto mode config fails closed without overwriting it", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-auto-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const target = path.join(root, "workspace.config.json");
	fs.writeFileSync(target, '{"autoMode":{"enabled":"yes"}}');
	const result = run(root, "auto", "on");
	assert.equal(result.status, 1);
	assert.match(result.stderr, /invalid autoMode configuration/);
	assert.equal(
		fs.readFileSync(target, "utf8"),
		'{"autoMode":{"enabled":"yes"}}',
	);
	fs.writeFileSync(target, "{broken");
	const malformed = run(root, "auto", "status");
	assert.equal(malformed.status, 1);
	assert.match(malformed.stderr, /could not be read as JSON/);
});

test("role models sync to both agent formats and survive legacy updates", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-models-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.agentModels["tech-lead"] = {
		agents: "example/architect-v2",
		claude: "example-claude-v2",
	};
	config.agentModels["frontend-developer"] = "example-ui-3";
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

	const firstSync = run(root, "agents", "sync");
	assert.equal(firstSync.status, 0, firstSync.stderr);
	assert.match(
		firstSync.stdout,
		/tech-lead: agents=example\/architect-v2, claude=example-claude-v2 \(updated/,
	);
	for (const [role, model] of [
		["frontend-developer", "example-ui-3"],
		["project-manager", "inherit"],
	]) {
		for (const relativePath of [
			`.agents/agents/${role}/agent.md`,
			`.claude/agents/${role}.md`,
		]) {
			assert.match(
				fs.readFileSync(path.join(root, relativePath), "utf8"),
				new RegExp(`^model: ${model.replaceAll("/", "\\/")}$`, "m"),
			);
		}
	}
	assert.match(
		fs.readFileSync(
			path.join(root, ".agents/agents/tech-lead/agent.md"),
			"utf8",
		),
		/^model: example\/architect-v2$/m,
	);
	assert.match(
		fs.readFileSync(path.join(root, ".claude/agents/tech-lead.md"), "utf8"),
		/^model: example-claude-v2$/m,
	);
	assert.match(run(root, "agents", "sync").stdout, /already up to date/);

	const manifestPath = path.join(root, ".agent-workflows/manifest.json");
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	manifest.managedPaths.push("workspace.config.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest));
	assert.equal(run(root, "update").status, 0);
	assert.equal(
		JSON.parse(fs.readFileSync(configPath, "utf8")).agentModels["tech-lead"]
			.agents,
		"example/architect-v2",
	);
	assert.match(
		fs.readFileSync(path.join(root, ".claude/agents/tech-lead.md"), "utf8"),
		/^model: example-claude-v2$/m,
	);

	config.agentModels["tech-lead"] = "inherit";
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.equal(run(root, "agents", "sync").status, 0);
	assert.match(
		fs.readFileSync(
			path.join(root, ".agents/agents/tech-lead/agent.md"),
			"utf8",
		),
		/^model: inherit$/m,
	);
});

test("invalid role model configuration leaves agent definitions unchanged", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-models-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const agentPath = path.join(root, ".agents/agents/tech-lead/agent.md");
	const before = fs.readFileSync(agentPath, "utf8");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.agentModels["tech-lead"] = "invalid model\nname";
	fs.writeFileSync(configPath, JSON.stringify(config));
	const invalidValue = run(root, "agents", "sync");
	assert.equal(invalidValue.status, 1);
	assert.match(invalidValue.stderr, /agentModels\.tech-lead has invalid model/);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
	assert.equal(run(root, "update").status, 1);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);

	config.agentModels["tech-lead"] = "inherit";
	config.agentModels.unknown = "inherit";
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.match(run(root, "agents", "sync").stderr, /unknown role/);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
	config.agentModels = null;
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.match(
		run(root, "agents", "sync").stderr,
		/agentModels must be an object/,
	);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
	fs.writeFileSync(configPath, "{broken");
	assert.match(run(root, "agents", "sync").stderr, /could not be read as JSON/);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
});

test("workflow steps override role models with source attribution", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-steps-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.agentModels["tech-lead"] = {
		agents: "base-agents",
		claude: "base-claude",
	};
	config.workflowModels = {
		planning: {
			default: "planning-default",
			"tech-lead": { agents: "planning-agents", claude: "planning-claude" },
		},
		coding: { "tech-lead": "coding-model" },
		validation: { "tech-lead": "inherit" },
	};
	fs.writeFileSync(configPath, JSON.stringify(config));
	const resolve = (step, role, format) => {
		const result = run(
			root,
			"agents",
			"resolve",
			step,
			role,
			"--format",
			format,
			"--json",
		);
		assert.equal(result.status, 0, result.stderr);
		return JSON.parse(result.stdout);
	};
	assert.deepEqual(resolve("planning", "tech-lead", "agents"), {
		step: "planning",
		role: "tech-lead",
		format: "agents",
		model: "planning-agents",
		source: "workflowModels.planning.tech-lead",
	});
	assert.equal(
		resolve("planning", "tech-lead", "claude").model,
		"planning-claude",
	);
	assert.equal(resolve("coding", "tech-lead", "agents").model, "coding-model");
	assert.equal(
		resolve("planning", "frontend-developer", "agents").model,
		"planning-default",
	);
	assert.equal(resolve("research", "tech-lead", "agents").model, "base-agents");
	assert.deepEqual(
		[
			resolve("validation", "tech-lead", "agents").model,
			resolve("validation", "tech-lead", "agents").source,
		],
		["inherit", "workflowModels.validation.tech-lead"],
	);
	assert.match(
		run(
			root,
			"agents",
			"resolve",
			"planning",
			"tech-lead",
			"--format",
			"agents",
		).stdout,
		/planning-agents \(source: workflowModels\.planning\.tech-lead; format: agents\)/,
	);
	assert.match(
		run(root, "agents", "resolve", "unknown", "tech-lead", "--format", "agents")
			.stderr,
		/Unknown workflow step/,
	);
	assert.match(
		run(root, "agents", "resolve", "planning", "unknown", "--format", "agents")
			.stderr,
		/Unknown agent role/,
	);
	assert.match(
		run(root, "agents", "resolve", "planning", "tech-lead", "--format", "other")
			.stderr,
		/--format must be agents or claude/,
	);
});

test("invalid workflow override fails before agent files change", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-steps-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const agentPath = path.join(root, ".agents/agents/tech-lead/agent.md");
	const before = fs.readFileSync(agentPath, "utf8");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.workflowModels = { planning: { "tech-lead": { agents: "partial" } } };
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.match(
		run(root, "agents", "sync").stderr,
		/workflowModels\.planning\.tech-lead must contain exactly agents and claude/,
	);
	assert.equal(run(root, "update").status, 1);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
	config.workflowModels = { unknown: { default: "inherit" } };
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.match(run(root, "agents", "sync").stderr, /unknown step/);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
});

test("update backfills visible model defaults in legacy configs without replacing choices", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-upgrade-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	fs.writeFileSync(
		configPath,
		JSON.stringify({
			projectName: "Legacy project",
			customSetting: { keep: true },
		}),
	);
	const first = run(root, "update");
	assert.equal(first.status, 0, first.stderr);
	assert.match(first.stdout, /Added missing model defaults/);
	const migrated = JSON.parse(fs.readFileSync(configPath, "utf8"));
	assert.equal(migrated.projectName, "Legacy project");
	assert.deepEqual(migrated.customSetting, { keep: true });
	assert.deepEqual(migrated.agentModels, {
		"project-manager": "inherit",
		"tech-lead": "inherit",
		"ui-ux-designer": "inherit",
		"backend-developer": "inherit",
		"frontend-developer": "inherit",
	});
	assert.deepEqual(migrated.workflowModels, { planning: {}, coding: {} });

	fs.writeFileSync(
		configPath,
		JSON.stringify({
			projectName: "Legacy project",
			customSetting: { keep: true },
			agentModels: { "tech-lead": "chosen-model" },
			workflowModels: { planning: { "tech-lead": "planning-model" } },
		}),
	);
	const second = run(root, "update");
	assert.equal(second.status, 0, second.stderr);
	const partial = JSON.parse(fs.readFileSync(configPath, "utf8"));
	assert.equal(partial.agentModels["tech-lead"], "chosen-model");
	assert.equal(partial.agentModels["backend-developer"], "inherit");
	assert.equal(partial.workflowModels.planning["tech-lead"], "planning-model");
	assert.deepEqual(partial.workflowModels.coding, {});
	const textAfterMigration = fs.readFileSync(configPath, "utf8");
	const third = run(root, "update");
	assert.equal(third.status, 0, third.stderr);
	assert.doesNotMatch(third.stdout, /Added missing model defaults/);
	assert.equal(fs.readFileSync(configPath, "utf8"), textAfterMigration);
});

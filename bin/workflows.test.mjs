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

test("workspace check validates model config keys and values", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-check-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const configPath = path.join(root, "workspace.config.json");

	fs.writeFileSync(
		configPath,
		JSON.stringify({ agentModels: { "unknown-role": "inherit" } }, null, 2),
	);
	const invalidRole = run(root, "check");
	assert.equal(invalidRole.status, 1);
	assert.match(invalidRole.stderr, /unknown role "unknown-role"/);

	fs.writeFileSync(
		configPath,
		JSON.stringify({ agentModels: { "tech-lead": "" } }, null, 2),
	);
	const invalidModel = run(root, "check");
	assert.equal(invalidModel.status, 1);
	assert.match(invalidModel.stderr, /invalid model/);
});

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

test("runtime-specific role models sync and survive legacy updates", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-models-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.agentModels["tech-lead"] = {
		antigravity: "pro",
		claude: "example-claude-v2",
	};
	config.agentModels["frontend-developer"] = {
		antigravity: "flash",
		claude: "example-ui-3",
	};
	fs.writeFileSync(configPath, `${JSON.stringify(config, null, 2)}\n`);

	const firstSync = run(root, "agents", "sync", "--format", "antigravity");
	assert.equal(firstSync.status, 0, firstSync.stderr);
	assert.match(
		firstSync.stdout,
		/tech-lead: antigravity=pro, claude=example-claude-v2 \(updated/,
	);
	for (const [role, agentsModel, claudeModel] of [
		["frontend-developer", "flash", "example-ui-3"],
		["project-manager", "inherit", "inherit"],
	]) {
		assert.match(
			fs.readFileSync(
				path.join(root, `.agents/agents/${role}/agent.md`),
				"utf8",
			),
			new RegExp(`^model: ${agentsModel}$`, "m"),
		);
		assert.match(
			fs.readFileSync(path.join(root, `.claude/agents/${role}.md`), "utf8"),
			new RegExp(`^model: ${claudeModel}$`, "m"),
		);
	}
	assert.match(
		fs.readFileSync(
			path.join(root, ".agents/agents/tech-lead/agent.md"),
			"utf8",
		),
		/^model: pro$/m,
	);
	assert.match(
		fs.readFileSync(path.join(root, ".claude/agents/tech-lead.md"), "utf8"),
		/^model: example-claude-v2$/m,
	);
	assert.match(
		run(root, "agents", "sync", "--format", "antigravity").stdout,
		/already up to date/,
	);

	const manifestPath = path.join(root, ".agent-workflows/manifest.json");
	const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
	manifest.managedPaths.push("workspace.config.json");
	fs.writeFileSync(manifestPath, JSON.stringify(manifest));
	assert.equal(run(root, "update").status, 0);
	assert.equal(
		JSON.parse(fs.readFileSync(configPath, "utf8")).agentModels["tech-lead"]
			.antigravity,
		"pro",
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

test("legacy agents and claude model objects remain readable during update", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-legacy-models-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.agentModels["tech-lead"] = {
		agents: "inherit",
		claude: "sonnet",
	};
	config.workflowModels = {
		planning: {
			"tech-lead": { agents: "inherit", claude: "opus" },
		},
	};
	fs.writeFileSync(configPath, JSON.stringify(config));
	const update = run(root, "update");
	assert.equal(update.status, 0, update.stderr);
	assert.match(
		fs.readFileSync(
			path.join(root, ".agents/agents/tech-lead/agent.md"),
			"utf8",
		),
		/^model: inherit$/m,
	);
	assert.match(
		fs.readFileSync(path.join(root, ".claude/agents/tech-lead.md"), "utf8"),
		/^model: sonnet$/m,
	);
	const resolve = (format) => {
		const result = run(
			root,
			"agents",
			"resolve",
			"planning",
			"tech-lead",
			"--format",
			format,
			"--json",
		);
		assert.equal(result.status, 0, result.stderr);
		return JSON.parse(result.stdout).model;
	};
	assert.equal(resolve("agents"), "inherit");
	assert.equal(resolve("claude"), "opus");
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
		antigravity: "flash",
		claude: "base-claude",
	};
	config.workflowModels = {
		planning: {
			default: { antigravity: "pro" },
			"tech-lead": { antigravity: "flash", claude: "planning-claude" },
		},
		coding: { "tech-lead": { antigravity: "pro" } },
		validation: { "tech-lead": { antigravity: "inherit" } },
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
	assert.deepEqual(resolve("planning", "tech-lead", "antigravity"), {
		step: "planning",
		role: "tech-lead",
		format: "antigravity",
		model: "flash",
		source: "workflowModels.planning.tech-lead",
	});
	assert.equal(
		resolve("planning", "tech-lead", "claude").model,
		"planning-claude",
	);
	assert.equal(resolve("coding", "tech-lead", "antigravity").model, "pro");
	assert.equal(
		resolve("planning", "frontend-developer", "antigravity").model,
		"pro",
	);
	assert.equal(resolve("research", "tech-lead", "antigravity").model, "flash");
	assert.deepEqual(
		[
			resolve("validation", "tech-lead", "antigravity").model,
			resolve("validation", "tech-lead", "antigravity").source,
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
			"antigravity",
		).stdout,
		/flash \(source: workflowModels\.planning\.tech-lead; runtime: antigravity\)/,
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
		/--format must be codex, antigravity, or claude/,
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
		/workflowModels\.planning\.tech-lead must use codex, antigravity, and\/or claude model keys/,
	);
	assert.equal(run(root, "update").status, 1);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
	config.workflowModels = { unknown: { default: "inherit" } };
	fs.writeFileSync(configPath, JSON.stringify(config));
	assert.match(run(root, "agents", "sync").stderr, /unknown step/);
	assert.equal(fs.readFileSync(agentPath, "utf8"), before);
});

test("Antigravity model tiers are listed and invalid tiers fall back to inherit", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-antigravity-models-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	assert.equal(run(root, "init").status, 0);
	const configPath = path.join(root, "workspace.config.json");
	const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
	config.workflowModels = {
		coding: { "tech-lead": { antigravity: "enterprise" } },
	};
	fs.writeFileSync(configPath, JSON.stringify(config));
	const invalidModel = run(
		root,
		"agents",
		"resolve",
		"coding",
		"tech-lead",
		"--format",
		"antigravity",
		"--json",
	);
	assert.equal(invalidModel.status, 0, invalidModel.stderr);
	assert.match(invalidModel.stderr, /not a supported Antigravity model tier/);
	assert.deepEqual(JSON.parse(invalidModel.stdout), {
		step: "coding",
		role: "tech-lead",
		format: "antigravity",
		model: "inherit",
		source: "invalid model fallback (runtime default)",
	});
	const models = run(
		root,
		"agents",
		"models",
		"--format",
		"antigravity",
		"--json",
	);
	assert.deepEqual(JSON.parse(models.stdout), {
		format: "antigravity",
		models: ["inherit", "flash", "pro"],
	});
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
	const inheritedModels = {
		codex: "inherit",
		antigravity: "inherit",
		claude: "inherit",
	};
	assert.deepEqual(migrated.agentModels, {
		"project-manager": inheritedModels,
		"tech-lead": inheritedModels,
		"ui-ux-designer": inheritedModels,
		"backend-developer": inheritedModels,
		"frontend-developer": inheritedModels,
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
	assert.deepEqual(partial.agentModels["backend-developer"], inheritedModels);
	assert.equal(partial.workflowModels.planning["tech-lead"], "planning-model");
	assert.deepEqual(partial.workflowModels.coding, {});
	const textAfterMigration = fs.readFileSync(configPath, "utf8");
	const third = run(root, "update");
	assert.equal(third.status, 0, third.stderr);
	assert.doesNotMatch(third.stdout, /Added missing model defaults/);
	assert.equal(fs.readFileSync(configPath, "utf8"), textAfterMigration);
});

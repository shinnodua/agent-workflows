import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
	readCodexSnapshot,
	verifyCodexChildSnapshots,
} from "./codex-usage-snapshot.mjs";
import { taskSummaryCheckpointCommand } from "./task-summary-checkpoints.mjs";

const cli = fileURLToPath(new URL("./workflows.js", import.meta.url));

function run(root, ...args) {
	return spawnSync(process.execPath, [cli, ...args, "--root", root], {
		encoding: "utf8",
	});
}

test("workspace check accepts formatting differences without changing files", (context) => {
	// Resolve macOS temp aliases so Biome loads the fixture's actual config.
	const root = fs.realpathSync(
		fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-check-")),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const configPath = path.join(root, "workspace.config.json");
	const config = {
		artifactDirectories: ["prds", "plans", "designs", "research", "docs"],
	};
	for (const content of [
		JSON.stringify(config),
		JSON.stringify(config, null, 2),
	]) {
		fs.writeFileSync(configPath, content);
		const result = run(root, "check");
		assert.equal(result.status, 0, result.stdout + result.stderr);
		assert.equal(fs.readFileSync(configPath, "utf8"), content);
	}

	const biomeConfig = JSON.stringify({
		formatter: { enabled: true },
		overrides: [
			{ includes: ["workspace.config.json"], formatter: { enabled: true } },
		],
		linter: {
			rules: { preset: "recommended", suspicious: { noDebugger: "error" } },
		},
	});
	fs.writeFileSync(path.join(root, "biome.json"), biomeConfig);
	const sourcePath = path.join(root, "example.js");
	const source = 'export const value={name:"example"}';
	fs.writeFileSync(sourcePath, source);
	const result = run(root, "check");
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.equal(fs.readFileSync(sourcePath, "utf8"), source);
	assert.equal(
		fs.readFileSync(path.join(root, "biome.json"), "utf8"),
		biomeConfig,
	);

	// Consumer lint rules must still reject actual code problems.
	fs.writeFileSync(sourcePath, "debugger;\n");
	const invalidSource = run(root, "check");
	assert.equal(invalidSource.status, 1);
	assert.match(invalidSource.stdout + invalidSource.stderr, /noDebugger/);
	assert.equal(fs.readFileSync(sourcePath, "utf8"), "debugger;\n");

	fs.writeFileSync(sourcePath, "export const value = ;\n");
	const invalidSyntax = run(root, "check");
	assert.equal(invalidSyntax.status, 1);
	assert.match(invalidSyntax.stdout + invalidSyntax.stderr, /parse/);
	assert.equal(fs.readFileSync(sourcePath, "utf8"), "export const value = ;\n");
});

test("workspace check preserves syntax, settings, and integrity failures", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "agent-workflows-check-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const configPath = path.join(root, "workspace.config.json");
	for (const [content, diagnostic] of [
		["{broken", /could not be read as JSON/],
		['{"autoMode":{"enabled":"yes"}}', /invalid autoMode configuration/],
	]) {
		fs.writeFileSync(configPath, content);
		const result = run(root, "check");
		assert.equal(result.status, 1);
		assert.match(result.stderr, diagnostic);
		assert.equal(fs.readFileSync(configPath, "utf8"), content);
	}
	fs.writeFileSync(configPath, '{"artifactDirectories":["prds"]}');
	fs.mkdirSync(path.join(root, "prds"));
	const artifact =
		"# Fixture\n\n- PRD ID: `PRD-20261102-duplicate`\n- Status: `draft`\n";
	for (const name of ["first.md", "second.md"]) {
		fs.writeFileSync(path.join(root, "prds", name), artifact);
	}
	const invalidArtifacts = run(root, "check");
	assert.equal(invalidArtifacts.status, 1);
	assert.match(
		invalidArtifacts.stdout + invalidArtifacts.stderr,
		/Duplicate artifact ID/,
	);
});

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
		"code-review": {
			default: { antigravity: "flash" },
			security: { antigravity: "pro" },
		},
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
	assert.deepEqual(resolve("code-review", "security", "antigravity"), {
		step: "code-review",
		role: "security",
		format: "antigravity",
		model: "pro",
		source: "workflowModels.code-review.security",
	});
	assert.equal(
		resolve("code-review", "tech-lead", "antigravity").model,
		"flash",
	);
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
		security: inheritedModels,
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

test("add-project discovery installs and updates without replacing project data", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-add-project-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const initialized = run(root, "init");
	assert.equal(initialized.status, 0, initialized.stderr);
	for (const relative of [
		".agents/skills/add-project/SKILL.md",
		".agents/skills/add-project/references/save-protocol.md",
		".codex/prompts/add-project.md",
		".claude/skills/add-project/SKILL.md",
		"commands/add-project.md",
	]) {
		assert.equal(fs.existsSync(path.join(root, relative)), true, relative);
	}
	const profilePath = path.join(root, "project/repositories.json");
	const profile = { repositories: [], custom: "keep developer configuration" };
	fs.writeFileSync(profilePath, JSON.stringify(profile));
	const refreshed = run(root, "update");
	assert.equal(refreshed.status, 0, refreshed.stderr);
	assert.deepEqual(JSON.parse(fs.readFileSync(profilePath, "utf8")), profile);
	const skillShim = fs.readFileSync(
		path.join(root, ".agents/skills/add-project/SKILL.md"),
		"utf8",
	);
	assert.match(skillShim, /packaged/i);
	assert.match(skillShim, /add-project/);
	assert.equal(
		fs.existsSync(path.join(root, "scripts/add-project.mjs")),
		false,
	);
});

test("packaged add-project helper targets a consumer rather than the source template", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-add-consumer-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const sourceProfile = fileURLToPath(
		new URL("../project/repositories.json", import.meta.url),
	);
	const sourceBefore = fs.readFileSync(sourceProfile, "utf8");
	assert.equal(run(root, "init").status, 0);
	const initializedGit = spawnSync("git", ["init", root], { encoding: "utf8" });
	assert.equal(initializedGit.status, 0, initializedGit.stderr);
	const profilePath = path.join(root, "project/repositories.json");
	const profileBefore = fs.readFileSync(profilePath, "utf8");
	const request = path.join(root, "empty-request.json");
	fs.writeFileSync(request, JSON.stringify({ entries: [] }));
	const helper = fileURLToPath(
		new URL("../scripts/add-project.mjs", import.meta.url),
	);
	const result = spawnSync(
		process.execPath,
		[helper, "save", "--root", root, "--request", request],
		{
			cwd: root,
			encoding: "utf8",
		},
	);
	assert.equal(result.status, 0, result.stdout + result.stderr);
	assert.equal(JSON.parse(result.stdout).status, "empty");
	assert.equal(fs.readFileSync(profilePath, "utf8"), profileBefore);
	assert.equal(fs.readFileSync(sourceProfile, "utf8"), sourceBefore);
	assert.equal(fs.existsSync(path.join(root, ".gitmodules")), false);
});

test("security discovery, legacy migration, and model resolution stay integrated", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "agent-workflows-security-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const initialized = run(root, "init");
	assert.equal(initialized.status, 0, initialized.stdout + initialized.stderr);
	const configPath = path.join(root, "workspace.config.json");
	const readConfig = () => JSON.parse(fs.readFileSync(configPath, "utf8"));
	const inherited = {
		codex: "inherit",
		antigravity: "inherit",
		claude: "inherit",
	};
	assert.deepEqual(readConfig().agentModels.security, inherited);
	const discovery = [
		"roles/security.md",
		".agents/agents/security/agent.md",
		".claude/agents/security.md",
		".agents/skills/security-review/SKILL.md",
		".agents/skills/security-review/agents/openai.yaml",
		".codex/prompts/security-review.md",
		".claude/skills/security-review/SKILL.md",
		"commands/security-review.md",
	];
	for (const relative of discovery) {
		assert.ok(fs.existsSync(path.join(root, relative)), relative);
	}
	// Simulate a consuming workspace from before Security was introduced.
	const legacy = readConfig();
	delete legacy.agentModels.security;
	legacy.agentModels["tech-lead"] = { antigravity: "pro", claude: "sonnet" };
	legacy.workflowModels.planning = { "tech-lead": { antigravity: "flash" } };
	legacy.projectNote = "preserve";
	fs.writeFileSync(configPath, JSON.stringify(legacy));
	for (const relative of discovery) fs.rmSync(path.join(root, relative));
	const updated = run(root, "update");
	assert.equal(updated.status, 0, updated.stdout + updated.stderr);
	const migrated = readConfig();
	assert.deepEqual(migrated.agentModels.security, inherited);
	assert.deepEqual(
		migrated.agentModels["tech-lead"],
		legacy.agentModels["tech-lead"],
	);
	assert.deepEqual(
		migrated.workflowModels.planning,
		legacy.workflowModels.planning,
	);
	assert.equal(migrated.projectNote, "preserve");
	for (const relative of discovery)
		assert.ok(fs.existsSync(path.join(root, relative)), relative);

	migrated.agentModels.security = { antigravity: "pro", claude: "sonnet" };
	migrated.workflowModels.research = { default: { antigravity: "flash" } };
	migrated.workflowModels.planning.security = { antigravity: "inherit" };
	fs.writeFileSync(configPath, JSON.stringify(migrated));
	const resolve = (step) => {
		const result = run(
			root,
			"agents",
			"resolve",
			step,
			"security",
			"--format",
			"antigravity",
			"--json",
		);
		assert.equal(result.status, 0, result.stderr);
		return JSON.parse(result.stdout);
	};
	assert.equal(resolve("meeting").model, "pro");
	assert.equal(resolve("prd").model, "pro");
	assert.equal(resolve("validation").model, "pro");
	assert.equal(resolve("research").model, "flash");
	assert.equal(resolve("planning").model, "inherit");
	const synced = run(root, "agents", "sync", "--format", "antigravity");
	assert.equal(synced.status, 0, synced.stderr);
	assert.match(
		fs.readFileSync(
			path.join(root, ".agents/agents/security/agent.md"),
			"utf8",
		),
		/^model: pro$/m,
	);
	assert.match(
		fs.readFileSync(path.join(root, ".claude/agents/security.md"), "utf8"),
		/^model: sonnet$/m,
	);
	const refreshed = run(root, "update");
	assert.equal(refreshed.status, 0, refreshed.stderr);
	assert.deepEqual(
		readConfig().agentModels.security,
		migrated.agentModels.security,
	);
	assert.deepEqual(readConfig().workflowModels, migrated.workflowModels);
	const codex = run(
		root,
		"agents",
		"resolve",
		"meeting",
		"security",
		"--format",
		"codex",
		"--json",
	);
	assert.equal(codex.status, 0, codex.stderr);
	assert.equal(JSON.parse(codex.stdout).model, "inherit");
	assert.match(
		fs.readFileSync(
			path.join(root, ".agents/agents/security/agent.md"),
			"utf8",
		),
		/^model: inherit$/m,
	);
});

test("normalizes task summary usage for each runtime and reconciles revised records", () => {
	const envelope = {
		id: "attempt-1",
		step: "Implementation",
		asOf: "2026-11-27T00:01:00Z",
	};
	function call(args, input) {
		const result = spawnSync(process.execPath, [cli, "summary", ...args], {
			encoding: "utf8",
			input: JSON.stringify(input),
		});
		assert.equal(result.status, 0, result.stderr);
		return JSON.parse(result.stdout);
	}

	const codex = call(["usage", "codex"], {
		...envelope,
		report: {
			type: "turn.completed",
			usage: { input_tokens: 100, cached_input_tokens: 20, output_tokens: 10 },
			text: "Raw prompt omitted from output",
		},
	});
	assert.equal(codex.input, 100);
	assert.doesNotMatch(JSON.stringify(codex), /Raw prompt/);
	const snapshot = (inputTokens, outputTokens) => ({
		method: "thread/tokenUsage/updated",
		params: {
			threadId: "native-thread",
			tokenUsage: {
				total: {
					inputTokens,
					outputTokens,
					totalTokens: inputTokens + outputTokens,
				},
			},
		},
	});
	const threadDelta = call(["usage", "codex"], {
		...envelope,
		id: "thread-interval",
		step: null,
		before: snapshot(400, 20),
		report: snapshot(460, 24),
	});
	assert.equal(threadDelta.total, 64);
	assert.equal(
		call(["totals"], [threadDelta]).records[0].source,
		"Codex thread counters",
	);
	assert.doesNotMatch(JSON.stringify(threadDelta), /native-thread/);
	const claude = call(["usage", "claude"], {
		...envelope,
		report: {
			type: "result",
			usage: {
				input_tokens: 70,
				cache_read_input_tokens: 20,
				cache_creation_input_tokens: 10,
				output_tokens: 10,
			},
		},
	});
	assert.equal(claude.input, 100);

	const gemini = call(["usage", "gemini"], {
		...envelope,
		report: {
			stats: {
				models: {
					gemini: {
						tokens: {
							input: 80,
							prompt: 100,
							cached: 20,
							candidates: 7,
							thoughts: 3,
							tool: 0,
							total: 110,
						},
					},
				},
			},
		},
	});
	assert.equal(gemini.total, 110);

	const antigravity = call(["usage", "antigravity"], {
		...envelope,
		step: null,
		before: {
			conversation_id: "native-session",
			status: "SUCCESS",
			num_turns: 1,
			usage: { input_tokens: 200, output_tokens: 20, total_tokens: 220 },
		},
		report: {
			event: "result",
			result: {
				conversation_id: "native-session",
				status: "SUCCESS",
				num_turns: 2,
				usage: {
					input_tokens: 300,
					output_tokens: 30,
					thinking_tokens: 5,
					cache_read_tokens: 20,
					total_tokens: 330,
				},
			},
		},
	});
	assert.equal(antigravity.total, 110);

	const unrelated = spawnSync(
		process.execPath,
		[cli, "summary", "usage", "antigravity"],
		{
			encoding: "utf8",
			input: JSON.stringify({
				...envelope,
				before: { conversation_id: "first", status: "SUCCESS", num_turns: 1 },
				report: {
					conversation_id: "second",
					status: "SUCCESS",
					num_turns: 2,
					usage: { input_tokens: 10, output_tokens: 2, total_tokens: 12 },
				},
			}),
		},
	);
	assert.equal(unrelated.status, 1);
	assert.match(unrelated.stderr, /same session/);

	const revised = {
		...codex,
		asOf: "2026-11-27T00:02:00Z",
		input: 110,
		total: 120,
	};
	const result = call(
		["totals"],
		[codex, claude, antigravity, codex, gemini, revised],
	);
	assert.deepEqual(result.totals, { input: 410, output: 40, total: 450 });
	assert.equal(result.records.length, 4);
	assert.equal(
		result.steps.find(({ step }) => step === "Implementation").total,
		340,
	);
	assert.equal(result.asOf, "2026-11-27T00:02:00.000Z");
	assert.equal(call(["totals"], []).totals, null);
	const legacy = Object.fromEntries(
		Object.entries(antigravity).filter(([key]) => key !== "cacheRead"),
	);
	const enriched = call(["totals"], [legacy, antigravity, legacy]);
	assert.equal(enriched.records.length, 1);
	assert.equal(enriched.records[0].cacheRead, 20);
	assert.equal(enriched.totals.total, 110);
});

test("checkpoints persist consecutive steps, replay exactly, and preserve unknown measurements", (context) => {
	const root = fs.mkdtempSync(
		path.join(os.tmpdir(), "task-summary-checkpoint-"),
	);
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const directory = path.join(root, "task-summary");
	fs.mkdirSync(directory);
	const feature = "prd-20261127-checkpoint-fixture";
	const target = path.join(directory, `${feature}.md`);
	const template = fs.readFileSync(
		new URL("../templates/task-summary-template.md", import.meta.url),
		"utf8",
	);
	function sample(second, input, output) {
		return {
			threadAlias: "a".repeat(64),
			asOf: `2026-11-27T00:00:${second}.000Z`,
			total: {
				inputTokens: input,
				outputTokens: output,
				totalTokens: input + output,
			},
		};
	}

	const observations = [
		sample("01", 20, 5),
		sample("02", 60, 10),
		sample("03", 100, 20),
		null,
		sample("05", 110, 30),
	];
	const runCheckpoint = (...args) =>
		taskSummaryCheckpointCommand(
			root,
			["checkpoint", args[0], feature, ...args.slice(1)],
			() => observations.shift(),
		);

	assert.deepEqual(runCheckpoint("start", "Research", "attempt-1"), {
		status: "started",
		available: true,
	});
	assert.throws(
		() => runCheckpoint("start", "Design", "attempt-2"),
		/Finish the active step/,
	);
	// Sealed next can be retried after creating the summary without reading a later cutoff.
	assert.throws(
		() => runCheckpoint("next", "Research", "attempt-1", "Design", "attempt-2"),
		{ code: "ENOENT" },
	);
	fs.writeFileSync(target, template, { mode: 0o644 });
	const research = runCheckpoint(
		"next",
		"Research",
		"attempt-1",
		"Design",
		"attempt-2",
	);
	const design = runCheckpoint("finish", "Design", "attempt-2");
	assert.deepEqual(runCheckpoint("finish", "Design", "attempt-2"), design);
	assert.equal(research.receipt.total, 45);
	assert.equal(design.receipt.total, 50);
	assert.equal(research.receipt.asOf, "2026-11-27T00:00:02.000Z");

	runCheckpoint("start", "Validation", "attempt-3");
	assert.equal(
		runCheckpoint("finish", "Validation", "attempt-3").status,
		"unavailable",
	);
	const contents = fs.readFileSync(target, "utf8");
	assert.match(contents, /80 input, 15 output, 95 total/);
	assert.match(contents, /\| Validation \| Unavailable \|/);
	assert.equal(contents.match(/\| Design \|/g).length, 1);
	assert.match(contents, /## Final handoff/);
	assert.equal(fs.statSync(target).mode & 0o777, 0o644);

	const native = spawnSync(
		process.execPath,
		[cli, "summary", "record", feature, "claude", "complete", "--root", root],
		{
			encoding: "utf8",
			input: JSON.stringify({
				id: "later-receipt",
				step: "Validation",
				asOf: "2026-11-27T00:00:06Z",
				report: {
					type: "result",
					usage: { input_tokens: 10, output_tokens: 2 },
				},
			}),
		},
	);
	assert.equal(native.status, 0, native.stderr);
	assert.match(
		fs.readFileSync(target, "utf8"),
		/\| Validation \|[^\n]*\| Partial\. .*Earlier coverage gaps remain/,
	);
	taskSummaryCheckpointCommand(root, [
		"reconcile",
		feature,
		"Validation",
		"complete",
	]);
	assert.match(
		fs.readFileSync(target, "utf8"),
		/\| Validation \|[^\n]*\| Complete\./,
	);
});

test("Codex snapshots bind matching rollout metadata and omit raw identities", (context) => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "task-summary-rollout-"));
	context.after(() => fs.rmSync(root, { recursive: true, force: true }));
	const dated = path.join(root, "2026/11/27");
	fs.mkdirSync(dated, { recursive: true });
	const parent = "00000000-0000-0000-0000-000000000001";
	const child = "00000000-0000-0000-0000-000000000002";
	const file = path.join(dated, `rollout-2026-11-27T00-00-00-${child}.jsonl`);
	const events = [
		{
			type: "session_meta",
			payload: {
				id: child,
				source: { subagent: { thread_spawn: { parent_thread_id: parent } } },
			},
		},
		{ type: "event_msg", payload: { type: "task_started" } },
		{
			type: "event_msg",
			timestamp: "2026-11-27T00:00:01Z",
			payload: {
				type: "token_count",
				info: {
					total_token_usage: {
						input_tokens: 100,
						output_tokens: 5,
						total_tokens: 105,
					},
				},
			},
		},
	];
	fs.writeFileSync(
		file,
		`${events.map((event) => JSON.stringify(event)).join("\n")}\n`,
	);
	const snapshot = readCodexSnapshot(root, child);
	assert.deepEqual(snapshot.total, {
		inputTokens: 100,
		outputTokens: 5,
		totalTokens: 105,
	});
	assert.notEqual(snapshot.threadAlias, snapshot.parentAlias);
	assert.doesNotMatch(
		JSON.stringify(snapshot),
		new RegExp(`${parent}|${child}`),
	);
	assert.equal(readCodexSnapshot(root, parent), null);
	const second = structuredClone(events[2]);
	second.timestamp = "2026-11-27T00:00:02Z";
	second.payload.info.total_token_usage = {
		input_tokens: 120,
		output_tokens: 10,
		total_tokens: 130,
	};
	fs.appendFileSync(file, `${JSON.stringify(second)}\n`);
	const later = readCodexSnapshot(root, child);
	assert.equal(
		verifyCodexChildSnapshots(snapshot.parentAlias, snapshot, later, root),
		true,
	);
	assert.equal(
		verifyCodexChildSnapshots("0".repeat(64), snapshot, later, root),
		false,
	);
	assert.equal(
		verifyCodexChildSnapshots(
			snapshot.parentAlias,
			snapshot,
			{
				...later,
				total: { inputTokens: 300, outputTokens: 100, totalTokens: 400 },
			},
			root,
		),
		false,
	);

	const duplicate = path.join(
		dated,
		`rollout-2026-11-27T01-00-00-${child}.jsonl`,
	);
	fs.copyFileSync(file, duplicate);
	assert.equal(readCodexSnapshot(root, child), null);
});

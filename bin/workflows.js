#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const manifestDirectory = ".agent-workflows";
const manifestPath = path.join(manifestDirectory, "manifest.json");
const metadataPath = path.join(manifestDirectory, "metadata.json");
const packageJson = readJson(path.join(packageRoot, "package.json"));
const packageLocalPath = path.join(
	"node_modules",
	...packageJson.name.split("/"),
);
const roleNames = [
	"project-manager",
	"tech-lead",
	"ui-ux-designer",
	"backend-developer",
	"frontend-developer",
];
const workflowSteps = [
	"research",
	"prd",
	"design",
	"meeting",
	"planning",
	"coding",
	"validation",
];

const managedPaths = [
	"AGENTS.md",
	"CLAUDE.md",
	"workflows.md",
	".codex/prompts",
	".claude/skills",
	".claude/agents",
	".agents/agents",
	".agents/skills",
	"commands",
	"docs/workspace-template-setup.md",
	"roles",
	"templates",
];

const scaffoldOnlyPaths = [
	"workspace.config.json",
	".gitmodules.example",
	"project/PROJECT.md",
	"project/repositories.json",
	"project/validation.json",
	"project/workflows.json",
	"prds/.gitkeep",
	"plans/.gitkeep",
	"designs/.gitkeep",
	"research/.gitkeep",
	"meeting-logs/.gitkeep",
	"docs/.gitkeep",
	"modules/.gitkeep",
];

const [, , command = "help", ...args] = process.argv;

try {
	if (command === "init") {
		initWorkspace(resolveRoot(args));
	} else if (command === "update") {
		updateWorkspace(resolveRoot(args));
	} else if (command === "dashboard") {
		startDashboard(resolveRoot(args), args);
	} else if (command === "integrity") {
		runPackagedScript("scripts/workspace-integrity.ts", resolveRoot(args));
	} else if (command === "check") {
		runCheck(resolveRoot(args));
	} else if (command === "auto") {
		autoMode(resolveRoot(args), passthroughArgs(args));
	} else if (command === "agents") {
		const agentArgs = passthroughArgs(args);
		if (agentArgs.length === 1 && agentArgs[0] === "sync") {
			syncAgentModels(resolveRoot(args));
		} else if (agentArgs[0] === "sync") {
			syncAgentModelsCommand(resolveRoot(args), agentArgs.slice(1));
		} else if (agentArgs[0] === "models") {
			listAgentModels(agentArgs.slice(1));
		} else if (agentArgs[0] === "resolve") {
			resolveAgentModelCommand(resolveRoot(args), agentArgs.slice(1));
		} else {
			throw new Error(
				"Usage: workflows agents sync [--format <codex|antigravity>] | models --format <runtime> | resolve <step> <role> --format <runtime> [--json] [--root <path>].",
			);
		}
	} else {
		printHelp();
	}
} catch (error) {
	console.error(
		`workflows: ${error instanceof Error ? error.message : String(error)}`,
	);
	process.exitCode = 1;
}

function initWorkspace(root) {
	ensureDirectory(root);
	const configExisted = fs.existsSync(path.join(root, "workspace.config.json"));
	const scaffolded = copyPaths(
		root,
		scaffoldOnlyPaths.filter(
			(relativePath) => relativePath !== "workspace.config.json",
		),
		{ overwrite: false },
	);
	const prepared = prepareWorkspaceConfig(root);
	const { models } = readModelConfiguration(root, prepared.config);
	validateAutoModeConfig(prepared.config.autoMode);
	if (prepared.changed) writeWorkspaceConfig(root, prepared.config);
	if (!configExisted) scaffolded.push("workspace.config.json");
	cleanupLegacyAutoMode(root);
	const managed = copyPaths(root, managedPaths, { overwrite: false });
	syncAgentModels(root, models);
	mergePackageScripts(root);
	writeManifest(root);

	console.log(`Initialized Agent Workflows in ${root}`);
	console.log(
		`Wrote ${managed.length} managed workflow files and scaffolded ${scaffolded.length} project files.`,
	);
	console.log(
		"Next: use /project-setup or $project-setup to configure this project's workflow profile.",
	);
	console.log(
		"Restart or reload any active agent session so it can discover the local custom agent, command, and skill shims.",
	);
}

function updateWorkspace(root) {
	const manifest = loadManifest(root);
	const prepared = prepareWorkspaceConfig(root);
	const { models } = readModelConfiguration(root, prepared.config);
	validateAutoModeConfig(prepared.config.autoMode);
	const paths = [
		...new Set([...(manifest?.managedPaths ?? []), ...managedPaths]),
	].filter((relativePath) => relativePath !== "workspace.config.json");
	if (prepared.changed) writeWorkspaceConfig(root, prepared.config);
	cleanupLegacyAutoMode(root);
	const managed = copyPaths(root, paths, { overwrite: true });
	syncAgentModels(root, models);
	writeManifest(root);

	console.log(`Updated ${managed.length} managed workflow files in ${root}`);
	if (prepared.changed) {
		console.log("Added missing model defaults to workspace.config.json.");
	}
	console.log(
		"Project profile files and existing artifacts were left unchanged.",
	);
	console.log(
		"Restart or reload any active agent session so it can discover refreshed custom agent, command, and skill shims.",
	);
}

function readWorkspaceConfig(root) {
	const configPath = path.join(root, "workspace.config.json");
	try {
		return readJson(configPath);
	} catch (error) {
		throw new Error(
			`workspace.config.json could not be read as JSON: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

function prepareWorkspaceConfig(root) {
	const configPath = path.join(root, "workspace.config.json");
	const defaults = readJson(path.join(packageRoot, "workspace.config.json"));
	if (!fs.existsSync(configPath)) {
		const config = structuredClone(defaults);
		config.autoMode = readLegacyAutoMode(root) ?? { enabled: false };
		return { config, changed: true };
	}
	const config = readWorkspaceConfig(root);
	if (!config || typeof config !== "object" || Array.isArray(config)) {
		throw new Error("workspace.config.json must contain a JSON object.");
	}
	let changed = false;
	if (!Object.hasOwn(config, "autoMode")) {
		const legacy = readLegacyAutoMode(root);
		config.autoMode = legacy ?? { enabled: false };
		changed = true;
	}
	validateAutoModeConfig(config.autoMode);
	if (!Object.hasOwn(config, "agentModels")) {
		config.agentModels = { ...defaults.agentModels };
		changed = true;
	} else if (
		config.agentModels &&
		typeof config.agentModels === "object" &&
		!Array.isArray(config.agentModels)
	) {
		for (const [role, model] of Object.entries(defaults.agentModels)) {
			if (!Object.hasOwn(config.agentModels, role)) {
				config.agentModels[role] = model;
				changed = true;
			}
		}
	}
	if (!Object.hasOwn(config, "workflowModels")) {
		config.workflowModels = structuredClone(defaults.workflowModels);
		changed = true;
	} else if (
		config.workflowModels &&
		typeof config.workflowModels === "object" &&
		!Array.isArray(config.workflowModels)
	) {
		for (const [step, selections] of Object.entries(defaults.workflowModels)) {
			if (!Object.hasOwn(config.workflowModels, step)) {
				config.workflowModels[step] = structuredClone(selections);
				changed = true;
			}
		}
	}
	return { config, changed };
}

function readLegacyAutoMode(root) {
	const target = path.join(root, metadataPath);
	if (!fs.existsSync(target)) return undefined;
	let metadata;
	try {
		metadata = readJson(target);
	} catch (error) {
		throw new Error(
			`${metadataPath} could not be read during migration: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
		throw new Error(
			`${metadataPath} must contain a JSON object during migration.`,
		);
	}
	if (!Object.hasOwn(metadata, "autoMode")) return undefined;
	validateAutoModeConfig(metadata.autoMode, metadataPath);
	return structuredClone(metadata.autoMode);
}

function validateAutoModeConfig(autoMode, source = "workspace.config.json") {
	if (
		!autoMode ||
		typeof autoMode !== "object" ||
		Array.isArray(autoMode) ||
		typeof autoMode.enabled !== "boolean" ||
		(autoMode.updatedAt !== undefined && typeof autoMode.updatedAt !== "string")
	) {
		throw new Error(`${source} has invalid autoMode configuration.`);
	}
}

function cleanupLegacyAutoMode(root) {
	const target = path.join(root, metadataPath);
	if (!fs.existsSync(target)) return;
	let metadata;
	try {
		metadata = readJson(target);
	} catch {
		return;
	}
	if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
		return;
	if (!Object.hasOwn(metadata, "autoMode")) return;
	delete metadata.autoMode;
	if (Object.keys(metadata).length === 0) {
		fs.unlinkSync(target);
		return;
	}
	const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
	try {
		fs.writeFileSync(temporary, `${JSON.stringify(metadata, null, "\t")}\n`, {
			flag: "wx",
		});
		fs.renameSync(temporary, target);
	} finally {
		if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
	}
}

function writeWorkspaceConfig(root, config) {
	const target = path.join(root, "workspace.config.json");
	const temporary = `${target}.${process.pid}.${Date.now()}.tmp`;
	try {
		fs.writeFileSync(temporary, `${JSON.stringify(config, null, "\t")}\n`, {
			flag: "wx",
		});
		fs.renameSync(temporary, target);
	} finally {
		if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
	}
}

function readModelConfiguration(root, config = readWorkspaceConfig(root)) {
	if (!config || typeof config !== "object" || Array.isArray(config)) {
		throw new Error("workspace.config.json must contain a JSON object.");
	}
	const configured = Object.hasOwn(config, "agentModels")
		? config.agentModels
		: {};
	if (
		!configured ||
		typeof configured !== "object" ||
		Array.isArray(configured)
	) {
		throw new Error("workspace.config.json agentModels must be an object.");
	}
	for (const role of Object.keys(configured)) {
		if (!roleNames.includes(role)) {
			throw new Error(
				`workspace.config.json agentModels has unknown role ${JSON.stringify(role)}; expected ${roleNames.join(", ")}.`,
			);
		}
	}
	const models = {};
	for (const role of roleNames) {
		const selection = Object.hasOwn(configured, role)
			? configured[role]
			: "inherit";
		models[role] = parseModelSelection(selection, `agentModels.${role}`);
	}
	const configuredWorkflow = Object.hasOwn(config, "workflowModels")
		? config.workflowModels
		: {};
	if (
		!configuredWorkflow ||
		typeof configuredWorkflow !== "object" ||
		Array.isArray(configuredWorkflow)
	) {
		throw new Error("workspace.config.json workflowModels must be an object.");
	}
	const workflowModels = {};
	for (const [step, selections] of Object.entries(configuredWorkflow)) {
		if (!workflowSteps.includes(step)) {
			throw new Error(
				`workspace.config.json workflowModels has unknown step ${JSON.stringify(step)}; expected ${workflowSteps.join(", ")}.`,
			);
		}
		if (
			!selections ||
			typeof selections !== "object" ||
			Array.isArray(selections)
		) {
			throw new Error(
				`workspace.config.json workflowModels.${step} must be an object of role selections.`,
			);
		}
		workflowModels[step] = {};
		for (const [role, selection] of Object.entries(selections)) {
			if (role !== "default" && !roleNames.includes(role)) {
				throw new Error(
					`workspace.config.json workflowModels.${step} has unknown role ${JSON.stringify(role)}; expected default or ${roleNames.join(", ")}.`,
				);
			}
			workflowModels[step][role] = parseModelSelection(
				selection,
				`workflowModels.${step}.${role}`,
			);
		}
	}
	return { models, workflowModels };
}

function parseModelSelection(selection, key) {
	if (typeof selection === "string") {
		const model = validateModel(selection, key);
		return { codex: model, antigravity: model, claude: model };
	}
	if (!selection || typeof selection !== "object" || Array.isArray(selection)) {
		throw new Error(
			`workspace.config.json ${key} has invalid model ${JSON.stringify(selection)}; use a model ID or runtime-keyed model values.`,
		);
	}
	const keys = Object.keys(selection);
	const legacyShape =
		keys.length === 2 && keys.includes("agents") && keys.includes("claude");
	if (
		!keys.length ||
		keys.some(
			(runtime) =>
				!["codex", "agents", "antigravity", "claude"].includes(runtime),
		) ||
		(keys.includes("agents") && !legacyShape)
	) {
		throw new Error(
			`workspace.config.json ${key} must use codex, antigravity, and/or claude model keys. Legacy objects must contain both agents and claude keys.`,
		);
	}
	if (keys.includes("agents") && keys.includes("codex")) {
		throw new Error(
			`workspace.config.json ${key} cannot contain both agents and codex.`,
		);
	}
	const normalized = {
		codex: "inherit",
		antigravity: "inherit",
		claude: "inherit",
		...selection,
	};
	if (Object.hasOwn(selection, "agents")) normalized.codex = selection.agents;
	return {
		codex: validateModel(normalized.codex, `${key}.codex`),
		antigravity: validateModel(normalized.antigravity, `${key}.antigravity`),
		claude: validateModel(normalized.claude, `${key}.claude`),
	};
}

function validateModel(model, key) {
	if (
		typeof model !== "string" ||
		!/^[A-Za-z0-9][A-Za-z0-9._/@-]*$/.test(model)
	) {
		throw new Error(
			`workspace.config.json ${key} has invalid model ${JSON.stringify(model)}; use a nonempty single-line model ID or inherit.`,
		);
	}
	return model;
}

function syncAgentModelsCommand(root, args) {
	let format = "codex";
	for (let index = 0; index < args.length; index += 1) {
		if (args[index] === "--format") {
			format = normalizeAgentRuntime(args[++index]);
		} else {
			throw new Error(
				`Unknown agents sync option ${JSON.stringify(args[index])}.`,
			);
		}
	}
	syncAgentModels(root, readModelConfiguration(root).models, format);
}

function syncAgentModels(
	root,
	models = readModelConfiguration(root).models,
	format = "codex",
) {
	if (!["codex", "antigravity"].includes(format)) {
		throw new Error("agents sync --format must be codex or antigravity.");
	}
	const changes = [];
	const effectiveModels = Object.fromEntries(
		roleNames.map((role) => [
			role,
			{
				agents: validateRuntimeModel(
					format,
					models[role][format],
					`base role ${role}`,
				),
				claude: validateRuntimeModel(
					"claude",
					models[role].claude,
					`base role ${role}`,
				),
			},
		]),
	);
	for (const role of roleNames) {
		for (const [format, relativePath] of [
			["agents", `.agents/agents/${role}/agent.md`],
			["claude", `.claude/agents/${role}.md`],
		]) {
			const target = path.join(root, relativePath);
			const source = fs.readFileSync(target, "utf8");
			const frontmatterEnd = source.startsWith("---\n")
				? source.indexOf("\n---\n", 4)
				: -1;
			const frontmatter = source.slice(0, frontmatterEnd + 1);
			const modelLines = frontmatter.match(/^model:.*$/gm);
			if (frontmatterEnd < 0 || modelLines?.length !== 1) {
				throw new Error(
					`${relativePath} must have exactly one model frontmatter line.`,
				);
			}
			const effective =
				format === "claude"
					? effectiveModels[role].claude
					: effectiveModels[role].agents;
			const updated =
				frontmatter.replace(/^model:.*$/m, `model: ${effective}`) +
				source.slice(frontmatterEnd + 1);
			changes.push({
				target,
				relativePath,
				updated,
				changed: updated !== source,
			});
		}
	}
	for (const change of changes) {
		if (change.changed) fs.writeFileSync(change.target, change.updated);
	}
	for (const role of roleNames) {
		const configured = models[role];
		const effectiveAgent = effectiveModels[role].agents;
		const roleChanges = changes.filter(
			(change) =>
				change.relativePath.includes(`/${role}/`) ||
				change.relativePath.endsWith(`/${role}.md`),
		);
		console.log(
			`${role}: ${format === "codex" ? "agents" : format}=${effectiveAgent}${effectiveAgent !== configured[format] ? ` (configured ${configured[format]})` : ""}, claude=${effectiveModels[role].claude}${effectiveModels[role].claude !== configured.claude ? ` (configured ${configured.claude})` : ""} (${roleChanges.some((change) => change.changed) ? "updated" : "already up to date"} in both agent formats)`,
		);
	}
	console.log(
		"Base role files are synchronized. Workflow-step overrides apply when a coordinator spawns a new agent; reload the runtime for changed base models.",
	);
}

function resolveAgentModelCommand(root, args) {
	const [step, role, ...options] = args;
	let format;
	let json = false;
	for (let index = 0; index < options.length; index += 1) {
		if (options[index] === "--format") {
			format = options[++index];
		} else if (options[index] === "--json") {
			json = true;
		} else {
			throw new Error(
				`Unknown agents resolve option ${JSON.stringify(options[index])}.`,
			);
		}
	}
	if (!workflowSteps.includes(step)) {
		throw new Error(
			`Unknown workflow step ${JSON.stringify(step)}; expected ${workflowSteps.join(", ")}.`,
		);
	}
	if (!roleNames.includes(role)) {
		throw new Error(
			`Unknown agent role ${JSON.stringify(role)}; expected ${roleNames.join(", ")}.`,
		);
	}
	if (!isAgentRuntime(format)) {
		throw new Error(
			"--format must be codex, antigravity, or claude (agents is a legacy alias for codex).",
		);
	}
	const requestedFormat = format;
	format = normalizeAgentRuntime(format);
	const configuration = readModelConfiguration(root);
	const resolution = resolveAgentModel(configuration, step, role, format);
	const selectedModel = resolution.model;
	resolution.model = validateRuntimeModel(
		format,
		resolution.model,
		`${step} step for ${role}`,
	);
	if (resolution.model !== selectedModel) {
		resolution.source = "invalid model fallback (runtime default)";
	}
	resolution.format = requestedFormat;
	console.log(
		json
			? JSON.stringify(resolution)
			: `${resolution.model}${resolution.model === "inherit" ? " (runtime default)" : ""} (source: ${resolution.source}; runtime: ${format})`,
	);
}

function readCodexModelCatalog() {
	const result = spawnSync("codex", ["debug", "models"], {
		encoding: "utf8",
		stdio: ["ignore", "pipe", "ignore"],
	});
	if (result.error || result.status !== 0) return null;
	try {
		const catalog = JSON.parse(result.stdout);
		const models = catalog.models
			?.filter(
				(model) => model.visibility === "list" || model.visibility === "allon",
			)
			.map((model) => model.slug);
		return Array.isArray(models) ? new Set(models) : null;
	} catch {
		return null;
	}
}

function listAgentModels(args) {
	let format;
	let json = false;
	for (let index = 0; index < args.length; index += 1) {
		if (args[index] === "--format") format = args[++index];
		else if (args[index] === "--json") json = true;
		else
			throw new Error(
				`Unknown agents models option ${JSON.stringify(args[index])}.`,
			);
	}
	if (!isAgentRuntime(format)) {
		throw new Error(
			"Usage: workflows agents models --format <codex|antigravity|claude> [--json].",
		);
	}
	format = normalizeAgentRuntime(format);
	if (format === "antigravity") {
		const models = ["inherit", "flash", "pro"];
		console.log(json ? JSON.stringify({ format, models }) : models.join("\n"));
		return;
	}
	if (format === "claude") {
		const note =
			"Claude Code has no local model catalog; use its documented aliases such as sonnet or opus, or a full model ID.";
		console.log(
			json ? JSON.stringify({ format, catalogAvailable: false, note }) : note,
		);
		return;
	}
	const catalog = readCodexModelCatalog();
	if (!catalog)
		throw new Error("Could not read the installed Codex model catalog.");
	const models = [...catalog].sort();
	console.log(json ? JSON.stringify({ format, models }) : models.join("\n"));
}

function validateRuntimeModel(runtime, model, context) {
	if (model === "inherit") return model;
	if (runtime === "antigravity") {
		if (["flash", "pro"].includes(model)) return model;
		console.error(
			`Warning: model ${JSON.stringify(model)} is not a supported Antigravity model tier for ${context}. Supported values are inherit, flash, and pro. Falling back to inherit (runtime default).`,
		);
		return "inherit";
	}
	if (runtime === "claude") {
		console.error(
			`Warning: cannot verify model ${JSON.stringify(model)} for ${context} because Claude Code does not expose a local model catalog; passing it through.`,
		);
		return model;
	}
	const catalog = readCodexModelCatalog();
	if (!catalog) {
		console.error(
			`Warning: cannot verify Codex model ${JSON.stringify(model)} for ${context}; passing it through.`,
		);
		return model;
	}
	if (catalog.has(model)) return model;
	const suggestion = [...catalog]
		.map((candidate) => ({
			candidate,
			distance: editDistance(model, candidate),
		}))
		.sort((a, b) => a.distance - b.distance)[0];
	const hint =
		suggestion &&
		suggestion.distance <= Math.max(2, Math.floor(model.length / 3))
			? ` Did you mean ${JSON.stringify(suggestion.candidate)}?`
			: "";
	console.error(
		`Warning: model ${JSON.stringify(model)} is not in the installed Codex model catalog for ${context}.${hint} Falling back to inherit (runtime default).`,
	);
	return "inherit";
}

function isAgentRuntime(value) {
	return ["codex", "agents", "antigravity", "claude"].includes(value);
}

function normalizeAgentRuntime(value) {
	if (!isAgentRuntime(value)) {
		throw new Error(
			"Expected codex, antigravity, or claude (agents is a legacy alias for codex).",
		);
	}
	return value === "agents" ? "codex" : value;
}

function editDistance(left, right) {
	const row = Array.from({ length: right.length + 1 }, (_, index) => index);
	for (let i = 1; i <= left.length; i += 1) {
		let diagonal = row[0];
		row[0] = i;
		for (let j = 1; j <= right.length; j += 1) {
			const previous = row[j];
			row[j] = Math.min(
				row[j] + 1,
				row[j - 1] + 1,
				diagonal + (left[i - 1] === right[j - 1] ? 0 : 1),
			);
			diagonal = previous;
		}
	}
	return row[right.length];
}

function resolveAgentModel(configuration, step, role, format) {
	const requestedFormat = format;
	format = normalizeAgentRuntime(format);
	const stepModels = configuration.workflowModels[step] ?? {};
	for (const [source, selection] of [
		[`workflowModels.${step}.${role}`, stepModels[role]],
		[`workflowModels.${step}.default`, stepModels.default],
		[`agentModels.${role}`, configuration.models[role]],
	]) {
		if (selection) {
			return {
				step,
				role,
				format: requestedFormat,
				model: selection[format],
				source,
			};
		}
	}
	return {
		step,
		role,
		format: requestedFormat,
		model: "inherit",
		source: "runtime default",
	};
}

function startDashboard(root, args) {
	const dashboardArgs = passthroughArgs(args);
	const result = spawnSync(
		"bun",
		[
			"run",
			"--cwd",
			path.join(packageRoot, "dashboard"),
			"dev",
			...dashboardArgs,
		],
		{
			env: {
				...process.env,
				WORKFLOWS_WORKSPACE_ROOT: root,
			},
			stdio: "inherit",
		},
	);

	process.exit(result.status ?? 1);
}

function runCheck(root) {
	const commands = [
		[resolvePackageBin("@biomejs/biome"), ["check", root]],
		["bun", [path.join(packageRoot, "scripts/workspace-integrity.ts")]],
	];

	for (const [binary, commandArgs] of commands) {
		const result = spawnSync(binary, commandArgs, {
			cwd: root,
			env: {
				...process.env,
				WORKFLOWS_WORKSPACE_ROOT: root,
			},
			stdio: "inherit",
		});
		if (result.status !== 0) {
			process.exit(result.status ?? 1);
		}
	}
}

function runPackagedScript(scriptPath, root) {
	const result = spawnSync("bun", [path.join(packageRoot, scriptPath)], {
		cwd: root,
		env: {
			...process.env,
			WORKFLOWS_WORKSPACE_ROOT: root,
		},
		stdio: "inherit",
	});

	process.exit(result.status ?? 1);
}

function autoMode(root, args) {
	const [action = "status", ...extra] = args;
	if (extra.length > 0 || !["on", "off", "toggle", "status"].includes(action)) {
		throw new Error(
			"Usage: workflows auto on|off|toggle|status [--root <path>].",
		);
	}

	const prepared = prepareWorkspaceConfig(root);
	const config = prepared.config;
	validateAutoModeConfig(config.autoMode);
	const target = path.join(root, "workspace.config.json");

	if (action !== "status") {
		const enabled =
			action === "toggle" ? !config.autoMode.enabled : action === "on";
		config.autoMode = {
			...config.autoMode,
			enabled,
			updatedAt: new Date().toISOString(),
		};
		writeWorkspaceConfig(root, config);
	} else if (prepared.changed) {
		writeWorkspaceConfig(root, config);
	}
	cleanupLegacyAutoMode(root);

	const enabled =
		action === "status" ? config.autoMode.enabled : config.autoMode.enabled;
	console.log(`Auto mode: ${enabled ? "on" : "off"} (${target})`);
}

function copyPaths(root, relativePaths, options) {
	const written = [];

	for (const relativePath of relativePaths) {
		const source = path.join(packageRoot, relativePath);
		if (!fs.existsSync(source)) {
			continue;
		}

		if (fs.statSync(source).isDirectory()) {
			for (const filePath of walkFiles(source)) {
				const nestedRelativePath = path.relative(packageRoot, filePath);
				if (writeManagedFile(root, nestedRelativePath, options)) {
					written.push(nestedRelativePath);
				}
			}
			continue;
		}

		if (writeManagedFile(root, relativePath, options)) {
			written.push(relativePath);
		}
	}

	return written;
}

function writeManagedFile(root, relativePath, options) {
	const source = path.join(packageRoot, relativePath);
	const target = path.join(root, relativePath);

	if (!options.overwrite && fs.existsSync(target)) {
		return false;
	}

	fs.mkdirSync(path.dirname(target), { recursive: true });
	if (shouldWriteReferenceShim(relativePath)) {
		fs.writeFileSync(target, buildReferenceShim(root, relativePath));
	} else {
		fs.copyFileSync(source, target);
	}
	return true;
}

function shouldWriteReferenceShim(relativePath) {
	const normalized = toPosixPath(relativePath);
	if (normalized === "AGENTS.md" || normalized === "workflows.md") return true;
	if (normalized === "docs/workspace-template-setup.md") return true;
	if (normalized.startsWith("commands/") && normalized.endsWith(".md")) {
		return true;
	}
	if (normalized.startsWith(".codex/prompts/") && normalized.endsWith(".md")) {
		return true;
	}
	if (normalized.startsWith(".agents/agents/") && normalized.endsWith(".md")) {
		return true;
	}
	if (
		normalized.startsWith(".agents/skills/") &&
		normalized.endsWith("SKILL.md")
	) {
		return true;
	}
	if (
		(normalized.startsWith("roles/") || normalized.startsWith("templates/")) &&
		normalized.endsWith(".md")
	) {
		return true;
	}
	return false;
}

function buildReferenceShim(root, relativePath) {
	const normalized = toPosixPath(relativePath);
	const packageSourceRoot = packageSourceRootReference(root);
	const packagePath = toPosixPath(path.join(packageSourceRoot, normalized));
	const source = fs.readFileSync(path.join(packageRoot, normalized), "utf8");

	if (
		normalized.startsWith(".agents/skills/") &&
		normalized.endsWith("SKILL.md")
	) {
		return buildSkillShim(normalized, packagePath, packageSourceRoot, source);
	}

	if (normalized.startsWith(".codex/prompts/")) {
		return buildPromptShim(normalized, packagePath, packageSourceRoot);
	}

	if (normalized.startsWith(".agents/agents/")) {
		return buildAgentShim(normalized, packagePath, packageSourceRoot, source);
	}

	return buildMarkdownShim(normalized, packagePath, packageSourceRoot);
}

function buildSkillShim(relativePath, packagePath, packageSourceRoot, source) {
	const frontmatter = extractFrontmatter(source);
	const title = path.basename(path.dirname(relativePath));
	return `${frontmatter ?? ""}# ${title}

This local file is an Agent Workflows discovery shim.

Packaged source of truth:

\`${packagePath}\`

Read the packaged source completely and follow it as this skill's instructions.
When the packaged source references reusable files such as \`AGENTS.md\`,
\`workflows.md\`, \`roles/...\`, \`templates/...\`, \`commands/...\`,
\`.codex/prompts/...\`, \`.agents/agents/...\`, or \`.agents/skills/...\`,
resolve those paths under
\`${packageSourceRoot}\` unless the instruction explicitly says to use the
consuming project's \`project/\`, \`prds/\`, \`plans/\`, \`designs/\`,
\`research/\`, \`meeting-logs/\`, \`docs/\`, or \`modules/\` paths.
`;
}

function buildPromptShim(relativePath, packagePath, packageSourceRoot) {
	const commandName = path.basename(relativePath, ".md");
	return `Use the packaged Agent Workflows slash prompt for \`${commandName}\`.

Packaged source of truth:

\`${packagePath}\`

Read the packaged prompt and any skill it delegates to from
\`${packageSourceRoot}\`, then run it with this request:

$ARGUMENTS
`;
}

function buildAgentShim(relativePath, packagePath, packageSourceRoot, source) {
	const frontmatter = extractFrontmatter(source);
	const title = path.basename(path.dirname(relativePath));
	return `${frontmatter ?? ""}# ${title}

This local file is an Agent Workflows custom-agent discovery shim.

Packaged source of truth:

\`${packagePath}\`

Read the packaged custom-agent definition completely and follow it as this
agent's instructions. When the packaged source references reusable files such as
\`AGENTS.md\`, \`workflows.md\`, \`roles/...\`, \`templates/...\`,
\`commands/...\`, \`.codex/prompts/...\`, \`.agents/agents/...\`, or
\`.agents/skills/...\`, resolve those paths under \`${packageSourceRoot}\`
unless the instruction explicitly says to use the consuming project's
\`project/\`, \`prds/\`, \`plans/\`, \`designs/\`, \`research/\`,
\`meeting-logs/\`, \`docs/\`, or \`modules/\` paths.
`;
}

function buildMarkdownShim(relativePath, packagePath, packageSourceRoot) {
	const title = path.basename(relativePath, path.extname(relativePath));
	return `# ${title}

This local file is an Agent Workflows reference shim.

Packaged source of truth:

\`${packagePath}\`

Read and use the packaged file instead of this shim. When that file references
other reusable Agent Workflows files, resolve them under \`${packageSourceRoot}\`.
Project-owned files such as \`project/\`, \`prds/\`, \`plans/\`, \`designs/\`,
\`research/\`, \`meeting-logs/\`, \`docs/\`, and \`modules/\` remain local to
this consuming workspace.
`;
}

function extractFrontmatter(source) {
	if (!source.startsWith("---\n")) return undefined;
	const endIndex = source.indexOf("\n---", 4);
	if (endIndex < 0) return undefined;
	return `${source.slice(0, endIndex + 5).trim()}\n\n`;
}

function packageSourceRootReference(root) {
	const localPackageRoot = path.join(root, packageLocalPath);
	if (path.resolve(localPackageRoot) === packageRoot) {
		return packageLocalPath;
	}

	const relativePackageRoot = path.relative(root, packageRoot);
	if (
		relativePackageRoot &&
		!relativePackageRoot.startsWith("..") &&
		!path.isAbsolute(relativePackageRoot)
	) {
		return relativePackageRoot;
	}

	return packageRoot;
}

function toPosixPath(filePath) {
	return filePath.split(path.sep).join("/");
}

function mergePackageScripts(root) {
	const packagePath = path.join(root, "package.json");
	const packageData = fs.existsSync(packagePath)
		? readJson(packagePath)
		: { private: true };
	const scripts = {
		...(packageData.scripts ?? {}),
		"workspace:check":
			packageData.scripts?.["workspace:check"] ?? "workflows check",
		"workspace:integrity":
			packageData.scripts?.["workspace:integrity"] ?? "workflows integrity",
		"dashboard:dev":
			packageData.scripts?.["dashboard:dev"] ?? "workflows dashboard",
		"workflows:update":
			packageData.scripts?.["workflows:update"] ?? "workflows update",
	};

	fs.writeFileSync(
		packagePath,
		`${JSON.stringify({ ...packageData, scripts }, null, "\t")}\n`,
	);
}

function writeManifest(root) {
	const manifest = {
		packageName: packageJson.name,
		packageVersion: packageJson.version,
		managedPaths,
		scaffoldOnlyPaths,
		updatedAt: new Date().toISOString(),
	};
	const target = path.join(root, manifestPath);
	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.writeFileSync(target, `${JSON.stringify(manifest, null, "\t")}\n`);
}

function loadManifest(root) {
	const target = path.join(root, manifestPath);
	if (!fs.existsSync(target)) {
		throw new Error(
			`No ${manifestPath} found in ${root}. Run workflows init first.`,
		);
	}

	return readJson(target);
}

function resolveRoot(args) {
	const rootFlagIndex = args.findIndex(
		(arg) => arg === "--root" || arg === "-r",
	);
	const rootValue =
		rootFlagIndex >= 0 ? args[rootFlagIndex + 1] : process.cwd();
	if (!rootValue || rootValue.startsWith("-")) {
		throw new Error("--root requires a path.");
	}

	return path.resolve(rootValue);
}

function passthroughArgs(args) {
	const result = [];
	for (let index = 0; index < args.length; index += 1) {
		const arg = args[index];
		if (arg === "--root" || arg === "-r") {
			index += 1;
			continue;
		}
		result.push(arg);
	}
	return result;
}

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function resolvePackageBin(packageName) {
	const packagePath = require.resolve(`${packageName}/package.json`);
	const packageData = readJson(packagePath);
	const bin =
		typeof packageData.bin === "string"
			? packageData.bin
			: packageData.bin?.[Object.keys(packageData.bin)[0]];
	if (!bin) {
		throw new Error(`${packageName} does not expose a binary.`);
	}

	return path.join(path.dirname(packagePath), bin);
}

function ensureDirectory(directory) {
	fs.mkdirSync(directory, { recursive: true });
}

function walkFiles(directory) {
	const entries = fs.readdirSync(directory, { withFileTypes: true });
	const files = [];

	for (const entry of entries) {
		const entryPath = path.join(directory, entry.name);
		if (entry.isDirectory()) {
			files.push(...walkFiles(entryPath));
		} else if (entry.isFile()) {
			files.push(entryPath);
		}
	}

	return files;
}

function printHelp() {
	console.log(`Agent Workflows

Usage:
  workflows init [--root <path>]
  workflows update [--root <path>]
  workflows dashboard [--root <path>] [-- --vite-arg]
  workflows integrity [--root <path>]
  workflows check [--root <path>]
  workflows auto on|off|toggle|status [--root <path>]
  workflows agents sync [--root <path>]
  workflows agents sync [--format <codex|antigravity>] [--root <path>]
  workflows agents models --format <codex|antigravity|claude> [--json]
  workflows agents resolve <step> <role> --format <codex|antigravity|claude> [--json] [--root <path>]

Commands:
  init       Write local workflow shims into a developer project and create a manifest.
  update     Refresh workflow-owned shims and add missing model defaults to older configs.
  dashboard  Start the packaged dashboard against the developer project.
  integrity  Run the packaged workspace integrity check against the project.
  check      Run package-provided workspace checks against the project.
  auto       Persist or inspect workspace auto mode (default: off).
  agents    Sync base role models or resolve workflow-step overrides.

Agent command and skill loading:
  Run workflows init once after global install, or bunx workflows init for a project-local install.
  Run workflows update after package upgrades. Set AGENT_WORKFLOWS_AUTO_UPDATE=1 during installation to opt in to an automatic refresh.
  Restart or reload active agent sessions after either command so they discover refreshed shims.`);
}

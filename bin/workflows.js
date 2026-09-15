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
const packageJson = readJson(path.join(packageRoot, "package.json"));
const packageLocalPath = path.join(
	"node_modules",
	...packageJson.name.split("/"),
);

const managedPaths = [
	"AGENTS.md",
	"workflows.md",
	"workspace.config.json",
	".codex/prompts",
	".agents/agents",
	".agents/skills",
	"commands",
	"docs/workspace-template-setup.md",
	"roles",
	"templates",
];

const scaffoldOnlyPaths = [
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
	const managed = copyPaths(root, managedPaths, { overwrite: false });
	const scaffolded = copyPaths(root, scaffoldOnlyPaths, { overwrite: false });
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
	const paths = manifest?.managedPaths ?? managedPaths;
	const managed = copyPaths(root, paths, { overwrite: true });
	writeManifest(root);

	console.log(`Updated ${managed.length} managed workflow files in ${root}`);
	console.log(
		"Project profile files and existing artifacts were left unchanged.",
	);
	console.log(
		"Restart or reload any active agent session so it can discover refreshed custom agent, command, and skill shims.",
	);
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

Commands:
  init       Write local workflow shims into a developer project and create a manifest.
  update     Refresh workflow-owned shims from the installed package.
  dashboard  Start the packaged dashboard against the developer project.
  integrity  Run the packaged workspace integrity check against the project.
  check      Run package-provided workspace checks against the project.

Agent command and skill loading:
  Run workflows init once after global install, or bunx workflows init for a project-local install.
  Run workflows update after package upgrades, or bunx workflows update when lifecycle scripts are disabled.
  Restart or reload active agent sessions after either command so they discover refreshed shims.`);
}

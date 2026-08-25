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

const managedPaths = [
	"AGENTS.md",
	"workflows.md",
	"workspace.config.json",
	".codex/prompts",
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
	const copied = copyPaths(root, managedPaths, { overwrite: false });
	const scaffolded = copyPaths(root, scaffoldOnlyPaths, { overwrite: false });
	mergePackageScripts(root);
	writeManifest(root);

	console.log(`Initialized Agent Workflows in ${root}`);
	console.log(
		`Copied ${copied.length} workflow files and scaffolded ${scaffolded.length} project files.`,
	);
	console.log(
		"Next: use /project-setup or $project-setup to configure this project's workflow profile.",
	);
}

function updateWorkspace(root) {
	const manifest = loadManifest(root);
	const paths = manifest?.managedPaths ?? managedPaths;
	const copied = copyPaths(root, paths, { overwrite: true });
	writeManifest(root);

	console.log(`Updated ${copied.length} workflow files in ${root}`);
	console.log(
		"Project profile files and existing artifacts were left unchanged.",
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
	const copied = [];

	for (const relativePath of relativePaths) {
		const source = path.join(packageRoot, relativePath);
		if (!fs.existsSync(source)) {
			continue;
		}

		if (fs.statSync(source).isDirectory()) {
			for (const filePath of walkFiles(source)) {
				const nestedRelativePath = path.relative(packageRoot, filePath);
				if (copyFile(root, nestedRelativePath, options)) {
					copied.push(nestedRelativePath);
				}
			}
			continue;
		}

		if (copyFile(root, relativePath, options)) {
			copied.push(relativePath);
		}
	}

	return copied;
}

function copyFile(root, relativePath, options) {
	const source = path.join(packageRoot, relativePath);
	const target = path.join(root, relativePath);

	if (!options.overwrite && fs.existsSync(target)) {
		return false;
	}

	fs.mkdirSync(path.dirname(target), { recursive: true });
	fs.copyFileSync(source, target);
	return true;
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
  init       Copy workflow files into a developer project and create a manifest.
  update     Refresh workflow-owned files from the installed package.
  dashboard  Start the packaged dashboard against the developer project.
  integrity  Run the packaged workspace integrity check against the project.
  check      Run package-provided workspace checks against the project.`);
}

#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const initCwd = process.env.INIT_CWD;

if (!initCwd) {
	process.exit(0);
}

const manifestPath = path.join(initCwd, ".agent-workflows", "manifest.json");

if (!/^(1|true)$/i.test(process.env.AGENT_WORKFLOWS_AUTO_UPDATE ?? "")) {
	console.log(
		"Agent Workflows left existing workspace files unchanged. Run `bunx workflows update` to refresh commands and skills, or set AGENT_WORKFLOWS_AUTO_UPDATE=1 to enable install-time updates.",
	);
	process.exit(0);
}

if (!fs.existsSync(manifestPath)) {
	console.log(
		"Agent Workflows installed. Run `bunx workflows init` from the project root so source agents can load packaged commands and skills.",
	);
	process.exit(0);
}

const packageRoot = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	"..",
);
const workflowsBin = path.join(packageRoot, "bin", "workflows.js");
const result = spawnSync(
	process.execPath,
	[workflowsBin, "update", "--root", initCwd],
	{
		env: {
			...process.env,
			AGENT_WORKFLOWS_POSTINSTALL: "1",
		},
		stdio: "inherit",
	},
);

if (result.status === 0) {
	console.log(
		"Agent Workflows command and skill shims were refreshed. Restart or reload any active agent session to pick them up.",
	);
	process.exit(0);
}

console.warn(
	"Agent Workflows could not auto-refresh workflow files. Run `bunx workflows update` from the project root.",
);
process.exit(0);

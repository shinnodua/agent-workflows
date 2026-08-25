#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const initCwd = process.env.INIT_CWD;

if (!initCwd) {
	process.exit(0);
}

const manifestPath = path.join(initCwd, ".agent-workflows", "manifest.json");

if (!fs.existsSync(manifestPath)) {
	process.exit(0);
}

console.log(
	"Agent Workflows was installed or updated. This project is initialized; run `workflows update` to refresh workflow files.",
);

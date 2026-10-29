#!/usr/bin/env node
/** Deterministic, explicit-save backend for the conversational add-project skill. */
import { spawnSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROFILE = "project/repositories.json";
const WORKFLOWS = "project/workflows.json";
const MODULES = ".gitmodules";
const files = [PROFILE, WORKFLOWS, MODULES];
const artifacts = ["plans", "designs", "research", "docs"];
const own = (value, key) => Object.hasOwn(value, key);
const hasControl = (value) =>
	[...value].some((character) => character.charCodeAt(0) < 32);
const digest = (value) => createHash("sha256").update(value).digest("hex");
const json = (value) => `${JSON.stringify(value, null, "\t")}\n`;
const fail = (message) => {
	throw new Error(message);
};
const read = (name) =>
	fs.existsSync(name) ? fs.readFileSync(name, "utf8") : null;
const run = (root, args, options = {}) => {
	// Hooks export repository-local variables; every operation here selects its
	// repository by cwd, including checkouts whose Git metadata lives elsewhere.
	const environment = { ...process.env, ...options.env };
	for (const key of [
		"GIT_DIR",
		"GIT_WORK_TREE",
		"GIT_INDEX_FILE",
		"GIT_COMMON_DIR",
		"GIT_OBJECT_DIRECTORY",
		"GIT_ALTERNATE_OBJECT_DIRECTORIES",
		"GIT_PREFIX",
		"GIT_SHALLOW_FILE",
		"GIT_GRAFT_FILE",
		"GIT_IMPLICIT_WORK_TREE",
	])
		delete environment[key];
	const result = spawnSync("git", ["-c", "core.hooksPath=/dev/null", ...args], {
		cwd: root,
		encoding: "utf8",
		env: {
			...environment,
			GIT_TERMINAL_PROMPT: "0",
			GIT_CONFIG_NOSYSTEM: "1",
		},
		input: options.input,
	});
	if (result.status !== 0 && !options.optional)
		fail(
			`Git operation failed (${args[0]}); check repository access and local Git state.`,
		);
	return result.status === 0
		? options.raw
			? result.stdout
			: result.stdout.trimEnd()
		: null;
};

/** Equivalent HTTPS/SSH forms share an identity; paths retain case on unknown hosts. */
export function normalizeUrl(value, { allowLocal = false } = {}) {
	if (
		typeof value !== "string" ||
		/\s/.test(value) ||
		hasControl(value) ||
		value.startsWith("-")
	)
		fail("Use a clean HTTPS or SSH repository URL without credentials.");
	if (allowLocal && path.isAbsolute(value))
		return `local:${path.resolve(value)}`;
	let host;
	let pathname;
	if (/^https:\/\//.test(value) || /^ssh:\/\//.test(value)) {
		let parsed;
		try {
			parsed = new URL(value);
		} catch {
			fail("Invalid repository URL.");
		}
		if (
			parsed.password ||
			(parsed.protocol === "https:" && parsed.username) ||
			parsed.search ||
			parsed.hash
		)
			fail(
				"Use a clean repository URL without embedded credentials, query, or fragment.",
			);
		host = parsed.host.toLowerCase();
		pathname = parsed.pathname;
		if (parsed.protocol === "ssh:" && parsed.port === "22")
			host = parsed.hostname.toLowerCase();
	} else {
		const scp = value.match(/^(?:[a-zA-Z0-9_.-]+@)?([a-zA-Z0-9.-]+):([^:]+)$/);
		if (!scp)
			fail("Use a clean HTTPS or SSH repository URL without credentials.");
		host = scp[1].toLowerCase();
		pathname = scp[2];
	}
	pathname = pathname.replace(/^\/+|\/+$/g, "").replace(/\.git$/, "");
	if (
		!host ||
		host.startsWith("-") ||
		!pathname ||
		pathname
			.split("/")
			.some((part) => !part || part === "." || part === "..") ||
		/[%\\]/.test(pathname)
	)
		fail("Invalid repository identity.");
	if (host === "github.com") pathname = pathname.toLowerCase();
	return `${host}/${pathname}`;
}

function contained(root, relative, { module = false } = {}) {
	if (
		typeof relative !== "string" ||
		!relative ||
		path.isAbsolute(relative) ||
		relative.includes("\\") ||
		relative
			.split("/")
			.some((part) => !part || part === "." || part === "..") ||
		hasControl(relative)
	)
		fail("Paths must be normalized workspace-relative paths.");
	if (module && (!relative.startsWith("modules/") || relative === "modules/"))
		fail("Repository paths must be below modules/.");
	let cursor = root;
	for (const part of relative.split("/")) {
		cursor = path.join(cursor, part);
		let stat;
		try {
			stat = fs.lstatSync(cursor);
		} catch (error) {
			if (error.code !== "ENOENT") throw error;
		}
		if (stat?.isSymbolicLink())
			fail("Symlink paths require explicit resolution before saving.");
	}
	return path.join(root, relative);
}
function validateEntry(root, entry, options) {
	if (!entry || typeof entry !== "object" || Array.isArray(entry))
		fail("Each entry must be a repository profile object.");
	for (const key of ["id", "name", "path", "url", "purpose", "agentGuide"])
		if (typeof entry[key] !== "string" || !entry[key].trim())
			fail(`Entry requires a nonempty ${key}.`);
	if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(entry.id))
		fail(
			"Repository IDs must contain only letters, digits, hyphens, or underscores.",
		);
	normalizeUrl(entry.url, options);
	contained(root, entry.path, { module: true });
	for (const key of ["scope", "platforms", "codeScanDirectories", "validation"])
		if (
			!Array.isArray(entry[key]) ||
			entry[key].some((item) => typeof item !== "string" || !item.trim())
		)
			fail(`${key} must be an array of nonempty strings.`);
	if (!entry.scope.length || !entry.platforms.length)
		fail("Accept at least one scope and platform.");
	if (
		!entry.artifactDirectories ||
		typeof entry.artifactDirectories !== "object" ||
		Array.isArray(entry.artifactDirectories)
	)
		fail("artifactDirectories must be an object.");
	for (const relative of [
		entry.agentGuide,
		...artifacts.map((key) => entry.artifactDirectories[key]),
		...Object.values(entry.artifactDirectories),
		...entry.codeScanDirectories,
	]) {
		contained(root, relative);
		if (!relative.startsWith(`${entry.path}/`))
			fail(
				"Repository guidance, artifacts, and scan paths must be inside its checkout.",
			);
	}
}

// Exact shipped records, independent of the consuming workspace's current profile.
const templateProfiles = JSON.parse(
	fs.readFileSync(
		new URL("../project/repositories.json", import.meta.url),
		"utf8",
	),
).repositories;
function isTemplate(entry) {
	const shipped = templateProfiles.find(
		(item) =>
			item.id === entry.id &&
			item.url &&
			normalizeUrl(item.url).startsWith("github.com/example/"),
	);
	return shipped && stable(shipped) === stable(entry);
}
function stable(value) {
	if (Array.isArray(value)) return `[${value.map(stable).join(",")}]`;
	if (value && typeof value === "object")
		return `{${Object.keys(value)
			.sort()
			.map((key) => `${JSON.stringify(key)}:${stable(value[key])}`)
			.join(",")}}`;
	return JSON.stringify(value);
}
function indexEntry(root, name) {
	return run(root, ["ls-files", "--stage", "--", name]);
}
function indexedText(root, name) {
	const entry = indexEntry(root, name);
	if (!entry) return null;
	if (!entry.startsWith("100644 ") && !entry.startsWith("100755 "))
		fail("Resolve nonregular or unmerged configuration index entries first.");
	if (entry.split("\n").length !== 1 || !entry.includes(" 0\t"))
		fail("Resolve unmerged configuration entries first.");
	return run(root, ["show", `:${name}`], { raw: true });
}
function configRead(text, key) {
	if (text === null) return null;
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "add-project-config-"));
	try {
		const name = path.join(dir, "config");
		fs.writeFileSync(name, text);
		return run(dir, ["config", "--file", name, "--get", key], {
			optional: true,
		});
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}
function moduleRecords(text) {
	if (text === null || !text.trim()) return [];
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "add-project-config-"));
	try {
		const name = path.join(dir, "config");
		fs.writeFileSync(name, text);
		run(dir, ["config", "--file", name, "--list"]);
		const result = run(
			dir,
			["config", "--file", name, "--get-regexp", "^submodule\\..*\\.path$"],
			{ optional: true },
		);
		return result
			? result.split("\n").map((line) => {
					const split = line.indexOf(" ");
					const key = line.slice(0, split);
					const section = key.slice(0, -5);
					return {
						section,
						path: line.slice(split + 1),
						url: configRead(text, `${section}.url`),
						keys: run(dir, [
							"config",
							"--file",
							name,
							"--name-only",
							"--get-regexp",
							`^${section.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.`,
						]).split("\n"),
					};
				})
			: [];
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}
function editModules(text, entries, removals) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "add-project-config-"));
	try {
		const name = path.join(dir, "config");
		// git config --remove-section also discards trailing comments. Remove only
		// reviewed template headers/keys, retaining every standalone/inline comment.
		const sections = new Set(
			moduleRecords(text)
				.filter((record) => removals.includes(record.path))
				.map((record) => record.section),
		);
		let removing = false;
		const cleaned = (text ?? "")
			.split("\n")
			.flatMap((line) => {
				if (/^\s*\[/.test(line)) {
					const header = line.match(
						/^\s*\[submodule\s+("(?:[^"\\]|\\.)*")\]([\s\S]*)$/i,
					);
					const legacy = line.match(/^\s*\[submodule\.([^\]]+)\]([\s\S]*)$/i);
					const section = header
						? `submodule.${JSON.parse(header[1])}`
						: legacy
							? `submodule.${legacy[1]}`
							: null;
					removing = sections.has(section);
					if (removing)
						return (header?.[2] ?? legacy?.[2] ?? "").trim()
							? [(header?.[2] ?? legacy?.[2] ?? "").trimStart()]
							: [];
				}
				if (removing && /^\s*(?:path|url)\s*=/i.test(line)) {
					let quoted = false;
					let escaped = false;
					for (let i = 0; i < line.length; i++) {
						const character = line[i];
						if (escaped) {
							escaped = false;
							continue;
						}
						if (character === "\\") {
							escaped = true;
							continue;
						}
						if (character === '"') quoted = !quoted;
						if (!quoted && (character === "#" || character === ";"))
							return [line.slice(i)];
					}
					return [];
				}
				return [line];
			})
			.join("\n");
		fs.writeFileSync(name, cleaned);
		for (const entry of entries) {
			const existing = moduleRecords(fs.readFileSync(name, "utf8")).find(
				(record) => record.path === entry.path,
			);
			const section = existing?.section ?? `submodule.${entry.path}`;
			run(dir, ["config", "--file", name, `${section}.path`, entry.path]);
			run(dir, ["config", "--file", name, `${section}.url`, entry.url]);
		}
		return fs.readFileSync(name, "utf8");
	} finally {
		fs.rmSync(dir, { recursive: true, force: true });
	}
}
function checkoutState(root, entry, options) {
	const location = contained(root, entry.path, { module: true });
	const registered = moduleRecords(read(path.join(root, MODULES))).find(
		(record) => record.path === entry.path,
	);
	const indexed = indexEntry(root, entry.path);
	const exists = fs.existsSync(location);
	const revision =
		exists && fs.existsSync(path.join(location, ".git"))
			? run(location, ["rev-parse", "--verify", "HEAD"], { optional: true })
			: null;
	const remote = revision
		? run(location, ["remote", "get-url", "origin"], { optional: true })
		: null;
	const matching =
		remote &&
		normalizeUrl(remote, options) === normalizeUrl(entry.url, options);
	if (
		registered &&
		(!registered.url ||
			normalizeUrl(registered.url, options) !==
				normalizeUrl(entry.url, options))
	)
		fail("Conflicting submodule URL; resolve the existing registration first.");
	if (indexed && !indexed.startsWith("160000 "))
		fail("Repository destination conflicts with tracked files.");
	if (
		indexed &&
		(!registered ||
			!revision ||
			!matching ||
			!indexed.includes(` ${revision} 0\t`))
	)
		fail(
			"Existing gitlink, registration, checkout, or revision conflicts; resolve before saving.",
		);
	if (exists && fs.readdirSync(location).length && !indexed) {
		const marker = ownedMarker(root, entry);
		if (
			!revision ||
			!matching ||
			read(marker) !== normalizeUrl(entry.url, options)
		)
			fail("Nonempty unregistered destination will not be adopted.");
	}
	const localUrl = run(
		root,
		[
			"config",
			"--get",
			`${registered?.section ?? `submodule.${entry.path}`}.url`,
		],
		{ optional: true },
	);
	if (
		localUrl &&
		normalizeUrl(localUrl, options) !== normalizeUrl(entry.url, options)
	)
		fail("Local submodule configuration conflicts with the accepted URL.");
	return {
		id: entry.id,
		path: entry.path,
		revision,
		state:
			indexed && localUrl
				? "registered"
				: revision
					? "checkout-ready"
					: "pending",
	};
}
function ownedMarker(root, entry) {
	const gitDir = run(root, ["rev-parse", "--absolute-git-dir"]);
	return contained(gitDir, `add-project/${digest(entry.path)}`);
}

function prepare(rootInput, request, options = {}) {
	const root = fs.realpathSync(rootInput);
	if (!request || !Array.isArray(request.entries))
		fail("Request must contain entries[].");
	if (run(root, ["rev-parse", "--show-toplevel"]) !== root)
		fail("Target must be the parent Git workspace root.");
	for (const file of files) contained(root, file);
	const original = Object.fromEntries(
		files.map((file) => [file, read(path.join(root, file))]),
	);
	const profile = JSON.parse(
		original[PROFILE] ?? fail("Repository profile is missing."),
	);
	if (!Array.isArray(profile.repositories))
		fail("Profile requires repositories[].");
	const entries = request.entries;
	for (const [i, entry] of entries.entries()) {
		validateEntry(root, entry, options);
		if (
			entries
				.slice(0, i)
				.some(
					(pending) =>
						pending.id === entry.id ||
						normalizeUrl(pending.url, options) ===
							normalizeUrl(entry.url, options) ||
						pending.path === entry.path ||
						pending.path.startsWith(`${entry.path}/`) ||
						entry.path.startsWith(`${pending.path}/`),
				)
		)
			fail("Duplicate pending repository identity, URL, or path.");
	}
	const explicit = request.removeExamples ?? [];
	if (!Array.isArray(explicit) || explicit.some((id) => typeof id !== "string"))
		fail("removeExamples must be an array of reviewed IDs.");
	const remove = entries.length
		? profile.repositories.filter(
				(entry) => isTemplate(entry) || explicit.includes(entry.id),
			)
		: [];
	if (
		explicit.some(
			(id) =>
				!profile.repositories.some(
					(entry) =>
						entry.id === id &&
						(templateProfiles.some((shipped) => shipped.id === entry.id) ||
							templateProfiles.some(
								(shipped) =>
									normalizeUrl(shipped.url, options) ===
									normalizeUrl(entry.url, options),
							)),
				),
		)
	)
		fail("Cleanup selections must name existing template-like entries.");
	const retained = profile.repositories.filter(
		(entry) => !remove.includes(entry),
	);
	const all = [...retained];
	for (const entry of entries) {
		const match = all.find(
			(saved) => saved.id === entry.id && stable(saved) === stable(entry),
		);
		if (match && retained.includes(match)) continue;
		for (const saved of all) {
			if (
				saved.id === entry.id ||
				normalizeUrl(saved.url, options) === normalizeUrl(entry.url, options) ||
				saved.path === entry.path ||
				saved.path.startsWith(`${entry.path}/`) ||
				entry.path.startsWith(`${saved.path}/`)
			)
				fail(
					"Duplicate or overlapping repository identity, URL, or path; resolve before saving.",
				);
		}
		all.push(entry);
	}
	const records = moduleRecords(original[MODULES]);
	if (new Set(records.map((record) => record.path)).size !== records.length)
		fail("Duplicate .gitmodules paths require resolution before saving.");
	const indexText = indexedText(root, MODULES);
	for (const removed of remove) {
		if (indexEntry(root, removed.path))
			fail(
				"Template cleanup would remove a registered checkout; resolve it explicitly first.",
			);
		for (const record of [...records, ...moduleRecords(indexText)].filter(
			(item) => item.path === removed.path,
		))
			if (
				record.url !== removed.url ||
				record.section !== `submodule.${removed.path}` ||
				record.keys.length !== 2
			)
				fail(
					"Template .gitmodules reference was modified; resolve it explicitly first.",
				);
	}
	for (const entry of entries) {
		for (const record of [...records, ...moduleRecords(indexText)]) {
			if (
				record.path !== entry.path &&
				(record.path.startsWith(`${entry.path}/`) ||
					entry.path.startsWith(`${record.path}/`) ||
					(record.url &&
						normalizeUrl(record.url, options) ===
							normalizeUrl(entry.url, options)))
			)
				fail("Submodule registration conflicts with the reviewed repository.");
			if (
				record.path === entry.path &&
				normalizeUrl(record.url, options) !== normalizeUrl(entry.url, options)
			)
				fail("Submodule URL conflicts with the reviewed repository.");
		}
	}
	const states = entries.map((entry) => checkoutState(root, entry, options));
	const removedIds = remove.map((entry) => entry.id);
	let workflows =
		original[WORKFLOWS] === null ? null : JSON.parse(original[WORKFLOWS]);
	if (workflows && removedIds.length) {
		if (!Array.isArray(workflows.implementationStages))
			fail("Workflow implementationStages must be an array.");
		workflows = {
			...workflows,
			implementationStages: workflows.implementationStages.flatMap((stage) => {
				const affected =
					stage.repositoryIds?.filter((id) => removedIds.includes(id)) ?? [];
				if (!affected.length) return [stage];
				const templateId = {
					shared: "example-core",
					backend: "example-service",
					frontend: "example-web",
				}[stage.id];
				const exact =
					stable(stage) ===
					stable({
						id: stage.id,
						repositoryIds: [templateId],
						parallel: stage.id === "frontend",
						...(stage.id === "frontend"
							? {
									condition:
										"Run after required shared contracts and APIs are available locally.",
								}
							: {}),
					});
				if (
					exact &&
					affected.every((id) => !own(request.workflowReplacements ?? {}, id))
				)
					return [];
				const repositoryIds = stage.repositoryIds.flatMap((id) => {
					if (!removedIds.includes(id)) return [id];
					const replacements = request.workflowReplacements?.[id];
					if (
						!Array.isArray(replacements) ||
						replacements.some(
							(replacement) => !all.some((entry) => entry.id === replacement),
						)
					)
						fail(
							"Custom workflow references require reviewed workflowReplacements arrays.",
						);
					return replacements;
				});
				return [{ ...stage, repositoryIds: [...new Set(repositoryIds)] }];
			}),
		};
	}
	const removals = remove.map((entry) => entry.path);
	const next = entries.length
		? {
				[PROFILE]: json({ ...profile, repositories: all }),
				[WORKFLOWS]: workflows === null ? null : json(workflows),
				[MODULES]: editModules(original[MODULES], entries, removals),
			}
		: { ...original };
	const effects = {
		repositories: entries.map((entry) => ({
			id: entry.id,
			url: entry.url,
			path: entry.path,
		})),
		removeExamples: removedIds,
		files: files.filter((file) => next[file] !== original[file]),
		index: entries.length
			? [MODULES, ...entries.map((entry) => entry.path)]
			: [],
		workflowReplacements: request.workflowReplacements ?? {},
	};
	const token = digest(
		stable({
			root,
			entries,
			effects,
			removedRecords: remove,
			workflowTouched:
				original[WORKFLOWS] === null
					? []
					: JSON.parse(original[WORKFLOWS]).implementationStages?.filter(
							(stage) =>
								stage.repositoryIds?.some((id) => removedIds.includes(id)),
						),
			index: indexEntry(root, MODULES),
			states,
		}),
	);
	return {
		root,
		entries,
		original,
		next,
		indexText,
		removals,
		effects,
		token,
		states,
	};
}
export function preview(root, request, options = {}) {
	try {
		const prepared = prepare(root, request, options);
		return {
			status: "preview",
			token: prepared.token,
			effects: prepared.effects,
			repositories: prepared.states,
			note: "Ready to save — not saved yet. Save clones and registers submodules; it creates no commits.",
		};
	} catch (error) {
		return {
			status: "conflict",
			error:
				error instanceof SyntaxError
					? "Invalid configuration JSON."
					: error.message,
		};
	}
}

function replace(root, file, value, expected) {
	const target = contained(root, file);
	if (read(target) !== expected)
		fail(`Concurrent change to ${file}; review a fresh preview.`);
	if (value === null) {
		if (expected !== null) fs.unlinkSync(target);
		return;
	}
	const temporary = `${target}.add-project-${randomUUID()}`;
	try {
		fs.writeFileSync(temporary, value, {
			flag: "wx",
			mode: fs.existsSync(target) ? fs.statSync(target).mode : 0o644,
		});
		fs.renameSync(temporary, target);
	} finally {
		if (fs.existsSync(temporary)) fs.unlinkSync(temporary);
	}
}
function stageModules(root, text, expectedIndex) {
	if (indexEntry(root, MODULES) !== expectedIndex)
		fail(
			"Concurrent .gitmodules index change; review recovery before retrying.",
		);
	const object = run(root, ["hash-object", "-w", "--stdin"], { input: text });
	run(root, [
		"update-index",
		"--add",
		"--cacheinfo",
		`${expectedIndex?.split(" ")[0] || "100644"},${object},${MODULES}`,
	]);
}

/** Save only the exact preview the user reviewed. Partial Git work is retained for retry. */
export function save(rootInput, request, options = {}) {
	let prepared;
	try {
		prepared = prepare(rootInput, request, options);
	} catch (error) {
		return {
			status: "conflict",
			error:
				error instanceof SyntaxError
					? "Invalid configuration JSON."
					: error.message,
			changedFiles: [],
			restoredFiles: [],
		};
	}
	if (!prepared.entries.length)
		return {
			status: "empty",
			repositories: [],
			changedFiles: [],
			restoredFiles: [],
		};
	if (!request.token || request.token !== prepared.token)
		return {
			status: "conflict",
			error:
				"A current reviewed preview token is required; review this preview before choosing Save again.",
			preview: preview(rootInput, request, options),
			changedFiles: [],
			restoredFiles: [],
		};
	const { root, entries, original, next, indexText, removals } = prepared;
	const states = prepared.states.map((state) => ({ ...state }));
	const changedFiles = [];
	const restoredFiles = [];
	const createdPaths = [];
	const configWritten = [];
	const initialIndexEntries = Object.fromEntries(
		[MODULES, ...entries.map((entry) => entry.path)].map((file) => [
			file,
			indexEntry(root, file),
		]),
	);
	const initialPaths = new Set(
		entries
			.filter((entry) => fs.existsSync(path.join(root, entry.path)))
			.map((entry) => entry.path),
	);
	const actualIndexEffects = () =>
		Object.keys(initialIndexEntries).filter(
			(file) => indexEntry(root, file) !== initialIndexEntries[file],
		);
	let currentModules = original[MODULES];
	let currentIndex = indexEntry(root, MODULES);
	let currentIndexText = indexText;
	let active = -1;
	let cleanupSnapshot = null;
	try {
		for (let i = 0; i < entries.length; i++) {
			active = i;
			const entry = entries[i];
			const state = states[i];
			if (state.state === "registered") continue;
			for (const file of [PROFILE, WORKFLOWS])
				if (read(path.join(root, file)) !== original[file])
					fail(`Concurrent change to ${file}; review a fresh preview.`);
			if (
				read(path.join(root, MODULES)) !== currentModules ||
				indexEntry(root, MODULES) !== currentIndex
			)
				fail("Concurrent .gitmodules change; stop and review before retrying.");
			if (state.state !== "checkout-ready") {
				const gitDir = run(root, ["rev-parse", "--absolute-git-dir"]);
				const metadata = contained(gitDir, `modules/${entry.path}`);
				if (fs.existsSync(metadata))
					fail(
						"Existing submodule Git metadata conflicts; inspect recovery before retrying.",
					);
				fs.mkdirSync(path.dirname(metadata), { recursive: true });
				const marker = ownedMarker(root, entry);
				fs.mkdirSync(path.dirname(marker), { recursive: true });
				fs.writeFileSync(marker, normalizeUrl(entry.url, options));
				const destination = contained(root, entry.path, { module: true });
				fs.mkdirSync(path.dirname(destination), { recursive: true });
				state.state = "cloning";
				options.onProgress?.({ ...state });
				run(root, [
					...(options.allowLocal ? ["-c", "protocol.file.allow=always"] : []),
					"clone",
					"--no-recurse-submodules",
					"--separate-git-dir",
					metadata,
					"--",
					entry.url,
					destination,
				]);
				createdPaths.push(entry.path);
				state.revision = run(destination, ["rev-parse", "--verify", "HEAD"]);
				state.state = "checkout-ready";
			}
			options.beforeRegister?.(entry);
			if (
				read(path.join(root, MODULES)) !== currentModules ||
				indexEntry(root, MODULES) !== currentIndex
			)
				fail(
					"Concurrent .gitmodules change during clone; checkout retained for retry.",
				);
			if (indexEntry(root, entry.path) !== initialIndexEntries[entry.path])
				fail(
					"Concurrent destination index change; preserve staged work and resolve before retrying.",
				);
			checkoutState(root, entry, options);
			const modules = editModules(currentModules, [entry], []);
			replace(root, MODULES, modules, currentModules);
			currentModules = modules;
			if (!changedFiles.includes(MODULES)) changedFiles.push(MODULES);
			currentIndexText = editModules(currentIndexText, [entry], []);
			stageModules(root, currentIndexText, currentIndex);
			currentIndex = indexEntry(root, MODULES);
			run(root, [
				"update-index",
				"--add",
				"--cacheinfo",
				`160000,${state.revision},${entry.path}`,
			]);
			const section =
				moduleRecords(currentModules).find(
					(record) => record.path === entry.path,
				)?.section ?? `submodule.${entry.path}`;
			run(root, ["config", `${section}.url`, entry.url]);
			run(root, ["config", `${section}.active`, "true"]);
			state.state = "registered";
			options.onProgress?.({ ...state });
		}
		active = -1;
		// Configuration is published only after every checkout and registration succeeded.
		for (const entry of entries) checkoutState(root, entry, options);
		for (const file of [PROFILE, WORKFLOWS])
			if (read(path.join(root, file)) !== original[file])
				fail(
					`Concurrent change to ${file}; registered repositories retained for retry.`,
				);
		if (
			read(path.join(root, MODULES)) !== currentModules ||
			indexEntry(root, MODULES) !== currentIndex
		)
			fail("Concurrent .gitmodules change before cleanup.");
		for (const file of [WORKFLOWS, PROFILE]) {
			if (next[file] === original[file]) continue;
			options.beforeWrite?.(file);
			replace(root, file, next[file], original[file]);
			configWritten.push(file);
			changedFiles.push(file);
		}
		const finalModules = editModules(currentModules, [], removals);
		cleanupSnapshot = {
			working: currentModules,
			index: currentIndex,
			indexText: currentIndexText,
			next: finalModules,
			stagedNext: editModules(currentIndexText, [], removals),
		};
		options.beforeWrite?.(MODULES);
		replace(root, MODULES, finalModules, currentModules);
		currentModules = finalModules;
		stageModules(root, cleanupSnapshot.stagedNext, currentIndex);
		cleanupSnapshot.writtenIndex = indexEntry(root, MODULES);
		for (const entry of entries) checkoutState(root, entry, options);
		return {
			status: "saved",
			repositories: states,
			changedFiles,
			restoredFiles,
			createdPaths,
			indexEffects: actualIndexEffects(),
			setupActions: entries.flatMap((entry) =>
				[entry.agentGuide, ...Object.values(entry.artifactDirectories)]
					.filter((relative) => !fs.existsSync(path.join(root, relative)))
					.map((relative) => `Unverified or missing: ${relative}`),
			),
			recovery: [],
		};
	} catch (error) {
		// Undo only the final cleanup, retaining successful new registrations.
		const recoveryErrors = [];
		try {
			if (cleanupSnapshot) {
				if (read(path.join(root, MODULES)) === cleanupSnapshot.next) {
					replace(root, MODULES, cleanupSnapshot.working, cleanupSnapshot.next);
					restoredFiles.push(MODULES);
				}
				if (
					cleanupSnapshot.writtenIndex &&
					indexEntry(root, MODULES) === cleanupSnapshot.writtenIndex
				)
					stageModules(
						root,
						cleanupSnapshot.indexText,
						cleanupSnapshot.writtenIndex,
					);
			}
		} catch {
			recoveryErrors.push(
				"Could not restore final .gitmodules cleanup; inspect working-tree and index references before retrying.",
			);
		}
		for (const file of configWritten.reverse()) {
			try {
				if (read(path.join(root, file)) === next[file]) {
					replace(root, file, original[file], next[file]);
					restoredFiles.push(file);
				}
			} catch {
				recoveryErrors.push(
					`Could not restore ${file}; inspect the actual configuration before retrying.`,
				);
			}
		}
		for (let i = 0; i < entries.length; i++) {
			try {
				states[i] = checkoutState(root, entries[i], options);
			} catch {
				states[i] = { ...states[i], state: "needs-recovery" };
			}
		}
		if (active >= 0 && states[active].state === "pending")
			states[active].state = "failed";
		return {
			status: "incomplete",
			error:
				error instanceof SyntaxError
					? "Invalid configuration JSON."
					: error.message,
			repositories: states,
			changedFiles: [...new Set(changedFiles)].filter((file) => {
				try {
					return read(path.join(root, file)) !== original[file];
				} catch {
					return true;
				}
			}),
			restoredFiles,
			createdPaths: entries
				.filter(
					(entry) =>
						!initialPaths.has(entry.path) &&
						fs.existsSync(path.join(root, entry.path)),
				)
				.map((entry) => entry.path),
			indexEffects: (() => {
				try {
					return actualIndexEffects();
				} catch {
					return ["Unknown — inspect Git index"];
				}
			})(),
			recovery: [
				...recoveryErrors,
				"Keep accepted entries. Inspect the reported checkouts, .gitmodules, and Git index; request a new preview and Save to resume. No existing checkout or unrelated index entry was reset.",
			],
		};
	}
}

if (
	process.argv[1] &&
	path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
	try {
		const [operation, ...args] = process.argv.slice(2);
		if (
			!["preview", "save"].includes(operation) ||
			args.length !== 4 ||
			args[0] !== "--root" ||
			args[2] !== "--request"
		)
			fail(
				"Usage: node add-project.mjs preview|save --root <workspace> --request <json-file>",
			);
		const request = JSON.parse(fs.readFileSync(args[3], "utf8"));
		const result =
			operation === "preview"
				? preview(args[1], request)
				: save(args[1], request, {
						onProgress: (state) =>
							process.stderr.write(`${JSON.stringify(state)}\n`),
					});
		process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
		if (!["preview", "saved", "empty"].includes(result.status))
			process.exitCode = 1;
	} catch (error) {
		process.stdout.write(
			`${JSON.stringify({ status: "conflict", error: error instanceof SyntaxError ? "Invalid request JSON." : error.message })}\n`,
		);
		process.exitCode = 1;
	}
}

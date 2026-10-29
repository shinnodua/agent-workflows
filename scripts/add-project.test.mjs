import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, test } from "node:test";
import { normalizeUrl, preview, save } from "./add-project.mjs";

const temporary = [];
const options = { allowLocal: true };
const template = JSON.parse(
	fs.readFileSync(
		new URL("../project/repositories.json", import.meta.url),
		"utf8",
	),
);
const workflowTemplate = JSON.parse(
	fs.readFileSync(
		new URL("../project/workflows.json", import.meta.url),
		"utf8",
	),
);
function git(root, ...args) {
	const environment = { ...process.env };
	for (const name of [
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
		delete environment[name];
	const result = spawnSync(
		"git",
		[
			"-c",
			"core.hooksPath=/dev/null",
			"-c",
			"user.name=Fixture",
			"-c",
			"user.email=fixture@example.com",
			...args,
		],
		{ cwd: root, encoding: "utf8", env: environment },
	);
	assert.equal(result.status, 0, result.stderr);
	return result.stdout.trim();
}
function fixture({ examples = true } = {}) {
	const dir = fs.mkdtempSync(path.join(os.tmpdir(), "add-project-test-"));
	temporary.push(dir);
	const root = path.join(dir, "workspace");
	fs.mkdirSync(path.join(root, "project"), { recursive: true });
	git(root, "init", "-q");
	fs.writeFileSync(
		path.join(root, "project/repositories.json"),
		JSON.stringify(examples ? template : { repositories: [] }, null, "\t") +
			"\n",
	);
	fs.writeFileSync(
		path.join(root, "project/workflows.json"),
		`${JSON.stringify(
			examples ? workflowTemplate : { implementationStages: [] },
			null,
			"\t",
		)}\n`,
	);
	fs.writeFileSync(
		path.join(root, ".gitmodules"),
		examples
			? fs.readFileSync(
					new URL("../.gitmodules.example", import.meta.url),
					"utf8",
				)
			: "",
	);
	fs.writeFileSync(path.join(root, "notes"), "baseline\n");
	git(root, "add", ".");
	git(root, "commit", "-qm", "fixture");
	function remote(id) {
		const location = path.join(dir, id);
		fs.mkdirSync(location);
		git(location, "init", "-q");
		fs.writeFileSync(path.join(location, "README.md"), id);
		git(location, "add", ".");
		git(location, "commit", "-qm", "fixture");
		return location;
	}
	function entry(id = "alpha", url = remote(id)) {
		const local = `modules/${id}`;
		return {
			id,
			name: id,
			path: local,
			url,
			purpose: "Test repository",
			scope: ["logic"],
			platforms: ["backend"],
			agentGuide: `${local}/AGENTS.md`,
			artifactDirectories: Object.fromEntries(
				["plans", "designs", "research", "docs"].map((key) => [
					key,
					`${local}/${key}`,
				]),
			),
			codeScanDirectories: [],
			validation: [],
		};
	}
	const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
	const write = (file, value) =>
		fs.writeFileSync(
			path.join(root, file),
			typeof value === "string"
				? value
				: `${JSON.stringify(value, null, "\t")}\n`,
		);
	return { root, dir, remote, entry, read, write };
}
function reviewed(root, entries, extra = {}) {
	const request = { entries, ...extra };
	const result = preview(root, request, options);
	assert.equal(result.status, "preview", result.error);
	return { ...request, token: result.token };
}
afterEach(() => {
	for (const dir of temporary.splice(0))
		fs.rmSync(dir, { recursive: true, force: true });
});

test("preview and empty Save leave configuration, Git index, and examples untouched", () => {
	const f = fixture();
	const entry = f.entry();
	const before = git(f.root, "status", "--porcelain=v1");
	const result = preview(f.root, { entries: [entry] }, options);
	assert.equal(result.status, "preview");
	assert.equal(result.effects.removeExamples.length, 3);
	assert.equal(fs.existsSync(path.join(f.root, entry.path)), false);
	assert.equal(save(f.root, { entries: [] }, options).status, "empty");
	assert.equal(git(f.root, "status", "--porcelain=v1"), before);
	assert.equal(
		JSON.parse(f.read("project/repositories.json")).repositories.length,
		3,
	);
});

test("multi-add clones, registers real submodules, reports revisions and removes exact examples", () => {
	const f = fixture();
	const entries = [f.entry("alpha"), f.entry("beta")];
	const result = save(f.root, reviewed(f.root, entries), options);
	assert.equal(result.status, "saved", result.error);
	assert.deepEqual(
		result.repositories.map((state) => state.state),
		["registered", "registered"],
	);
	for (const entry of entries) {
		const revision = git(path.join(f.root, entry.path), "rev-parse", "HEAD");
		assert.match(
			git(f.root, "ls-files", "--stage", "--", entry.path),
			new RegExp(`160000 ${revision}`),
		);
		assert.equal(
			git(
				f.root,
				"config",
				"--file",
				".gitmodules",
				"--get",
				`submodule.${entry.path}.url`,
			),
			entry.url,
		);
		assert.match(
			git(f.root, "submodule", "status", "--", entry.path),
			new RegExp(revision),
		);
	}
	assert.deepEqual(
		JSON.parse(f.read("project/repositories.json")).repositories,
		entries,
	);
	assert.deepEqual(
		JSON.parse(f.read("project/workflows.json")).implementationStages,
		[],
	);
	assert.doesNotMatch(f.read(".gitmodules"), /example-/);
	assert.equal(git(f.root, "rev-list", "--count", "HEAD"), "1");
	assert.equal(
		save(f.root, reviewed(f.root, entries), options).status,
		"saved",
	);
});

test("unrelated staged and unstaged changes, including mixed .gitmodules, survive", () => {
	const f = fixture({ examples: false });
	const entry = f.entry();
	f.write("notes", "staged\n");
	git(f.root, "add", "notes");
	f.write("notes", "working\n");
	f.write(".gitmodules", "# staged comment\n[custom]\n\tkeep = staged\n");
	git(f.root, "add", ".gitmodules");
	f.write(".gitmodules", "# working comment\n[custom]\n\tkeep = working\n");
	const result = save(f.root, reviewed(f.root, [entry]), options);
	assert.equal(result.status, "saved", result.error);
	assert.equal(git(f.root, "show", ":notes"), "staged");
	assert.equal(f.read("notes"), "working\n");
	assert.match(git(f.root, "show", ":.gitmodules"), /keep = staged/);
	assert.doesNotMatch(git(f.root, "show", ":.gitmodules"), /working comment/);
	assert.match(f.read(".gitmodules"), /keep = working/);
	assert.match(git(f.root, "show", ":.gitmodules"), /modules\/alpha/);
});

test("B failure keeps A registered and examples; fresh preview retries only missing B", () => {
	const f = fixture();
	const first = f.entry();
	const missing = path.join(f.dir, "later");
	const second = f.entry("beta", missing);
	const result = save(f.root, reviewed(f.root, [first, second]), options);
	assert.equal(result.status, "incomplete");
	assert.equal(result.repositories[0].state, "registered");
	assert.equal(result.repositories[1].state, "failed");
	assert.equal(
		JSON.parse(f.read("project/repositories.json")).repositories.length,
		3,
	);
	assert.match(f.read(".gitmodules"), /example-core/);
	f.remote("later");
	const before = git(path.join(f.root, first.path), "rev-parse", "HEAD");
	const retry = save(f.root, reviewed(f.root, [first, second]), options);
	assert.equal(retry.status, "saved", retry.error);
	assert.equal(git(path.join(f.root, first.path), "rev-parse", "HEAD"), before);
	assert.equal(f.read(".gitmodules").match(/path = modules\/alpha/g).length, 1);
});

test("failure after clone keeps an owned checkout that can finish registration on retry", () => {
	const f = fixture();
	const entry = f.entry();
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeRegister() {
			throw new Error("Injected registration failure");
		},
	});
	assert.equal(result.status, "incomplete");
	assert.equal(result.repositories[0].state, "checkout-ready");
	assert.equal(
		save(f.root, reviewed(f.root, [entry]), options).status,
		"saved",
	);
});

test("materially changed cleanup returns a revised preview without cloning or overwriting edits", () => {
	const f = fixture();
	const entry = f.entry();
	const request = reviewed(f.root, [entry]);
	const config = JSON.parse(f.read("project/repositories.json"));
	config.custom = "intervening";
	config.repositories[0].purpose = "A retained real repository";
	f.write("project/repositories.json", config);
	const result = save(f.root, request, options);
	assert.equal(result.status, "conflict");
	assert.equal(result.preview.status, "preview");
	assert.equal(fs.existsSync(path.join(f.root, entry.path)), false);
	assert.equal(
		save(f.root, { ...request, token: result.preview.token }, options).status,
		"saved",
	);
	assert.equal(
		JSON.parse(f.read("project/repositories.json")).custom,
		"intervening",
	);
});

test("write failure restores only owned JSON and retains examples and successful registrations", () => {
	const f = fixture();
	const entry = f.entry();
	const original = f.read("project/workflows.json");
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeWrite(file) {
			if (file === "project/repositories.json")
				throw new Error("Injected write failure");
		},
	});
	assert.equal(result.status, "incomplete");
	assert.equal(f.read("project/workflows.json"), original);
	assert.equal(
		JSON.parse(f.read("project/repositories.json")).repositories.length,
		3,
	);
	assert.match(f.read(".gitmodules"), /example-core/);
	assert.deepEqual(result.restoredFiles, ["project/workflows.json"]);
	assert.equal(
		save(f.root, reviewed(f.root, [entry]), options).status,
		"saved",
	);
});

test("concurrent newer JSON is never overwritten by failure recovery", () => {
	const f = fixture();
	const entry = f.entry();
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeWrite(file) {
			if (file === "project/repositories.json") {
				f.write("project/workflows.json", {
					implementationStages: [],
					newer: true,
				});
				throw new Error("Injected");
			}
		},
	});
	assert.equal(result.status, "incomplete");
	assert.equal(JSON.parse(f.read("project/workflows.json")).newer, true);
	assert.deepEqual(result.restoredFiles, []);
});

test("modified examples and custom metadata survive automatic cleanup", () => {
	const f = fixture();
	const profile = JSON.parse(f.read("project/repositories.json"));
	profile.repositories[0].purpose = "My real service";
	profile.repositories[0].custom = true;
	profile.custom = 42;
	f.write("project/repositories.json", profile);
	const result = save(f.root, reviewed(f.root, [f.entry()]), options);
	assert.equal(result.status, "saved", result.error);
	const saved = JSON.parse(f.read("project/repositories.json"));
	assert.equal(saved.custom, 42);
	assert.equal(saved.repositories[0].custom, true);
	assert.equal(saved.repositories.length, 2);
});

test("custom stages require explicit reference decisions and retain their metadata", () => {
	const f = fixture();
	f.write("project/workflows.json", {
		implementationStages: [
			{ id: "custom", repositoryIds: ["example-core"], custom: "retain" },
		],
		custom: true,
	});
	const entry = f.entry();
	assert.equal(
		preview(f.root, { entries: [entry] }, options).status,
		"conflict",
	);
	const request = reviewed(f.root, [entry], {
		workflowReplacements: { "example-core": [entry.id] },
	});
	assert.equal(save(f.root, request, options).status, "saved");
	assert.deepEqual(JSON.parse(f.read("project/workflows.json")), {
		implementationStages: [
			{ id: "custom", repositoryIds: [entry.id], custom: "retain" },
		],
		custom: true,
	});
});

test("duplicate IDs, URLs, and overlapping paths in pending or saved records conflict", () => {
	const f = fixture({ examples: false });
	const a = f.entry();
	const b = f.entry("beta");
	for (const changed of [
		{ ...b, id: a.id },
		{ ...b, url: a.url },
		{ ...b, path: a.path },
	])
		assert.equal(
			preview(f.root, { entries: [a, changed] }, options).status,
			"conflict",
		);
	assert.equal(
		preview(f.root, { entries: [a, a] }, options).status,
		"conflict",
	);
	assert.equal(save(f.root, reviewed(f.root, [a]), options).status, "saved");
	assert.equal(
		preview(f.root, { entries: [{ ...b, url: a.url }] }, options).status,
		"conflict",
	);
});

test("reject escaping, symlink, nonempty, and tracked-file destinations before mutation", () => {
	const f = fixture({ examples: false });
	const entry = f.entry();
	for (const local of [
		"../outside",
		"modules/../outside",
		"/tmp/outside",
		".git/evil",
	])
		assert.equal(
			preview(f.root, { entries: [{ ...entry, path: local }] }, options).status,
			"conflict",
		);
	fs.mkdirSync(path.join(f.root, "modules"));
	fs.symlinkSync(f.dir, path.join(f.root, "modules/link"));
	assert.equal(
		preview(
			f.root,
			{ entries: [{ ...entry, path: "modules/link/repo" }] },
			options,
		).status,
		"conflict",
	);
	fs.mkdirSync(path.join(f.root, entry.path));
	fs.writeFileSync(path.join(f.root, entry.path, "work"), "preserve");
	assert.equal(
		preview(f.root, { entries: [entry] }, options).status,
		"conflict",
	);
	assert.equal(
		fs.readFileSync(path.join(f.root, entry.path, "work"), "utf8"),
		"preserve",
	);
});

test("clean URL canonicalization keeps host and unknown-host path identity; rejects secrets without echo", () => {
	assert.equal(
		normalizeUrl("github.com:Owner/Repo.git"),
		normalizeUrl("https://github.com/owner/repo"),
	);
	assert.equal(
		normalizeUrl("ssh://git@example.com/Owner/Repo.git"),
		normalizeUrl("https://example.com/Owner/Repo"),
	);
	assert.notEqual(
		normalizeUrl("https://a.example/Owner/Repo"),
		normalizeUrl("https://b.example/Owner/Repo"),
	);
	assert.notEqual(
		normalizeUrl("https://a.example/Owner/Repo"),
		normalizeUrl("https://a.example/owner/repo"),
	);
	const f = fixture();
	const entry = f.entry();
	for (const url of [
		"https://token-secret@example.com/owner/repo",
		"ssh://git:token-secret@host/repo",
		"https://host/repo?token=token-secret",
		"ext::token-secret",
		"--upload-pack=token-secret",
	]) {
		const result = preview(f.root, { entries: [{ ...entry, url }] });
		assert.equal(result.status, "conflict");
		assert.doesNotMatch(JSON.stringify(result), /token-secret/);
	}
});

test("CLI requires an explicit operation and refuses malformed or secret requests safely", () => {
	const f = fixture();
	const script = new URL("./add-project.mjs", import.meta.url).pathname;
	const request = path.join(f.dir, "request.json");
	fs.writeFileSync(request, JSON.stringify({ entries: [] }));
	const empty = spawnSync(
		process.execPath,
		[script, "save", "--root", f.root, "--request", request],
		{ encoding: "utf8" },
	);
	assert.equal(empty.status, 0);
	assert.equal(JSON.parse(empty.stdout).status, "empty");
	fs.writeFileSync(request, '{"secret":"should-not-echo"');
	const malformed = spawnSync(
		process.execPath,
		[script, "preview", "--root", f.root, "--request", request],
		{ encoding: "utf8" },
	);
	assert.equal(malformed.status, 1);
	assert.doesNotMatch(malformed.stdout, /should-not-echo/);
});

test("malformed and modified template .gitmodules are conflicts, never cleanup candidates", () => {
	const f = fixture();
	const entry = f.entry();
	f.write(".gitmodules", "[broken\n");
	assert.equal(
		preview(f.root, { entries: [entry] }, options).status,
		"conflict",
	);
	f.write(
		".gitmodules",
		fs.readFileSync(new URL("../.gitmodules.example", import.meta.url), "utf8"),
	);
	git(
		f.root,
		"config",
		"--file",
		".gitmodules",
		"submodule.modules/example-core.branch",
		"custom",
	);
	assert.equal(
		preview(f.root, { entries: [entry] }, options).status,
		"conflict",
	);
	assert.match(f.read(".gitmodules"), /branch = custom/);
});

test("empty preview proposes no formatting writes and optional arrays remain honest", () => {
	const f = fixture({ examples: false });
	f.write("project/repositories.json", '{"repositories":[]}');
	const result = preview(f.root, { entries: [] }, options);
	assert.equal(result.status, "preview");
	assert.deepEqual(result.effects.files, []);
	assert.deepEqual(result.effects.index, []);
	assert.deepEqual(result.effects.removeExamples, []);
	const entry = f.entry();
	entry.artifactDirectories.custom = 1;
	assert.equal(
		preview(f.root, { entries: [entry] }, options).status,
		"conflict",
	);
});

test("mixed index blob whitespace is preserved exactly outside newly appended registrations", () => {
	const f = fixture({ examples: false });
	const original = "# staged trailing text\n\n\n";
	f.write(".gitmodules", original);
	git(f.root, "add", ".gitmodules");
	f.write(".gitmodules", "# work only\n");
	const entry = f.entry();
	assert.equal(
		save(f.root, reviewed(f.root, [entry]), options).status,
		"saved",
	);
	const result = spawnSync("git", ["show", ":.gitmodules"], {
		cwd: f.root,
		encoding: "utf8",
	});
	assert.ok(result.stdout.startsWith(original));
	assert.ok(f.read(".gitmodules").startsWith("# work only\n"));
});

test("final cleanup index conflict restores template references and JSON without overwriting new index work", () => {
	const f = fixture();
	const entry = f.entry();
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeWrite(file) {
			if (file !== ".gitmodules") return;
			const staged = spawnSync("git", ["show", ":.gitmodules"], {
				cwd: f.root,
				encoding: "utf8",
			}).stdout;
			const object = spawnSync("git", ["hash-object", "-w", "--stdin"], {
				cwd: f.root,
				input: `${staged}# concurrent index\n`,
				encoding: "utf8",
			}).stdout.trim();
			git(
				f.root,
				"update-index",
				"--cacheinfo",
				`100644,${object},.gitmodules`,
			);
		},
	});
	assert.equal(result.status, "incomplete");
	assert.match(f.read(".gitmodules"), /example-core/);
	assert.match(git(f.root, "show", ":.gitmodules"), /concurrent index/);
	assert.equal(
		JSON.parse(f.read("project/repositories.json")).repositories.length,
		3,
	);
	assert.equal(result.repositories[0].state, "registered");
});

test("concurrent metadata changes during cloning stop registration and preserve the checkout", () => {
	const f = fixture();
	const entry = f.entry();
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeRegister() {
			f.write(".gitmodules", `${f.read(".gitmodules")}# concurrent work\n`);
		},
	});
	assert.equal(result.status, "incomplete");
	assert.equal(result.repositories[0].state, "checkout-ready");
	assert.match(f.read(".gitmodules"), /concurrent work/);
	assert.equal(
		save(f.root, reviewed(f.root, [entry]), options).status,
		"saved",
	);
	assert.match(f.read(".gitmodules"), /concurrent work/);
});

test("unrelated intervening profile, workflow, and working .gitmodules edits merge without another Save", () => {
	const f = fixture();
	const entry = f.entry();
	const request = reviewed(f.root, [entry]);
	const config = JSON.parse(f.read("project/repositories.json"));
	config.custom = "newer";
	f.write("project/repositories.json", config);
	const workflows = JSON.parse(f.read("project/workflows.json"));
	workflows.custom = true;
	workflows.implementationStages.push({
		id: "independent",
		repositoryIds: [],
		custom: true,
	});
	f.write("project/workflows.json", workflows);
	f.write(
		".gitmodules",
		`${f.read(".gitmodules")}# preserve unrelated new comment\n`,
	);
	const result = save(f.root, request, options);
	assert.equal(result.status, "saved", result.error);
	assert.equal(JSON.parse(f.read("project/repositories.json")).custom, "newer");
	assert.equal(JSON.parse(f.read("project/workflows.json")).custom, true);
	assert.deepEqual(
		JSON.parse(f.read("project/workflows.json")).implementationStages,
		[{ id: "independent", repositoryIds: [], custom: true }],
	);
	assert.match(f.read(".gitmodules"), /preserve unrelated new comment/);
});

test("explicit reviewed cleanup accepts a modified known template identity with an HTTPS URL", () => {
	const f = fixture({ examples: false });
	const modified = structuredClone(template.repositories[0]);
	modified.url = "https://github.com/example/example-core.git";
	modified.purpose = "Changed";
	f.write("project/repositories.json", { repositories: [modified] });
	const entry = f.entry();
	const first = preview(f.root, { entries: [entry] }, options);
	assert.equal(first.status, "preview");
	assert.deepEqual(first.effects.removeExamples, []);
	const request = reviewed(f.root, [entry], { removeExamples: [modified.id] });
	assert.equal(save(f.root, request, options).status, "saved");
	assert.deepEqual(
		JSON.parse(f.read("project/repositories.json")).repositories,
		[entry],
	);
});

test("concurrent staged destination is preserved rather than overwritten with a gitlink", () => {
	const f = fixture();
	const entry = f.entry();
	let stagedObject;
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeRegister() {
			stagedObject = git(f.root, "hash-object", "-w", "notes");
			git(
				f.root,
				"update-index",
				"--add",
				"--cacheinfo",
				`100644,${stagedObject},${entry.path}`,
			);
		},
	});
	assert.equal(result.status, "incomplete");
	assert.match(
		git(f.root, "ls-files", "--stage", "--", entry.path),
		new RegExp(`100644 ${stagedObject}`),
	);
	assert.equal(
		JSON.parse(f.read("project/repositories.json")).repositories.length,
		3,
	);
});

test("matching existing submodules with custom section names are reused without duplicate local configuration", () => {
	const f = fixture({ examples: false });
	const entry = f.entry();
	assert.equal(
		save(f.root, reviewed(f.root, [entry]), options).status,
		"saved",
	);
	git(
		f.root,
		"config",
		"--file",
		".gitmodules",
		"--rename-section",
		`submodule.${entry.path}`,
		"submodule.custom-name",
	);
	git(f.root, "add", ".gitmodules");
	git(
		f.root,
		"config",
		"--rename-section",
		`submodule.${entry.path}`,
		"submodule.custom-name",
	);
	const request = reviewed(f.root, [entry]);
	const result = save(f.root, request, options);
	assert.equal(result.status, "saved", result.error);
	assert.equal(result.repositories[0].state, "registered");
	assert.equal(
		git(f.root, "config", "--get", "submodule.custom-name.url"),
		entry.url,
	);
	const missing = spawnSync(
		"git",
		["config", "--get", `submodule.${entry.path}.url`],
		{ cwd: f.root },
	);
	assert.equal(missing.status, 1);
	assert.deepEqual(result.createdPaths, []);
});

test("concurrent target local configuration changes are conflicts and never overwritten", () => {
	const f = fixture();
	const entry = f.entry();
	const result = save(f.root, reviewed(f.root, [entry]), {
		...options,
		beforeRegister() {
			git(
				f.root,
				"config",
				`submodule.${entry.path}.url`,
				"https://other.example/other/repo",
			);
		},
	});
	assert.equal(result.status, "incomplete");
	assert.equal(
		git(f.root, "config", "--get", `submodule.${entry.path}.url`),
		"https://other.example/other/repo",
	);
	assert.equal(git(f.root, "ls-files", "--stage", "--", entry.path), "");
});

test("template cleanup retains standalone and inline comments in working and indexed .gitmodules", () => {
	const f = fixture();
	const entry = f.entry();
	const original = `${f
		.read(".gitmodules")
		.replace(
			'[submodule "modules/example-core"]',
			'[submodule "modules/example-core"] # keep header comment',
		)
		.replace(
			"path = modules/example-core",
			"path = modules/example-core # keep path comment",
		)}# keep trailing comment\n`;
	f.write(".gitmodules", original);
	git(f.root, "add", ".gitmodules");
	const result = save(f.root, reviewed(f.root, [entry]), options);
	assert.equal(result.status, "saved", result.error);
	for (const text of [
		f.read(".gitmodules"),
		git(f.root, "show", ":.gitmodules"),
	]) {
		assert.match(text, /keep header comment/);
		assert.match(text, /keep path comment/);
		assert.match(text, /keep trailing comment/);
		assert.doesNotMatch(text, /path = modules\/example-core/);
	}
});

test("save isolates repository-local Git hook variables from fixture clones", () => {
	const f = fixture();
	const entry = f.entry();
	const parentIndex = fs.readFileSync(path.join(f.root, ".git/index"));
	const helperUrl = new URL("./add-project.mjs", import.meta.url).href;
	const child = spawnSync(
		process.execPath,
		[
			"--input-type=module",
			"-e",
			`
		import { preview, save } from ${JSON.stringify(helperUrl)};
		const root = process.argv[1];
		const request = JSON.parse(process.argv[2]);
		const result = preview(root, request, { allowLocal: true });
		console.log(JSON.stringify(save(root, { ...request, token: result.token }, { allowLocal: true })));
	`,
			f.root,
			JSON.stringify({ entries: [entry] }),
		],
		{
			encoding: "utf8",
			env: {
				...process.env,
				GIT_INDEX_FILE: ".git/index",
				GIT_DIR: path.join(f.root, ".git"),
				GIT_WORK_TREE: f.root,
			},
		},
	);
	assert.equal(child.status, 0, child.stderr);
	const result = JSON.parse(child.stdout);
	assert.equal(result.status, "saved", result.error);
	assert.equal(
		git(path.join(f.root, entry.path), "rev-parse", "HEAD"),
		result.repositories[0].revision,
	);
	assert.notDeepEqual(
		fs.readFileSync(path.join(f.root, ".git/index")),
		parentIndex,
	);
	assert.match(
		git(f.root, "ls-files", "--stage", "--", entry.path),
		/^160000 /,
	);
});

import { expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { readTaskSummaries } from "../taskSummaryFiles";

test("loads the latest summary and isolates malformed and symlinked entries", () => {
	const root = fs.mkdtempSync(path.join(os.tmpdir(), "task-summary-files-"));
	try {
		const directory = path.join(root, "task-summary");
		fs.mkdirSync(directory);
		const name = "prd-20261127-one";
		const file = path.join(directory, `${name}.md`);
		const body = "# Task One\n\n- Task status: In progress\n";
		fs.writeFileSync(file, body);
		fs.writeFileSync(path.join(root, "outside.md"), "# Outside");
		fs.symlinkSync(
			path.join(root, "outside.md"),
			path.join(directory, "prd-20261127-two.md"),
		);
		fs.writeFileSync(
			path.join(directory, "prd-20261127-broken.md"),
			"Missing heading",
		);
		fs.writeFileSync(path.join(directory, "other.md"), "# Ignored");

		expect(readTaskSummaries(root)).toMatchObject({
			[name]: { content: body, isTaskSummary: true, status: "In progress" },
			"prd-20261127-two": "unavailable",
			"prd-20261127-broken": "unavailable",
		});
		expect(Object.keys(readTaskSummaries(root))).toHaveLength(3);
		const saved = `${body}\nLatest result.\n`;
		fs.writeFileSync(file, saved);
		expect(readTaskSummaries(root)[name]).toMatchObject({
			content: saved,
		});

		const relocated = path.join(root, "relocated");
		fs.renameSync(directory, relocated);
		fs.symlinkSync(relocated, directory, "dir");
		expect(readTaskSummaries(root)).toEqual({});
	} finally {
		fs.rmSync(root, { recursive: true, force: true });
	}
});

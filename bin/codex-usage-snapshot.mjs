import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const uuid = /^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i;
const tailLimit = 2 * 1024 * 1024;
const metadataLimit = 64 * 1024;

function sessionsDirectory() {
	return path.join(
		process.env.CODEX_HOME || path.join(os.homedir(), ".codex"),
		"sessions",
	);
}

function parseLine(line) {
	try {
		return JSON.parse(line);
	} catch {
		return undefined;
	}
}

function folders(directory, pattern) {
	return fs
		.readdirSync(directory, { withFileTypes: true })
		.filter((entry) => entry.isDirectory() && pattern.test(entry.name))
		.map(({ name }) => path.join(directory, name));
}

function findRollout(directory, matches) {
	const candidates = [];
	for (const year of folders(directory, /^\d{4}$/)) {
		for (const month of folders(year, /^\d{2}$/)) {
			for (const day of folders(month, /^\d{2}$/)) {
				for (const file of fs.readdirSync(day, { withFileTypes: true })) {
					if (
						!file.isFile() ||
						!file.name.startsWith("rollout-") ||
						!file.name.endsWith(".jsonl")
					)
						continue;

					const id = file.name.slice(-42, -6);
					if (
						file.name.at(-43) === "-" &&
						uuid.test(id) &&
						matches(id.toLowerCase())
					) {
						candidates.push({
							filename: path.join(day, file.name),
							id: id.toLowerCase(),
						});
					}
				}
			}
		}
	}
	return candidates.length === 1 ? candidates[0] : undefined;
}

function alias(threadId) {
	return createHash("sha256")
		.update(`workflow-codex-usage:${threadId.toLowerCase()}`)
		.digest("hex");
}

function section(fd, length, position) {
	const buffer = Buffer.alloc(length);
	const bytes = fs.readSync(fd, buffer, 0, length, position);
	return buffer.subarray(0, bytes).toString("utf8");
}

function safeUsage(value) {
	const {
		input_tokens: input,
		output_tokens: output,
		total_tokens: total,
	} = value ?? {};
	if (
		![input, output, total].every(
			(number) => Number.isSafeInteger(number) && number >= 0,
		) ||
		input + output !== total
	)
		return undefined;
	return { inputTokens: input, outputTokens: output, totalTokens: total };
}

function* snapshots(fd, fileSize, threadAlias, parentAlias) {
	const offset = Math.max(0, fileSize - tailLimit);
	const lines = section(fd, fileSize - offset, offset).split("\n");
	if (offset > 0) lines.shift();
	for (const line of lines.reverse()) {
		const event = parseLine(line);
		if (event?.type !== "event_msg" || event.payload?.type !== "token_count")
			continue;

		const total = safeUsage(event.payload.info?.total_token_usage);
		if (!total || !Number.isFinite(Date.parse(event.timestamp))) continue;
		yield {
			threadAlias,
			parentAlias,
			asOf: new Date(event.timestamp).toISOString(),
			total,
		};
	}
}

function readRollout(directory, matches, inspect) {
	try {
		const rollout = findRollout(directory, matches);
		if (!rollout) return null;

		const fd = fs.openSync(
			rollout.filename,
			fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK,
		);
		try {
			const file = fs.fstatSync(fd);
			if (!file.isFile()) return null;
			const header = parseLine(
				section(fd, Math.min(file.size, metadataLimit), 0).split("\n", 1)[0],
			);
			if (
				header?.type !== "session_meta" ||
				header.payload?.id?.toLowerCase() !== rollout.id
			)
				return null;

			const parent =
				header.payload.source?.subagent?.thread_spawn?.parent_thread_id;
			const parentAlias =
				typeof parent === "string" && uuid.test(parent) ? alias(parent) : null;
			return inspect(snapshots(fd, file.size, alias(rollout.id), parentAlias));
		} finally {
			fs.closeSync(fd);
		}
	} catch {
		return null;
	}
}

export function readCodexSnapshot(
	directory = sessionsDirectory(),
	// A worker can inherit its coordinator's session ID. Use the current thread first.
	threadId = process.env.CODEX_THREAD_ID || process.env.CODEX_SESSION_ID,
) {
	if (typeof threadId !== "string" || !uuid.test(threadId)) return null;
	return readRollout(
		directory,
		(id) => id === threadId.toLowerCase(),
		(records) => records.next().value ?? null,
	);
}

function isSameSnapshot(native, claimed) {
	return (
		native.asOf === claimed.asOf &&
		native.total.inputTokens === claimed.total?.inputTokens &&
		native.total.outputTokens === claimed.total?.outputTokens &&
		native.total.totalTokens === claimed.total?.totalTokens
	);
}

export function verifyCodexChildSnapshots(
	parentAlias,
	before,
	after,
	directory = sessionsDirectory(),
) {
	if (
		!parentAlias ||
		before?.threadAlias === parentAlias ||
		before?.threadAlias !== after?.threadAlias
	)
		return false;
	return (
		readRollout(
			directory,
			(id) => alias(id) === before?.threadAlias,
			(records) => {
				let sawBefore = false;
				let sawAfter = false;
				for (const native of records) {
					if (native.parentAlias !== parentAlias) return false;
					sawBefore ||= isSameSnapshot(native, before);
					sawAfter ||= isSameSnapshot(native, after);
					if (sawBefore && sawAfter) return true;
				}
				return false;
			},
		) === true
	);
}

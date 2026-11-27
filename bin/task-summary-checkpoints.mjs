import { createHash, randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
	readCodexSnapshot,
	verifyCodexChildSnapshots,
} from "./codex-usage-snapshot.mjs";
import { normalizeUsage, summarizeUsage } from "./task-summary-usage.mjs";

const featurePattern =
	/^(?:prd|pending-research)-\d{8}-[a-z0-9][a-z0-9-]{0,99}$/;
const stepPattern = /^[a-z0-9][a-z0-9 ._:/-]{0,119}$/i;
const attemptPattern = /^[a-z0-9][a-z0-9._-]{0,79}$/i;
const threadAliasPattern = /^[a-f0-9]{64}$/;
const usageRecords =
	/(^### Usage records\r?\n\r?\n```json\r?\n)([\s\S]*?)(\r?\n```)/m;

function ensureDirectory(directory) {
	try {
		fs.mkdirSync(directory, { mode: 0o700 });
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
	}
	if (!fs.lstatSync(directory).isDirectory()) {
		throw new Error("A summary directory is not a regular directory.");
	}
}

function validateFeature(feature) {
	if (typeof feature !== "string" || !featurePattern.test(feature)) {
		throw new Error("Use a lowercase PRD ID or pending research ID.");
	}
}

function validateStep(step, attempt) {
	if (
		typeof step !== "string" ||
		!stepPattern.test(step) ||
		step.toLowerCase() === "step" ||
		typeof attempt !== "string" ||
		!attemptPattern.test(attempt)
	) {
		throw new Error("Use a step name and a stable, path-free attempt ID.");
	}
}

function readRegularFile(filename) {
	const entry = fs.lstatSync(filename);
	if (!entry.isFile()) throw new Error("Expected a regular summary file.");
	const fd = fs.openSync(
		filename,
		fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW | fs.constants.O_NONBLOCK,
	);
	try {
		const file = fs.fstatSync(fd);
		if (
			!file.isFile() ||
			file.ino !== entry.ino ||
			file.dev !== entry.dev ||
			file.size > 2 * 1024 * 1024
		) {
			throw new Error(
				"Summary file changed identity or exceeded the permitted size.",
			);
		}
		return fs.readFileSync(fd, "utf8");
	} finally {
		fs.closeSync(fd);
	}
}

function atomicWrite(filename, content, mode = 0o600, previous) {
	const temporary = path.join(
		path.dirname(filename),
		`.summary-${randomUUID()}.tmp`,
	);
	try {
		fs.writeFileSync(temporary, content, { flag: "wx", mode });
		fs.chmodSync(temporary, mode);
		if (previous !== undefined && readRegularFile(filename) !== previous) {
			throw new Error(
				"The summary changed during measurement. Retry the same receipt.",
			);
		}
		fs.renameSync(temporary, filename);
	} finally {
		fs.rmSync(temporary, { force: true });
	}
}

function withFeatureLock(root, feature, action) {
	validateFeature(feature);
	const metadata = path.join(root, ".agent-workflows");
	ensureDirectory(metadata);
	const directory = path.join(metadata, "summary-checkpoints");
	ensureDirectory(directory);
	const lock = path.join(directory, `${feature}.lock`);
	try {
		fs.mkdirSync(lock);
	} catch (error) {
		if (error.code !== "EEXIST") throw error;
		throw new Error(
			"A summary update is in progress. Retry after it finishes.",
		);
	}
	try {
		return action(path.join(directory, `${feature}.json`));
	} finally {
		fs.rmdirSync(lock);
	}
}

function readState(filename) {
	try {
		return JSON.parse(readRegularFile(filename));
	} catch (error) {
		if (error.code !== "ENOENT") throw error;
		return { active: null, completed: {} };
	}
}

function snapshotReport(snapshot) {
	return {
		method: "thread/tokenUsage/updated",
		params: {
			threadId: snapshot.threadAlias,
			tokenUsage: { total: snapshot.total },
		},
	};
}

function checkpointReceipt(before, after, step, identity) {
	if (
		!before ||
		!after ||
		!threadAliasPattern.test(before.threadAlias) ||
		before.threadAlias !== after.threadAlias ||
		!(before.asOf < after.asOf)
	)
		return null;
	const id = createHash("sha256")
		.update(JSON.stringify([before.threadAlias, ...identity]))
		.digest("hex");
	try {
		return normalizeUsage("codex", {
			id: `checkpoint-${id}`,
			step,
			asOf: after.asOf,
			before: snapshotReport(before),
			report: snapshotReport(after),
		});
	} catch {
		// A reset or incomplete native sample has no attributable interval.
		return null;
	}
}

function formatCount(value) {
	return new Intl.NumberFormat("en-US").format(value);
}

function usageSection(content) {
	const start = content.indexOf("## Token usage");
	const end = content.indexOf("### Usage records", start);
	if (start < 0 || end < 0)
		throw new Error("Summary has no supported token section.");
	return {
		start,
		end,
		lines: content.slice(start, end).trimEnd().split(/\r?\n/),
	};
}

function writeMeasurement(
	root,
	feature,
	step,
	receipt,
	coverage,
	note,
	reconcile = false,
) {
	const directory = path.join(root, "task-summary");
	if (!fs.lstatSync(directory).isDirectory())
		throw new Error("Missing regular task-summary directory.");
	const filename = path.join(directory, `${feature}.md`);
	const content = readRegularFile(filename);
	if (
		!/^- Template version: 1\s*$/m.test(content) ||
		!usageRecords.test(content)
	) {
		throw new Error(
			"The summary must exist and use the version 1 token ledger.",
		);
	}
	const records = JSON.parse(content.match(usageRecords)[2]);
	const usage = summarizeUsage(receipt ? [...records, receipt] : records);
	const matching = usage.steps.find((measurement) => measurement.step === step);
	const stepRecords = usage.records.filter((record) => record.step === step);
	const { start, end, lines } = usageSection(content);
	const index = lines.findIndex((line) => line.startsWith(`| ${step} |`));
	const previousCoverage =
		index < 0 ? "" : lines[index].split("|").at(-2)?.trim();
	if (
		receipt &&
		coverage === "Partial" &&
		/^Complete\b/.test(previousCoverage ?? "") &&
		JSON.stringify(summarizeUsage(records).records) ===
			JSON.stringify(usage.records)
	) {
		return { status: "recorded", receipt };
	}
	const priorGap =
		!reconcile && /^(?:Partial|Unavailable)\b/.test(previousCoverage ?? "");
	if (reconcile && coverage === "Complete" && !matching)
		throw new Error("No verified measurements are recorded for this step.");
	const cacheReads = stepRecords.reduce(
		(sum, record) => sum + (record.cacheRead ?? 0),
		0,
	);
	const stepCoverage = cacheReads > 0 || priorGap ? "Partial" : coverage;
	const gapNote =
		priorGap && coverage === "Complete"
			? " Earlier coverage gaps remain until the full step is reconciled."
			: "";
	const cacheNote =
		cacheReads > 0
			? ` Antigravity reported ${formatCount(cacheReads)} cache reads separately. The input column keeps provider-reported input.`
			: "";
	const display = (values) => [...new Set(values)].join(", ") || "Unavailable";
	const fields = [
		step,
		display(
			stepRecords.map((record) =>
				record.model ? `${record.runtime} / ${record.model}` : record.runtime,
			),
		),
		display(stepRecords.map(({ source }) => source)),
		matching?.asOf ?? "Unavailable",
		...(matching
			? [matching.input, matching.output, matching.total].map(formatCount)
			: ["Unavailable", "Unavailable", "Unavailable"]),
		`${matching ? stepCoverage : "Unavailable"}. ${note}${gapNote}${cacheNote}`,
	];

	const row = `| ${fields.join(" | ")} |`;
	if (index >= 0) lines[index] = row;
	else lines.push(row);
	const section = lines.join("\n");
	let updated = `${content.slice(0, start)}${section}\n\n${content.slice(end)}`;
	updated = updated.replace(
		usageRecords,
		(_match, opening, _body, closing) =>
			`${opening}${JSON.stringify(usage.records, null, 2)}${closing}`,
	);
	if (usage.totals) {
		const { input, output, total } = usage.totals;
		const counts = `${formatCount(input)} input, ${formatCount(output)} output, ${formatCount(total)} total`;
		updated = updated
			.replace(
				/^- Cumulative input, output, and total tokens: .*$/m,
				`- Cumulative input, output, and total tokens: ${counts}.`,
			)
			.replace(
				/^- Usage as of, coverage, and gaps: .*$/m,
				`- Usage as of, coverage, and gaps: ${usage.asOf} · Partial until the coordinator verifies coverage for all steps and workers. See step rows for gaps.`,
			);
		if (updated.includes("- Task status: Completed")) {
			updated = updated.replace(
				/^- Final token totals and coverage: .*$/m,
				`- Final token totals and coverage: ${counts} as of ${usage.asOf}. Partial until reconciled.`,
			);
		}
	}
	if (updated !== content) {
		updated = updated.replace(
			/^- Last updated: .*$/m,
			`- Last updated: ${new Date().toISOString()}`,
		);
		atomicWrite(
			filename,
			updated,
			fs.lstatSync(filename).mode & 0o777,
			content,
		);
	}
	return {
		status: receipt ? "recorded" : matching ? "reconciled" : "unavailable",
		receipt,
	};
}

function readEnvelope() {
	try {
		return JSON.parse(fs.readFileSync(0, "utf8"));
	} catch {
		throw new Error("Pass valid JSON on stdin.");
	}
}

function normalizeCoverage(coverage) {
	if (coverage !== "complete" && coverage !== "partial")
		throw new Error("Use complete or partial for step coverage.");
	return coverage === "complete" ? "Complete" : "Partial";
}

function checkpoint(
	root,
	takeSnapshot,
	action,
	feature,
	step,
	attempt,
	nextStep,
	nextAttempt,
) {
	validateStep(step, attempt);
	if (action === "next") validateStep(nextStep, nextAttempt);
	return withFeatureLock(root, feature, (filename) => {
		const key = JSON.stringify([step, attempt]);
		const state = readState(filename);
		if (action === "start") {
			if (state.completed[key]) return { status: "finished" };
			if (state.active && state.active.key !== key)
				throw new Error("Finish the active step before starting another.");
			if (state.active?.sample) return { status: "started", available: true };

			const sample = takeSnapshot();
			state.active = { key, sample };
			atomicWrite(filename, JSON.stringify(state));
			return { status: "started", available: Boolean(sample) };
		}

		let sealed = state.completed[key];
		if (!sealed) {
			if (state.active?.key !== key)
				throw new Error(
					"Start this exact step and attempt before finishing it.",
				);
			const following =
				action === "next" ? JSON.stringify([nextStep, nextAttempt]) : null;
			if (following && (following === key || state.completed[following])) {
				throw new Error("The next step needs a new attempt.");
			}
			const sample = takeSnapshot();
			sealed = {
				receipt: checkpointReceipt(state.active.sample, sample, step, [
					"main",
					step,
					attempt,
				]),
				following,
			};
			state.completed[key] = sealed;
			state.active = following ? { key: following, sample } : null;
			// Preserve the cutoff before writing the summary so a failed write can be retried.
			atomicWrite(filename, JSON.stringify(state));
		} else if (
			action === "next" &&
			sealed.following !== JSON.stringify([nextStep, nextAttempt])
		) {
			throw new Error("The sealed checkpoint has a different next step.");
		}
		return writeMeasurement(
			root,
			feature,
			step,
			sealed.receipt,
			"Partial",
			sealed.receipt
				? "Main Codex thread measured. Reconcile any worker or unobserved usage."
				: "No distinct, monotonic Codex counter was available for both boundaries.",
		);
	});
}

function recordChild(
	root,
	feature,
	step,
	attempt,
	accounting,
	parent,
	before,
	after,
) {
	validateStep(step, attempt);
	if (!verifyCodexChildSnapshots(parent, before, after)) {
		throw new Error(
			"Could not match both usage samples to the current thread's native child rollout.",
		);
	}
	const receipt = checkpointReceipt(before, after, step, [
		"child",
		before.asOf,
		after.asOf,
	]);
	if (!receipt)
		throw new Error("No distinct, monotonic child counter was available.");

	return withFeatureLock(root, feature, (filename) => {
		const state = readState(filename);
		const children = state.children ?? {};
		const previous = children[receipt.id];
		if (
			previous &&
			(previous.step !== step ||
				previous.attempt !== attempt ||
				(previous.accounting !== "unknown" &&
					previous.accounting !== accounting))
		) {
			throw new Error(
				"This native child interval was already assigned a different step, attempt, or accounting scope.",
			);
		}
		if (
			accounting !== "unknown" &&
			Object.entries(children).some(
				([id, child]) =>
					id !== receipt.id &&
					child.threadAlias === before.threadAlias &&
					child.accounting !== "unknown" &&
					(accounting === "excluded" || child.accounting === "excluded") &&
					child.start < after.asOf &&
					before.asOf < child.end,
			)
		) {
			throw new Error(
				"This interval overlaps already assigned usage from the same child.",
			);
		}
		children[receipt.id] = {
			step,
			attempt,
			accounting,
			threadAlias: before.threadAlias,
			start: before.asOf,
			end: after.asOf,
		};
		atomicWrite(filename, JSON.stringify({ ...state, children }));
		if (accounting === "included") return { status: "covered-by-parent" };
		return writeMeasurement(
			root,
			feature,
			step,
			accounting === "excluded" ? receipt : null,
			"Partial",
			accounting === "excluded"
				? "Separate child usage recorded. Verify full step scope."
				: "Child usage was observed, but overlap with parent counters was not verified.",
		);
	});
}

export function taskSummaryCheckpointCommand(
	root,
	args,
	takeSnapshot = readCodexSnapshot,
) {
	const [command, first, second, third, fourth, fifth, sixth] = args;
	if (command === "snapshot" && args.length === 1) {
		return { snapshot: takeSnapshot() };
	}
	if (
		command === "checkpoint" &&
		((args.length === 5 && ["start", "finish"].includes(first)) ||
			(args.length === 7 && first === "next"))
	) {
		return checkpoint(
			root,
			takeSnapshot,
			first,
			second,
			third,
			fourth,
			fifth,
			sixth,
		);
	}
	if (command === "record" && args.length === 4) {
		const coverage = normalizeCoverage(third);
		const envelope = readEnvelope();
		const receipt = normalizeUsage(second, envelope);
		validateStep(receipt.step, receipt.id);
		return withFeatureLock(root, first, () =>
			writeMeasurement(
				root,
				first,
				receipt.step,
				receipt,
				coverage,
				"Scoped native runtime result.",
			),
		);
	}
	if (command === "reconcile" && args.length === 4) {
		validateStep(second, "reconcile");
		const coverage = normalizeCoverage(third);
		return withFeatureLock(root, first, () =>
			writeMeasurement(
				root,
				first,
				second,
				null,
				coverage,
				"Coordinator reconciled all known receipts for this step.",
				true,
			),
		);
	}
	if (
		command === "record-child" &&
		args.length === 5 &&
		["excluded", "included", "unknown"].includes(fourth)
	) {
		const { before, after } = readEnvelope();
		return recordChild(
			root,
			first,
			second,
			third,
			fourth,
			takeSnapshot()?.threadAlias,
			before,
			after,
		);
	}
	throw new Error(
		"Usage: workflows summary snapshot | checkpoint start/finish/next <feature> <step> <attempt> [<next-step> <next-attempt>] | record <feature> <runtime> <complete|partial> | reconcile <feature> <step> <complete|partial> | record-child <feature> <step> <attempt> <excluded|included|unknown>",
	);
}

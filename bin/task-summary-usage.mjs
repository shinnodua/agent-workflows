import fs from "node:fs";

const sources = {
	codex: "Codex completed turn",
	claude: "Claude Code result",
	gemini: "Gemini CLI model stats",
	antigravity: "Antigravity CLI result",
};
const codexCounterSource = "Codex thread counters";

function count(value) {
	if (!Number.isSafeInteger(value) || value < 0) {
		throw new Error("Token counts must be nonnegative safe integers.");
	}
	return value;
}

function counts(input, output, reportedTotal) {
	const total = count(input + output);
	if (reportedTotal !== undefined && count(reportedTotal) !== total) {
		throw new Error("Input and output do not account for the provider total.");
	}
	return { input, output, total };
}

function nativeCounts(runtime, report) {
	switch (runtime) {
		case "codex": {
			const usage =
				report?.type === "turn.completed" ? report.usage : undefined;
			return counts(count(usage?.input_tokens), count(usage?.output_tokens));
		}
		case "claude": {
			const usage = report?.type === "result" ? report.usage : undefined;
			const input =
				count(usage?.input_tokens) +
				count(usage.cache_read_input_tokens ?? 0) +
				count(usage.cache_creation_input_tokens ?? 0);
			return counts(count(input), count(usage.output_tokens));
		}
		case "gemini": {
			const models = Object.values(report?.stats?.models ?? {});
			if (models.length === 0)
				throw new Error("Gemini CLI model stats are unavailable.");
			return sum(
				models.map(({ tokens }) => {
					const input = count(tokens?.prompt);
					const output = count(tokens.candidates) + count(tokens.thoughts ?? 0);
					const total = count(tokens.total);
					// Tool prompt tokens are inputs if separately included in this report's total.
					const tools = count(tokens.tool ?? 0);
					return counts(
						input + (total === input + output ? 0 : tools),
						output,
						total,
					);
				}),
			);
		}
		case "antigravity": {
			const { usage } = antigravityResult(report);
			const input = count(usage?.input_tokens);
			const output = count(usage.output_tokens);
			if (
				count(usage.cache_read_tokens ?? 0) > input ||
				count(usage.thinking_tokens ?? 0) > output
			) {
				throw new Error(
					"Antigravity usage reports an ambiguous cache or thinking breakdown.",
				);
			}
			return counts(input, output, count(usage.total_tokens));
		}
		default:
			throw new Error(
				"Unsupported usage runtime. Use codex, claude, gemini, or antigravity.",
			);
	}
}

function antigravityResult(report) {
	const result = report?.event === "result" ? report.result : report;
	if (
		(report?.event !== undefined && report.event !== "result") ||
		typeof result?.conversation_id !== "string" ||
		!result.conversation_id ||
		!["SUCCESS", "ERROR"].includes(result.status) ||
		!Number.isSafeInteger(result.num_turns) ||
		result.num_turns < 1
	) {
		throw new Error(
			"Provide a completed Antigravity invocation or session result.",
		);
	}
	return result;
}

function codexThreadSnapshot(report) {
	const params =
		report?.method === "thread/tokenUsage/updated" ? report.params : undefined;
	if (typeof params?.threadId !== "string" || !params.threadId) {
		throw new Error(
			"Provide a Codex thread usage snapshot with its thread identity.",
		);
	}
	const total = params.tokenUsage?.total;
	return {
		threadId: params.threadId,
		...counts(
			count(total?.inputTokens),
			count(total?.outputTokens),
			count(total?.totalTokens),
		),
	};
}

function delta(latest, baseline) {
	return counts(
		count(latest.input - baseline.input),
		count(latest.output - baseline.output),
	);
}

function sum(records) {
	let input = 0;
	let output = 0;
	for (const record of records) {
		input += record.input;
		output += record.output;
	}
	return counts(count(input), count(output));
}

function cleanLabel(value, field) {
	if (
		typeof value !== "string" ||
		!/^[a-z0-9][a-z0-9 ._:/-]{0,119}$/i.test(value)
	) {
		throw new Error(
			`Invalid ${field}. Supply a short non-sensitive identifier.`,
		);
	}
	return value;
}

function metadata(runtime, record) {
	if (!Object.hasOwn(sources, runtime))
		throw new Error("Unsupported usage runtime.");
	if (
		!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?Z$/.test(record?.asOf)
	) {
		throw new Error("Usage cutoff must be a UTC ISO timestamp.");
	}
	const date = new Date(record.asOf);
	if (!Number.isFinite(date.getTime()))
		throw new Error("Invalid usage cutoff.");
	return {
		runtime,
		id: cleanLabel(record.id, "invocation ID"),
		step: record.step == null ? null : cleanLabel(record.step, "step"),
		model: record.model == null ? undefined : cleanLabel(record.model, "model"),
		asOf: date.toISOString(),
		source:
			runtime === "codex" && record.source === codexCounterSource
				? codexCounterSource
				: sources[runtime],
	};
}

export function normalizeUsage(runtime, record) {
	const details = metadata(runtime, { ...record, source: undefined });
	if (
		runtime === "codex" &&
		record.report?.method === "thread/tokenUsage/updated"
	) {
		const latest = codexThreadSnapshot(record.report);
		const baseline = codexThreadSnapshot(record.before);
		if (latest.threadId !== baseline.threadId) {
			throw new Error("Codex usage snapshots must belong to the same thread.");
		}
		return {
			...details,
			source: codexCounterSource,
			...delta(latest, baseline),
		};
	}
	const latest = nativeCounts(runtime, record.report);
	if (record.before === undefined) return { ...details, ...latest };

	if (runtime !== "antigravity") {
		throw new Error(
			"Use Codex thread snapshots or Antigravity session results for native before/after totals.",
		);
	}
	const first = antigravityResult(record.before);
	const last = antigravityResult(record.report);
	if (
		first.conversation_id !== last.conversation_id ||
		first.num_turns >= last.num_turns
	) {
		throw new Error(
			"Antigravity totals must belong to the same session and advance to a later turn.",
		);
	}

	const baseline = nativeCounts(runtime, record.before);
	return { ...details, ...delta(latest, baseline) };
}

export function summarizeUsage(records) {
	if (!Array.isArray(records))
		throw new Error("Pass an array of normalized usage records.");
	const byInvocation = new Map();
	for (const record of records) {
		const details = metadata(record?.runtime, record);
		const next = {
			...details,
			...counts(count(record.input), count(record.output), record.total),
		};
		const key = JSON.stringify([details.runtime, details.id]);
		const previous = byInvocation.get(key);
		if (previous && previous.step !== next.step) {
			throw new Error("A usage invocation is assigned to multiple steps.");
		}
		if (
			previous?.asOf === next.asOf &&
			(previous.input !== next.input || previous.output !== next.output)
		) {
			throw new Error("Conflicting token measurements have the same cutoff.");
		}
		if (!previous || previous.asOf < next.asOf) byInvocation.set(key, next);
	}

	const unique = [...byInvocation.values()];
	const byStep = new Map();
	for (const record of unique) {
		if (!byStep.has(record.step)) byStep.set(record.step, []);
		byStep.get(record.step).push(record);
	}
	return {
		totals: unique.length ? sum(unique) : null,
		asOf:
			unique
				.map(({ asOf }) => asOf)
				.sort()
				.at(-1) ?? null,
		steps: [...byStep].map(([step, items]) => ({
			step,
			...sum(items),
			asOf: items
				.map(({ asOf }) => asOf)
				.sort()
				.at(-1),
		})),
		records: unique,
	};
}

export function taskSummaryUsageCommand(args) {
	let data;
	try {
		data = JSON.parse(fs.readFileSync(0, "utf8"));
	} catch {
		throw new Error("Provide a valid usage JSON object or array on stdin.");
	}

	if (args.length === 2 && args[0] === "usage") {
		console.log(JSON.stringify(normalizeUsage(args[1], data), null, 2));
		return;
	}
	if (args.length === 1 && args[0] === "totals") {
		console.log(JSON.stringify(summarizeUsage(data), null, 2));
		return;
	}
	throw new Error("Usage: workflows summary usage <runtime> | totals");
}

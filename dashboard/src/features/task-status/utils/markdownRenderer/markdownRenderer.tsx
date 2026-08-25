import type { ReactNode } from "react";
import {
	type MarkdownRenderContext,
	renderInlineMarkdown,
} from "../markdownInline/markdownInline";
import styles from "./markdownRenderer.module.css";

type MarkdownBlockResult = {
	nextIndex: number;
	node?: ReactNode;
};

export function renderMarkdownBlocks(
	markdown: string,
	context: MarkdownRenderContext,
) {
	const lines = markdown.replace(/\r\n/g, "\n").split("\n");
	const blocks: ReactNode[] = [];
	let index = 0;

	while (index < lines.length) {
		const result = parseMarkdownBlock(lines, index, context);
		index = result.nextIndex;

		if (result.node) {
			blocks.push(result.node);
		}
	}

	return blocks;
}

function parseMarkdownBlock(
	lines: string[],
	index: number,
	context: MarkdownRenderContext,
): MarkdownBlockResult {
	const line = lines[index] ?? "";

	if (!line.trim()) {
		return { nextIndex: index + 1 };
	}

	if (line.startsWith("```")) {
		return parseCodeBlock(lines, index);
	}

	if (/^(#{1,4})\s+/.test(line)) {
		return parseHeading(line, index, context);
	}

	if (/^[-*]\s+/.test(line)) {
		return parseList(lines, index, context, "unordered");
	}

	if (/^\d+\.\s+/.test(line)) {
		return parseList(lines, index, context, "ordered");
	}

	if (line.startsWith(">")) {
		return parseQuote(lines, index, context);
	}

	if (/^-{3,}$/.test(line.trim())) {
		return {
			nextIndex: index + 1,
			node: <hr className={styles.divider} key={`hr-${index}`} />,
		};
	}

	if (isTableStart(lines, index)) {
		return parseTable(lines, index, context);
	}

	return parseParagraph(lines, index, context);
}

function parseCodeBlock(lines: string[], index: number) {
	const codeLines: string[] = [];
	let nextIndex = index + 1;

	while (nextIndex < lines.length && !lines[nextIndex]?.startsWith("```")) {
		codeLines.push(lines[nextIndex] ?? "");
		nextIndex += 1;
	}

	return {
		nextIndex: nextIndex + 1,
		node: (
			<pre className={styles.codeBlock} key={`code-${nextIndex}`}>
				<code className={styles.code}>{codeLines.join("\n")}</code>
			</pre>
		),
	};
}

function parseHeading(
	line: string,
	index: number,
	context: MarkdownRenderContext,
) {
	const heading = line.match(/^(#{1,4})\s+(.+)$/);
	const level = heading?.[1].length ?? 3;
	const text = heading?.[2] ?? line;
	const className = `${styles.heading} ${getHeadingClassName(level)}`;

	return {
		nextIndex: index + 1,
		node: (
			<h3 className={className} key={`h-${index}`}>
				{renderInlineMarkdown(text, context)}
			</h3>
		),
	};
}

function parseList(
	lines: string[],
	index: number,
	context: MarkdownRenderContext,
	type: "ordered" | "unordered",
) {
	const items = collectListItems(lines, index, type);
	const children = items.values.map((item) => (
		<li key={item}>{renderInlineMarkdown(item, context)}</li>
	));

	return {
		nextIndex: items.nextIndex,
		node:
			type === "ordered" ? (
				<ol className={styles.orderedList} key={`ol-${items.nextIndex}`}>
					{children}
				</ol>
			) : (
				<ul className={styles.unorderedList} key={`ul-${items.nextIndex}`}>
					{children}
				</ul>
			),
	};
}

function parseQuote(
	lines: string[],
	index: number,
	context: MarkdownRenderContext,
) {
	const quote = collectQuoteLines(lines, index);

	return {
		nextIndex: quote.nextIndex,
		node: (
			<blockquote className={styles.quote} key={`quote-${quote.nextIndex}`}>
				{quote.values.map((line) => (
					<p key={line}>{renderInlineMarkdown(line, context)}</p>
				))}
			</blockquote>
		),
	};
}

function parseTable(
	lines: string[],
	index: number,
	context: MarkdownRenderContext,
) {
	const tableLines = collectTableLines(lines, index);
	const [headerLine, , ...bodyLines] = tableLines.rows;
	const headers = splitTableRow(headerLine ?? "");

	return {
		nextIndex: tableLines.nextIndex,
		node: (
			<div className={styles.tableWrap} key={`table-${tableLines.nextIndex}`}>
				<table className={styles.table}>
					<thead className={styles.tableHead}>
						<tr>
							{headers.map((header) => (
								<th className={styles.tableHeader} key={header}>
									{renderInlineMarkdown(header, context)}
								</th>
							))}
						</tr>
					</thead>
					<tbody>
						{bodyLines.map((row) => (
							<TableRow context={context} key={row} row={row} />
						))}
					</tbody>
				</table>
			</div>
		),
	};
}

function TableRow(props: { context: MarkdownRenderContext; row: string }) {
	const { context, row } = props;

	return (
		<tr className={styles.tableRow}>
			{splitTableRow(row).map((cell) => (
				<td className={styles.tableCell} key={`${row}-${cell}`}>
					{renderInlineMarkdown(cell, context)}
				</td>
			))}
		</tr>
	);
}

function parseParagraph(
	lines: string[],
	index: number,
	context: MarkdownRenderContext,
) {
	const paragraph = collectParagraphLines(lines, index);

	return {
		nextIndex: paragraph.nextIndex,
		node: (
			<p className={styles.paragraph} key={`p-${paragraph.nextIndex}`}>
				{renderInlineMarkdown(paragraph.values.join(" "), context)}
			</p>
		),
	};
}

function collectListItems(
	lines: string[],
	index: number,
	type: "ordered" | "unordered",
) {
	const values: string[] = [];
	const pattern = type === "ordered" ? /^\d+\.\s+/ : /^[-*]\s+/;
	let nextIndex = index;

	while (nextIndex < lines.length && pattern.test(lines[nextIndex] ?? "")) {
		values.push((lines[nextIndex] ?? "").replace(pattern, ""));
		nextIndex += 1;
	}

	return { nextIndex, values };
}

function collectQuoteLines(lines: string[], index: number) {
	const values: string[] = [];
	let nextIndex = index;

	while (nextIndex < lines.length && lines[nextIndex]?.startsWith(">")) {
		values.push((lines[nextIndex] ?? "").replace(/^>\s?/, ""));
		nextIndex += 1;
	}

	return { nextIndex, values };
}

function collectTableLines(lines: string[], index: number) {
	const rows: string[] = [];
	let nextIndex = index;

	while (
		nextIndex < lines.length &&
		/^\s*\|.+\|\s*$/.test(lines[nextIndex] ?? "")
	) {
		rows.push(lines[nextIndex] ?? "");
		nextIndex += 1;
	}

	return { nextIndex, rows };
}

function collectParagraphLines(lines: string[], index: number) {
	const values: string[] = [];
	let nextIndex = index;

	while (canContinueParagraph(lines, nextIndex)) {
		values.push(lines[nextIndex] ?? "");
		nextIndex += 1;
	}

	return { nextIndex, values };
}

function canContinueParagraph(lines: string[], index: number) {
	const line = lines[index] ?? "";

	return (
		Boolean(line.trim()) &&
		!line.startsWith("```") &&
		!line.match(/^(#{1,4})\s+/) &&
		!/^[-*]\s+/.test(line) &&
		!/^\d+\.\s+/.test(line) &&
		!line.startsWith(">") &&
		!/^-{3,}$/.test(line.trim()) &&
		!isTableStart(lines, index)
	);
}

function isTableStart(lines: string[], index: number) {
	const current = lines[index] ?? "";
	const next = lines[index + 1] ?? "";

	return (
		/^\s*\|.+\|\s*$/.test(current) && /^\s*\|[\s:-]+\|[\s|:-]*$/.test(next)
	);
}

function splitTableRow(row: string) {
	return row
		.trim()
		.replace(/^\|/, "")
		.replace(/\|$/, "")
		.split("|")
		.map((cell) => cell.trim());
}

function getHeadingClassName(level: number) {
	if (level === 1) {
		return styles.headingLevelOne;
	}

	if (level === 2) {
		return styles.headingLevelTwo;
	}

	return styles.headingLevelDefault;
}

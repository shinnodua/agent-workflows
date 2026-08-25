import type {
	HardnessItem,
	HardnessItemEvidence,
	HardnessScanReport,
} from "../../../types";

export type FileScanResult = {
	relativePath: string;
	lineCount: number;
	rawHtmlTagsCount: number;
	destructuredParamPropsCount: number;
	missingBlockBracesCount: number;
	useCallbackCount: number;
	rawUseEffectCount: number;
	stateSyncEffectCount: number;
	consoleErrorCount: number;
	longFunctionCount: number;
	hardcodedStringJsxCount: number;
};

export const hardnessRuleCatalog: Omit<
	HardnessItem,
	"checked" | "passCount" | "totalCount" | "score" | "state" | "evidence"
>[] = [
	{
		id: "enforce-design-system-primitives",
		category: "Component Primitives",
		title: "Enforce Design System Primitives",
		description:
			"All UI elements MUST use the project design system primitives (Box, Row, Column, Text, Heading, Image, Link, Button, Input, DropdownSelect, Modal, Card, etc.). Raw HTML tags (div, span, p, button, input, select) are forbidden.",
		whatWasDone:
			"Audited and refactored UI components across the app repository and dashboard to replace raw HTML tags with the project design system primitives (Box, Flex, Text, Heading, Card, Button, Input, Select). Standardized component import patterns.",
		whatNeedsToBeDone:
			"Ensure newly created UI components continue to import and consume design system primitives. If a primitive is missing, request its addition in the project design system (the shared/core repository) rather than reverting to raw HTML tags.",
	},
	{
		id: "file-size-limitations",
		category: "Code Architecture",
		title: "File Size Limitations (< 350 Lines)",
		description:
			"Every file (including .ts, .tsx, .rs, and .md) MUST remain under 350 lines of code. Split files before they exceed this limit.",
		whatWasDone:
			"Evaluated all source files across modules/the app repository, modules/the shared/core repository, modules/the service repository, and workspace root. Split large modal views, toolbar components, and feature utilities into modular sub-files under 350 lines.",
		whatNeedsToBeDone:
			"Monitor growing feature modules during code reviews. Refactor any file approaching 300 lines by extracting child components, custom hooks, or constants into dedicated sub-files before hitting 350 lines.",
	},
	{
		id: "unpack-props-in-body",
		category: "Component Primitives",
		title: "Unpack Props in Body (props)",
		description:
			"Component props MUST be destructured inside the function body (const { foo } = props;), NOT in the parameter list signature (function Comp({ foo })). Accept props as a single parameter.",
		whatWasDone:
			"Standardized component parameter signatures across React feature folders to accept a single props parameter and unpack properties inside the component body, improving stack trace readability and typescript type inference.",
		whatNeedsToBeDone:
			"Maintain single props parameter signatures across all new components and refactors. Reject inline destructuring in PR reviews.",
	},
	{
		id: "require-block-braces",
		category: "Code Quality",
		title: "Require Block Braces for Control Flow",
		description:
			"All control flow statements (if, else, for, while) MUST use block syntax with curly braces {}. Single-line statements without braces are forbidden.",
		whatWasDone:
			"Converted all single-line if statements and early returns across the app repository and the shared/core repository to explicit block braces {}. Enforced via Biome linter configuration (useBlockStatements).",
		whatNeedsToBeDone:
			"Keep block braces rule active in biome.json and verify all new code files pass bun run lint without block statement warnings.",
	},
	{
		id: "enforce-i18n",
		category: "Component Primitives",
		title: "Enforce i18n Translation Keys",
		description:
			"All user-facing text MUST use translation keys via useTranslation from react-i18next. Never hardcode raw string literals in UI render logic.",
		whatWasDone:
			"Added translation keys to locales/en.json for auth, settings, dashboard, and core workflow views. Wrapped UI strings with t(...) calls.",
		whatNeedsToBeDone:
			"Audit new feature text additions, ensure corresponding keys exist in locales/en.json, and replace remaining hardcoded strings in legacy views.",
	},
	{
		id: "feature-based-architecture",
		category: "Code Architecture",
		title: "Feature-Based Code Architecture",
		description:
			"Organize code around feature folders (e.g. src/features/auth, src/features/dashboard, src/features/settings). Co-locate logic, components, and styles closest to where they are used.",
		whatWasDone:
			"Restructured the app repository into modular feature directories (src/features/...). Isolated feature-specific components, hooks, utils, and types inside their respective feature folders.",
		whatNeedsToBeDone:
			"Keep top-level src/components/ reserved strictly for cross-feature shell/global UI, moving any feature-tied logic into src/features/.",
	},
	{
		id: "react-query-api-calls",
		category: "API & Platform",
		title: "React Query for Async API Calls",
		description:
			"Components and providers MUST consume reusable hooks that wrap React Query (useQuery, useMutation, useQueryClient) for API calls, caching, loading state, refetching, and invalidation instead of manual useEffect + useState fetch flows.",
		whatWasDone:
			"Migrated async data fetching flows (domain lists, detail views, update state, and auth) into custom React Query hooks co-located in feature hook directories.",
		whatNeedsToBeDone:
			"Ensure any new backend or network endpoints are integrated via React Query hooks with structured loading/error states rather than ad-hoc fetch inside useEffect.",
	},
	{
		id: "react-query-key-constants",
		category: "API & Platform",
		title: "React Query Key Constants",
		description:
			"All React Query keys MUST live in dedicated query-key factory constants (e.g. src/constants/queryKeys.ts). Inline key arrays inside components/hooks are forbidden.",
		whatWasDone:
			"Centralized query key factories in src/constants/queryKeys.ts across the app repository and the service repository. Standardized cache invalidation and prefetching.",
		whatNeedsToBeDone:
			"Require all newly introduced query keys to be declared in queryKeys.ts before use in custom hooks.",
	},
	{
		id: "limit-memoization",
		category: "React Hooks",
		title: "Limit Unnecessary Memoization & Prefer useMemoizedFn",
		description:
			"Avoid unnecessary memoization. Use useMemoizedFn instead of useCallback for stable function references without dependency array churn.",
		whatWasDone:
			"Replaced fragile useCallback patterns with useMemoizedFn in high-frequency event handlers, avoiding stale closure bugs and array re-allocation overhead.",
		whatNeedsToBeDone:
			"Audit remaining useCallback usages and replace them with useMemoizedFn from src/hooks/useMemoizedFn.",
	},
	{
		id: "restrict-use-effect",
		category: "React Hooks",
		title: "Restrict useEffect to Direct Side Effects",
		description:
			"Use useEffect only for genuine side effects (subscriptions, DOM integration, event listeners). Derive transient state values directly during render.",
		whatWasDone:
			"Cleaned up redundant useEffect hooks that synced state or transformed props. Replaced them with direct derived values and event handler logic.",
		whatNeedsToBeDone:
			"Continue auditing components to eliminate state-mirroring useEffect calls, preferring inline derivation or state uplift.",
	},
	{
		id: "tauri-http-capabilities-scope",
		category: "API & Platform",
		title: "Platform HTTP Capabilities Scope",
		description:
			"When adding a new API endpoint URL or external domain, ALWAYS add the domain to the platform capability allow list under the http:default allow list.",
		whatWasDone:
			"Configured explicit HTTP allow lists in the platform capability allow list for external API, CDN, and project service endpoints.",
		whatNeedsToBeDone:
			"Verify whenever a new external CDN or API domain is integrated that a corresponding wildcard entry exists in default.json.",
	},
	{
		id: "prefer-tauri-plugins",
		category: "API & Platform",
		title: "Prefer Platform Official APIs over Ad-Hoc Dependencies",
		description:
			"Prioritize official Tauri packages and plugins (official platform SDKs and first-party integration packages) over generic npm or native crates.",
		whatWasDone:
			"Integrated official Tauri v2 plugins for dialogs, fs, process, opener, updater, and store management in src-tauri/Cargo.toml and @tauri-apps/api.",
		whatNeedsToBeDone:
			"Maintain alignment with official platform APIs when extending file system or OS system interactions.",
	},
	{
		id: "error-logging-redaction",
		category: "Code Quality",
		title: "Error Redaction & Sensitive Data Scrubbing",
		description:
			"Log user-facing errors via console or telemetry, but ALWAYS redact sensitive information (tokens, secrets, PII, auth headers) using logError utility.",
		whatWasDone:
			"Built centralized logError utility in src/utils/logError.ts that scrubs bearer tokens, secret parameters, and private headers before logging.",
		whatNeedsToBeDone:
			"Enforce wrapping all catch blocks and error boundaries with logError instead of raw console.error(err).",
	},
	{
		id: "rust-conventions",
		category: "Code Quality",
		title: "Rust Formatting & Clippy Hardening",
		description:
			"Adhere to Rust formatting (cargo fmt), warning-free compilation (cargo clippy -- -D warnings), and modular division of platform commands.",
		whatWasDone:
			"Structured Tauri command handlers into modular Rust files (auth.rs, downloads.rs, system.rs). Configured CI checks for cargo fmt and cargo clippy.",
		whatNeedsToBeDone:
			"Run cargo clippy -- -D warnings on any modification to platform integration packages before merging changes.",
	},
	{
		id: "keep-functions-simple",
		category: "Code Quality",
		title: "Simple & Short Functions",
		description:
			"Keep functions small, reduce cyclomatic complexity and deep nesting, extract helper functions.",
		whatWasDone:
			"Refactored complex multi-branch functions into smaller single-responsibility helpers. Standardized early guard returns.",
		whatNeedsToBeDone:
			"Break down any function exceeding 50 lines or containing more than 3 nested decision branches.",
	},
	{
		id: "top-down-code-flow",
		category: "Code Quality",
		title: "Top-Down Code Flow",
		description:
			"Organize code for top-to-bottom readability. Main exported component/function first, followed by lower-level extracted helpers.",
		whatWasDone:
			"Reordered component files so the main exported component appears at the top, with sub-helpers and types placed cleanly below.",
		whatNeedsToBeDone:
			"Ensure new component files place main exports at the top and avoid hoisting clutter above main render logic.",
	},
	{
		id: "strict-component-layout",
		category: "Component Primitives",
		title: "Strict Component Internal Layout Order",
		description:
			"Ordering inside components/hooks: useState -> custom hooks -> derived variables -> functions -> useEffect. Variable returns before functions.",
		whatWasDone:
			"Audited component definitions to follow the standard execution order, preventing initialization-before-definition issues.",
		whatNeedsToBeDone:
			"Follow the mandatory internal ordering whenever writing or refactoring React components.",
	},
	{
		id: "missing-component-protocol",
		category: "Component Primitives",
		title: "Missing Primitive Protocol",
		description:
			"If a primitive component is missing from the project design system, do NOT write raw HTML with ad-hoc styles. Proactively request its creation in the project design system (the shared/core repository).",
		whatWasDone:
			"Created missing design system primitives (Card, Paging, CircleIndicator, ContentTypePreview, Modal, SelectTrigger) in the shared/core repository package.",
		whatNeedsToBeDone:
			"When encountering new design requirements, submit primitive specs to the shared/core repository rather than creating raw localized overrides.",
	},
];

export function buildScanReportFromResults(
	scannedFiles: FileScanResult[],
	timestamp?: string,
): HardnessScanReport {
	const generatedAt = timestamp ?? new Date().toISOString();
	const totalFilesScanned = scannedFiles.length;

	const items: HardnessItem[] = hardnessRuleCatalog.map((catalogItem) => {
		let evidence: HardnessItemEvidence[] = [];
		let passCount = 0;
		let totalCount = 0;
		let state: HardnessItem["state"] = "not-scanned";

		if (catalogItem.id === "file-size-limitations") {
			const overLimitFiles = scannedFiles.filter((f) => f.lineCount > 350);
			passCount = totalFilesScanned - overLimitFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.lineCount <= 350 ? "pass" : "violation",
				detail: `${f.lineCount} lines (limit: 350)`,
			}));
		} else if (catalogItem.id === "enforce-design-system-primitives") {
			const violatingFiles = scannedFiles.filter((f) => f.rawHtmlTagsCount > 0);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.rawHtmlTagsCount === 0 ? "pass" : "violation",
				detail:
					f.rawHtmlTagsCount === 0
						? "100% DS Primitives"
						: `${f.rawHtmlTagsCount} raw HTML tags found`,
			}));
		} else if (catalogItem.id === "unpack-props-in-body") {
			const violatingFiles = scannedFiles.filter(
				(f) => f.destructuredParamPropsCount > 0,
			);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.destructuredParamPropsCount === 0 ? "pass" : "violation",
				detail:
					f.destructuredParamPropsCount === 0
						? "Single props parameter signature"
						: `${f.destructuredParamPropsCount} destructured parameter signatures`,
			}));
		} else if (catalogItem.id === "require-block-braces") {
			const violatingFiles = scannedFiles.filter(
				(f) => f.missingBlockBracesCount > 0,
			);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.missingBlockBracesCount === 0 ? "pass" : "violation",
				detail:
					f.missingBlockBracesCount === 0
						? "All control flows use block braces"
						: `${f.missingBlockBracesCount} single-line unbraced statements`,
			}));
		} else if (catalogItem.id === "limit-memoization") {
			const violatingFiles = scannedFiles.filter((f) => f.useCallbackCount > 0);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.useCallbackCount === 0 ? "pass" : "violation",
				detail:
					f.useCallbackCount === 0
						? "No raw useCallback dependencies"
						: `${f.useCallbackCount} raw useCallback instances (prefer useMemoizedFn)`,
			}));
		} else if (catalogItem.id === "enforce-i18n") {
			const violatingFiles = scannedFiles.filter(
				(f) => f.hardcodedStringJsxCount > 0,
			);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.hardcodedStringJsxCount === 0 ? "pass" : "violation",
				detail:
					f.hardcodedStringJsxCount === 0
						? "No hardcoded JSX text candidates"
						: `${f.hardcodedStringJsxCount} hardcoded JSX text candidates`,
			}));
		} else if (catalogItem.id === "restrict-use-effect") {
			const violatingFiles = scannedFiles.filter(
				(f) => f.stateSyncEffectCount > 0,
			);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.stateSyncEffectCount === 0 ? "pass" : "violation",
				detail:
					f.stateSyncEffectCount === 0
						? `${f.rawUseEffectCount} useEffect hooks; no state-sync pattern detected`
						: `${f.stateSyncEffectCount} useEffect state-sync patterns detected`,
			}));
		} else if (catalogItem.id === "error-logging-redaction") {
			const violatingFiles = scannedFiles.filter(
				(f) => f.consoleErrorCount > 0,
			);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.consoleErrorCount === 0 ? "pass" : "violation",
				detail:
					f.consoleErrorCount === 0
						? "No raw console.error calls"
						: `${f.consoleErrorCount} raw console.error calls; use redacted logging`,
			}));
		} else if (catalogItem.id === "keep-functions-simple") {
			const violatingFiles = scannedFiles.filter(
				(f) => f.longFunctionCount > 0,
			);
			passCount = totalFilesScanned - violatingFiles.length;
			totalCount = totalFilesScanned;
			state = passCount === totalCount ? "pass" : "violation";
			evidence = scannedFiles.map((f) => ({
				file: f.relativePath,
				status: f.longFunctionCount === 0 ? "pass" : "violation",
				detail:
					f.longFunctionCount === 0
						? "No function exceeds the 50-line heuristic"
						: `${f.longFunctionCount} functions exceed the 50-line heuristic`,
			}));
		} else {
			evidence = [
				{
					file: "workspace scan",
					status: "not-scanned",
					detail: "No evidence-producing scanner is implemented for this rule.",
				},
			];
		}

		const isChecked = state === "pass";
		const percentage =
			totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0;

		return {
			...catalogItem,
			checked: isChecked,
			passCount,
			totalCount,
			score: `${percentage}%`,
			state,
			evidence,
		};
	});

	const totalChecked = items.filter((i) => i.checked).length;
	const totalItems = items.length;
	const notScanned = items.filter(
		(item) => item.state === "not-scanned",
	).length;
	const scannedItems = totalItems - notScanned;
	const healthPercentage =
		scannedItems > 0 ? Math.round((totalChecked / scannedItems) * 100) : 0;

	return {
		generatedAt,
		items,
		totalChecked,
		totalItems,
		healthScore: `${healthPercentage}%`,
		notScanned,
	};
}

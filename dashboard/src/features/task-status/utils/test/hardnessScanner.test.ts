import { describe, expect, test } from "bun:test";
import {
	buildScanReportFromResults,
	type FileScanResult,
} from "../hardnessScanner";

describe("hardnessScanner", () => {
	test("calculates overall health score and item status when all files pass", () => {
		const mockFiles: FileScanResult[] = [
			{
				relativePath: "src/ComponentA.tsx",
				lineCount: 150,
				rawHtmlTagsCount: 0,
				destructuredParamPropsCount: 0,
				missingBlockBracesCount: 0,
				useCallbackCount: 0,
				rawUseEffectCount: 0,
				stateSyncEffectCount: 0,
				consoleErrorCount: 0,
				longFunctionCount: 0,
				hardcodedStringJsxCount: 0,
			},
			{
				relativePath: "src/ComponentB.tsx",
				lineCount: 200,
				rawHtmlTagsCount: 0,
				destructuredParamPropsCount: 0,
				missingBlockBracesCount: 0,
				useCallbackCount: 0,
				rawUseEffectCount: 0,
				stateSyncEffectCount: 0,
				consoleErrorCount: 0,
				longFunctionCount: 0,
				hardcodedStringJsxCount: 0,
			},
		];

		const report = buildScanReportFromResults(
			mockFiles,
			"2026-08-18T12:00:00Z",
		);

		expect(report.healthScore).toBe("100%");
		expect(report.totalChecked).toBeLessThan(report.totalItems);
		expect(report.notScanned).toBeGreaterThan(0);
		expect(report.items.length).toBeGreaterThan(0);

		const dsItem = report.items.find(
			(i) => i.id === "enforce-design-system-primitives",
		);
		expect(dsItem).toBeDefined();
		expect(dsItem?.checked).toBe(true);
		expect(dsItem?.state).toBe("pass");
		expect(dsItem?.passCount).toBe(2);
	});

	test("detects violations and updates checked state accordingly", () => {
		const mockFiles: FileScanResult[] = [
			{
				relativePath: "src/OverLimitFile.tsx",
				lineCount: 420,
				rawHtmlTagsCount: 3,
				destructuredParamPropsCount: 1,
				missingBlockBracesCount: 0,
				useCallbackCount: 0,
				rawUseEffectCount: 0,
				stateSyncEffectCount: 0,
				consoleErrorCount: 0,
				longFunctionCount: 0,
				hardcodedStringJsxCount: 0,
			},
			{
				relativePath: "src/CleanFile.tsx",
				lineCount: 100,
				rawHtmlTagsCount: 0,
				destructuredParamPropsCount: 0,
				missingBlockBracesCount: 0,
				useCallbackCount: 0,
				rawUseEffectCount: 0,
				stateSyncEffectCount: 0,
				consoleErrorCount: 0,
				longFunctionCount: 0,
				hardcodedStringJsxCount: 0,
			},
		];

		const report = buildScanReportFromResults(
			mockFiles,
			"2026-08-18T12:00:00Z",
		);

		expect(report.healthScore).not.toBe("100%");

		const fileSizeItem = report.items.find(
			(i) => i.id === "file-size-limitations",
		);
		expect(fileSizeItem?.checked).toBe(false);
		expect(fileSizeItem?.passCount).toBe(1);
		expect(fileSizeItem?.totalCount).toBe(2);
		expect(fileSizeItem?.score).toBe("50%");

		const dsItem = report.items.find(
			(i) => i.id === "enforce-design-system-primitives",
		);
		expect(dsItem?.checked).toBe(false);
		expect(dsItem?.passCount).toBe(1);
		expect(dsItem?.state).toBe("violation");
	});

	test("scans code-quality evidence instead of marking supported rules unknown", () => {
		const report = buildScanReportFromResults([
			{
				relativePath: "src/Unsafe.tsx",
				lineCount: 80,
				rawHtmlTagsCount: 0,
				destructuredParamPropsCount: 0,
				missingBlockBracesCount: 0,
				useCallbackCount: 0,
				rawUseEffectCount: 1,
				stateSyncEffectCount: 1,
				consoleErrorCount: 1,
				longFunctionCount: 1,
				hardcodedStringJsxCount: 1,
			},
		]);

		for (const id of [
			"enforce-i18n",
			"restrict-use-effect",
			"error-logging-redaction",
			"keep-functions-simple",
		]) {
			const item = report.items.find((candidate) => candidate.id === id);
			expect(item?.state).toBe("violation");
			expect(item?.evidence[0]?.status).toBe("violation");
		}
	});
});

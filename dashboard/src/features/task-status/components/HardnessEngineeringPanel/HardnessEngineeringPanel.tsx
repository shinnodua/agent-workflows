import {
	Check,
	CheckCircle2,
	ChevronDown,
	ChevronRight,
	Clock,
	ShieldCheck,
	Wrench,
} from "lucide-react";
import { useState } from "react";
import { Card, Input } from "../../../../shared/design-system";
import type { HardnessCategory, HardnessScanReport } from "../../../../types";
import styles from "./HardnessEngineeringPanel.module.css";

type HardnessEngineeringPanelProps = {
	report: HardnessScanReport;
};

const categories: Array<HardnessCategory | "All"> = [
	"All",
	"Code Architecture",
	"Component Primitives",
	"Code Quality",
	"React Hooks",
	"API & Platform",
];

export function HardnessEngineeringPanel(props: HardnessEngineeringPanelProps) {
	const { report } = props;
	const [activeCategory, setActiveCategory] = useState<
		HardnessCategory | "All"
	>("All");
	const [activeStatusFilter, setActiveStatusFilter] = useState<
		"all" | "checked" | "violation" | "not-scanned"
	>("all");
	const [searchQuery, setSearchQuery] = useState("");
	const [expandedItemIds, setExpandedItemIds] = useState<Set<string>>(
		new Set(),
	);

	const { items, totalChecked, totalItems, healthScore, notScanned } = report;
	const violations = items.filter((item) => item.state === "violation").length;

	const filteredItems = items.filter((item) => {
		const matchesCategory =
			activeCategory === "All" || item.category === activeCategory;
		const matchesStatus =
			activeStatusFilter === "all" ||
			(activeStatusFilter === "checked" && item.checked) ||
			(activeStatusFilter === "violation" && item.state === "violation") ||
			(activeStatusFilter === "not-scanned" && item.state === "not-scanned");
		const matchesQuery =
			!searchQuery ||
			item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
			item.category.toLowerCase().includes(searchQuery.toLowerCase());

		return matchesCategory && matchesStatus && matchesQuery;
	});

	function toggleExpand(id: string) {
		setExpandedItemIds((prev) => {
			const next = new Set(prev);
			if (next.has(id)) {
				next.delete(id);
			} else {
				next.add(id);
			}
			return next;
		});
	}

	return (
		<div className={styles.container}>
			<Card className={styles.summaryCard} variant="yellow">
				<div className={styles.summaryHeader}>
					<div className={styles.summaryTitleGroup}>
						<ShieldCheck className={styles.summaryIcon} />
						<div>
							<h2 className="text-xl font-bold text-slate-900">
								Code Quality Checklist
							</h2>
							<p className="text-sm font-medium text-slate-700">
								Workspace scan of applied engineering principles & code
								conventions
							</p>
						</div>
					</div>

					<div className={styles.summaryMetrics}>
						<div className={styles.metricBadge}>
							<span className={styles.metricValue}>{healthScore}</span>
							<span className={styles.metricLabel}>Applied Score</span>
						</div>
						<div className={styles.metricBadge}>
							<span className={styles.metricValue}>
								{totalChecked} / {totalItems}
							</span>
							<span className={styles.metricLabel}>Items Checked</span>
						</div>
					</div>
				</div>

				<div className={styles.progressBar}>
					<div className={styles.progressFill} style={{ width: healthScore }} />
				</div>
			</Card>

			<div className={styles.filterBar}>
				<div className={styles.searchBox}>
					<Input
						label="Search checklist items"
						placeholder="Search rule title, category, description..."
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.currentTarget.value)}
					/>
				</div>

				<div className={styles.tabsGroup}>
					<div className={styles.categoryTabs}>
						{categories.map((cat) => (
							<button
								className={`${styles.tabButton} ${
									activeCategory === cat ? styles.tabActive : ""
								}`}
								key={cat}
								onClick={() => setActiveCategory(cat)}
								type="button"
							>
								{cat}
							</button>
						))}
					</div>

					<div className={styles.statusTabs}>
						<button
							className={`${styles.tabButton} ${
								activeStatusFilter === "all" ? styles.tabActive : ""
							}`}
							onClick={() => setActiveStatusFilter("all")}
							type="button"
						>
							All ({items.length})
						</button>
						<button
							className={`${styles.tabButton} ${
								activeStatusFilter === "checked" ? styles.tabActive : ""
							}`}
							onClick={() => setActiveStatusFilter("checked")}
							type="button"
						>
							Checked ({totalChecked})
						</button>
						<button
							className={`${styles.tabButton} ${
								activeStatusFilter === "violation" ? styles.tabActive : ""
							}`}
							onClick={() => setActiveStatusFilter("violation")}
							type="button"
						>
							Violations ({violations})
						</button>
						<button
							className={`${styles.tabButton} ${
								activeStatusFilter === "not-scanned" ? styles.tabActive : ""
							}`}
							onClick={() => setActiveStatusFilter("not-scanned")}
							type="button"
						>
							Not scanned ({notScanned})
						</button>
					</div>
				</div>
			</div>

			<div className={styles.itemList}>
				{filteredItems.length === 0 ? (
					<div className={styles.emptyState}>
						<p className="font-bold text-slate-800">
							No hardness checklist items match your current filter.
						</p>
					</div>
				) : (
					filteredItems.map((item) => {
						const isExpanded = expandedItemIds.has(item.id);

						return (
							<Card
								className={styles.itemCard}
								key={item.id}
								variant={item.state === "pass" ? "white" : "pink"}
							>
								<div className={styles.itemHeader}>
									<div className={styles.itemTitleRow}>
										<span
											className={`${styles.checkBadge} ${
												item.state === "pass"
													? styles.checkBadgeApplied
													: styles.checkBadgePending
											}`}
										>
											{item.state === "pass" ? (
												<Check size={18} strokeWidth={3} />
											) : (
												<Clock size={16} strokeWidth={2.5} />
											)}
										</span>
										<div>
											<h3 className="text-base font-bold text-slate-900">
												{item.title}
											</h3>
											<div className={styles.itemMeta}>
												<span className={styles.categoryTag}>
													{item.category}
												</span>
												<span
													className={`${styles.scoreTag} ${
														item.state !== "pass" ? styles.scoreTagPartial : ""
													}`}
												>
													{item.state === "not-scanned"
														? "Not scanned"
														: `${item.score} (${item.passCount}/${item.totalCount} passing)`}
												</span>
											</div>
										</div>
									</div>
								</div>

								<p className={styles.itemDescription}>{item.description}</p>

								<div className={styles.sectionsGrid}>
									<div className={`${styles.sectionBox} ${styles.sectionDone}`}>
										<div className={styles.sectionTitle}>
											<CheckCircle2 size={16} className="text-emerald-600" />
											<span>What Was Done (Applied Details)</span>
										</div>
										<p className={styles.sectionText}>{item.whatWasDone}</p>
									</div>

									<div className={`${styles.sectionBox} ${styles.sectionTodo}`}>
										<div className={styles.sectionTitle}>
											<Wrench size={16} className="text-blue-600" />
											<span>What Needs To Be Done (Action Items)</span>
										</div>
										<p className={styles.sectionText}>
											{item.whatNeedsToBeDone}
										</p>
									</div>
								</div>

								{item.evidence.length > 0 ? (
									<div className={styles.evidenceSection}>
										<button
											className={styles.evidenceToggle}
											onClick={() => toggleExpand(item.id)}
											type="button"
										>
											{isExpanded ? (
												<ChevronDown size={16} />
											) : (
												<ChevronRight size={16} />
											)}
											<span>
												Inspect Scanned Workspace Files ({item.evidence.length}{" "}
												audited)
											</span>
										</button>

										{isExpanded ? (
											<div className={styles.evidenceList}>
												{item.evidence.map((ev) => (
													<div className={styles.evidenceItem} key={ev.file}>
														<span className={styles.evidencePath}>
															{ev.file}
														</span>
														<span
															className={
																ev.status === "pass"
																	? styles.evidenceDetail
																	: styles.evidenceDetailViolation
															}
														>
															{ev.detail ?? ev.status}
														</span>
													</div>
												))}
											</div>
										) : null}
									</div>
								) : null}
							</Card>
						);
					})
				)}
			</div>
		</div>
	);
}

import { Card, Input } from "../../../../shared/design-system";
import type {
	ActionItem,
	Artifact,
	DashboardView,
	HardnessScanReport,
} from "../../../../types";
import { navItems, taskSubmenuItems } from "../../taskStatusConfig";
import styles from "./Sidebar.module.css";

type SidebarProps = {
	activeView: DashboardView;
	filteredArtifacts: Artifact[];
	hardnessReport?: HardnessScanReport;
	actionItems: ActionItem[];
	onSelectView: (view: DashboardView) => void;
	query: string;
	setQuery: (query: string) => void;
};

export function Sidebar(props: SidebarProps) {
	const {
		activeView,
		filteredArtifacts,
		actionItems,
		hardnessReport,
		onSelectView,
		query,
		setQuery,
	} = props;

	return (
		<aside className={styles.sidebar}>
			<Card className={styles.card} variant="white">
				<div className={styles.search}>
					<Input
						label="Filter tasks and artifacts"
						placeholder="Search title, status, ID, path"
						value={query}
						onChange={(event) => setQuery(event.currentTarget.value)}
					/>
				</div>

				<nav className={styles.nav}>
					{navItems.map((item) => (
						<div className={styles.navGroup} key={item.view}>
							<SidebarItem
								activeView={activeView}
								filteredArtifacts={filteredArtifacts}
								hardnessReport={hardnessReport}
								actionItems={actionItems}
								item={item}
								isActive={isNavItemActive(activeView, item.view)}
								onSelectView={onSelectView}
							/>
							{item.view === "task" ? (
								<div className={styles.submenu}>
									{taskSubmenuItems.map((submenuItem) => (
										<SidebarItem
											activeView={activeView}
											filteredArtifacts={filteredArtifacts}
											hardnessReport={hardnessReport}
											actionItems={actionItems}
											item={submenuItem}
											isActive={activeView === submenuItem.view}
											isSubmenu
											key={submenuItem.view}
											onSelectView={onSelectView}
										/>
									))}
								</div>
							) : null}
						</div>
					))}
				</nav>
			</Card>
		</aside>
	);
}

function SidebarItem(props: {
	activeView: DashboardView;
	filteredArtifacts: Artifact[];
	hardnessReport?: HardnessScanReport;
	actionItems: ActionItem[];
	item: (typeof navItems)[number];
	isActive: boolean;
	isSubmenu?: boolean;
	onSelectView: (view: DashboardView) => void;
}) {
	const {
		filteredArtifacts,
		hardnessReport,
		actionItems,
		isActive,
		isSubmenu = false,
		item,
		onSelectView,
	} = props;
	const Icon = item.icon;
	const count = getViewCount(
		filteredArtifacts,
		item.view,
		actionItems,
		hardnessReport,
	);

	return (
		<button
			className={`${isSubmenu ? styles.submenuItem : styles.item} ${
				isActive ? styles.itemActive : styles.itemInactive
			}`}
			onClick={() => onSelectView(item.view)}
			type="button"
		>
			<span className={styles.itemLabel}>
				<Icon className={styles.itemIcon} />
				{item.label}
			</span>
			<span className={styles.itemCount}>{count}</span>
		</button>
	);
}

function isNavItemActive(activeView: DashboardView, itemView: DashboardView) {
	if (itemView === "task") {
		return (
			activeView === "task" ||
			taskSubmenuItems.some((item) => item.view === activeView)
		);
	}

	return activeView === itemView;
}

function getViewCount(
	artifacts: Artifact[],
	view: DashboardView,
	actionItems: ActionItem[],
	hardnessReport?: HardnessScanReport,
) {
	if (view === "action-required") {
		return actionItems.length;
	}
	if (view === "lifecycle") {
		return new Set(artifacts.map((artifact) => artifact.taskKey)).size;
	}
	if (view === "task") {
		return artifacts.filter((artifact) => artifact.type !== "document").length;
	}

	if (view === "workflow") {
		return 9;
	}

	if (view === "hardness") {
		return hardnessReport
			? `${hardnessReport.totalChecked}/${hardnessReport.totalItems}`
			: "18";
	}

	return artifacts.filter((artifact) => artifact.type === view).length;
}

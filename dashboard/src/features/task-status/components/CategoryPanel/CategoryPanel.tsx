import { Button, Card } from "../../../../shared/design-system";
import type {
	Artifact,
	DocumentModuleFilter,
	DocumentModuleTab,
} from "../../../../types";
import type { artifactTypes } from "../../taskStatusConfig";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./CategoryPanel.module.css";

type CategoryPanelProps = {
	activeDocumentModule?: DocumentModuleFilter;
	artifactsForType: Artifact[];
	documentModuleTabs?: DocumentModuleTab[];
	documentModuleCounts?: Record<DocumentModuleFilter, number>;
	onSelectArtifact: (artifact: Artifact) => void;
	onSelectDocumentModule?: (module: DocumentModuleFilter) => void;
	type: (typeof artifactTypes)[number];
};

export function CategoryPanel(props: CategoryPanelProps) {
	const {
		activeDocumentModule,
		artifactsForType,
		documentModuleTabs,
		documentModuleCounts,
		onSelectArtifact,
		onSelectDocumentModule,
		type,
	} = props;
	const Icon = type.icon;
	const shouldShowDocumentTabs =
		type.type === "document" &&
		activeDocumentModule &&
		documentModuleTabs &&
		documentModuleCounts &&
		onSelectDocumentModule;

	return (
		<section>
			<div className={styles.header}>
				<div className={styles.titleWrap}>
					<Icon className={styles.icon} />
					<h2 className={styles.title}>{type.label}</h2>
				</div>
				<span className={styles.countBadge}>
					{artifactsForType.length} found
				</span>
			</div>
			{shouldShowDocumentTabs ? (
				<DocumentModuleTabs
					activeModule={activeDocumentModule}
					counts={documentModuleCounts}
					tabs={documentModuleTabs}
					onSelectModule={onSelectDocumentModule}
				/>
			) : null}

			{artifactsForType.length > 0 ? (
				<div className={styles.list}>
					{artifactsForType.map((artifact) => (
						<CategoryArtifactCard
							artifact={artifact}
							key={artifact.relativePath}
							onSelectArtifact={onSelectArtifact}
							type={type}
						/>
					))}
				</div>
			) : (
				<CategoryEmptyState label={type.label} />
			)}
		</section>
	);
}

function DocumentModuleTabs(props: {
	activeModule: DocumentModuleFilter;
	counts: Record<DocumentModuleFilter, number>;
	tabs: DocumentModuleTab[];
	onSelectModule: (module: DocumentModuleFilter) => void;
}) {
	const { activeModule, counts, tabs, onSelectModule } = props;

	return (
		<div className={styles.tabs}>
			{tabs.map((tab) => {
				const isActive = activeModule === tab.module;

				return (
					<button
						className={`${styles.tab} ${
							isActive ? styles.tabActive : styles.tabInactive
						}`}
						key={tab.module}
						onClick={() => onSelectModule(tab.module)}
						type="button"
					>
						{tab.label}
						<span className={styles.tabCount}>{counts[tab.module]}</span>
					</button>
				);
			})}
		</div>
	);
}

function CategoryArtifactCard(props: {
	artifact: Artifact;
	onSelectArtifact: (artifact: Artifact) => void;
	type: (typeof artifactTypes)[number];
}) {
	const { artifact, onSelectArtifact, type } = props;

	return (
		<Card className={styles.card} variant={type.accent}>
			<div className={styles.cardInner}>
				<div className={styles.cardText}>
					<div className={styles.meta}>
						<span className={styles.singular}>{type.singular}</span>
						<StatusBadge status={artifact.status} />
					</div>
					<h3 className={styles.artifactTitle}>{artifact.title}</h3>
					<p className={styles.path}>{artifact.relativePath}</p>
				</div>
				<Button
					onClick={() => onSelectArtifact(artifact)}
					size="sm"
					variant="white"
				>
					Read
				</Button>
			</div>
		</Card>
	);
}

function CategoryEmptyState(props: { label: string }) {
	const { label } = props;

	return (
		<Card className={styles.emptyCard} variant="white">
			<p className={styles.emptyTitle}>No {label.toLowerCase()} found.</p>
			<p className={styles.emptyCopy}>
				The dashboard is watching the approved workspace folder for this
				artifact type.
			</p>
		</Card>
	);
}

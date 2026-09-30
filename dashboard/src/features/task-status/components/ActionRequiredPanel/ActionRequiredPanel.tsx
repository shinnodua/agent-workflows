import { AlertTriangle, ArrowRight, CheckCircle2 } from "lucide-react";
import { Card } from "../../../../shared/design-system";
import type { ActionItem } from "../../../../types";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./ActionRequiredPanel.module.css";

type ActionRequiredPanelProps = {
	items: ActionItem[];
	onSelectArtifact: (item: ActionItem) => void;
};

export function ActionRequiredPanel(props: ActionRequiredPanelProps) {
	const { items, onSelectArtifact } = props;

	return (
		<section className={styles.section}>
			<div className={styles.header}>
				<div>
					<p className={styles.eyebrow}>Workflow health</p>
					<h2 className={styles.title}>Action required</h2>
					<p className={styles.description}>
						Resolve the issues keeping tasks from moving through the workspace
						workflow.
					</p>
				</div>
				<span className={styles.count}>{items.length}</span>
			</div>

			{items.length === 0 ? (
				<Card className={styles.empty} variant="lime">
					<CheckCircle2 className={styles.emptyIcon} />
					<div>
						<h3 className={styles.emptyTitle}>Nothing needs attention</h3>
						<p className={styles.emptyText}>
							The current workspace artifacts pass the available workflow
							checks.
						</p>
					</div>
				</Card>
			) : (
				<div className={styles.list}>
					{items.map((item) => (
						<ActionItemCard
							item={item}
							key={item.id}
							onSelect={() => onSelectArtifact(item)}
						/>
					))}
				</div>
			)}
		</section>
	);
}

function ActionItemCard(props: { item: ActionItem; onSelect: () => void }) {
	const { item, onSelect } = props;

	return (
		<Card className={styles.card} variant="white">
			<div className={styles.cardHeader}>
				<div className={styles.cardTitleWrap}>
					<AlertTriangle className={styles.itemIcon} />
					<div>
						<h3 className={styles.itemTitle}>{item.title}</h3>
						<p className={styles.itemReason}>{item.reason}</p>
					</div>
				</div>
				<StatusBadge status={item.severity} />
			</div>
			<p className={styles.artifactTitle}>{item.artifact.title}</p>
			<div className={styles.cardFooter}>
				<code className={styles.path}>{item.artifact.relativePath}</code>
				<button className={styles.openButton} onClick={onSelect} type="button">
					Inspect
					<ArrowRight className={styles.openIcon} />
				</button>
			</div>
		</Card>
	);
}

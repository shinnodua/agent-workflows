import { LayoutDashboard } from "lucide-react";
import { Card } from "../../../../shared/design-system";
import styles from "./DashboardHeader.module.css";

type DashboardHeaderProps = {
	artifactCount: number;
	generatedAt: string;
	markdownMetadataCount: number;
};

export function DashboardHeader(props: DashboardHeaderProps) {
	const { artifactCount, generatedAt, markdownMetadataCount } = props;

	return (
		<section className={styles.header}>
			<div>
				<div className={styles.eyebrow}>
					<LayoutDashboard className={styles.icon} />
					Agent Workflow Workspace
				</div>
				<h1 className={styles.title}>Task Status Page</h1>
				<p className={styles.copy}>
					Local task tracking with a readable Markdown view for PRDs, research,
					designs, plans, and documents.
				</p>
			</div>
			<Card variant="yellow" className={styles.summaryCard}>
				<p className={styles.summaryLabel}>Generated from files</p>
				<p className={styles.summaryCount}>{artifactCount} artifacts</p>
				<p className={styles.summaryTime}>
					{new Date(generatedAt).toLocaleString()}
				</p>
				{markdownMetadataCount > 0 ? (
					<p className={styles.summaryWarning}>
						{markdownMetadataCount} Markdown metadata files
					</p>
				) : null}
			</Card>
		</section>
	);
}

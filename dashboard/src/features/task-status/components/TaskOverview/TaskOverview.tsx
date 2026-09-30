import { CalendarDays, Search } from "lucide-react";
import { Card } from "../../../../shared/design-system";
import type { Artifact, TaskGroup } from "../../../../types";
import { type artifactTypes, taskArtifactTypes } from "../../taskStatusConfig";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./TaskOverview.module.css";

type TaskOverviewProps = {
	onSelectArtifact: (artifact: Artifact) => void;
	taskGroups: TaskGroup[];
};

export function TaskOverview(props: TaskOverviewProps) {
	const { onSelectArtifact, taskGroups } = props;

	return (
		<section>
			<div className={styles.sectionHeader}>
				<Search className={styles.sectionIcon} />
				<h2 className={styles.sectionTitle}>Task overview</h2>
			</div>
			<div className={styles.taskGrid}>
				{taskGroups.length > 0 ? (
					taskGroups.map((task) => (
						<TaskCard
							key={task.key}
							onSelectArtifact={onSelectArtifact}
							task={task}
						/>
					))
				) : (
					<Card className={styles.emptyCard} variant="white">
						<p className={styles.emptyTitle}>No matching tasks found.</p>
						<p className={styles.emptyCopy}>
							Try a broader search or clear the filter.
						</p>
					</Card>
				)}
			</div>
		</section>
	);
}

function TaskCard(props: {
	onSelectArtifact: (artifact: Artifact) => void;
	task: TaskGroup;
}) {
	const { onSelectArtifact, task } = props;

	return (
		<Card variant="white" className={styles.taskCard}>
			<TaskCardHeader task={task} />
			<div className={styles.columns}>
				{taskArtifactTypes.map((artifactType) => (
					<TaskArtifactColumn
						artifactType={artifactType}
						key={artifactType.type}
						onSelectArtifact={onSelectArtifact}
						task={task}
					/>
				))}
			</div>
		</Card>
	);
}

function TaskCardHeader(props: { task: TaskGroup }) {
	const { task } = props;

	return (
		<div className={styles.header}>
			<div className={styles.headerMain}>
				<div className={styles.meta}>
					<StatusBadge status={task.status} />
					<span className={styles.artifactCount}>
						{task.artifacts.length} artifacts
					</span>
				</div>
				<h2 className={styles.title}>{task.title}</h2>
				{task.description ? (
					<p className={styles.description}>{task.description}</p>
				) : null}
				<p className={styles.key}>{task.key}</p>
			</div>
			{task.updated ? (
				<div className={styles.updated}>
					<CalendarDays className={styles.updatedIcon} />
					{task.updated}
				</div>
			) : null}
		</div>
	);
}

function TaskArtifactColumn(props: {
	artifactType: (typeof artifactTypes)[number];
	onSelectArtifact: (artifact: Artifact) => void;
	task: TaskGroup;
}) {
	const { artifactType, onSelectArtifact, task } = props;
	const items = task.byType[artifactType.type];
	const firstStatus = items[0]?.status ?? "missing";

	return (
		<div className={styles.column}>
			<div className={styles.columnHeader}>
				<div className={styles.columnLabel}>{artifactType.label}</div>
				<StatusBadge status={firstStatus} />
			</div>
			<div className={styles.columnItems}>
				{items.length > 0 ? (
					items.map((artifact) => (
						<button
							className={styles.artifactButton}
							key={artifact.relativePath}
							onClick={() => onSelectArtifact(artifact)}
							type="button"
						>
							{artifact.title}
						</button>
					))
				) : (
					<span className={styles.missing}>Missing</span>
				)}
			</div>
		</div>
	);
}

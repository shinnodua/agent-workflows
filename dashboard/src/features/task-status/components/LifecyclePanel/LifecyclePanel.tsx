import {
	Check,
	CircleDashed,
	CircleX,
	Clock3,
	ShieldAlert,
} from "lucide-react";
import { Card } from "../../../../shared/design-system";
import type { TaskGroup } from "../../../../types";
import { buildLifecycleStages } from "../../utils/lifecycle";
import styles from "./LifecyclePanel.module.css";

type LifecyclePanelProps = {
	taskGroups: TaskGroup[];
	onSelectArtifact: (artifact: TaskGroup["artifacts"][number]) => void;
};

export function LifecyclePanel(props: LifecyclePanelProps) {
	const { taskGroups, onSelectArtifact } = props;

	return (
		<section className={styles.section}>
			<header>
				<p className={styles.eyebrow}>Task progression</p>
				<h2 className={styles.title}>Project lifecycle</h2>
				<p className={styles.description}>
					See the evidence-backed stage coverage for every grouped task.
				</p>
			</header>
			{taskGroups.length === 0 ? (
				<Card className={styles.empty} variant="white">
					No grouped tasks match the current filter.
				</Card>
			) : (
				<div className={styles.list}>
					{taskGroups.map((group) => (
						<Card className={styles.card} key={group.key} variant="white">
							<div className={styles.cardHeader}>
								<div>
									<p className={styles.taskLabel}>Task</p>
									<h3 className={styles.taskTitle}>{group.title}</h3>
								</div>
								<span className={styles.taskStatus}>{group.status}</span>
							</div>
							<div className={styles.stageScroller}>
								<div className={styles.stageGrid}>
									{buildLifecycleStages(group).map((stage) => (
										<button
											className={`${styles.stage} ${styles[stage.state]}`}
											key={stage.name}
											onClick={() => {
												const artifact = stage.artifacts[0];
												if (artifact) onSelectArtifact(artifact);
											}}
											type="button"
										>
											<StageIcon state={stage.state} />
											<span>{stage.name}</span>
											<small>{stage.state.replace("-", " ")}</small>
										</button>
									))}
								</div>
							</div>
						</Card>
					))}
				</div>
			)}
		</section>
	);
}

function StageIcon(props: { state: string }) {
	const { state } = props;
	if (state === "complete") return <Check className={styles.icon} />;
	if (state === "current") return <Clock3 className={styles.icon} />;
	if (state === "blocked") return <ShieldAlert className={styles.icon} />;
	if (state === "missing") return <CircleX className={styles.icon} />;
	return <CircleDashed className={styles.icon} />;
}

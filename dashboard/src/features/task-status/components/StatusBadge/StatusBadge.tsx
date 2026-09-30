import { displayStatus, normalizeStatus } from "../../utils/status";
import styles from "./StatusBadge.module.css";

type StatusBadgeProps = {
	status: string;
};

export function StatusBadge(props: StatusBadgeProps) {
	const { status } = props;

	return (
		<span className={`${styles.badge} ${getStatusClasses(status)}`}>
			{displayStatus(status)}
		</span>
	);
}

function getStatusClasses(status: string) {
	switch (normalizeStatus(status)) {
		case "approved": {
			return styles.approved;
		}
		case "blocked": {
			return styles.blocked;
		}
		case "complete": {
			return styles.complete;
		}
		case "draft": {
			return styles.draft;
		}
		case "need-design": {
			return styles.needDesign;
		}
		case "design-done": {
			return styles.designDone;
		}
		case "in-progress": {
			return styles.inProgress;
		}
		case "superseded": {
			return styles.superseded;
		}
		default: {
			return styles.unknown;
		}
	}
}

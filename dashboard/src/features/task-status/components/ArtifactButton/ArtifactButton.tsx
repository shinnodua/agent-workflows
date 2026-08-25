import type { Artifact } from "../../../../types";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./ArtifactButton.module.css";

type ArtifactButtonProps = {
	artifact: Artifact;
	isSelected: boolean;
	onSelect: () => void;
};

export function ArtifactButton(props: ArtifactButtonProps) {
	const { artifact, isSelected, onSelect } = props;

	return (
		<button
			className={`${styles.button} ${
				isSelected ? styles.selected : styles.default
			}`}
			onClick={onSelect}
			type="button"
		>
			<span className={styles.header}>
				<span className={styles.title}>{artifact.title}</span>
				<StatusBadge status={artifact.status} />
			</span>
			<span className={styles.path}>{artifact.relativePath}</span>
		</button>
	);
}

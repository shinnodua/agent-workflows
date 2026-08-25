import { Card } from "../../../../shared/design-system";
import type { Artifact } from "../../../../types";
import { ArtifactButton } from "../ArtifactButton/ArtifactButton";
import styles from "./FilesPanel.module.css";

type FilesPanelProps = {
	activeArtifact: Artifact | null;
	files: Artifact[];
	onSelectArtifact: (artifact: Artifact) => void;
	title: string;
};

export function FilesPanel(props: FilesPanelProps) {
	const { activeArtifact, files, onSelectArtifact, title } = props;

	return (
		<Card className={styles.card} variant="white">
			<div className={styles.header}>
				<h2 className={styles.title}>{title}</h2>
				<span className={styles.countBadge}>{files.length} files</span>
			</div>
			<div className={styles.grid}>
				{files.length > 0 ? (
					files.map((artifact) => (
						<ArtifactButton
							artifact={artifact}
							isSelected={
								activeArtifact?.relativePath === artifact.relativePath
							}
							key={artifact.relativePath}
							onSelect={() => onSelectArtifact(artifact)}
						/>
					))
				) : (
					<p className={styles.empty}>No files match the current filter.</p>
				)}
			</div>
		</Card>
	);
}

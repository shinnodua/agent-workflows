import { Card } from "../../../../shared/design-system";
import type { Artifact } from "../../../../types";
import { artifactTypes } from "../../taskStatusConfig";
import { countArtifactsByType } from "../../utils/artifactGrouping";
import styles from "./ArtifactSummaryCards.module.css";

type ArtifactSummaryCardsProps = {
	artifacts: Artifact[];
};

export function ArtifactSummaryCards(props: ArtifactSummaryCardsProps) {
	const { artifacts } = props;

	return (
		<section className={styles.grid}>
			{artifactTypes.map((artifactType) => (
				<Card
					className={styles.card}
					key={artifactType.type}
					variant={artifactType.accent}
				>
					<div className={styles.row}>
						<div className={styles.labelWrap}>
							<artifactType.icon className={styles.icon} />
							<span className={styles.label}>{artifactType.label}</span>
						</div>
						<span className={styles.count}>
							{countArtifactsByType(artifacts, artifactType.type)}
						</span>
					</div>
				</Card>
			))}
		</section>
	);
}

declare module "virtual:workspace-artifacts" {
	import type { Artifact, HardnessScanReport, ProjectProfile } from "./types";

	export const artifacts: Artifact[];
	export const hardnessReport: HardnessScanReport;
	export const projectProfile: ProjectProfile;
	export const artifactEndpoint: string;
	export const generatedAt: string;
}

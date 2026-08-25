export type ArtifactType = "prd" | "plan" | "design" | "research" | "document";

export type DashboardView =
	| "task"
	| "workflow"
	| "hardness"
	| "action-required"
	| "lifecycle"
	| ArtifactType;

export type WorkspaceModule = "workspace" | string;

export type DocumentModuleFilter = "all" | WorkspaceModule;

export type ProjectRepository = {
	id: string;
	name: string;
	path: string;
	url?: string;
	purpose: string;
	scope: string[];
	platforms: string[];
	agentGuide?: string;
	artifactDirectories?: Partial<
		Record<"plans" | "designs" | "research" | "docs", string>
	>;
	codeScanDirectories?: string[];
	validation?: string[];
};

export type ProjectProfile = {
	repositories: ProjectRepository[];
};

export type DocumentModuleTab = {
	module: DocumentModuleFilter;
	label: string;
};

export type Artifact = {
	type: ArtifactType;
	title: string;
	status: string;
	goal?: string;
	created?: string;
	modified: string;
	updated?: string;
	id?: string;
	prdId?: string;
	planId?: string;
	parentPlanId?: string;
	relatedArtifactIds: string[];
	taskKey: string;
	relativePath: string;
	sourceModule: WorkspaceModule;
	sourceHref: string;
	content: string;
	metadataFormat?: "structured" | "markdown";
	metadataWarnings?: string[];
	metadataErrors?: string[];
	owner?: string;
};

export type TaskGroup = {
	key: string;
	title: string;
	artifacts: Artifact[];
	byType: Record<ArtifactType, Artifact[]>;
	status: string;
	description?: string;
	updated?: string;
};

export type HardnessCategory =
	| "Code Architecture"
	| "Component Primitives"
	| "Code Quality"
	| "React Hooks"
	| "API & Platform";

export type HardnessItemEvidence = {
	file: string;
	status: "pass" | "violation" | "not-scanned";
	detail?: string;
};

export type HardnessItem = {
	id: string;
	category: HardnessCategory;
	title: string;
	description: string;
	checked: boolean;
	state: "pass" | "violation" | "not-scanned";
	passCount: number;
	totalCount: number;
	score: string;
	whatWasDone: string;
	whatNeedsToBeDone: string;
	evidence: HardnessItemEvidence[];
};

export type HardnessScanReport = {
	generatedAt: string;
	items: HardnessItem[];
	totalChecked: number;
	totalItems: number;
	healthScore: string;
	notScanned: number;
};

export type LifecycleStageState =
	| "complete"
	| "current"
	| "missing"
	| "blocked"
	| "not-verified";

export type LifecycleStage = {
	name: string;
	state: LifecycleStageState;
	artifacts: Artifact[];
};

export type ActionItemSeverity = "blocked" | "high" | "medium" | "low";

export type ActionItem = {
	id: string;
	severity: ActionItemSeverity;
	title: string;
	reason: string;
	artifact: Artifact;
	date: string;
};

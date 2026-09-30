import {
	artifactEndpoint,
	artifacts as initialArtifacts,
	generatedAt as initialGeneratedAt,
	hardnessReport as initialHardnessReport,
	projectProfile as initialProjectProfile,
} from "virtual:workspace-artifacts";
import { useEffect, useState } from "react";
import type {
	ActionItem,
	Artifact,
	DashboardView,
	DocumentModuleFilter,
	DocumentModuleTab,
	HardnessScanReport,
	ProjectProfile,
} from "../../../../types";
import { artifactTypes } from "../../taskStatusConfig";
import { buildActionItems, filterActionItems } from "../../utils/actionItems";
import {
	buildTaskGroups,
	countDocumentsByModule,
	filterArtifacts,
	filterDocumentsByModule,
	getVisibleFiles,
} from "../../utils/artifactGrouping";
import { ActionRequiredPanel } from "../ActionRequiredPanel/ActionRequiredPanel";
import { ArtifactSummaryCards } from "../ArtifactSummaryCards/ArtifactSummaryCards";
import { CategoryPanel } from "../CategoryPanel/CategoryPanel";
import { DashboardHeader } from "../DashboardHeader/DashboardHeader";
import { FilesPanel } from "../FilesPanel/FilesPanel";
import { HardnessEngineeringPanel } from "../HardnessEngineeringPanel/HardnessEngineeringPanel";
import { LifecyclePanel } from "../LifecyclePanel/LifecyclePanel";
import { MarkdownDialog } from "../MarkdownDialog/MarkdownDialog";
import { Sidebar } from "../Sidebar/Sidebar";
import { TaskOverview } from "../TaskOverview/TaskOverview";
import { WorkflowPanel } from "../WorkflowPanel/WorkflowPanel";
import styles from "./TaskStatusDashboard.module.css";

type WorkspaceArtifactPayload = {
	artifacts: Artifact[];
	hardnessReport?: HardnessScanReport;
	projectProfile: ProjectProfile;
	generatedAt: string;
};

export function TaskStatusDashboard() {
	const [activeView, setActiveView] = useState<DashboardView>("task");
	const [artifactHistory, setArtifactHistory] = useState<Artifact[]>([]);
	const [activeDocumentModule, setActiveDocumentModule] =
		useState<DocumentModuleFilter>("all");
	const [artifactPayload, setArtifactPayload] =
		useState<WorkspaceArtifactPayload>({
			artifacts: initialArtifacts,
			hardnessReport: initialHardnessReport,
			projectProfile: initialProjectProfile,
			generatedAt: initialGeneratedAt,
		});
	const [query, setQuery] = useState("");
	const {
		artifacts,
		generatedAt,
		hardnessReport = initialHardnessReport,
		projectProfile,
	} = artifactPayload;
	const activeArtifact = artifactHistory.at(-1) ?? null;
	const filteredArtifacts = filterArtifacts(artifacts, query);
	const actionItems = filterActionItems(
		buildActionItems(artifacts, projectProfile.repositories),
		query,
	);
	const markdownMetadataCount = artifacts.filter(
		(artifact) => artifact.metadataFormat === "markdown",
	).length;
	const taskGroups = buildTaskGroups(filteredArtifacts);
	const selectedType = artifactTypes.find((type) => type.type === activeView);
	const visibleFiles = getVisibleFiles(filteredArtifacts, activeView);
	const documentModuleTabs = buildDocumentModuleTabs(projectProfile);
	const documentModuleCounts = countDocumentsByModule(
		getVisibleFiles(filteredArtifacts, "document"),
		documentModuleTabs,
	);
	const visibleFilesForView =
		activeView === "document"
			? filterDocumentsByModule(visibleFiles, activeDocumentModule)
			: visibleFiles;
	const visibleFilesTitle =
		activeView === "task"
			? "Task files"
			: activeView === "workflow"
				? "Workflow files"
				: `${selectedType?.label ?? "Selected"} files`;

	useEffect(() => {
		const controller = new AbortController();

		async function refreshArtifacts() {
			try {
				const response = await fetch(
					`${artifactEndpoint}?updated=${Date.now().toString()}`,
					{
						cache: "no-store",
						signal: controller.signal,
					},
				);

				if (!response.ok) {
					return;
				}

				const nextPayload = (await response.json()) as WorkspaceArtifactPayload;
				setArtifactPayload(nextPayload);
			} catch (error) {
				if (!controller.signal.aborted) {
					console.warn("Unable to refresh workspace artifacts.", error);
				}
			}
		}

		refreshArtifacts();

		return () => controller.abort();
	}, []);

	function handleSelectView(view: DashboardView) {
		setActiveView(view);
		setArtifactHistory([]);
	}

	function handleSelectArtifact(artifact: Artifact) {
		setArtifactHistory([artifact]);
	}

	function handleNavigateArtifact(artifact: Artifact) {
		setArtifactHistory((currentHistory) => {
			const currentArtifact = currentHistory.at(-1);

			if (currentArtifact?.relativePath === artifact.relativePath) {
				return currentHistory;
			}

			return [...currentHistory, artifact];
		});
	}

	function handleBackArtifact() {
		setArtifactHistory((currentHistory) => currentHistory.slice(0, -1));
	}

	function handleCloseDialog() {
		setArtifactHistory([]);
	}

	return (
		<>
			<main className={styles.layout}>
				<Sidebar
					activeView={activeView}
					filteredArtifacts={filteredArtifacts}
					actionItems={actionItems}
					hardnessReport={hardnessReport}
					onSelectView={handleSelectView}
					query={query}
					setQuery={setQuery}
				/>

				<section className={styles.content}>
					<DashboardHeader
						artifactCount={artifacts.length}
						generatedAt={generatedAt}
						markdownMetadataCount={markdownMetadataCount}
					/>
					<ContentPanel
						activeArtifact={activeArtifact}
						actionItems={actionItems}
						activeView={activeView}
						activeDocumentModule={activeDocumentModule}
						artifacts={artifacts}
						documentModuleCounts={documentModuleCounts}
						documentModuleTabs={documentModuleTabs}
						hardnessReport={hardnessReport}
						onSelectArtifact={handleSelectArtifact}
						onSelectDocumentModule={setActiveDocumentModule}
						selectedType={selectedType}
						taskGroups={taskGroups}
						visibleFiles={visibleFilesForView}
						visibleFilesTitle={visibleFilesTitle}
					/>
				</section>
			</main>
			{activeArtifact ? (
				<MarkdownDialog
					artifact={activeArtifact}
					artifacts={artifacts}
					canGoBack={artifactHistory.length > 1}
					onBack={handleBackArtifact}
					onClose={handleCloseDialog}
					onNavigate={handleNavigateArtifact}
				/>
			) : null}
		</>
	);
}

function ContentPanel(props: {
	activeArtifact: Artifact | null;
	actionItems: ActionItem[];
	activeView: DashboardView;
	activeDocumentModule: DocumentModuleFilter;
	artifacts: Artifact[];
	documentModuleCounts: Record<DocumentModuleFilter, number>;
	documentModuleTabs: DocumentModuleTab[];
	hardnessReport: HardnessScanReport;
	onSelectArtifact: (artifact: Artifact) => void;
	onSelectDocumentModule: (module: DocumentModuleFilter) => void;
	selectedType: (typeof artifactTypes)[number] | undefined;
	taskGroups: ReturnType<typeof buildTaskGroups>;
	visibleFiles: Artifact[];
	visibleFilesTitle: string;
}) {
	const {
		activeArtifact,
		actionItems,
		activeView,
		activeDocumentModule,
		artifacts,
		documentModuleCounts,
		documentModuleTabs,
		hardnessReport,
		onSelectArtifact,
		onSelectDocumentModule,
		selectedType,
		taskGroups,
		visibleFiles,
		visibleFilesTitle,
	} = props;

	if (activeView === "task") {
		return (
			<>
				<ArtifactSummaryCards artifacts={artifacts} />
				<TaskOverview
					onSelectArtifact={onSelectArtifact}
					taskGroups={taskGroups}
				/>
				<FilesPanel
					activeArtifact={activeArtifact}
					files={visibleFiles}
					onSelectArtifact={onSelectArtifact}
					title={visibleFilesTitle}
				/>
			</>
		);
	}

	if (activeView === "workflow") {
		return <WorkflowPanel />;
	}

	if (activeView === "action-required") {
		return (
			<ActionRequiredPanel
				items={actionItems}
				onSelectArtifact={(item) => onSelectArtifact(item.artifact)}
			/>
		);
	}

	if (activeView === "lifecycle") {
		return (
			<LifecyclePanel
				onSelectArtifact={onSelectArtifact}
				taskGroups={taskGroups}
			/>
		);
	}

	if (activeView === "hardness") {
		return <HardnessEngineeringPanel report={hardnessReport} />;
	}

	if (!selectedType) {
		return null;
	}

	return (
		<>
			<CategoryPanel
				activeDocumentModule={activeDocumentModule}
				artifactsForType={visibleFiles}
				documentModuleCounts={documentModuleCounts}
				documentModuleTabs={documentModuleTabs}
				onSelectArtifact={onSelectArtifact}
				onSelectDocumentModule={onSelectDocumentModule}
				type={selectedType}
			/>
			<FilesPanel
				activeArtifact={activeArtifact}
				files={visibleFiles}
				onSelectArtifact={onSelectArtifact}
				title={visibleFilesTitle}
			/>
		</>
	);
}

function buildDocumentModuleTabs(
	projectProfile: ProjectProfile,
): DocumentModuleTab[] {
	return [
		{ module: "all", label: "All" },
		{ module: "workspace", label: "Workspace" },
		...projectProfile.repositories.map((repository) => ({
			module: repository.id,
			label: repository.name,
		})),
	];
}

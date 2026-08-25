import {
	AlertTriangle,
	BookOpen,
	Brush,
	FileText,
	GitBranch,
	Layers3,
	LayoutDashboard,
	Milestone,
	ShieldCheck,
	Sparkles,
} from "lucide-react";
import type { ArtifactType, DashboardView } from "../../types";

export const artifactTypes: Array<{
	type: ArtifactType;
	label: string;
	singular: string;
	icon: typeof FileText;
	accent: "yellow" | "lime" | "pink" | "blue" | "white";
}> = [
	{
		type: "research",
		label: "Research",
		singular: "Research",
		icon: Sparkles,
		accent: "lime",
	},
	{
		type: "prd",
		label: "PRD",
		singular: "PRD",
		icon: FileText,
		accent: "yellow",
	},
	{
		type: "design",
		label: "Design",
		singular: "Design",
		icon: Brush,
		accent: "pink",
	},
	{
		type: "plan",
		label: "Plan",
		singular: "Plan",
		icon: Layers3,
		accent: "blue",
	},
	{
		type: "document",
		label: "Documents",
		singular: "Document",
		icon: BookOpen,
		accent: "white",
	},
];

export const taskArtifactTypes = artifactTypes.filter(
	(artifactType) => artifactType.type !== "document",
);

export const taskSubmenuItems = taskArtifactTypes.map((artifactType) => ({
	view: artifactType.type,
	label: artifactType.label,
	icon: artifactType.icon,
}));

export const navItems: Array<{
	view: DashboardView;
	label: string;
	icon: typeof FileText;
}> = [
	{ view: "task", label: "Task", icon: LayoutDashboard },
	{ view: "action-required", label: "Action Required", icon: AlertTriangle },
	{ view: "lifecycle", label: "Lifecycle", icon: Milestone },
	{ view: "workflow", label: "Workflow", icon: GitBranch },
	{
		view: "hardness",
		label: "Code Quality",
		icon: ShieldCheck,
	},
	{
		view: "document",
		label: "Documents",
		icon: BookOpen,
	},
];

export const statusRank = [
	"blocked",
	"draft",
	"need-design",
	"design-done",
	"in-progress",
	"approved",
	"complete",
	"superseded",
	"unknown",
];

import {
	ArrowRight,
	BadgeCheck,
	CheckCircle2,
	ClipboardCheck,
	ClipboardList,
	Code2,
	FilePenLine,
	FileText,
	GitBranch,
	Layers3,
	PencilLine,
	SearchCheck,
	Sparkles,
	UsersRound,
} from "lucide-react";
import { Card } from "../../../../shared/design-system";
import styles from "./WorkflowPanel.module.css";

const workflowSteps = [
	{
		title: "Request",
		command: "Developer request",
		icon: UsersRound,
		primaryRole: "Developer",
		supportingRoles: ["Project Manager", "Tech Lead"],
		output: "Scope, constraints, and workflow exceptions",
		detail: "Defines the work and any explicit exception to the normal path.",
	},
	{
		title: "Research",
		command: "$research <description>",
		icon: SearchCheck,
		primaryRole: "Tech Lead + Project Manager",
		supportingRoles: ["UI/UX Designer"],
		output: "research/RESEARCH-*.md",
		detail:
			"Used when current facts, product context, or architecture risk need grounding.",
	},
	{
		title: "Draft PRD",
		command: "$create-prd <description>",
		icon: FileText,
		primaryRole: "Project Manager",
		supportingRoles: ["Developer"],
		output: "prds/PRD-*.md",
		detail:
			"Captures user value, scope, requirements, and acceptance criteria.",
	},
	{
		title: "Clarify PRD",
		command: "$griling-prd <prd-id-or-path>",
		icon: ClipboardCheck,
		primaryRole: "Project Manager",
		supportingRoles: ["Developer"],
		output: "Updated draft PRD",
		detail:
			"Resolves missing requirements, unclear scope, conflicts, and risk.",
	},
	{
		title: "Approve PRD",
		command: "$approve-prd <prd-id>",
		icon: BadgeCheck,
		primaryRole: "Developer",
		supportingRoles: ["Project Manager"],
		output: "Approved PRD",
		detail: "Unlocks root planning and submodule planning.",
	},
	{
		title: "Design",
		command: "$create-design <design request>",
		icon: Sparkles,
		primaryRole: "UI/UX Designer",
		supportingRoles: ["Project Manager", "Tech Lead"],
		output: "Design artifact + PRD in design-done",
		detail:
			"Defines flows, layout, states, and updates PRD status to design-done.",
	},
	{
		title: "Plan",
		command: "$approve-prd <prd-id>",
		icon: Layers3,
		primaryRole: "Tech Lead",
		supportingRoles: ["Sub-agents"],
		output: "plans/PLAN-*.md + modules/*/plans/*.md",
		detail:
			"Creates the root overview plan and affected submodule detail plans.",
	},
	{
		title: "Clarify plan",
		command: "$griling-plan <plan-id-or-path>",
		icon: GitBranch,
		primaryRole: "Tech Lead",
		supportingRoles: ["Developer", "Implementation roles"],
		output: "Updated root or submodule plan",
		detail:
			"Challenges sequencing, ownership, risks, validation, and handoffs.",
	},
	{
		title: "Approve plan",
		command: "$approve-plan <plan-id>",
		icon: PencilLine,
		primaryRole: "Developer",
		supportingRoles: ["Tech Lead"],
		output: "Approved root plan",
		detail: "Allows implementation to begin in platform order.",
	},
	{
		title: "Implement",
		command: "Follow approved plan",
		icon: FilePenLine,
		primaryRole: "Core, Backend, Frontend",
		supportingRoles: ["Tech Lead", "UI/UX Designer"],
		output: "Changed modules + validation report",
		detail:
			"Builds in platform order, validates each repo, and reports handoff state.",
	},
] as const;

const implementationSteps = [
	{
		title: "shared/core",
		role: "Core Developer",
		detail: "Shared contracts, packages, and reusable logic",
	},
	{
		title: "backend/service",
		role: "Backend Developer",
		detail: "API routes, service behavior, persistence, and jobs",
	},
	{
		title: "frontend/app",
		role: "Frontend Developer",
		detail: "User workflows, screens, client state, and integration",
	},
] as const;

const commandGuidance = [
	{
		command: "$create-prd",
		when: "Start any feature or implementation task.",
		result: "Creates a draft PRD from `templates/prd-template.md`.",
	},
	{
		command: "$griling-prd",
		when: "The draft PRD has unclear requirements, conflicts, or risky gaps.",
		result: "Asks focused questions, then updates the PRD.",
	},
	{
		command: "$approve-prd",
		when: "The PRD is ready for design routing or planning approval.",
		result:
			"Routes to design (`need-design`) or approves PRD (`approved`) and creates plans.",
	},
	{
		command: "$create-design",
		when: "The task affects screens, layout, interaction, accessibility, or UI copy.",
		result: "Creates design guidance and updates PRD status to `design-done`.",
	},
	{
		command: "$create-diagram",
		when: "A workflow, handoff, or architecture needs a visual map.",
		result: "Creates a role-aware Mermaid or dashboard-native diagram.",
	},
	{
		command: "$griling-plan",
		when: "The plan needs pressure testing before approval.",
		result: "Clarifies sequencing, dependencies, validation, and risks.",
	},
	{
		command: "$approve-plan",
		when: "The root plan is complete enough to execute.",
		result: "Marks the plan approved and allows code changes.",
	},
] as const;

export function WorkflowPanel() {
	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<GitBranch className={styles.sectionIcon} />
				<h2 className={styles.sectionTitle}>Workspace workflow</h2>
			</div>

			<Card className={styles.workflowCard} variant="white">
				<div className={styles.workflowHeader}>
					<div>
						<p className={styles.eyebrow}>
							How work moves through this workspace
						</p>
						<h3 className={styles.title}>Role-aware workflow diagram</h3>
					</div>
					<div className={styles.workflowBadges}>
						<span className={styles.badge}>PRD first</span>
						<span className={styles.badge}>Plan before code</span>
						<span className={styles.badge}>Roles on every step</span>
					</div>
				</div>

				<div className={styles.diagramScroller}>
					<ol className={styles.diagramTrack} aria-label="Workspace workflow">
						{workflowSteps.map((step, index) => (
							<WorkflowStepCard index={index} key={step.title} step={step} />
						))}
					</ol>
				</div>
			</Card>

			<Card className={styles.implementationCard} variant="lime">
				<div className={styles.guideHeader}>
					<Code2 className={styles.guideIcon} />
					<h3 className={styles.guideTitle}>Implementation lane</h3>
				</div>
				<ol className={styles.implementationTrack}>
					{implementationSteps.map((step, index) => (
						<li className={styles.implementationStep} key={step.title}>
							<span className={styles.orderIndex}>{index + 1}</span>
							<div>
								<h4 className={styles.implementationTitle}>{step.title}</h4>
								<p className={styles.implementationRole}>{step.role}</p>
								<p className={styles.implementationDetail}>{step.detail}</p>
							</div>
						</li>
					))}
				</ol>
				<p className={styles.orderNote}>
					Skip platforms that are not in the approved plan. After each platform,
					stop and ask whether to continue to the next one.
				</p>
			</Card>

			<Card className={styles.rolesCard} variant="blue">
				<div className={styles.guideHeader}>
					<CheckCircle2 className={styles.guideIcon} />
					<h3 className={styles.guideTitle}>Step ownership</h3>
				</div>
				<div className={styles.rolesGrid}>
					{workflowSteps.map((step, index) => (
						<div className={styles.roleRow} key={step.title}>
							<span className={styles.roleIndex}>{index + 1}</span>
							<div className={styles.roleText}>
								<h4 className={styles.roleStep}>{step.title}</h4>
								<p className={styles.roleMeta}>
									<span>Primary: {step.primaryRole}</span>
									<span>Support: {step.supportingRoles.join(", ")}</span>
								</p>
							</div>
						</div>
					))}
				</div>
			</Card>

			<div className={styles.lowerGrid}>
				<CommandGuide />
				<WorkflowRules />
			</div>
		</section>
	);
}

function WorkflowStepCard(props: {
	index: number;
	step: (typeof workflowSteps)[number];
}) {
	const { index, step } = props;
	const Icon = step.icon;

	return (
		<li className={styles.stepCard}>
			<div className={styles.stepHeader}>
				<span className={styles.stepIndex}>{index + 1}</span>
				<Icon className={styles.stepIcon} />
			</div>
			<h4 className={styles.stepTitle}>{step.title}</h4>
			<p className={styles.command}>{step.command}</p>
			<div className={styles.roleChips}>
				<span className={styles.primaryRole}>{step.primaryRole}</span>
				{step.supportingRoles.map((role) => (
					<span className={styles.supportRole} key={role}>
						{role}
					</span>
				))}
			</div>
			<p className={styles.output}>
				<span>Output:</span> {step.output}
			</p>
			<p className={styles.detail}>{step.detail}</p>
			{index < workflowSteps.length - 1 ? (
				<div className={styles.next} aria-hidden="true">
					<ArrowRight className={styles.nextIcon} />
				</div>
			) : null}
		</li>
	);
}

function CommandGuide() {
	return (
		<Card className={styles.guideCard} variant="yellow">
			<div className={styles.guideHeader}>
				<FileText className={styles.guideIcon} />
				<h3 className={styles.guideTitle}>Command guide</h3>
			</div>
			<div className={styles.guideGrid}>
				{commandGuidance.map((item) => (
					<div className={styles.guideItem} key={item.command}>
						<div className={styles.guideCommand}>{item.command}</div>
						<p className={styles.guideCopy}>
							<span className={styles.guideLabel}>Use when: </span>
							{item.when}
						</p>
						<p className={styles.guideCopyTight}>
							<span className={styles.guideLabel}>Result: </span>
							{item.result}
						</p>
					</div>
				))}
			</div>
		</Card>
	);
}

function WorkflowRules() {
	return (
		<Card className={styles.rulesCard} variant="yellow">
			<div className={styles.guideHeader}>
				<ClipboardList className={styles.guideIcon} />
				<h3 className={styles.guideTitle}>Workflow rules</h3>
			</div>
			<ul className={styles.rulesList}>
				{[
					"Every feature or implementation task starts with a saved PRD.",
					"Implementation starts only after the root plan is approved.",
					"Keep changes inside the repository that owns the work.",
					"Report changed submodules, validation, and pointer status.",
				].map((rule) => (
					<li className={styles.ruleItem} key={rule}>
						{rule}
					</li>
				))}
			</ul>
		</Card>
	);
}

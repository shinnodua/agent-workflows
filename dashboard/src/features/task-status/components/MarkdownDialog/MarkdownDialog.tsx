import { ArrowLeft, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button, Card } from "../../../../shared/design-system";
import type { Artifact } from "../../../../types";
import { renderMarkdownBlocks } from "../../utils/markdownRenderer/markdownRenderer";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import styles from "./MarkdownDialog.module.css";

type MarkdownDialogProps = {
	artifact: Artifact;
	artifacts: Artifact[];
	canGoBack: boolean;
	onBack: () => void;
	onClose: () => void;
	onNavigate: (artifact: Artifact) => void;
};

const defaultDialogWidth = 640;
const minDialogWidth = 420;
const viewportGutter = 48;
const keyboardResizeStep = 32;
const drawerAnimationMs = 180;

export function MarkdownDialog(props: MarkdownDialogProps) {
	const { artifact, artifacts, canGoBack, onBack, onClose, onNavigate } = props;
	const [dialogWidth, setDialogWidth] = useState(defaultDialogWidth);
	const [isClosing, setIsClosing] = useState(false);
	const resizeState = useRef<{
		startWidth: number;
		startX: number;
	} | null>(null);
	const closeTimeout = useRef<number | null>(null);
	const blocks = renderMarkdownBlocks(artifact.content, {
		artifacts,
		currentArtifact: artifact,
		onNavigate,
	});

	useEffect(
		() => () => {
			if (closeTimeout.current) {
				window.clearTimeout(closeTimeout.current);
			}
		},
		[],
	);

	useEffect(() => {
		function handleWindowResize() {
			setDialogWidth((currentWidth) => clampDialogWidth(currentWidth));
		}

		window.addEventListener("resize", handleWindowResize);

		return () => window.removeEventListener("resize", handleWindowResize);
	}, []);

	useEffect(() => {
		function handleEscapeKey(event: KeyboardEvent) {
			if (event.key === "Escape") {
				requestClose();
			}
		}

		window.addEventListener("keydown", handleEscapeKey);

		return () => window.removeEventListener("keydown", handleEscapeKey);
	});

	function requestClose() {
		if (isClosing) {
			return;
		}

		setIsClosing(true);
		closeTimeout.current = window.setTimeout(onClose, drawerAnimationMs);
	}

	function handleResizePointerDown(
		event: React.PointerEvent<HTMLButtonElement>,
	) {
		event.preventDefault();
		resizeState.current = {
			startWidth: dialogWidth,
			startX: event.clientX,
		};
		document.body.style.cursor = "ew-resize";
		document.body.style.userSelect = "none";
		window.addEventListener("pointermove", handleResizePointerMove);
		window.addEventListener("pointerup", handleResizePointerUp, { once: true });
	}

	function handleResizePointerMove(event: PointerEvent) {
		const currentResize = resizeState.current;

		if (!currentResize) {
			return;
		}

		setDialogWidth(
			clampDialogWidth(
				currentResize.startWidth + currentResize.startX - event.clientX,
			),
		);
	}

	function handleResizePointerUp() {
		resizeState.current = null;
		document.body.style.cursor = "";
		document.body.style.userSelect = "";
		window.removeEventListener("pointermove", handleResizePointerMove);
	}

	function handleResizeKeyDown(event: React.KeyboardEvent<HTMLButtonElement>) {
		if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
			return;
		}

		event.preventDefault();
		setDialogWidth((currentWidth) =>
			clampDialogWidth(
				event.key === "ArrowLeft"
					? currentWidth + keyboardResizeStep
					: currentWidth - keyboardResizeStep,
			),
		);
	}

	return (
		<>
			<button
				aria-label="Close markdown preview"
				className={`${styles.backdrop} ${
					isClosing ? styles.backdropExit : styles.backdropEnter
				}`}
				onClick={requestClose}
				type="button"
			/>
			<aside
				aria-label={`Markdown preview for ${artifact.title}`}
				aria-modal="true"
				className={`${styles.drawer} ${
					isClosing ? styles.drawerExit : styles.drawerEnter
				}`}
				role="dialog"
				style={{ width: dialogWidth }}
			>
				<button
					aria-label="Resize markdown preview width"
					className={styles.resizeHandle}
					onKeyDown={handleResizeKeyDown}
					onPointerDown={handleResizePointerDown}
					title="Resize markdown preview"
					type="button"
				>
					<span className={styles.resizeIndicator} />
				</button>
				<Card variant="white" className={styles.card}>
					<MarkdownDialogHeader
						artifact={artifact}
						canGoBack={canGoBack}
						onBack={onBack}
						onClose={requestClose}
					/>
					<div className={styles.body}>{blocks}</div>
				</Card>
			</aside>
		</>
	);
}

function clampDialogWidth(width: number) {
	const maxWidth =
		typeof window === "undefined"
			? defaultDialogWidth
			: Math.max(minDialogWidth, window.innerWidth - viewportGutter);

	return Math.min(Math.max(width, minDialogWidth), maxWidth);
}

function MarkdownDialogHeader(props: {
	artifact: Artifact;
	canGoBack: boolean;
	onBack: () => void;
	onClose: () => void;
}) {
	const { artifact, canGoBack, onBack, onClose } = props;

	return (
		<div className={styles.header}>
			<div className={styles.headerTop}>
				<div>
					<div className={styles.meta}>
						<span className={styles.typeBadge}>{artifact.type}</span>
						<StatusBadge status={artifact.status} />
					</div>
					<h2 className={styles.title}>{artifact.title}</h2>
					<p className={styles.path}>{artifact.relativePath}</p>
				</div>
				<div className={styles.actions}>
					{canGoBack ? (
						<Button
							aria-label="Go back to previous markdown document"
							onClick={onBack}
							size="icon"
							variant="white"
						>
							<ArrowLeft className={styles.icon} />
						</Button>
					) : null}
					<Button
						aria-label="Close markdown preview"
						onClick={onClose}
						size="icon"
						variant="red"
					>
						<X className={styles.icon} />
					</Button>
				</div>
			</div>
			<a
				className={styles.rawLink}
				href={artifact.sourceHref}
				target="_blank"
				rel="noreferrer"
			>
				<Button size="sm" variant="white">
					Open raw
				</Button>
			</a>
		</div>
	);
}

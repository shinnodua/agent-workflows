import type {
	ButtonHTMLAttributes,
	InputHTMLAttributes,
	ReactNode,
} from "react";
import "./design-system.css";

type SurfaceVariant = "white" | "yellow" | "lime" | "blue" | "pink" | "red";

type CardProps = {
	children: ReactNode;
	className?: string;
	variant?: SurfaceVariant;
};

export function Card(props: CardProps) {
	const { children, className = "", variant = "white" } = props;

	return (
		<div
			className={["aw-card", `aw-card--${variant}`, className]
				.filter(Boolean)
				.join(" ")}
		>
			{children}
		</div>
	);
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
	size?: "sm" | "md" | "icon";
	variant?: SurfaceVariant;
};

export function Button(props: ButtonProps) {
	const {
		className = "",
		size = "md",
		variant = "white",
		type = "button",
		...buttonProps
	} = props;

	return (
		<button
			className={[
				"aw-button",
				`aw-button--${size}`,
				`aw-button--${variant}`,
				className,
			]
				.filter(Boolean)
				.join(" ")}
			type={type}
			{...buttonProps}
		/>
	);
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
	label?: string;
};

export function Input(props: InputProps) {
	const { className = "", id, label, ...inputProps } = props;
	const inputId =
		id ??
		(label
			? label
					.toLowerCase()
					.replace(/[^a-z0-9]+/g, "-")
					.replace(/^-|-$/g, "")
			: undefined);

	return (
		<label
			className={["aw-field", className].filter(Boolean).join(" ")}
			htmlFor={inputId}
		>
			{label ? <span className="aw-field__label">{label}</span> : null}
			<input className="aw-input" id={inputId} {...inputProps} />
		</label>
	);
}

import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "primary" | "secondary" | "danger";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
};

export const buttonVariantClasses: Record<ButtonVariant, string> = {
  primary:
    "border border-transparent rounded-xl bg-app-accent text-app-inverse hover:bg-app-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",
  secondary:
    "border border-app-border-strong rounded-xl bg-app-surface text-app-foreground hover:bg-app-surface-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-accent",
  danger:
    "border border-transparent rounded-xl bg-app-danger text-app-inverse hover:bg-app-danger-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-app-danger",
};

export function getButtonClassName(
  variant: ButtonVariant,
  className = "",
) {
  return `inline-flex items-center justify-center font-semibold transition ${buttonVariantClasses[variant]} ${className}`.trim();
}

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      className={getButtonClassName(variant, className)}
    />
  );
}

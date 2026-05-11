import { type ReactNode } from "react";
import { cn } from "../../utils/cn";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 px-4 text-center",
        className
      )}
    >
      {icon && (
        <div className="mb-4 p-4 bg-slate-50 rounded-full text-slate-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-slate-700">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-slate-500 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// Construction-themed SVG illustration
export function ConstructionEmptyIllustration() {
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="40" cy="40" r="40" fill="#FFF7ED" />
      <rect x="20" y="50" width="40" height="6" rx="2" fill="#F97316" opacity="0.3" />
      <rect x="25" y="35" width="30" height="15" rx="2" fill="#F97316" opacity="0.5" />
      <path d="M30 35 L40 20 L50 35" fill="#F97316" opacity="0.7" />
      <circle cx="40" cy="18" r="4" fill="#F97316" />
    </svg>
  );
}

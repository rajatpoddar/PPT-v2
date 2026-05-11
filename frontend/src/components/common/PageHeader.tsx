import { type ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../../utils/cn";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backTo?: string;
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, backTo, actions, className }: PageHeaderProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        "sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-4 py-3",
        className
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          {backTo && (
            <button
              onClick={() => navigate(backTo)}
              className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors flex-shrink-0"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-slate-800 truncate">{title}</h1>
            {subtitle && (
              <p className="text-xs text-slate-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>}
      </div>
    </div>
  );
}

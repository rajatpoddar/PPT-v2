import { type ReactNode } from "react";
import { cn } from "../../utils/cn";
import { formatCurrency } from "../../utils/formatters";
import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  isCurrency?: boolean;
  trend?: number; // positive = up, negative = down
  subtitle?: string;
  className?: string;
  valueClassName?: string;
}

export function KPICard({
  title,
  value,
  icon,
  isCurrency = false,
  trend,
  subtitle,
  className,
  valueClassName,
}: KPICardProps) {
  const displayValue = isCurrency
    ? formatCurrency(typeof value === "string" ? parseFloat(value) : value)
    : value;

  const isProfit = typeof value === "number" && value >= 0;

  return (
    <div
      className={cn(
        "bg-white rounded-xl shadow-sm border border-slate-100 p-4 transition-all duration-200 hover:shadow-md",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">
            {title}
          </p>
          <p
            className={cn(
              "mt-1 text-2xl font-bold text-slate-800 animate-count-up",
              valueClassName,
              isCurrency && title.toLowerCase().includes("profit") && {
                "text-green-600": isProfit,
                "text-red-500": !isProfit,
              }
            )}
          >
            {displayValue}
          </p>
          {subtitle && (
            <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="ml-3 p-2.5 bg-orange-50 rounded-lg text-orange-500 flex-shrink-0">
            {icon}
          </div>
        )}
      </div>
      {trend !== undefined && (
        <div className="mt-2 flex items-center gap-1">
          {trend >= 0 ? (
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
          ) : (
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
          )}
          <span
            className={cn(
              "text-xs font-medium",
              trend >= 0 ? "text-green-600" : "text-red-500"
            )}
          >
            {Math.abs(trend)}% vs last week
          </span>
        </div>
      )}
    </div>
  );
}

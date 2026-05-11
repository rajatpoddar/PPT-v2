import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency } from "../../utils/formatters";
import { cn } from "../../utils/cn";

interface MoneyDisplayProps {
  amount: number;
  showSign?: boolean;
  showTrend?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function MoneyDisplay({
  amount,
  showSign = false,
  showTrend = false,
  size = "md",
  className,
}: MoneyDisplayProps) {
  const isPositive = amount > 0;
  const isNegative = amount < 0;
  const isZero = amount === 0;

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-xl font-bold",
    xl: "text-2xl font-bold",
  };

  const colorClass = showSign
    ? isPositive
      ? "text-green-600"
      : isNegative
      ? "text-red-500"
      : "text-slate-500"
    : "text-slate-800";

  return (
    <span className={cn("inline-flex items-center gap-1", sizeClasses[size], colorClass, className)}>
      {showTrend && (
        <>
          {isPositive && <TrendingUp className="w-4 h-4" />}
          {isNegative && <TrendingDown className="w-4 h-4" />}
          {isZero && <Minus className="w-4 h-4" />}
        </>
      )}
      {showSign && isPositive && "+"}
      {formatCurrency(Math.abs(amount))}
    </span>
  );
}

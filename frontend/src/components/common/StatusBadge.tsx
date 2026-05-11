import { cn } from "../../utils/cn";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: { label: "Active", className: "bg-green-100 text-green-700" },
  on_hold: { label: "On Hold", className: "bg-yellow-100 text-yellow-700" },
  completed: { label: "Completed", className: "bg-blue-100 text-blue-700" },
  closed: { label: "Closed", className: "bg-gray-100 text-gray-600" },
  inactive: { label: "Inactive", className: "bg-gray-100 text-gray-600" },
  present: { label: "Present", className: "bg-green-100 text-green-700" },
  absent: { label: "Absent", className: "bg-red-100 text-red-700" },
  half_day: { label: "Half Day", className: "bg-yellow-100 text-yellow-700" },
  leave: { label: "Leave", className: "bg-blue-100 text-blue-700" },
  in_store: { label: "In Store", className: "bg-green-100 text-green-700" },
  on_site: { label: "On Site", className: "bg-orange-100 text-orange-700" },
  under_repair: { label: "Under Repair", className: "bg-red-100 text-red-700" },
  disposed: { label: "Disposed", className: "bg-gray-100 text-gray-600" },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { label: status, className: "bg-gray-100 text-gray-600" };
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}

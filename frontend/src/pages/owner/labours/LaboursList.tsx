import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Phone } from "lucide-react";
import { laboursApi } from "../../../services/api";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { EmptyState } from "../../../components/common/EmptyState";
import { TableSkeleton } from "../../../components/common/LoadingSkeleton";
import { PageHeader } from "../../../components/common/PageHeader";
import { formatCurrency } from "../../../utils/formatters";
import { SKILL_TYPE_LABELS } from "../../../utils/constants";
import type { Labour } from "../../../types";

export function LaboursList() {
  const [search, setSearch] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("active");

  const { data: labours = [], isLoading } = useQuery<Labour[]>({
    queryKey: ["labours", search, skillFilter, statusFilter],
    queryFn: () =>
      laboursApi.list({
        search: search || undefined,
        skill_type: skillFilter || undefined,
        status: statusFilter || undefined,
      }).then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Labour"
        subtitle={`${labours.length} worker${labours.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            to="/labours/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Labour</span>
          </Link>
        }
      />

      {/* Search & Filters */}
      <div className="px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-400"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["active", "inactive", ""].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {s === "" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Labour List */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <TableSkeleton rows={8} />
        ) : labours.length === 0 ? (
          <EmptyState
            title="No labours found"
            description="Add your first worker to get started"
            action={
              <Link
                to="/labours/new"
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Add Labour
              </Link>
            }
          />
        ) : (
          <div className="space-y-2">
            {labours.map((labour) => (
              <Link
                key={labour.id}
                to={`/labours/${labour.id}`}
                className="flex items-center gap-3 bg-white rounded-xl border border-slate-100 p-3 hover:shadow-sm hover:border-orange-200 transition-all duration-200"
              >
                {/* Avatar */}
                <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold flex-shrink-0 overflow-hidden">
                  {labour.photo_url ? (
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${labour.photo_url}`}
                      alt={labour.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    labour.name.charAt(0)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{labour.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500">
                      {SKILL_TYPE_LABELS[labour.skill_type]?.split(" / ")[0]}
                    </span>
                    {labour.phone && (
                      <>
                        <span className="text-slate-300">·</span>
                        <span className="text-xs text-slate-400 flex items-center gap-0.5">
                          <Phone className="w-3 h-3" />
                          {labour.phone}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Rate & Status */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-slate-800">{formatCurrency(labour.daily_rate)}</p>
                  <p className="text-xs text-slate-400">per day</p>
                </div>
                <StatusBadge status={labour.status} />
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

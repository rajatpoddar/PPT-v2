import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, MapPin, User, Filter } from "lucide-react";
import { sitesApi } from "../../../services/api";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { EmptyState, ConstructionEmptyIllustration } from "../../../components/common/EmptyState";
import { CardSkeleton } from "../../../components/common/LoadingSkeleton";
import { PageHeader } from "../../../components/common/PageHeader";
import { formatCurrency } from "../../../utils/formatters";
import { PROJECT_TYPE_LABELS } from "../../../utils/constants";
import type { Site } from "../../../types";

export function SitesList() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const { data: sites = [], isLoading } = useQuery<Site[]>({
    queryKey: ["sites", search, statusFilter],
    queryFn: () =>
      sitesApi.list({ search: search || undefined, status: statusFilter || undefined })
        .then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Sites"
        subtitle={`${sites.length} site${sites.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            to="/sites/new"
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Site</span>
          </Link>
        }
      />

      {/* Search & Filter */}
      <div className="px-4 py-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search sites or contractor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {["", "active", "on_hold", "completed"].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                statusFilter === s
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:border-orange-300"
              }`}
            >
              {s === "" ? "All" : s === "on_hold" ? "On Hold" : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Sites Grid */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : sites.length === 0 ? (
          <EmptyState
            icon={<ConstructionEmptyIllustration />}
            title="No sites found"
            description={search ? "Try a different search term" : "Create your first construction site to get started"}
            action={
              <Link
                to="/sites/new"
                className="px-4 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
              >
                Create Site
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {sites.map((site) => (
              <SiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SiteCard({ site }: { site: Site }) {
  return (
    <Link
      to={`/sites/${site.id}`}
      className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200 block"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-slate-800 truncate">{site.name}</h3>
          {site.location && (
            <div className="flex items-center gap-1 mt-0.5">
              <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
              <p className="text-xs text-slate-400 truncate">{site.location}</p>
            </div>
          )}
        </div>
        <StatusBadge status={site.status} className="ml-2 flex-shrink-0" />
      </div>

      {site.project_type && (
        <span className="inline-block text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full mb-3">
          {PROJECT_TYPE_LABELS[site.project_type]}
        </span>
      )}

      {site.main_contractor_name && (
        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
          <User className="w-3 h-3" />
          <span className="truncate">{site.main_contractor_name}</span>
          {site.main_contractor_company && (
            <span className="text-slate-400">· {site.main_contractor_company}</span>
          )}
        </div>
      )}

      {site.total_contract_value && (
        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
          <span className="text-xs text-slate-400">Contract Value</span>
          <span className="text-sm font-semibold text-slate-700">
            {formatCurrency(site.total_contract_value)}
          </span>
        </div>
      )}
    </Link>
  );
}

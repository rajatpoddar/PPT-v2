import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Edit } from "lucide-react";
import { sitesApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { PageSkeleton } from "../../../components/common/LoadingSkeleton";
import { useAuthStore } from "../../../store/authStore";
import { OverviewTab } from "./tabs/OverviewTab";
import { WorkItemsTab } from "./tabs/WorkItemsTab";
import { WorkLogsTab } from "./tabs/WorkLogsTab";
import { AttendanceTab } from "./tabs/AttendanceTab";
import { FinancialsTab } from "./tabs/FinancialsTab";
import { PhotosTab } from "./tabs/PhotosTab";
import type { Site } from "../../../types";
import { cn } from "../../../utils/cn";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "work-items", label: "Rate Card" },
  { id: "work-logs", label: "Work Logs" },
  { id: "attendance", label: "Attendance" },
  { id: "financials", label: "Financials" },
  { id: "photos", label: "Photos" },
];

export function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const siteId = parseInt(id!);
  const [activeTab, setActiveTab] = useState("overview");
  const { user } = useAuthStore();
  const isOwner = user?.role === "owner";

  const { data: site, isLoading } = useQuery<Site>({
    queryKey: ["site", siteId],
    queryFn: () => sitesApi.get(siteId).then((r) => r.data),
    enabled: !!siteId,
  });

  if (isLoading) return <PageSkeleton />;
  if (!site) return <div className="p-4 text-center text-slate-500">Site not found</div>;

  return (
    <div>
      <PageHeader
        title={site.name}
        subtitle={site.location}
        backTo="/sites"
        actions={
          <div className="flex items-center gap-3">
            <StatusBadge status={site.status} />
            {isOwner && (
              <Link
                to={`/sites/${site.id}/edit`}
                className="p-2 text-slate-500 hover:text-orange-500 bg-white rounded-lg border border-slate-200 hover:border-orange-500 transition-colors"
                title="Edit Site"
              >
                <Edit className="w-4 h-4" />
              </Link>
            )}
          </div>
        }
      />

      {/* Tab Bar */}
      <div className="bg-white border-b border-slate-100 sticky top-[57px] z-10">
        <div className="flex overflow-x-auto scrollbar-hide px-4">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.id
                  ? "border-orange-500 text-orange-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-4">
        {activeTab === "overview" && <OverviewTab site={site} />}
        {activeTab === "work-items" && <WorkItemsTab siteId={siteId} />}
        {activeTab === "work-logs" && <WorkLogsTab siteId={siteId} />}
        {activeTab === "attendance" && <AttendanceTab siteId={siteId} />}
        {activeTab === "financials" && <FinancialsTab siteId={siteId} />}
        {activeTab === "photos" && <PhotosTab siteId={siteId} />}
      </div>
    </div>
  );
}

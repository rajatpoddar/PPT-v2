import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { dashboardApi } from "../../services/api";
import { PageHeader } from "../../components/common/PageHeader";
import { KPICard } from "../../components/common/KPICard";
import { PageSkeleton } from "../../components/common/LoadingSkeleton";
import { formatCurrency, formatDate } from "../../utils/formatters";
import { StatusBadge } from "../../components/common/StatusBadge";

export function InvestorPortal() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "investor"],
    queryFn: () => dashboardApi.investor().then((r) => r.data),
  });

  if (isLoading) return <PageSkeleton />;
  if (!data) return null;

  const { summary, site_cards, recent_transactions } = data;

  return (
    <div>
      <PageHeader title="My Investments" subtitle="Investment portfolio overview" />

      <div className="p-4 space-y-5">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <KPICard
            title="Total Invested"
            value={summary.total_invested}
            isCurrency
            icon={<DollarSign className="w-5 h-5" />}
          />
          <KPICard
            title="Total Returned"
            value={summary.total_returned}
            isCurrency
            icon={<TrendingUp className="w-5 h-5" />}
          />
          <KPICard
            title="Outstanding"
            value={summary.outstanding}
            isCurrency
            icon={<TrendingDown className="w-5 h-5" />}
          />
        </div>

        {/* Site Cards */}
        {site_cards.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">My Sites</h2>
            <div className="space-y-3">
              {site_cards.map((site: {
                site_id: number;
                site_name: string;
                amount_invested: number;
                status: string;
                photos: { url: string; caption?: string }[];
              }) => (
                <div key={site.site_id} className="bg-white rounded-xl border border-slate-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-800">{site.site_name}</h3>
                      <p className="text-sm text-slate-500 mt-0.5">
                        Invested: <span className="font-semibold text-slate-700">{formatCurrency(site.amount_invested)}</span>
                      </p>
                    </div>
                    <StatusBadge status={site.status} />
                  </div>

                  {/* Photo thumbnails */}
                  {site.photos.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {site.photos.slice(0, 5).map((photo, i) => (
                        <div key={i} className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-slate-100">
                          <img
                            src={`${import.meta.env.VITE_API_BASE_URL}${photo.url}`}
                            alt={photo.caption || "Site photo"}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Transactions */}
        {recent_transactions.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-slate-700 mb-3">Recent Transactions</h2>
            <div className="space-y-2">
              {recent_transactions.map((txn: {
                id: number;
                date: string;
                type: string;
                amount: number;
                notes?: string;
              }) => (
                <div key={txn.id} className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    txn.type.includes("investment") ? "bg-green-50" : "bg-orange-50"
                  }`}>
                    {txn.type.includes("investment") ? (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 capitalize">
                      {txn.type.replace(/_/g, " ")}
                    </p>
                    <p className="text-xs text-slate-400">{formatDate(txn.date)}</p>
                  </div>
                  <p className={`font-bold text-sm flex-shrink-0 ${
                    txn.type.includes("investment") ? "text-green-600" : "text-orange-600"
                  }`}>
                    {formatCurrency(txn.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

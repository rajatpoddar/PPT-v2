import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Download, TrendingUp, TrendingDown } from "lucide-react";
import { reportsApi, sitesApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { formatCurrency } from "../../../utils/formatters";
import type { Site } from "../../../types";

export function ReportsPage() {
  const [selectedSite, setSelectedSite] = useState("");
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => sitesApi.list().then((r) => r.data),
  });

  const { data: monthlySummary } = useQuery({
    queryKey: ["monthly-summary", month],
    queryFn: () => reportsApi.monthlySummary(month).then((r) => r.data),
  });

  const downloadWeeklyReport = async (siteId: number) => {
    try {
      const res = await reportsApi.weeklySettlement(siteId);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `weekly_settlement_${siteId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // PDF generation may fail if WeasyPrint not installed
      alert("PDF generation requires WeasyPrint. Check backend setup.");
    }
  };

  return (
    <div>
      <PageHeader title="Reports" subtitle="Generate and download reports" />

      <div className="px-4 py-3 space-y-5">
        {/* Monthly Summary */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-slate-700 text-sm">Monthly Summary</h3>
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
          </div>

          {monthlySummary && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center">
                  <p className="text-lg font-bold text-slate-800">{formatCurrency(monthlySummary.totals.earned)}</p>
                  <p className="text-xs text-slate-400">Total Earned</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-bold text-red-500">{formatCurrency(monthlySummary.totals.expenses)}</p>
                  <p className="text-xs text-slate-400">Total Expenses</p>
                </div>
                <div className="text-center">
                  <p className={`text-lg font-bold ${monthlySummary.totals.profit >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {formatCurrency(monthlySummary.totals.profit)}
                  </p>
                  <p className="text-xs text-slate-400">Net Profit</p>
                </div>
              </div>

              <div className="space-y-2">
                {monthlySummary.sites.map((site: {
                  site_id: number;
                  site_name: string;
                  earned: number;
                  expenses: number;
                  profit: number;
                }) => (
                  <div key={site.site_id} className="flex items-center justify-between text-sm p-2 bg-slate-50 rounded-lg">
                    <span className="font-medium text-slate-700 truncate flex-1">{site.site_name}</span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {site.profit >= 0 ? (
                        <TrendingUp className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-red-500" />
                      )}
                      <span className={site.profit >= 0 ? "text-green-600 font-semibold" : "text-red-500 font-semibold"}>
                        {formatCurrency(site.profit)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Report Downloads */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Download Reports</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1.5">Select Site</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Choose a site...</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              {[
                { label: "Weekly Settlement Report", desc: "Work done, expenses, P&L summary" },
                { label: "Site Progress Report", desc: "Work items progress and photos" },
              ].map(({ label, desc }) => (
                <button
                  key={label}
                  onClick={() => selectedSite && downloadWeeklyReport(parseInt(selectedSite))}
                  disabled={!selectedSite}
                  className="w-full flex items-center gap-3 p-3 border border-slate-200 rounded-lg hover:border-orange-300 hover:bg-orange-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed text-left"
                >
                  <div className="p-2 bg-orange-50 rounded-lg flex-shrink-0">
                    <FileText className="w-4 h-4 text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700">{label}</p>
                    <p className="text-xs text-slate-400">{desc}</p>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 flex-shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

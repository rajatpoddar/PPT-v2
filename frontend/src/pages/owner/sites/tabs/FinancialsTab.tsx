import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, TrendingDown, Download } from "lucide-react";
import { sitesApi, reportsApi } from "../../../../services/api";
import { formatCurrency, getWeekStart, getWeekLabel } from "../../../../utils/formatters";

interface FinancialsTabProps {
  siteId: number;
}

export function FinancialsTab({ siteId }: FinancialsTabProps) {
  const [weekStart, setWeekStart] = useState(() => {
    const d = getWeekStart();
    return d.toISOString().split("T")[0];
  });

  const { data: financials, isLoading } = useQuery({
    queryKey: ["site-financials", siteId, weekStart],
    queryFn: () => sitesApi.financials(siteId, { week_start: weekStart }).then((r) => r.data),
  });

  const handleDownloadPDF = async () => {
    try {
      const res = await reportsApi.weeklySettlement(siteId, weekStart);
      const url = URL.createObjectURL(new Blob([res.data], { type: "application/pdf" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = `settlement_${siteId}_${weekStart}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      // If PDF fails, show error
    }
  };

  const navigateWeek = (direction: number) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + direction * 7);
    setWeekStart(d.toISOString().split("T")[0]);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Week Selector */}
      <div className="flex items-center justify-between bg-white rounded-xl border border-slate-100 p-3">
        <button
          onClick={() => navigateWeek(-1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          ‹
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-700">
            {getWeekLabel(new Date(weekStart))}
          </p>
          <p className="text-xs text-slate-400">Week</p>
        </div>
        <button
          onClick={() => navigateWeek(1)}
          className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-600"
        >
          ›
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : financials ? (
        <>
          {/* Work Items Breakdown */}
          {financials.work_items_breakdown?.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-100 p-4">
              <h3 className="font-semibold text-slate-700 text-sm mb-3">Work Done</h3>
              <div className="space-y-2">
                {financials.work_items_breakdown.map((item: {
                  work_item_id: number;
                  work_name: string;
                  unit_label: string;
                  rate: number;
                  quantity_done: number;
                  earned: number;
                }) => (
                  <div key={item.work_item_id} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="font-medium text-slate-700">{item.work_name}</p>
                      <p className="text-xs text-slate-400">
                        {item.quantity_done.toFixed(2)} {item.unit_label} × {formatCurrency(item.rate)}
                      </p>
                    </div>
                    <span className="font-semibold text-slate-800">{formatCurrency(item.earned)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settlement Card */}
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <h3 className="font-semibold text-slate-700 text-sm mb-3">Settlement Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Total Earned</span>
                <span className="font-semibold text-slate-800">{formatCurrency(financials.earnings)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Labour Cost</span>
                <span className="text-red-500">- {formatCurrency(financials.labour_cost)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Other Expenses</span>
                <span className="text-red-500">- {formatCurrency(financials.expenses)}</span>
              </div>
              <div className="border-t border-slate-100 pt-2 flex justify-between">
                <span className="font-semibold text-slate-700">Net Profit / Loss</span>
                <div className="flex items-center gap-1">
                  {financials.gross_profit >= 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                  <span
                    className={`font-bold text-lg ${
                      financials.gross_profit >= 0 ? "text-green-600" : "text-red-500"
                    }`}
                  >
                    {financials.gross_profit >= 0 ? "+" : ""}
                    {formatCurrency(financials.gross_profit)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Download Report */}
          <button
            onClick={handleDownloadPDF}
            className="w-full py-2.5 border border-orange-300 text-orange-600 font-medium text-sm rounded-xl hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download Weekly Report (PDF)
          </button>
        </>
      ) : (
        <div className="text-center py-8 text-slate-500 text-sm">No financial data for this week</div>
      )}
    </div>
  );
}

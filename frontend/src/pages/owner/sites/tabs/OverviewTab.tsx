import { useQuery } from "@tanstack/react-query";
import { MapPin, Phone, User, Calendar, DollarSign } from "lucide-react";
import { sitesApi } from "../../../../services/api";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { PROJECT_TYPE_LABELS } from "../../../../utils/constants";
import type { Site } from "../../../../types";

interface OverviewTabProps {
  site: Site;
}

export function OverviewTab({ site }: OverviewTabProps) {
  const { data: financials } = useQuery({
    queryKey: ["site-financials", site.id],
    queryFn: () => sitesApi.financials(site.id).then((r) => r.data),
  });

  const progress = financials
    ? Math.min(
        (financials.work_items_breakdown?.reduce((s: number, i: { quantity_done: number }) => s + i.quantity_done, 0) /
          Math.max(1, financials.work_items_breakdown?.reduce((s: number, i: { quantity_done: number }) => s + i.quantity_done, 0))) *
          100,
        100
      )
    : 0;

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Site Info Card */}
      <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
        <h3 className="font-semibold text-slate-700 text-sm">Site Details</h3>

        {site.project_type && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
              {PROJECT_TYPE_LABELS[site.project_type]}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-2 text-sm">
          {site.location && (
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
              {site.location}
            </div>
          )}
          {site.start_date && (
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              Started: {formatDate(site.start_date)}
              {site.expected_end_date && ` · Expected: ${formatDate(site.expected_end_date)}`}
            </div>
          )}
          {site.total_contract_value && (
            <div className="flex items-center gap-2 text-slate-600">
              <DollarSign className="w-4 h-4 text-slate-400 flex-shrink-0" />
              Contract: {formatCurrency(site.total_contract_value)}
            </div>
          )}
        </div>
      </div>

      {/* Contractor Info */}
      {site.main_contractor_name && (
        <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-2">
          <h3 className="font-semibold text-slate-700 text-sm">Main Contractor</h3>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <User className="w-4 h-4 text-slate-400" />
            {site.main_contractor_name}
            {site.main_contractor_company && (
              <span className="text-slate-400">· {site.main_contractor_company}</span>
            )}
          </div>
          {site.main_contractor_phone && (
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Phone className="w-4 h-4 text-slate-400" />
              <a href={`tel:${site.main_contractor_phone}`} className="text-orange-500">
                {site.main_contractor_phone}
              </a>
            </div>
          )}
        </div>
      )}

      {/* Financial Summary */}
      {financials && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">This Week's Financials</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Earned</span>
              <span className="font-medium text-slate-800">{formatCurrency(financials.earnings)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Labour Cost</span>
              <span className="font-medium text-red-500">- {formatCurrency(financials.labour_cost)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-500">Expenses</span>
              <span className="font-medium text-red-500">- {formatCurrency(financials.expenses)}</span>
            </div>
            <div className="border-t border-slate-100 pt-2 flex justify-between text-sm font-semibold">
              <span className="text-slate-700">Net Profit</span>
              <span className={financials.gross_profit >= 0 ? "text-green-600" : "text-red-500"}>
                {financials.gross_profit >= 0 ? "+" : ""}{formatCurrency(financials.gross_profit)}
              </span>
            </div>
          </div>
        </div>
      )}

      {site.notes && (
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">Notes</h3>
          <p className="text-sm text-slate-600">{site.notes}</p>
        </div>
      )}
    </div>
  );
}

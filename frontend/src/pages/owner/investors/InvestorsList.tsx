import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, TrendingUp, X, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { investorsApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatCurrency } from "../../../utils/formatters";
import type { Investor } from "../../../types";

const INVESTMENT_TYPE_LABELS = {
  profit_sharing: "Profit Sharing",
  interest_based: "Interest Based",
  hybrid: "Hybrid",
};

export function InvestorsList() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "Test@1234",
    full_name: "",
    phone: "",
    investment_type: "profit_sharing",
    profit_share_percentage: "",
    interest_rate_monthly: "",
    address: "",
    pan_number: "",
  });

  const { data: investors = [], isLoading } = useQuery<Investor[]>({
    queryKey: ["investors"],
    queryFn: () => investorsApi.list().then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      investorsApi.create({
        ...data,
        profit_share_percentage: data.profit_share_percentage ? parseFloat(data.profit_share_percentage) : undefined,
        interest_rate_monthly: data.interest_rate_monthly ? parseFloat(data.interest_rate_monthly) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investors"] });
      toast.success("Investor added");
      setShowForm(false);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Failed to add investor");
    },
  });

  return (
    <div>
      <PageHeader
        title="Investors"
        subtitle={`${investors.length} investor${investors.length !== 1 ? "s" : ""}`}
        actions={
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add
          </button>
        }
      />

      <div className="px-4 py-3 space-y-4">
        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-700 text-sm">Add Investor</h4>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.full_name}
                onChange={(e) => setForm((p) => ({ ...p, full_name: e.target.value }))}
                placeholder="Full name"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="Phone"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
              placeholder="Email (for login)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
            <select
              value={form.investment_type}
              onChange={(e) => setForm((p) => ({ ...p, investment_type: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
            >
              {Object.entries(INVESTMENT_TYPE_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
            {(form.investment_type === "profit_sharing" || form.investment_type === "hybrid") && (
              <input
                type="number"
                value={form.profit_share_percentage}
                onChange={(e) => setForm((p) => ({ ...p, profit_share_percentage: e.target.value }))}
                placeholder="Profit share % (e.g. 30)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            )}
            {(form.investment_type === "interest_based" || form.investment_type === "hybrid") && (
              <input
                type="number"
                value={form.interest_rate_monthly}
                onChange={(e) => setForm((p) => ({ ...p, interest_rate_monthly: e.target.value }))}
                placeholder="Monthly interest rate % (e.g. 2)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            )}
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.full_name || !form.email}
              className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Investor"}
            </button>
          </div>
        )}

        {/* Investor Cards */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-24 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : investors.length === 0 ? (
          <EmptyState
            icon={<TrendingUp className="w-8 h-8" />}
            title="No investors yet"
            description="Add investors to track their contributions"
          />
        ) : (
          <div className="space-y-3">
            {investors.map((investor) => (
              <Link
                key={investor.id}
                to={`/investors/${investor.id}`}
                className="block bg-white rounded-xl border border-slate-100 p-4 hover:shadow-md hover:border-orange-200 transition-all duration-200"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-slate-800">{investor.full_name}</p>
                    {investor.phone && (
                      <p className="text-xs text-slate-400 mt-0.5">{investor.phone}</p>
                    )}
                  </div>
                  <span className="text-xs bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full font-medium">
                    {INVESTMENT_TYPE_LABELS[investor.investment_type]}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
                  {investor.profit_share_percentage && (
                    <span>Profit share: {investor.profit_share_percentage}%</span>
                  )}
                  {investor.interest_rate_monthly && (
                    <span>Interest: {investor.interest_rate_monthly}%/month</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Wallet, X, Loader2, TrendingDown } from "lucide-react";
import toast from "react-hot-toast";
import { paymentsApi, sitesApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { EmptyState } from "../../../components/common/EmptyState";
import { TableSkeleton } from "../../../components/common/LoadingSkeleton";
import { formatCurrency } from "../../../utils/formatters";
import { SKILL_TYPE_LABELS, PAYMENT_MODE_LABELS } from "../../../utils/constants";
import type { PendingPayment, Site } from "../../../types";

export function PaymentsPage() {
  const queryClient = useQueryClient();
  const [payModal, setPayModal] = useState<PendingPayment | null>(null);
  const [payForm, setPayForm] = useState({
    amount: "",
    payment_type: "daily_salary",
    payment_mode: "cash",
    reference_number: "",
    remarks: "",
  });

  const { data: pending = [], isLoading } = useQuery<PendingPayment[]>({
    queryKey: ["pending-payments"],
    queryFn: () => paymentsApi.pending().then((r) => r.data),
  });

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => sitesApi.list().then((r) => r.data),
  });

  const payMutation = useMutation({
    mutationFn: (data: typeof payForm) =>
      paymentsApi.record({
        labour_id: payModal!.labour_id,
        site_id: payModal!.site_id,
        payment_date: new Date().toISOString().split("T")[0],
        amount: parseFloat(data.amount),
        payment_type: data.payment_type,
        payment_mode: data.payment_mode,
        reference_number: data.reference_number || undefined,
        remarks: data.remarks || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
      toast.success("Payment recorded!");
      setPayModal(null);
    },
    onError: () => toast.error("Failed to record payment"),
  });

  const openPayModal = (p: PendingPayment) => {
    setPayModal(p);
    setPayForm({
      amount: p.balance_due.toFixed(0),
      payment_type: "daily_salary",
      payment_mode: "cash",
      reference_number: "",
      remarks: "",
    });
  };

  const totalPending = pending.reduce((s, p) => s + p.balance_due, 0);

  return (
    <div>
      <PageHeader title="Payments" subtitle="Pending labour payments" />

      {/* Summary */}
      {pending.length > 0 && (
        <div className="px-4 py-3">
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-orange-700 font-medium">{pending.length} labours pending</p>
              <p className="text-xs text-orange-500">Total outstanding</p>
            </div>
            <p className="text-xl font-bold text-orange-600">{formatCurrency(totalPending)}</p>
          </div>
        </div>
      )}

      {/* Pending List */}
      <div className="px-4 pb-4">
        {isLoading ? (
          <TableSkeleton rows={6} />
        ) : pending.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-8 h-8" />}
            title="All payments up to date"
            description="No pending labour payments"
          />
        ) : (
          <div className="space-y-2">
            {pending.map((p) => (
              <div
                key={p.labour_id}
                className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                  {p.labour_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm truncate">{p.labour_name}</p>
                  <p className="text-xs text-slate-400">
                    {SKILL_TYPE_LABELS[p.skill_type]?.split(" / ")[0]}
                    {p.site_id && ` · Site #${p.site_id}`}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>Earned: {formatCurrency(p.total_earned)}</span>
                    <span>·</span>
                    <span>Paid: {formatCurrency(p.total_paid)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-base font-bold text-green-600">{formatCurrency(p.balance_due)}</p>
                  <button
                    onClick={() => openPayModal(p)}
                    className="mt-1 px-3 py-1.5 bg-orange-500 text-white text-xs font-medium rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Pay Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setPayModal(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-5 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">Pay {payModal.labour_name}</h3>
              <button onClick={() => setPayModal(null)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Balance breakdown */}
            <div className="bg-slate-50 rounded-lg p-3 mb-4 space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Total Earned</span>
                <span>{formatCurrency(payModal.total_earned)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Already Paid</span>
                <span className="text-red-500">- {formatCurrency(payModal.total_paid)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t border-slate-200 pt-1">
                <span>Balance Due</span>
                <span className="text-green-600">{formatCurrency(payModal.balance_due)}</span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Amount (₹)</label>
                <input
                  type="number"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 font-semibold text-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Type</label>
                  <select
                    value={payForm.payment_type}
                    onChange={(e) => setPayForm((p) => ({ ...p, payment_type: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
                  >
                    <option value="daily_salary">Daily Salary</option>
                    <option value="advance">Advance</option>
                    <option value="bonus">Bonus</option>
                    <option value="final_settlement">Final Settlement</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1">Mode</label>
                  <select
                    value={payForm.payment_mode}
                    onChange={(e) => setPayForm((p) => ({ ...p, payment_mode: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
                  >
                    {Object.entries(PAYMENT_MODE_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </div>
              </div>
              {payForm.payment_mode !== "cash" && (
                <input
                  value={payForm.reference_number}
                  onChange={(e) => setPayForm((p) => ({ ...p, reference_number: e.target.value }))}
                  placeholder="Reference / Transaction ID"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
                />
              )}
              <input
                value={payForm.remarks}
                onChange={(e) => setPayForm((p) => ({ ...p, remarks: e.target.value }))}
                placeholder="Remarks (optional)"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
              <button
                onClick={() => payMutation.mutate(payForm)}
                disabled={payMutation.isPending || !payForm.amount}
                className="w-full py-3 bg-orange-500 text-white font-semibold rounded-xl hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {payMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                Confirm Payment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

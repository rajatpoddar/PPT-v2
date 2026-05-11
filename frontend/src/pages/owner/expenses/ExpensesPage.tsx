import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { expensesApi, sitesApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { EmptyState } from "../../../components/common/EmptyState";
import { ConfirmDialog } from "../../../components/common/ConfirmDialog";
import { formatCurrency, formatDate } from "../../../utils/formatters";
import { EXPENSE_CATEGORY_LABELS } from "../../../utils/constants";
import type { Expense, Site } from "../../../types";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#F97316", "#22C55E", "#3B82F6", "#EF4444", "#8B5CF6", "#F59E0B", "#06B6D4", "#64748B"];

export function ExpensesPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [siteFilter, setSiteFilter] = useState("");
  const [form, setForm] = useState({
    site_id: "",
    expense_date: new Date().toISOString().split("T")[0],
    category: "material",
    amount: "",
    description: "",
    vendor_name: "",
    payment_mode: "cash",
  });

  const { data: expenses = [], isLoading } = useQuery<Expense[]>({
    queryKey: ["expenses", siteFilter],
    queryFn: () =>
      expensesApi.list({ site_id: siteFilter || undefined }).then((r) => r.data),
  });

  const { data: sites = [] } = useQuery<Site[]>({
    queryKey: ["sites"],
    queryFn: () => sitesApi.list().then((r) => r.data),
  });

  const { data: summary = [] } = useQuery<{ category: string; total: number }[]>({
    queryKey: ["expense-summary", siteFilter],
    queryFn: () =>
      expensesApi.summary({ site_id: siteFilter || undefined }).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      expensesApi.create({
        ...data,
        site_id: parseInt(data.site_id),
        amount: parseFloat(data.amount),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      toast.success("Expense added");
      setShowForm(false);
      setForm((p) => ({ ...p, amount: "", description: "", vendor_name: "" }));
    },
    onError: () => toast.error("Failed to add expense"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => expensesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["expense-summary"] });
      toast.success("Expense deleted");
      setDeleteId(null);
    },
  });

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);

  const chartData = summary.map((s) => ({
    name: EXPENSE_CATEGORY_LABELS[s.category as keyof typeof EXPENSE_CATEGORY_LABELS] || s.category,
    value: s.total,
  }));

  return (
    <div>
      <PageHeader
        title="Expenses"
        subtitle={`Total: ${formatCurrency(totalExpenses)}`}
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
        {/* Site Filter */}
        <select
          value={siteFilter}
          onChange={(e) => setSiteFilter(e.target.value)}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
        >
          <option value="">All Sites</option>
          {sites.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>

        {/* Pie Chart */}
        {chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-100 p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3">By Category</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={chartData} cx="50%" cy="50%" outerRadius={70} dataKey="value">
                  {chartData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "11px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-700 text-sm">Add Expense</h4>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.site_id}
                onChange={(e) => setForm((p) => ({ ...p, site_id: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Select site...</option>
                {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <input
                type="date"
                value={form.expense_date}
                onChange={(e) => setForm((p) => ({ ...p, expense_date: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="Amount (₹)"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Description"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.vendor_name}
                onChange={(e) => setForm((p) => ({ ...p, vendor_name: e.target.value }))}
                placeholder="Vendor name"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
              <select
                value={form.payment_mode}
                onChange={(e) => setForm((p) => ({ ...p, payment_mode: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.site_id || !form.amount}
              className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Expense"}
            </button>
          </div>
        )}

        {/* Expense List */}
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
          </div>
        ) : expenses.length === 0 ? (
          <EmptyState title="No expenses recorded" description="Add your first expense" />
        ) : (
          <div className="space-y-2">
            {expenses.map((expense) => (
              <div key={expense.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {EXPENSE_CATEGORY_LABELS[expense.category]}
                    </span>
                    <span className="text-xs text-slate-400">{formatDate(expense.expense_date)}</span>
                  </div>
                  {expense.description && (
                    <p className="text-sm text-slate-700 mt-1 truncate">{expense.description}</p>
                  )}
                  {expense.vendor_name && (
                    <p className="text-xs text-slate-400">{expense.vendor_name}</p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-slate-800">{formatCurrency(expense.amount)}</p>
                  <button
                    onClick={() => setDeleteId(expense.id)}
                    className="mt-1 p-1 hover:bg-red-50 rounded text-slate-300 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Expense"
        message="Are you sure you want to delete this expense?"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

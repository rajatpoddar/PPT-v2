import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Loader2, X } from "lucide-react";
import toast from "react-hot-toast";
import { sitesApi } from "../../../../services/api";
import { ConfirmDialog } from "../../../../components/common/ConfirmDialog";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency } from "../../../../utils/formatters";
import { WORK_TYPE_LABELS } from "../../../../utils/constants";
import type { SiteWorkItem } from "../../../../types";

interface WorkItemsTabProps {
  siteId: number;
}

const UNIT_LABELS: Record<string, string> = {
  running_meter: "Running Meter",
  m3: "Cubic Meter",
  sqm: "Square Meter",
  lumpsum: "Lump Sum",
  per_unit: "Unit",
};

export function WorkItemsTab({ siteId }: WorkItemsTabProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<SiteWorkItem | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    work_name: "",
    work_type: "running_meter",
    rate_per_unit: "",
    unit_label: "",
    total_estimated_quantity: "",
  });

  const { data: items = [], isLoading } = useQuery<SiteWorkItem[]>({
    queryKey: ["work-items", siteId],
    queryFn: () => sitesApi.workItems(siteId).then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      sitesApi.addWorkItem(siteId, {
        ...data,
        rate_per_unit: parseFloat(data.rate_per_unit),
        total_estimated_quantity: data.total_estimated_quantity
          ? parseFloat(data.total_estimated_quantity)
          : undefined,
        unit_label: data.unit_label || UNIT_LABELS[data.work_type],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-items", siteId] });
      toast.success("Work item added");
      resetForm();
    },
    onError: () => toast.error("Failed to add work item"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => sitesApi.deleteWorkItem(siteId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-items", siteId] });
      toast.success("Work item deleted");
      setDeleteId(null);
    },
    onError: () => toast.error("Failed to delete"),
  });

  const resetForm = () => {
    setForm({ work_name: "", work_type: "running_meter", rate_per_unit: "", unit_label: "", total_estimated_quantity: "" });
    setShowForm(false);
    setEditItem(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.work_name || !form.rate_per_unit) {
      toast.error("Work name and rate are required");
      return;
    }
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-700">Rate Card</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700 text-sm">New Work Item</h4>
            <button onClick={resetForm} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={form.work_name}
              onChange={(e) => setForm((p) => ({ ...p, work_name: e.target.value }))}
              placeholder="Work name (e.g. PCC Road Layer 1)"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.work_type}
                onChange={(e) => {
                  const wt = e.target.value;
                  setForm((p) => ({ ...p, work_type: wt, unit_label: UNIT_LABELS[wt] || "" }));
                }}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                {Object.entries(WORK_TYPE_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                type="number"
                value={form.rate_per_unit}
                onChange={(e) => setForm((p) => ({ ...p, rate_per_unit: e.target.value }))}
                placeholder="Rate (₹)"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                value={form.unit_label}
                onChange={(e) => setForm((p) => ({ ...p, unit_label: e.target.value }))}
                placeholder="Unit label"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
              <input
                type="number"
                value={form.total_estimated_quantity}
                onChange={(e) => setForm((p) => ({ ...p, total_estimated_quantity: e.target.value }))}
                placeholder="Est. quantity"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="flex-1 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
              </button>
              <button type="button" onClick={resetForm} className="px-4 py-2 bg-slate-100 text-slate-600 text-sm rounded-lg hover:bg-slate-200">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Items List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No work items yet"
          description="Add work items to define the rate card for this site"
        />
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 text-sm truncate">{item.work_name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                    {WORK_TYPE_LABELS[item.work_type]}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatCurrency(item.rate_per_unit)} / {item.unit_label || "unit"}
                  </span>
                </div>
                {item.total_estimated_quantity && (
                  <p className="text-xs text-slate-400 mt-0.5">
                    Est: {item.total_estimated_quantity} {item.unit_label}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDeleteId(item.id)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={deleteId !== null}
        title="Delete Work Item"
        message="This will also delete all work logs for this item. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        onCancel={() => setDeleteId(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}

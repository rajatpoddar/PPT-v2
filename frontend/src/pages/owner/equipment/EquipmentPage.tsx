import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, Wrench } from "lucide-react";
import toast from "react-hot-toast";
import { equipmentApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { StatusBadge } from "../../../components/common/StatusBadge";
import { EmptyState } from "../../../components/common/EmptyState";
import { formatCurrency } from "../../../utils/formatters";
import { EQUIPMENT_CATEGORY_LABELS } from "../../../utils/constants";
import type { Equipment } from "../../../types";

export function EquipmentPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<"list" | "board">("list");
  const [form, setForm] = useState({
    name: "",
    category: "digging_tools",
    description: "",
    total_quantity: "1",
    purchase_date: "",
    purchase_cost: "",
    notes: "",
  });

  const { data: equipment = [], isLoading } = useQuery<Equipment[]>({
    queryKey: ["equipment"],
    queryFn: () => equipmentApi.list().then((r) => r.data),
  });

  const { data: statusBoard = [] } = useQuery({
    queryKey: ["equipment-board"],
    queryFn: () => equipmentApi.statusBoard().then((r) => r.data),
    enabled: activeTab === "board",
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      equipmentApi.create({
        ...data,
        total_quantity: parseInt(data.total_quantity),
        purchase_cost: data.purchase_cost ? parseFloat(data.purchase_cost) : undefined,
        purchase_date: data.purchase_date || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["equipment"] });
      toast.success("Equipment added");
      setShowForm(false);
    },
    onError: () => toast.error("Failed to add equipment"),
  });

  return (
    <div>
      <PageHeader
        title="Equipment"
        subtitle={`${equipment.length} items`}
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
        {/* Tabs */}
        <div className="flex gap-2">
          {(["list", "board"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "bg-orange-500 text-white"
                  : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              {tab === "list" ? "Equipment List" : "Status Board"}
            </button>
          ))}
        </div>

        {/* Add Form */}
        {showForm && (
          <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-slate-700 text-sm">Add Equipment</h4>
              <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Equipment name"
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
            <div className="grid grid-cols-2 gap-2">
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                {Object.entries(EQUIPMENT_CATEGORY_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
              <input
                type="number"
                value={form.total_quantity}
                onChange={(e) => setForm((p) => ({ ...p, total_quantity: e.target.value }))}
                placeholder="Quantity"
                min="1"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={form.purchase_date}
                onChange={(e) => setForm((p) => ({ ...p, purchase_date: e.target.value }))}
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
              <input
                type="number"
                value={form.purchase_cost}
                onChange={(e) => setForm((p) => ({ ...p, purchase_cost: e.target.value }))}
                placeholder="Purchase cost (₹)"
                className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <button
              onClick={() => createMutation.mutate(form)}
              disabled={createMutation.isPending || !form.name}
              className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save"}
            </button>
          </div>
        )}

        {/* Equipment List */}
        {activeTab === "list" && (
          isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />)}
            </div>
          ) : equipment.length === 0 ? (
            <EmptyState
              icon={<Wrench className="w-8 h-8" />}
              title="No equipment added"
              description="Add tools and machinery to track them"
            />
          ) : (
            <div className="space-y-2">
              {equipment.map((eq) => (
                <div key={eq.id} className="bg-white rounded-xl border border-slate-100 p-4 flex items-center gap-3">
                  <div className="p-2.5 bg-slate-100 rounded-lg flex-shrink-0">
                    <Wrench className="w-5 h-5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm truncate">{eq.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400">
                        {EQUIPMENT_CATEGORY_LABELS[eq.category as keyof typeof EQUIPMENT_CATEGORY_LABELS]}
                      </span>
                      <span className="text-xs text-slate-300">·</span>
                      <span className="text-xs text-slate-500">Qty: {eq.total_quantity}</span>
                      {eq.purchase_cost && (
                        <>
                          <span className="text-xs text-slate-300">·</span>
                          <span className="text-xs text-slate-400">{formatCurrency(eq.purchase_cost)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={eq.current_status} />
                </div>
              ))}
            </div>
          )
        )}

        {/* Status Board */}
        {activeTab === "board" && (
          <div className="space-y-2">
            {(statusBoard as {
              id: number;
              name: string;
              category: string;
              total_quantity: number;
              allocated_quantity: number;
              available_quantity: number;
              status: string;
              sites: { site_id: number; site_name: string; quantity: number; since: string }[];
            }[]).map((item) => (
              <div key={item.id} className="bg-white rounded-xl border border-slate-100 p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-semibold text-slate-800 text-sm">{item.name}</p>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-green-600 font-medium">{item.available_quantity} available</span>
                    <span className="text-slate-400">/ {item.total_quantity} total</span>
                  </div>
                </div>
                {item.sites.length > 0 && (
                  <div className="space-y-1">
                    {item.sites.map((s) => (
                      <div key={s.site_id} className="flex items-center justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-2 py-1">
                        <span>{s.site_name}</span>
                        <span className="font-medium">{s.quantity} units</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, X, Loader2, CloudSun, Cloud, CloudRain } from "lucide-react";
import toast from "react-hot-toast";
import { sitesApi } from "../../../../services/api";
import { EmptyState } from "../../../../components/common/EmptyState";
import { formatCurrency, formatDate } from "../../../../utils/formatters";
import { WEATHER_LABELS } from "../../../../utils/constants";
import type { SiteWorkItem, WorkLog } from "../../../../types";

interface WorkLogsTabProps {
  siteId: number;
}

export function WorkLogsTab({ siteId }: WorkLogsTabProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    work_item_id: "",
    log_date: selectedDate,
    quantity_done: "",
    length_m: "",
    width_m: "",
    height_m: "",
    remarks: "",
    weather: "sunny",
  });
  const [calculatedVolume, setCalculatedVolume] = useState<number | null>(null);

  const { data: workItems = [] } = useQuery<SiteWorkItem[]>({
    queryKey: ["work-items", siteId],
    queryFn: () => sitesApi.workItems(siteId).then((r) => r.data),
  });

  const { data: logs = [], isLoading } = useQuery<WorkLog[]>({
    queryKey: ["work-logs", siteId, selectedDate],
    queryFn: () => sitesApi.workLogs(siteId, { log_date: selectedDate }).then((r) => r.data),
  });

  const selectedWorkItem = workItems.find((w) => w.id === parseInt(form.work_item_id));
  const isM3 = selectedWorkItem?.work_type === "m3";
  const isSqm = selectedWorkItem?.work_type === "sqm";

  // Auto-calculate volume for m3
  useEffect(() => {
    if (isM3 && form.length_m && form.width_m && form.height_m) {
      const vol = parseFloat(form.length_m) * parseFloat(form.width_m) * parseFloat(form.height_m);
      setCalculatedVolume(isNaN(vol) ? null : vol);
    } else if (isSqm && form.length_m && form.width_m) {
      const area = parseFloat(form.length_m) * parseFloat(form.width_m);
      setCalculatedVolume(isNaN(area) ? null : area);
    } else {
      setCalculatedVolume(null);
    }
  }, [form.length_m, form.width_m, form.height_m, isM3, isSqm]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      sitesApi.addWorkLog(siteId, {
        work_item_id: parseInt(data.work_item_id),
        log_date: data.log_date,
        quantity_done: isM3 || isSqm ? calculatedVolume : parseFloat(data.quantity_done),
        length_m: data.length_m ? parseFloat(data.length_m) : undefined,
        width_m: data.width_m ? parseFloat(data.width_m) : undefined,
        height_m: data.height_m ? parseFloat(data.height_m) : undefined,
        remarks: data.remarks || undefined,
        weather: data.weather,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work-logs", siteId] });
      toast.success("Work log added");
      setShowForm(false);
      setForm((p) => ({ ...p, quantity_done: "", length_m: "", width_m: "", height_m: "", remarks: "" }));
    },
    onError: () => toast.error("Failed to add work log"),
  });

  const WeatherIcon = ({ w }: { w: string }) => {
    if (w === "sunny") return <CloudSun className="w-4 h-4 text-yellow-500" />;
    if (w === "cloudy") return <Cloud className="w-4 h-4 text-slate-400" />;
    return <CloudRain className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Date Selector */}
      <div className="flex items-center gap-3">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
        />
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors ml-auto"
        >
          <Plus className="w-4 h-4" />
          Log Work
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <div className="bg-white rounded-xl border border-orange-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-700 text-sm">Add Work Log</h4>
            <button onClick={() => setShowForm(false)} className="p-1 hover:bg-slate-100 rounded">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <select
            value={form.work_item_id}
            onChange={(e) => setForm((p) => ({ ...p, work_item_id: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
          >
            <option value="">Select work item...</option>
            {workItems.map((item) => (
              <option key={item.id} value={item.id}>
                {item.work_name} ({item.unit_label})
              </option>
            ))}
          </select>

          {/* Dimension inputs for m3/sqm */}
          {(isM3 || isSqm) ? (
            <div className="space-y-2">
              <p className="text-xs text-slate-500 font-medium">
                {isM3 ? "Enter dimensions (L × W × H = Volume)" : "Enter dimensions (L × W = Area)"}
              </p>
              <div className={`grid gap-2 ${isM3 ? "grid-cols-3" : "grid-cols-2"}`}>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Length (m)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.length_m}
                    onChange={(e) => setForm((p) => ({ ...p, length_m: e.target.value }))}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">Width (m)</label>
                  <input
                    type="number"
                    step="0.001"
                    value={form.width_m}
                    onChange={(e) => setForm((p) => ({ ...p, width_m: e.target.value }))}
                    placeholder="0.000"
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
                  />
                </div>
                {isM3 && (
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Height (m)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={form.height_m}
                      onChange={(e) => setForm((p) => ({ ...p, height_m: e.target.value }))}
                      placeholder="0.000"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
                    />
                  </div>
                )}
              </div>
              {calculatedVolume !== null && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                  <p className="text-xs text-orange-600 font-medium">Calculated {isM3 ? "Volume" : "Area"}</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {calculatedVolume.toFixed(3)} {selectedWorkItem?.unit_label}
                  </p>
                  {selectedWorkItem && (
                    <p className="text-xs text-orange-500 mt-0.5">
                      = {formatCurrency(calculatedVolume * selectedWorkItem.rate_per_unit)} earned
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="text-xs text-slate-500 mb-1 block">
                Quantity ({selectedWorkItem?.unit_label || "units"})
              </label>
              <input
                type="number"
                step="0.001"
                value={form.quantity_done}
                onChange={(e) => setForm((p) => ({ ...p, quantity_done: e.target.value }))}
                placeholder="Enter quantity"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
              {form.quantity_done && selectedWorkItem && (
                <p className="text-xs text-green-600 mt-1">
                  = {formatCurrency(parseFloat(form.quantity_done) * selectedWorkItem.rate_per_unit)} earned
                </p>
              )}
            </div>
          )}

          {/* Weather */}
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Weather</label>
            <select
              value={form.weather}
              onChange={(e) => setForm((p) => ({ ...p, weather: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
            >
              {Object.entries(WEATHER_LABELS).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>

          <textarea
            value={form.remarks}
            onChange={(e) => setForm((p) => ({ ...p, remarks: e.target.value }))}
            placeholder="Remarks (optional)"
            rows={2}
            className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 resize-none"
          />

          <button
            onClick={() => mutation.mutate(form)}
            disabled={mutation.isPending || !form.work_item_id || (!(isM3 || isSqm) && !form.quantity_done) || ((isM3 || isSqm) && calculatedVolume === null)}
            className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Work Log"}
          </button>
        </div>
      )}

      {/* Logs Timeline */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => <div key={i} className="h-20 bg-slate-100 rounded-xl animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <EmptyState
          title="No work logged"
          description={`No work logged for ${formatDate(selectedDate)}`}
        />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="bg-white rounded-xl border border-slate-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm">{log.work_item_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm font-bold text-orange-600">
                      {log.quantity_done} {log.unit_label}
                    </span>
                    <span className="text-xs text-slate-400">·</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(log.earned || 0)}
                    </span>
                  </div>
                  {log.length_m && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {log.length_m}m × {log.width_m}m{log.height_m ? ` × ${log.height_m}m` : ""}
                    </p>
                  )}
                  {log.remarks && (
                    <p className="text-xs text-slate-500 mt-1">{log.remarks}</p>
                  )}
                </div>
                {log.weather && (
                  <WeatherIcon w={log.weather} />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

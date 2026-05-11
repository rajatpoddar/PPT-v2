import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { sitesApi, attendanceApi } from "../../../../services/api";
import { formatCurrency } from "../../../../utils/formatters";
import { SKILL_TYPE_LABELS } from "../../../../utils/constants";
import type { AttendanceStatus } from "../../../../types";
import { cn } from "../../../../utils/cn";

interface AttendanceTabProps {
  siteId: number;
}

type AttMap = Record<number, AttendanceStatus>;

export function AttendanceTab({ siteId }: AttendanceTabProps) {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [attMap, setAttMap] = useState<AttMap>({});
  const [isSaving, setIsSaving] = useState(false);

  const { data: attendanceData, isLoading } = useQuery<{
    labours: { labour_id: number; labour_name: string; skill_type: string; daily_rate: number; photo_url?: string; status?: AttendanceStatus }[];
    summary: { total: number; present: number; absent: number; half_day: number; not_marked: number };
  }>({
    queryKey: ["site-attendance", siteId, selectedDate],
    queryFn: async () => {
      const r = await sitesApi.attendance(siteId, selectedDate);
      const data = r.data;
      const map: AttMap = {};
      data.labours.forEach((l: { labour_id: number; status?: AttendanceStatus }) => {
        if (l.status) map[l.labour_id] = l.status;
      });
      setAttMap(map);
      return data;
    },
  });

  const labours = attendanceData?.labours || [];
  const summary = attendanceData?.summary || { total: 0, present: 0, absent: 0, half_day: 0, not_marked: 0 };

  const totalSalaryToday = labours.reduce((sum, l) => {
    const status = attMap[l.labour_id];
    if (status === "present") return sum + (l.daily_rate || 0);
    if (status === "half_day") return sum + (l.daily_rate || 0) * 0.5;
    return sum;
  }, 0);

  const markAll = (status: AttendanceStatus) => {
    const map: AttMap = {};
    labours.forEach((l) => { map[l.labour_id] = status; });
    setAttMap(map);
  };

  const setStatus = (labourId: number, status: AttendanceStatus) => {
    setAttMap((p) => ({ ...p, [labourId]: status }));
  };

  const saveAttendance = async () => {
    const records = labours
      .filter((l) => attMap[l.labour_id])
      .map((l) => ({ labour_id: l.labour_id, status: attMap[l.labour_id] }));

    if (records.length === 0) {
      toast.error("Mark attendance for at least one labour");
      return;
    }

    setIsSaving(true);
    try {
      await attendanceApi.bulkMark({ site_id: siteId, date: selectedDate, records });
      queryClient.invalidateQueries({ queryKey: ["site-attendance", siteId] });
      toast.success(`Attendance saved for ${records.length} labours`);
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setIsSaving(false);
    }
  };

  const ATT_BUTTONS: { status: AttendanceStatus; label: string; activeClass: string }[] = [
    { status: "present", label: "P", activeClass: "bg-green-500 text-white" },
    { status: "absent", label: "A", activeClass: "bg-red-500 text-white" },
    { status: "half_day", label: "H", activeClass: "bg-yellow-500 text-white" },
    { status: "leave", label: "L", activeClass: "bg-blue-400 text-white" },
  ];

  return (
    <div className="space-y-4 max-w-2xl">
      {/* Date + Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
        />
        <button
          onClick={() => markAll("present")}
          className="px-3 py-2 bg-green-50 text-green-700 text-sm font-medium rounded-lg hover:bg-green-100 transition-colors"
        >
          ✓ Mark All Present
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: "Present", value: Object.values(attMap).filter((s) => s === "present").length, color: "text-green-600" },
          { label: "Absent", value: Object.values(attMap).filter((s) => s === "absent").length, color: "text-red-500" },
          { label: "Half Day", value: Object.values(attMap).filter((s) => s === "half_day").length, color: "text-yellow-600" },
          { label: "Today's Pay", value: formatCurrency(totalSalaryToday), color: "text-orange-600" },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 p-3 text-center">
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-400">{label}</p>
          </div>
        ))}
      </div>

      {/* Labour List */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-slate-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : labours.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No labours assigned to this site
        </div>
      ) : (
        <div className="space-y-2">
          {labours.map((labour) => {
            const currentStatus = attMap[labour.labour_id];
            return (
              <div
                key={labour.labour_id}
                className="bg-white rounded-xl border border-slate-100 p-3 flex items-center gap-3"
              >
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0 overflow-hidden">
                  {labour.photo_url ? (
                    <img src={labour.photo_url} alt={labour.labour_name} className="w-full h-full object-cover" />
                  ) : (
                    labour.labour_name?.charAt(0)
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-slate-800 text-sm truncate">{labour.labour_name}</p>
                  <p className="text-xs text-slate-400">
                    {SKILL_TYPE_LABELS[labour.skill_type as keyof typeof SKILL_TYPE_LABELS]?.split(" / ")[0]} ·{" "}
                    {formatCurrency(labour.daily_rate)}/day
                  </p>
                </div>

                {/* Attendance Buttons */}
                <div className="flex gap-1 flex-shrink-0">
                  {ATT_BUTTONS.map(({ status, label, activeClass }) => (
                    <button
                      key={status}
                      onClick={() => setStatus(labour.labour_id, status)}
                      className={cn(
                        "att-btn w-10 h-10 text-xs font-bold rounded-lg transition-all duration-150",
                        currentStatus === status
                          ? activeClass
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save Button */}
      {labours.length > 0 && (
        <button
          onClick={saveAttendance}
          disabled={isSaving || Object.keys(attMap).length === 0}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60 sticky bottom-4"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Save Attendance ({Object.keys(attMap).length} marked)
            </>
          )}
        </button>
      )}
    </div>
  );
}

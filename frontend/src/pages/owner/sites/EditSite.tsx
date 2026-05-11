import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPin } from "lucide-react";
import toast from "react-hot-toast";
import { sitesApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { PROJECT_TYPE_LABELS, SITE_STATUS_LABELS } from "../../../utils/constants";
import { PageSkeleton } from "../../../components/common/LoadingSkeleton";

export function EditSite() {
  const { id } = useParams<{ id: string }>();
  const siteId = parseInt(id!);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [form, setForm] = useState({
    name: "",
    location: "",
    project_type: "",
    start_date: "",
    expected_end_date: "",
    actual_end_date: "",
    main_contractor_name: "",
    main_contractor_phone: "",
    main_contractor_company: "",
    status: "",
    total_contract_value: "",
    notes: "",
    gps_lat: "",
    gps_lng: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { data: site, isLoading } = useQuery({
    queryKey: ["site", siteId],
    queryFn: () => sitesApi.get(siteId).then((r) => r.data),
    enabled: !!siteId,
  });

  useEffect(() => {
    if (site) {
      setForm({
        name: site.name || "",
        location: site.location || "",
        project_type: site.project_type || "",
        start_date: site.start_date || "",
        expected_end_date: site.expected_end_date || "",
        actual_end_date: site.actual_end_date || "",
        main_contractor_name: site.main_contractor_name || "",
        main_contractor_phone: site.main_contractor_phone || "",
        main_contractor_company: site.main_contractor_company || "",
        status: site.status || "",
        total_contract_value: site.total_contract_value ? String(site.total_contract_value) : "",
        notes: site.notes || "",
        gps_lat: site.gps_lat ? String(site.gps_lat) : "",
        gps_lng: site.gps_lng ? String(site.gps_lng) : "",
      });
    }
  }, [site]);

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      sitesApi.update(siteId, {
        ...data,
        project_type: data.project_type || undefined,
        status: data.status || undefined,
        total_contract_value: data.total_contract_value ? parseFloat(data.total_contract_value) : null,
        gps_lat: data.gps_lat ? parseFloat(data.gps_lat) : null,
        gps_lng: data.gps_lng ? parseFloat(data.gps_lng) : null,
        start_date: data.start_date || null,
        expected_end_date: data.expected_end_date || null,
        actual_end_date: data.actual_end_date || null,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["site", siteId] });
      queryClient.invalidateQueries({ queryKey: ["sites"] });
      toast.success("Site updated successfully!");
      navigate(`/sites/${res.data.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Failed to update site");
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Site name is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) mutation.mutate(form);
  };

  const detectGPS = () => {
    if (!navigator.geolocation) {
      toast.error("GPS not available on this device");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((p) => ({
          ...p,
          gps_lat: pos.coords.latitude.toFixed(6),
          gps_lng: pos.coords.longitude.toFixed(6),
        }));
        toast.success("Location detected!");
      },
      () => toast.error("Could not detect location")
    );
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  if (isLoading) return <PageSkeleton />;

  return (
    <div>
      <PageHeader title="Edit Site" backTo={`/sites/${siteId}`} />

      <form onSubmit={handleSubmit} className="p-4 space-y-5 max-w-2xl mx-auto">
        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm">Site Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Site Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. NH-30 PCC Road - Ranchi"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500/20 ${
                errors.name ? "border-red-400" : "border-slate-200 focus:border-orange-400"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Location</label>
            <input
              value={form.location}
              onChange={set("location")}
              placeholder="e.g. Ranchi, Jharkhand"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Project Type</label>
              <select
                value={form.project_type}
                onChange={set("project_type")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Select type...</option>
                {Object.entries(PROJECT_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={set("status")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Select status...</option>
                {Object.entries(SITE_STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Start Date</label>
              <input
                type="date"
                value={form.start_date}
                onChange={set("start_date")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Expected End</label>
              <input
                type="date"
                value={form.expected_end_date}
                onChange={set("expected_end_date")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Actual End Date</label>
            <input
              type="date"
              value={form.actual_end_date}
              onChange={set("actual_end_date")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contract Value (₹)</label>
            <input
              type="number"
              value={form.total_contract_value}
              onChange={set("total_contract_value")}
              placeholder="e.g. 2500000"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
        </section>

        {/* Contractor Info */}
        <section className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm">Main Contractor</h2>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Contractor Name</label>
            <input
              value={form.main_contractor_name}
              onChange={set("main_contractor_name")}
              placeholder="Contractor's name"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
              <input
                type="tel"
                value={form.main_contractor_phone}
                onChange={set("main_contractor_phone")}
                placeholder="9876543210"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Company</label>
              <input
                value={form.main_contractor_company}
                onChange={set("main_contractor_company")}
                placeholder="Company name"
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </section>

        {/* GPS */}
        <section className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700 text-sm">GPS Coordinates</h2>
            <button
              type="button"
              onClick={detectGPS}
              className="flex items-center gap-1.5 text-xs text-orange-500 font-medium hover:text-orange-600"
            >
              <MapPin className="w-3.5 h-3.5" />
              Auto-detect
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Latitude</label>
              <input
                value={form.gps_lat}
                onChange={set("gps_lat")}
                placeholder="23.3441"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Longitude</label>
              <input
                value={form.gps_lng}
                onChange={set("gps_lng")}
                placeholder="85.3096"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </section>

        {/* Notes */}
        <section className="bg-white rounded-xl border border-slate-100 p-4">
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes</label>
          <textarea
            value={form.notes}
            onChange={set("notes")}
            rows={3}
            placeholder="Any additional notes..."
            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 resize-none"
          />
        </section>

        {/* Submit */}
        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Updating...
            </>
          ) : (
            "Update Site"
          )}
        </button>
      </form>
    </div>
  );
}

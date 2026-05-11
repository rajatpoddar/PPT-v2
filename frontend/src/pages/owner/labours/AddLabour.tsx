import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { laboursApi } from "../../../services/api";
import { PageHeader } from "../../../components/common/PageHeader";
import { SKILL_TYPE_LABELS } from "../../../utils/constants";

export function AddLabour() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    phone: "",
    skill_type: "unskilled_labour",
    daily_rate: "",
    date_joined: new Date().toISOString().split("T")[0],
    address: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    id_proof_type: "",
    id_proof_number: "",
    notes: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: typeof form) =>
      laboursApi.create({
        ...data,
        daily_rate: parseFloat(data.daily_rate),
        date_joined: data.date_joined || undefined,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ["labours"] });
      toast.success("Labour added successfully!");
      navigate(`/labours/${res.data.id}`);
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Failed to add labour");
    },
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!form.name.trim()) newErrors.name = "Name is required";
    if (!form.daily_rate || isNaN(parseFloat(form.daily_rate))) newErrors.daily_rate = "Valid daily rate is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const set = (field: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((p) => ({ ...p, [field]: e.target.value }));
    if (errors[field]) setErrors((p) => ({ ...p, [field]: "" }));
  };

  return (
    <div>
      <PageHeader title="Add Labour" backTo="/labours" />

      <form
        onSubmit={(e) => { e.preventDefault(); if (validate()) mutation.mutate(form); }}
        className="p-4 space-y-5 max-w-2xl mx-auto"
      >
        {/* Basic Info */}
        <section className="bg-white rounded-xl border border-slate-100 p-4 space-y-4">
          <h2 className="font-semibold text-slate-700 text-sm">Basic Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              value={form.name}
              onChange={set("name")}
              placeholder="e.g. Raju Mahto"
              className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500/20 ${
                errors.name ? "border-red-400" : "border-slate-200 focus:border-orange-400"
              }`}
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              placeholder="9876543210"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Skill Type</label>
            <select
              value={form.skill_type}
              onChange={set("skill_type")}
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
            >
              {Object.entries(SKILL_TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Daily Rate (₹) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={form.daily_rate}
                onChange={set("daily_rate")}
                placeholder="500"
                className={`w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  errors.daily_rate ? "border-red-400" : "border-slate-200 focus:border-orange-400"
                }`}
              />
              {errors.daily_rate && <p className="mt-1 text-xs text-red-500">{errors.daily_rate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Date Joined</label>
              <input
                type="date"
                value={form.date_joined}
                onChange={set("date_joined")}
                className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
            <textarea
              value={form.address}
              onChange={set("address")}
              rows={2}
              placeholder="Village, District, State"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 resize-none"
            />
          </div>
        </section>

        {/* Emergency Contact */}
        <section className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm">Emergency Contact</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Name</label>
              <input
                value={form.emergency_contact_name}
                onChange={set("emergency_contact_name")}
                placeholder="Contact name"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Phone</label>
              <input
                type="tel"
                value={form.emergency_contact_phone}
                onChange={set("emergency_contact_phone")}
                placeholder="9876543210"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </section>

        {/* ID Proof */}
        <section className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
          <h2 className="font-semibold text-slate-700 text-sm">ID Proof</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Type</label>
              <select
                value={form.id_proof_type}
                onChange={set("id_proof_type")}
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400 bg-white"
              >
                <option value="">Select...</option>
                <option value="Aadhar">Aadhar Card</option>
                <option value="PAN">PAN Card</option>
                <option value="Voter ID">Voter ID</option>
                <option value="Driving License">Driving License</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Number</label>
              <input
                value={form.id_proof_number}
                onChange={set("id_proof_number")}
                placeholder="ID number"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-orange-400"
              />
            </div>
          </div>
        </section>

        <button
          type="submit"
          disabled={mutation.isPending}
          className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {mutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Adding...</>
          ) : (
            "Add Labour"
          )}
        </button>
      </form>
    </div>
  );
}

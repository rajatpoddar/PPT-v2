import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, LogOut } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../../services/api";
import { useAuthStore } from "../../../store/authStore";
import { PageHeader } from "../../../components/common/PageHeader";

export function SettingsPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [pwForm, setPwForm] = useState({ current: "", new: "", confirm: "" });
  const [pwErrors, setPwErrors] = useState<Record<string, string>>({});

  const pwMutation = useMutation({
    mutationFn: () => authApi.changePassword(pwForm.current, pwForm.new),
    onSuccess: () => {
      toast.success("Password changed successfully");
      setPwForm({ current: "", new: "", confirm: "" });
    },
    onError: (err: unknown) => {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      toast.error(msg || "Failed to change password");
    },
  });

  const validatePw = () => {
    const errors: Record<string, string> = {};
    if (!pwForm.current) errors.current = "Current password required";
    if (!pwForm.new || pwForm.new.length < 6) errors.new = "Min 6 characters";
    if (pwForm.new !== pwForm.confirm) errors.confirm = "Passwords don't match";
    setPwErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    clearAuth();
    navigate("/login");
  };

  return (
    <div>
      <PageHeader title="Settings" />

      <div className="px-4 py-3 space-y-5 max-w-lg">
        {/* Profile */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-3">Profile</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
              {user?.full_name?.charAt(0)}
            </div>
            <div>
              <p className="font-semibold text-slate-800">{user?.full_name}</p>
              <p className="text-sm text-slate-500">{user?.email}</p>
              <p className="text-xs text-slate-400 capitalize mt-0.5">{user?.role?.replace("_", " ")}</p>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white rounded-xl border border-slate-100 p-4 space-y-3">
          <h3 className="font-semibold text-slate-700 text-sm">Change Password</h3>
          {[
            { key: "current", label: "Current Password", placeholder: "••••••••" },
            { key: "new", label: "New Password", placeholder: "Min 6 characters" },
            { key: "confirm", label: "Confirm New Password", placeholder: "Repeat new password" },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs text-slate-500 mb-1">{label}</label>
              <input
                type="password"
                value={pwForm[key as keyof typeof pwForm]}
                onChange={(e) => setPwForm((p) => ({ ...p, [key]: e.target.value }))}
                placeholder={placeholder}
                className={`w-full px-3 py-2.5 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-orange-500/20 ${
                  pwErrors[key] ? "border-red-400" : "border-slate-200 focus:border-orange-400"
                }`}
              />
              {pwErrors[key] && <p className="mt-1 text-xs text-red-500">{pwErrors[key]}</p>}
            </div>
          ))}
          <button
            onClick={() => validatePw() && pwMutation.mutate()}
            disabled={pwMutation.isPending}
            className="w-full py-2.5 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {pwMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update Password"}
          </button>
        </div>

        {/* App Info */}
        <div className="bg-white rounded-xl border border-slate-100 p-4">
          <h3 className="font-semibold text-slate-700 text-sm mb-2">About</h3>
          <p className="text-sm text-slate-600">PPT Builders v1.0.0</p>
          <p className="text-xs text-slate-400 mt-0.5">Site se settlement tak, sab ek jagah</p>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="w-full py-3 border border-red-200 text-red-500 font-medium text-sm rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );
}

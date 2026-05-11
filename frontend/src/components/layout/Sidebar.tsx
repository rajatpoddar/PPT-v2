import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, Users, ClipboardCheck,
  Wallet, Receipt, Wrench, TrendingUp, FileText,
  Settings, HardHat, LogOut, ChevronRight
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/authStore";
import { authApi } from "../../services/api";
import toast from "react-hot-toast";

const ownerNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/sites", icon: Building2, label: "Sites" },
  { to: "/labours", icon: Users, label: "Labour" },
  { to: "/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/payments", icon: Wallet, label: "Payments" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/equipment", icon: Wrench, label: "Equipment" },
  { to: "/investors", icon: TrendingUp, label: "Investors" },
  { to: "/reports", icon: FileText, label: "Reports" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const inchargeNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/work-logs", icon: FileText, label: "Work Logs" },
  { to: "/photos", icon: Building2, label: "Photos" },
];

const investorNav = [
  { to: "/investor-portal", icon: TrendingUp, label: "My Investments" },
];

export function Sidebar() {
  const { user, clearAuth } = useAuthStore();

  const navItems =
    user?.role === "owner"
      ? ownerNav
      : user?.role === "site_incharge"
      ? inchargeNav
      : investorNav;

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    clearAuth();
    toast.success("Logged out");
  };

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white min-h-screen fixed left-0 top-0 z-20">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-700">
        <div className="p-2 bg-orange-500 rounded-lg">
          <HardHat className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-white text-sm">PPT Builders</p>
          <p className="text-xs text-slate-400">Site se settlement tak</p>
        </div>
      </div>

      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold">
            {user?.full_name?.charAt(0) || "U"}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-slate-400 capitalize">
              {user?.role?.replace("_", " ")}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-orange-500 text-white"
                  : "text-slate-300 hover:bg-slate-800 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {isActive && <ChevronRight className="w-3.5 h-3.5 opacity-70" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-all duration-150"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

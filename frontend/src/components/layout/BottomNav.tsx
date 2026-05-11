import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Building2, ClipboardCheck,
  Wallet, MoreHorizontal, TrendingUp
} from "lucide-react";
import { cn } from "../../utils/cn";
import { useAuthStore } from "../../store/authStore";

const ownerBottomNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/sites", icon: Building2, label: "Sites" },
  { to: "/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/payments", icon: Wallet, label: "Payments" },
  { to: "/more", icon: MoreHorizontal, label: "More" },
];

const inchargeBottomNav = [
  { to: "/dashboard", icon: LayoutDashboard, label: "Home" },
  { to: "/attendance", icon: ClipboardCheck, label: "Attendance" },
  { to: "/work-logs", icon: Building2, label: "Work" },
  { to: "/photos", icon: MoreHorizontal, label: "Photos" },
];

const investorBottomNav = [
  { to: "/investor-portal", icon: TrendingUp, label: "Investments" },
];

export function BottomNav() {
  const { user } = useAuthStore();

  const navItems =
    user?.role === "owner"
      ? ownerBottomNav
      : user?.role === "site_incharge"
      ? inchargeBottomNav
      : investorBottomNav;

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-20 bg-white border-t border-slate-200 pb-safe">
      <div className="flex items-center justify-around px-2 py-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg min-w-[56px] transition-all duration-150",
                isActive ? "text-orange-500" : "text-slate-400"
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={cn("w-5 h-5", isActive && "scale-110")} />
                <span className="text-[10px] font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

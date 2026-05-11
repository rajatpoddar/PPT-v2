import { Bell, HardHat } from "lucide-react";
import { useAuthStore } from "../../store/authStore";

export function Navbar() {
  const { user } = useAuthStore();

  return (
    <header className="lg:hidden sticky top-0 z-10 bg-white border-b border-slate-100 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-500 rounded-lg">
            <HardHat className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-slate-800 text-sm">PPT Builders</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-slate-100 transition-colors relative">
            <Bell className="w-5 h-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full" />
          </button>
          <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-sm font-bold text-white">
            {user?.full_name?.charAt(0) || "U"}
          </div>
        </div>
      </div>
    </header>
  );
}

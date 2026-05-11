import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  Building2, Users, TrendingUp, TrendingDown,
  AlertCircle, Camera, Wallet, Plus, ArrowRight
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { dashboardApi } from "../../services/api";
import { KPICard } from "../../components/common/KPICard";
import { StatusBadge } from "../../components/common/StatusBadge";
import { PageSkeleton } from "../../components/common/LoadingSkeleton";
import { formatCurrency, formatNumber } from "../../utils/formatters";
import { PROJECT_TYPE_LABELS } from "../../utils/constants";
import type { OwnerDashboard } from "../../types";

export function OwnerDashboard() {
  const { data, isLoading, error } = useQuery<OwnerDashboard>({
    queryKey: ["dashboard", "owner"],
    queryFn: () => dashboardApi.owner().then((r) => r.data),
    refetchInterval: 60_000,
  });

  if (isLoading) return <PageSkeleton />;
  if (error) return (
    <div className="p-4 text-center text-red-500">
      Failed to load dashboard. Please refresh.
    </div>
  );
  if (!data) return null;

  const { kpis, alerts, weekly_chart, site_cards } = data;
  const hasAlerts = alerts.pending_salary_labours.length > 0 || alerts.sites_no_photo.length > 0;

  return (
    <div className="p-4 space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">This week's overview</p>
        </div>
        <Link
          to="/sites/new"
          className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white text-sm font-medium rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Site
        </Link>
      </div>

      {/* Alerts */}
      {hasAlerts && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-700 font-medium text-sm">
            <AlertCircle className="w-4 h-4" />
            Attention Required
          </div>
          {alerts.pending_salary_labours.length > 0 && (
            <p className="text-sm text-amber-600">
              💰 {alerts.pending_salary_labours.length} labour(s) have pending salary for 7+ days:{" "}
              {alerts.pending_salary_labours.slice(0, 3).map((l) => l.name).join(", ")}
              {alerts.pending_salary_labours.length > 3 && ` +${alerts.pending_salary_labours.length - 3} more`}
            </p>
          )}
          {alerts.sites_no_photo.length > 0 && (
            <p className="text-sm text-amber-600">
              📷 No photos in 12h:{" "}
              {alerts.sites_no_photo.map((s) => s.name).join(", ")}
            </p>
          )}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KPICard
          title="Active Sites"
          value={kpis.active_sites}
          icon={<Building2 className="w-5 h-5" />}
        />
        <KPICard
          title="Labours Today"
          value={kpis.labours_today}
          icon={<Users className="w-5 h-5" />}
        />
        <KPICard
          title="Week Earnings"
          value={kpis.week_earnings}
          isCurrency
          icon={<TrendingUp className="w-5 h-5" />}
        />
        <KPICard
          title="Week Expenses"
          value={kpis.week_expenses}
          isCurrency
          icon={<Wallet className="w-5 h-5" />}
        />
        <KPICard
          title="Net Profit"
          value={kpis.net_profit}
          isCurrency
          icon={
            kpis.net_profit >= 0 ? (
              <TrendingUp className="w-5 h-5" />
            ) : (
              <TrendingDown className="w-5 h-5" />
            )
          }
          valueClassName={kpis.net_profit >= 0 ? "text-green-600" : "text-red-500"}
          className="col-span-2 sm:col-span-1"
        />
      </div>

      {/* Weekly Earnings Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Weekly Earnings (Last 8 Weeks)</h2>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekly_chart} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "#94a3b8" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Earned"]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "12px",
              }}
            />
            <Bar dataKey="earned" fill="#F97316" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Site Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-700">Your Sites</h2>
          <Link to="/sites" className="text-xs text-orange-500 font-medium flex items-center gap-1">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {site_cards.map((site) => (
            <Link
              key={site.id}
              to={`/sites/${site.id}`}
              className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 hover:shadow-md transition-all duration-200 hover:border-orange-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-slate-800 text-sm truncate">{site.name}</h3>
                  {site.location && (
                    <p className="text-xs text-slate-400 truncate">{site.location}</p>
                  )}
                </div>
                <StatusBadge status={site.status} className="ml-2 flex-shrink-0" />
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                  <span>Progress</span>
                  <span className="font-medium">{site.progress}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(site.progress, 100)}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400">This week</p>
                  <p className="text-sm font-bold text-slate-800">
                    {formatCurrency(site.week_earning)}
                  </p>
                </div>
                {site.project_type && (
                  <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                    {PROJECT_TYPE_LABELS[site.project_type] || site.project_type}
                  </span>
                )}
              </div>
            </Link>
          ))}

          {/* Add site card */}
          <Link
            to="/sites/new"
            className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 min-h-[120px]"
          >
            <Plus className="w-6 h-6 text-slate-400" />
            <span className="text-sm text-slate-500 font-medium">Add New Site</span>
          </Link>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { to: "/attendance", icon: Users, label: "Mark Attendance", color: "bg-green-50 text-green-600" },
          { to: "/payments", icon: Wallet, label: "Pay Labour", color: "bg-blue-50 text-blue-600" },
          { to: "/expenses", icon: TrendingDown, label: "Add Expense", color: "bg-red-50 text-red-600" },
          { to: "/sites", icon: Camera, label: "View Photos", color: "bg-purple-50 text-purple-600" },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link
            key={to}
            to={to}
            className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all duration-200"
          >
            <div className={`p-2.5 rounded-lg ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-medium text-slate-600 text-center">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

import type { SkillType, ProjectType, ExpenseCategory, EquipmentCategory } from "../types";

export const SKILL_TYPE_LABELS: Record<SkillType, string> = {
  unskilled_labour: "Unskilled Labour / Mazdoor",
  skilled_labour: "Skilled Labour",
  mason_mistri: "Mason / Mistri",
  bar_bender: "Bar Bender",
  carpenter: "Carpenter / Badhai",
  plumber: "Plumber",
  electrician: "Electrician",
  equipment_operator: "Equipment Operator",
  supervisor: "Supervisor / Mukadam",
};

export const PROJECT_TYPE_LABELS: Record<ProjectType, string> = {
  PCC_road: "PCC Road",
  WBM_road: "WBM Road",
  guardwall: "Guard Wall",
  check_dam: "Check Dam",
  culvert: "Culvert",
  kalvat: "Kalvat",
  excavation: "Excavation",
  building: "Building",
  other: "Other",
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  food_lodging: "Food & Lodging",
  equipment_purchase: "Equipment Purchase",
  equipment_repair: "Equipment Repair",
  fuel_transport: "Fuel & Transport",
  material: "Material",
  site_setup: "Site Setup",
  safety_equipment: "Safety Equipment",
  other: "Other",
};

export const EQUIPMENT_CATEGORY_LABELS: Record<EquipmentCategory, string> = {
  digging_tools: "Digging Tools",
  measuring_tools: "Measuring Tools",
  concrete_tools: "Concrete Tools",
  safety: "Safety Equipment",
  heavy_machinery: "Heavy Machinery",
  transport: "Transport",
  other: "Other",
};

export const WORK_TYPE_LABELS = {
  running_meter: "Running Meter",
  m3: "Cubic Meter (m³)",
  sqm: "Square Meter (sqm)",
  lumpsum: "Lump Sum",
  per_unit: "Per Unit",
};

export const ATTENDANCE_STATUS_LABELS = {
  present: "Present",
  absent: "Absent",
  half_day: "Half Day",
  leave: "Leave",
  holiday: "Holiday",
};

export const PAYMENT_TYPE_LABELS = {
  daily_salary: "Daily Salary",
  advance: "Advance",
  bonus: "Bonus",
  final_settlement: "Final Settlement",
  deduction: "Deduction",
};

export const PAYMENT_MODE_LABELS = {
  cash: "Cash",
  upi: "UPI",
  bank_transfer: "Bank Transfer",
};

export const STATUS_COLORS = {
  active: "bg-green-100 text-green-700",
  on_hold: "bg-yellow-100 text-yellow-700",
  completed: "bg-blue-100 text-blue-700",
  closed: "bg-gray-100 text-gray-600",
  inactive: "bg-gray-100 text-gray-600",
};

export const WEATHER_LABELS = {
  sunny: "☀️ Sunny",
  cloudy: "⛅ Cloudy",
  rainy: "🌧️ Rainy",
  stopped_due_to_rain: "⛈️ Stopped (Rain)",
};

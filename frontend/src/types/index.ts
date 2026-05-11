// ── Auth ──────────────────────────────────────────────────────────────────────
export type UserRole = "owner" | "site_incharge" | "investor";

export interface User {
  id: number;
  email: string;
  full_name: string;
  phone?: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface AuthToken {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ── Labour ────────────────────────────────────────────────────────────────────
export type SkillType =
  | "unskilled_labour"
  | "skilled_labour"
  | "mason_mistri"
  | "bar_bender"
  | "carpenter"
  | "plumber"
  | "electrician"
  | "equipment_operator"
  | "supervisor";

export type LabourStatus = "active" | "inactive";

export interface Labour {
  id: number;
  owner_id: number;
  name: string;
  phone?: string;
  skill_type: SkillType;
  daily_rate: number;
  date_joined?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  id_proof_type?: string;
  id_proof_number?: string;
  photo_url?: string;
  status: LabourStatus;
  notes?: string;
  created_at: string;
}

export interface LabourBalance {
  labour_id: number;
  labour_name: string;
  site_id?: number;
  total_earned: number;
  total_paid: number;
  balance_due: number;
  status: "owed_to_labour" | "labour_owes" | "settled";
}

// ── Site ──────────────────────────────────────────────────────────────────────
export type ProjectType =
  | "PCC_road"
  | "WBM_road"
  | "guardwall"
  | "check_dam"
  | "culvert"
  | "kalvat"
  | "excavation"
  | "building"
  | "other";

export type SiteStatus = "active" | "on_hold" | "completed";

export type WorkType = "running_meter" | "m3" | "sqm" | "lumpsum" | "per_unit";

export interface Site {
  id: number;
  owner_id: number;
  name: string;
  location?: string;
  project_type?: ProjectType;
  start_date?: string;
  expected_end_date?: string;
  actual_end_date?: string;
  main_contractor_name?: string;
  main_contractor_phone?: string;
  main_contractor_company?: string;
  site_incharge_id?: number;
  status: SiteStatus;
  total_contract_value?: number;
  gps_lat?: number;
  gps_lng?: number;
  notes?: string;
  created_at: string;
}

export interface SiteWorkItem {
  id: number;
  site_id: number;
  work_name: string;
  work_type: WorkType;
  rate_per_unit: number;
  unit_label?: string;
  total_estimated_quantity?: number;
  created_at: string;
}

// ── Work ──────────────────────────────────────────────────────────────────────
export type WeatherCondition = "sunny" | "cloudy" | "rainy" | "stopped_due_to_rain";
export type PhotoType = "morning" | "afternoon" | "evening" | "work_in_progress" | "completed_section" | "issue";

export interface WorkLog {
  id: number;
  site_id: number;
  work_item_id: number;
  work_item_name?: string;
  work_type?: WorkType;
  rate_per_unit?: number;
  unit_label?: string;
  logged_by: number;
  log_date: string;
  quantity_done: number;
  length_m?: number;
  width_m?: number;
  height_m?: number;
  earned?: number;
  remarks?: string;
  weather?: WeatherCondition;
  created_at: string;
}

export interface SitePhoto {
  id: number;
  site_id: number;
  work_log_id?: number;
  uploaded_by: number;
  photo_url: string;
  caption?: string;
  photo_time?: string;
  photo_type?: PhotoType;
  created_at: string;
}

// ── Attendance ────────────────────────────────────────────────────────────────
export type AttendanceStatus = "present" | "absent" | "half_day" | "leave" | "holiday";

export interface AttendanceRecord {
  id?: number;
  labour_id: number;
  labour_name?: string;
  skill_type?: SkillType;
  daily_rate?: number;
  photo_url?: string;
  attendance_id?: number;
  status?: AttendanceStatus;
}

export interface AttendanceSummary {
  date: string;
  site_id: number;
  labours: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absent: number;
    half_day: number;
    not_marked: number;
  };
}

// ── Payment ───────────────────────────────────────────────────────────────────
export type PaymentType = "daily_salary" | "advance" | "bonus" | "final_settlement" | "deduction";
export type PaymentMode = "cash" | "upi" | "bank_transfer";

export interface LabourPayment {
  id: number;
  labour_id: number;
  site_id: number;
  payment_date: string;
  amount: number;
  payment_type: PaymentType;
  payment_mode: PaymentMode;
  reference_number?: string;
  week_start?: string;
  week_end?: string;
  remarks?: string;
  paid_by: number;
  created_at: string;
}

export interface PendingPayment {
  labour_id: number;
  labour_name: string;
  skill_type: SkillType;
  photo_url?: string;
  site_id?: number;
  total_earned: number;
  total_paid: number;
  balance_due: number;
}

// ── Expense ───────────────────────────────────────────────────────────────────
export type ExpenseCategory =
  | "food_lodging"
  | "equipment_purchase"
  | "equipment_repair"
  | "fuel_transport"
  | "material"
  | "site_setup"
  | "safety_equipment"
  | "other";

export interface Expense {
  id: number;
  site_id: number;
  expense_date: string;
  category: ExpenseCategory;
  amount: number;
  description?: string;
  vendor_name?: string;
  payment_mode?: string;
  receipt_photo_url?: string;
  added_by: number;
  created_at: string;
}

// ── Equipment ─────────────────────────────────────────────────────────────────
export type EquipmentCategory =
  | "digging_tools"
  | "measuring_tools"
  | "concrete_tools"
  | "safety"
  | "heavy_machinery"
  | "transport"
  | "other";

export type EquipmentStatus = "in_store" | "on_site" | "under_repair" | "disposed";

export interface Equipment {
  id: number;
  owner_id: number;
  name: string;
  category?: EquipmentCategory;
  description?: string;
  total_quantity: number;
  purchase_date?: string;
  purchase_cost?: number;
  current_status: EquipmentStatus;
  notes?: string;
  created_at: string;
}

// ── Investor ──────────────────────────────────────────────────────────────────
export type InvestmentType = "profit_sharing" | "interest_based" | "hybrid";

export interface Investor {
  id: number;
  user_id: number;
  full_name: string;
  phone?: string;
  address?: string;
  pan_number?: string;
  bank_name?: string;
  bank_account?: string;
  ifsc_code?: string;
  investment_type: InvestmentType;
  profit_share_percentage?: number;
  interest_rate_monthly?: number;
  created_at: string;
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export interface OwnerDashboard {
  kpis: {
    active_sites: number;
    labours_today: number;
    week_earnings: number;
    week_expenses: number;
    net_profit: number;
  };
  alerts: {
    pending_salary_labours: { id: number; name: string }[];
    sites_no_photo: { id: number; name: string }[];
  };
  weekly_chart: { week: string; earned: number }[];
  site_cards: {
    id: number;
    name: string;
    location?: string;
    status: SiteStatus;
    project_type?: ProjectType;
    progress: number;
    week_earning: number;
    contractor?: string;
  }[];
}

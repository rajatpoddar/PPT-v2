import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Request interceptor — attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — handle 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        try {
          const res = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, null, {
            params: { token: refreshToken },
          });
          const newToken = res.data.access_token;
          localStorage.setItem("access_token", newToken);
          original.headers.Authorization = `Bearer ${newToken}`;
          return api(original);
        } catch {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          window.location.href = "/login";
        }
      } else {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string, remember_me = false) =>
    api.post("/api/v1/auth/login", { email, password, remember_me }),
  logout: () => api.post("/api/v1/auth/logout"),
  me: () => api.get("/api/v1/auth/me"),
  changePassword: (current_password: string, new_password: string) =>
    api.post("/api/v1/auth/change-password", { current_password, new_password }),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────
export const dashboardApi = {
  owner: () => api.get("/api/v1/dashboard/owner"),
  siteIncharge: () => api.get("/api/v1/dashboard/site-incharge"),
  investor: () => api.get("/api/v1/dashboard/investor"),
};

// ── Labours ───────────────────────────────────────────────────────────────────
export const laboursApi = {
  list: (params?: Record<string, unknown>) => api.get("/api/v1/labours", { params }),
  create: (data: unknown) => api.post("/api/v1/labours", data),
  get: (id: number) => api.get(`/api/v1/labours/${id}`),
  update: (id: number, data: unknown) => api.put(`/api/v1/labours/${id}`, data),
  deactivate: (id: number) => api.delete(`/api/v1/labours/${id}`),
  balance: (id: number, site_id?: number) =>
    api.get(`/api/v1/labours/${id}/balance`, { params: { site_id } }),
  attendance: (id: number, params?: Record<string, unknown>) =>
    api.get(`/api/v1/labours/${id}/attendance`, { params }),
  payments: (id: number, params?: Record<string, unknown>) =>
    api.get(`/api/v1/labours/${id}/payments`, { params }),
  assign: (id: number, data: unknown) => api.post(`/api/v1/labours/${id}/assign`, data),
  release: (id: number, site_id: number) =>
    api.post(`/api/v1/labours/${id}/release/${site_id}`),
  uploadPhoto: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/api/v1/labours/${id}/photo`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Sites ─────────────────────────────────────────────────────────────────────
export const sitesApi = {
  list: (params?: Record<string, unknown>) => api.get("/api/v1/sites", { params }),
  create: (data: unknown) => api.post("/api/v1/sites", data),
  get: (id: number) => api.get(`/api/v1/sites/${id}`),
  update: (id: number, data: unknown) => api.put(`/api/v1/sites/${id}`, data),
  workItems: (id: number) => api.get(`/api/v1/sites/${id}/work-items`),
  addWorkItem: (id: number, data: unknown) => api.post(`/api/v1/sites/${id}/work-items`, data),
  updateWorkItem: (siteId: number, itemId: number, data: unknown) =>
    api.put(`/api/v1/sites/${siteId}/work-items/${itemId}`, data),
  deleteWorkItem: (siteId: number, itemId: number) =>
    api.delete(`/api/v1/sites/${siteId}/work-items/${itemId}`),
  workLogs: (id: number, params?: Record<string, unknown>) =>
    api.get(`/api/v1/sites/${id}/work-logs`, { params }),
  addWorkLog: (id: number, data: unknown) => api.post(`/api/v1/sites/${id}/work-logs`, data),
  attendance: (id: number, date: string) =>
    api.get(`/api/v1/sites/${id}/attendance/${date}`),
  financials: (id: number, params?: Record<string, unknown>) =>
    api.get(`/api/v1/sites/${id}/financials`, { params }),
  photos: (id: number, params?: Record<string, unknown>) =>
    api.get(`/api/v1/sites/${id}/photos`, { params }),
};

// ── Attendance ────────────────────────────────────────────────────────────────
export const attendanceApi = {
  bulkMark: (data: unknown) => api.post("/api/v1/attendance/bulk", data),
  get: (site_id: number, date: string) =>
    api.get(`/api/v1/attendance/${site_id}/${date}`),
  update: (id: number, data: unknown) => api.put(`/api/v1/attendance/${id}`, data),
};

// ── Payments ──────────────────────────────────────────────────────────────────
export const paymentsApi = {
  pending: (params?: Record<string, unknown>) =>
    api.get("/api/v1/payments/pending", { params }),
  record: (data: unknown) => api.post("/api/v1/payments/labour", data),
  advance: (data: unknown) => api.post("/api/v1/payments/advance", data),
  history: (params?: Record<string, unknown>) =>
    api.get("/api/v1/payments/history", { params }),
};

// ── Expenses ──────────────────────────────────────────────────────────────────
export const expensesApi = {
  list: (params?: Record<string, unknown>) => api.get("/api/v1/expenses", { params }),
  create: (data: unknown) => api.post("/api/v1/expenses", data),
  update: (id: number, data: unknown) => api.put(`/api/v1/expenses/${id}`, data),
  delete: (id: number) => api.delete(`/api/v1/expenses/${id}`),
  summary: (params?: Record<string, unknown>) =>
    api.get("/api/v1/expenses/summary", { params }),
  uploadReceipt: (id: number, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/api/v1/expenses/${id}/receipt`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Equipment ─────────────────────────────────────────────────────────────────
export const equipmentApi = {
  list: () => api.get("/api/v1/equipment"),
  create: (data: unknown) => api.post("/api/v1/equipment", data),
  update: (id: number, data: unknown) => api.put(`/api/v1/equipment/${id}`, data),
  allocate: (id: number, data: unknown) =>
    api.post(`/api/v1/equipment/${id}/allocate`, data),
  return: (id: number, allocationId: number, data: unknown) =>
    api.post(`/api/v1/equipment/${id}/return/${allocationId}`, data),
  statusBoard: () => api.get("/api/v1/equipment/status-board"),
};

// ── Investors ─────────────────────────────────────────────────────────────────
export const investorsApi = {
  list: () => api.get("/api/v1/investors"),
  create: (data: unknown) => api.post("/api/v1/investors", data),
  get: (id: number) => api.get(`/api/v1/investors/${id}`),
  update: (id: number, data: unknown) => api.put(`/api/v1/investors/${id}`, data),
  addTransaction: (id: number, data: unknown) =>
    api.post(`/api/v1/investors/${id}/transactions`, data),
  transactions: (id: number, params?: Record<string, unknown>) =>
    api.get(`/api/v1/investors/${id}/transactions`, { params }),
  profitCalc: (id: number, site_id?: number) =>
    api.get(`/api/v1/investors/${id}/profit-calculation`, { params: { site_id } }),
};

// ── Upload ────────────────────────────────────────────────────────────────────
export const uploadApi = {
  photo: (site_id: number, file: File, caption?: string, photo_type?: string) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/v1/upload/photo", form, {
      params: { site_id, caption, photo_type },
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  receipt: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post("/api/v1/upload/receipt", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────
export const reportsApi = {
  weeklySettlement: (site_id: number, week?: string) =>
    api.get(`/api/v1/reports/weekly-settlement/${site_id}`, {
      params: { week },
      responseType: "blob",
    }),
  labourReport: (labour_id: number, from?: string, to?: string) =>
    api.get(`/api/v1/reports/labour/${labour_id}`, {
      params: { from_date: from, to_date: to },
      responseType: "blob",
    }),
  monthlySummary: (month?: string) =>
    api.get("/api/v1/reports/monthly-summary", { params: { month } }),
};

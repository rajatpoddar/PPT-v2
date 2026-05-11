# 🏗️ PPT Builders

**Site se settlement tak, sab ek jagah**

A full-stack construction subcontractor management system for Indian Peti Contractors.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript + Tailwind CSS |
| Backend | Python FastAPI |
| Database | PostgreSQL + SQLAlchemy |
| Auth | JWT (role-based) |
| Charts | Recharts |
| PDF | WeasyPrint |

---

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+ *(production only — dev uses SQLite)*

### 1. Database Setup

**Development:** No setup needed — SQLite file is created automatically at `backend/ppt_builders.db`.

**Production only:**
```bash
psql -U postgres -c "CREATE DATABASE ppt_builders;"
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
# Development (SQLite — no PostgreSQL needed):
pip install -r requirements.txt

# Production (PostgreSQL):
pip install -r requirements-prod.txt

# Configure environment
cp .env.example .env
# For dev, the default .env already uses SQLite — no changes needed.
# For production, change DATABASE_URL to your PostgreSQL connection string.

# Run the server (tables auto-created on startup)
python main.py
```

The API will be available at `http://localhost:8000`
API docs: `http://localhost:8000/docs`

### 3. Seed Data

```bash
cd backend
source venv/bin/activate
python seed.py
```

This creates:
- 1 Owner: `owner@pptbuilders.com` / `Test@1234`
- 2 Site In-charges: `incharge1@pptbuilders.com`, `incharge2@pptbuilders.com` / `Test@1234`
- 1 Investor: `investor1@pptbuilders.com` / `Test@1234`
- 3 Sites with work items, attendance, work logs, expenses

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

---

## User Roles

| Role | Access |
|------|--------|
| **Owner** | Full access — all sites, financials, investors, reports |
| **Site In-charge** | Only their assigned site(s) — attendance, work logs, photos |
| **Investor** | Read-only portal — their investments, site photos, P&L |

---

## Features

### Owner Dashboard
- KPI cards: active sites, labours today, weekly earnings/expenses, net profit
- Site cards grid with progress bars
- Weekly earnings bar chart
- Alerts: pending salaries, sites without photos

### Site Management (6 tabs)
1. **Overview** — site info, contractor details, financial summary
2. **Rate Card** — work items with rates per unit
3. **Work Logs** — daily work with m³ auto-calculation (L×W×H)
4. **Attendance** — bulk P/A/H/L marking with real-time salary total
5. **Financials** — weekly settlement with PDF download
6. **Photos** — gallery with camera upload, lightbox view

### Labour Management
- Full profile with skill type, daily rate, ID proof
- Balance calculation: earned - paid = balance due
- Attendance history (monthly calendar)
- Payment history timeline

### Payments
- Pending payments sorted by amount
- Pay modal with breakdown (earned / paid / balance)
- Advance payment with warning if > 3× daily rate

### Expenses
- Category-wise tracking with pie chart
- Receipt photo upload
- Filter by site, category, date range

### Equipment
- Inventory management
- Site allocation tracking
- Status board (where each item is)

### Investors
- Profit sharing / interest-based / hybrid models
- Transaction recording
- Investor portal (separate login)

### Reports (PDF)
- Weekly settlement report
- Monthly financial summary

---

## API Documentation

Once the backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

---

## Project Structure

```
ppt-builders/
├── backend/
│   ├── main.py              # FastAPI app
│   ├── config.py            # Settings
│   ├── database.py          # SQLAlchemy setup
│   ├── models/              # Database models
│   ├── schemas/             # Pydantic schemas
│   ├── routers/             # API route handlers
│   ├── services/            # Business logic
│   ├── middleware/          # Auth & role middleware
│   ├── seed.py              # Sample data
│   └── uploads/             # File storage
└── frontend/
    └── src/
        ├── components/      # Reusable UI components
        ├── pages/           # Route pages
        ├── services/        # API client
        ├── store/           # Zustand auth store
        ├── types/           # TypeScript interfaces
        └── utils/           # Formatters, constants
```

---

## Key Business Logic

### Labour Balance
```
balance_due = total_salary_earned - total_paid - total_advances
```
- Green: labour is owed money
- Red: labour owes money (advance overdraft)

### Work Quantity (m³)
```
volume = length × width × height
```
Auto-calculated in real-time as dimensions are entered.

### Site Earnings
```
earned = Σ (quantity_done × rate_per_unit) for all work logs
```

### Net Profit
```
gross_profit = earned - labour_cost - expenses
```

---

## Notes

- All currency displayed in Indian number format (₹1,23,456)
- Dates displayed as DD MMM YYYY (25 Apr 2025)
- Labour rate is snapshotted at assignment time — historical calculations use old rate
- JWT tokens stored in localStorage (access + refresh)
- Photos compressed to max 1920px before storage

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import date, timedelta
from database import get_db
from models.user import User
from models.site import Site, SiteWorkItem
from models.work import WorkLog
from models.labour import Labour
from models.payment import LabourPayment
from models.expense import Expense
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.calculations import calculate_net_profit, get_week_dates, get_labour_balance
from services.pdf_generator import generate_weekly_settlement_pdf, generate_labour_report_pdf, format_date, format_inr

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])


@router.get("/weekly-settlement/{site_id}")
def weekly_settlement_report(
    site_id: int,
    week: Optional[str] = None,  # "2025-04-21"
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    site = db.query(Site).filter(Site.id == site_id, Site.owner_id == current_user.id).first()
    if not site:
        raise HTTPException(status_code=404, detail="Site not found")

    if week:
        week_start_date = date.fromisoformat(week)
    else:
        week_start_date = date.today()

    w_start, w_end = get_week_dates(week_start_date)
    profit_data = calculate_net_profit(site_id, w_start, w_end, db)

    # Work items breakdown
    work_items_data = []
    work_items = db.query(SiteWorkItem).filter(SiteWorkItem.site_id == site_id).all()
    for item in work_items:
        total_done = db.query(func.sum(WorkLog.quantity_done)).filter(
            WorkLog.work_item_id == item.id,
            WorkLog.log_date >= w_start,
            WorkLog.log_date <= w_end
        ).scalar() or 0
        if float(total_done) > 0:
            work_items_data.append({
                "name": item.work_name,
                "quantity": float(total_done),
                "unit": item.unit_label or "",
                "rate": item.rate_per_unit,
                "earned": float(total_done) * float(item.rate_per_unit)
            })

    # Expenses
    expenses = db.query(Expense).filter(
        Expense.site_id == site_id,
        Expense.expense_date >= w_start,
        Expense.expense_date <= w_end
    ).all()
    expenses_data = [
        {"category": e.category, "description": e.description or "", "amount": e.amount}
        for e in expenses
    ]

    # Labour count
    from models.attendance import Attendance, AttendanceStatus
    labour_count = db.query(func.count(Attendance.labour_id.distinct())).filter(
        Attendance.site_id == site_id,
        Attendance.date >= w_start,
        Attendance.date <= w_end,
        Attendance.status.in_([AttendanceStatus.present, AttendanceStatus.half_day])
    ).scalar() or 0

    pdf_data = {
        "site_name": site.name,
        "week_start": format_date(w_start),
        "week_end": format_date(w_end),
        "work_items": work_items_data,
        "expenses": expenses_data,
        "total_earned": profit_data["earned"],
        "total_expenses": profit_data["expenses"],
        "total_salary": profit_data["labour_cost"],
        "total_advances": 0,
        "net_profit": profit_data["gross_profit"],
        "total_labours": labour_count
    }

    pdf_bytes = generate_weekly_settlement_pdf(pdf_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=settlement_{site_id}_{w_start}.pdf"}
    )


@router.get("/labour/{labour_id}")
def labour_report(
    labour_id: int,
    from_date: Optional[str] = None,
    to_date: Optional[str] = None,
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    labour = db.query(Labour).filter(Labour.id == labour_id, Labour.owner_id == current_user.id).first()
    if not labour:
        raise HTTPException(status_code=404, detail="Labour not found")

    balance = get_labour_balance(labour_id, None, db)

    payments = db.query(LabourPayment).filter(LabourPayment.labour_id == labour_id).all()

    pdf_data = {
        "labour_name": labour.name,
        "period": f"{from_date or 'All time'} to {to_date or 'Today'}",
        "monthly_summary": [],
        "payments": [
            {
                "date": format_date(p.payment_date),
                "type": p.payment_type,
                "amount": p.amount,
                "mode": p.payment_mode,
                "remarks": p.remarks or ""
            } for p in payments
        ],
        "total_earned": balance["total_earned"],
        "total_paid": balance["total_paid"],
        "balance_due": balance["balance_due"]
    }

    pdf_bytes = generate_labour_report_pdf(pdf_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=labour_{labour_id}_report.pdf"}
    )


@router.get("/monthly-summary")
def monthly_summary(
    month: Optional[str] = None,  # "2025-04"
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    if not month:
        today = date.today()
        month = f"{today.year}-{today.month:02d}"

    year, mon = month.split("-")
    from_date = date(int(year), int(mon), 1)
    # Last day of month
    if int(mon) == 12:
        to_date = date(int(year) + 1, 1, 1) - timedelta(days=1)
    else:
        to_date = date(int(year), int(mon) + 1, 1) - timedelta(days=1)

    sites = db.query(Site).filter(Site.owner_id == current_user.id).all()
    site_summaries = []
    total_earned = 0
    total_expenses = 0
    total_profit = 0

    for site in sites:
        profit_data = calculate_net_profit(site.id, from_date, to_date, db)
        site_summaries.append({
            "site_id": site.id,
            "site_name": site.name,
            "status": site.status,
            "earned": float(profit_data["earned"]),
            "expenses": float(profit_data["expenses"]) + float(profit_data["labour_cost"]),
            "profit": float(profit_data["gross_profit"])
        })
        total_earned += float(profit_data["earned"])
        total_expenses += float(profit_data["expenses"]) + float(profit_data["labour_cost"])
        total_profit += float(profit_data["gross_profit"])

    site_summaries.sort(key=lambda x: x["profit"], reverse=True)

    return {
        "month": month,
        "sites": site_summaries,
        "totals": {
            "earned": round(total_earned, 2),
            "expenses": round(total_expenses, 2),
            "profit": round(total_profit, 2)
        },
        "top_site": site_summaries[0] if site_summaries else None
    }

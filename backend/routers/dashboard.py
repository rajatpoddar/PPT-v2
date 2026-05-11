from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from datetime import date, timedelta
from database import get_db
from models.user import User, UserRole
from models.site import Site, SiteStatus
from models.labour import Labour, SiteLabour, LabourStatus
from models.attendance import Attendance, AttendanceStatus
from models.work import WorkLog, SitePhoto
from models.payment import LabourPayment, PaymentType
from models.expense import Expense
from models.investor import Investor, InvestorTransaction, SiteInvestment
from middleware.auth_middleware import get_current_user
from middleware.role_middleware import require_owner
from services.calculations import calculate_site_earnings, calculate_net_profit, get_week_dates

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("/owner")
def owner_dashboard(
    current_user: User = Depends(require_owner),
    db: Session = Depends(get_db)
):
    today = date.today()
    week_start, week_end = get_week_dates(today)

    # Active sites
    active_sites = db.query(Site).filter(
        Site.owner_id == current_user.id,
        Site.status == SiteStatus.active
    ).count()

    # Total labours deployed today
    labours_today = db.query(func.count(Attendance.labour_id.distinct())).filter(
        Attendance.date == today,
        Attendance.status.in_([AttendanceStatus.present, AttendanceStatus.half_day])
    ).scalar() or 0

    # This week's earnings (all sites)
    sites = db.query(Site).filter(Site.owner_id == current_user.id).all()
    week_earnings = sum(
        float(calculate_site_earnings(s.id, week_start, week_end, db))
        for s in sites
    )

    # This week's expenses
    week_expenses_result = db.query(func.sum(Expense.amount)).filter(
        Expense.site_id.in_([s.id for s in sites]),
        Expense.expense_date >= week_start,
        Expense.expense_date <= week_end
    ).scalar() or 0

    # Labour cost this week
    week_labour_cost = db.query(func.sum(LabourPayment.amount)).filter(
        LabourPayment.site_id.in_([s.id for s in sites]),
        LabourPayment.payment_date >= week_start,
        LabourPayment.payment_date <= week_end,
        LabourPayment.payment_type.in_([PaymentType.daily_salary, PaymentType.bonus])
    ).scalar() or 0

    net_profit = week_earnings - float(week_expenses_result) - float(week_labour_cost)

    # Alerts: labours with pending salary > 7 days
    seven_days_ago = today - timedelta(days=7)
    pending_salary_labours = []
    for labour in db.query(Labour).filter(Labour.owner_id == current_user.id, Labour.status == LabourStatus.active).all():
        last_payment = db.query(LabourPayment).filter(
            LabourPayment.labour_id == labour.id,
            LabourPayment.payment_type == PaymentType.daily_salary
        ).order_by(LabourPayment.payment_date.desc()).first()
        if not last_payment or last_payment.payment_date < seven_days_ago:
            pending_salary_labours.append({"id": labour.id, "name": labour.name})

    # Sites with no photo in last 12 hours
    from datetime import datetime, timedelta as td
    twelve_hours_ago = datetime.utcnow() - td(hours=12)
    sites_no_photo = []
    for site in db.query(Site).filter(Site.owner_id == current_user.id, Site.status == SiteStatus.active).all():
        last_photo = db.query(SitePhoto).filter(
            SitePhoto.site_id == site.id
        ).order_by(SitePhoto.created_at.desc()).first()
        if not last_photo or last_photo.created_at < twelve_hours_ago:
            sites_no_photo.append({"id": site.id, "name": site.name})

    # Weekly earnings chart (last 8 weeks)
    weekly_chart = []
    for i in range(7, -1, -1):
        w_start = week_start - timedelta(weeks=i)
        w_end = w_start + timedelta(days=6)
        w_earned = sum(float(calculate_site_earnings(s.id, w_start, w_end, db)) for s in sites)
        weekly_chart.append({
            "week": w_start.strftime("%d %b"),
            "earned": round(w_earned, 2)
        })

    # Site cards
    site_cards = []
    for site in sites:
        site_earned = float(calculate_site_earnings(site.id, week_start, week_end, db))
        # Progress calculation
        from models.site import SiteWorkItem
        from models.work import WorkLog
        total_estimated = db.query(func.sum(SiteWorkItem.total_estimated_quantity)).filter(
            SiteWorkItem.site_id == site.id
        ).scalar() or 0
        total_done = db.query(func.sum(WorkLog.quantity_done)).filter(
            WorkLog.site_id == site.id
        ).scalar() or 0
        progress = round((float(total_done) / float(total_estimated) * 100) if total_estimated > 0 else 0, 1)

        site_cards.append({
            "id": site.id,
            "name": site.name,
            "location": site.location,
            "status": site.status,
            "project_type": site.project_type,
            "progress": progress,
            "week_earning": round(site_earned, 2),
            "contractor": site.main_contractor_name
        })

    return {
        "kpis": {
            "active_sites": active_sites,
            "labours_today": labours_today,
            "week_earnings": round(week_earnings, 2),
            "week_expenses": round(float(week_expenses_result) + float(week_labour_cost), 2),
            "net_profit": round(net_profit, 2),
        },
        "alerts": {
            "pending_salary_labours": pending_salary_labours[:5],
            "sites_no_photo": sites_no_photo
        },
        "weekly_chart": weekly_chart,
        "site_cards": site_cards
    }


@router.get("/site-incharge")
def site_incharge_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    today = date.today()

    # Get assigned sites
    assigned_sites = db.query(Site).filter(
        Site.site_incharge_id == current_user.id,
        Site.status == SiteStatus.active
    ).all()

    dashboards = []
    for site in assigned_sites:
        # Today's attendance status
        attendance_marked = db.query(Attendance).filter(
            Attendance.site_id == site.id,
            Attendance.date == today
        ).count() > 0

        # Last photo upload
        last_photo = db.query(SitePhoto).filter(
            SitePhoto.site_id == site.id
        ).order_by(SitePhoto.created_at.desc()).first()

        # Today's photos count
        from datetime import datetime
        today_photos = db.query(SitePhoto).filter(
            SitePhoto.site_id == site.id,
            func.date(SitePhoto.created_at) == today
        ).count()

        # Today's work log
        work_logged = db.query(WorkLog).filter(
            WorkLog.site_id == site.id,
            WorkLog.log_date == today
        ).count() > 0

        dashboards.append({
            "site_id": site.id,
            "site_name": site.name,
            "attendance_marked": attendance_marked,
            "work_logged": work_logged,
            "today_photos": today_photos,
            "last_photo_time": last_photo.created_at.isoformat() if last_photo else None,
            "photo_warning": today_photos < 3
        })

    return {"sites": dashboards}


@router.get("/investor")
def investor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    investor = db.query(Investor).filter(Investor.user_id == current_user.id).first()
    if not investor:
        return {"error": "Investor profile not found"}

    # Total invested
    total_invested = db.query(func.sum(InvestorTransaction.amount)).filter(
        InvestorTransaction.investor_id == investor.id,
        InvestorTransaction.transaction_type.in_(["investment", "additional_investment"])
    ).scalar() or 0

    # Total returned
    total_returned = db.query(func.sum(InvestorTransaction.amount)).filter(
        InvestorTransaction.investor_id == investor.id,
        InvestorTransaction.transaction_type.in_(["repayment", "profit_share_paid", "interest_paid"])
    ).scalar() or 0

    outstanding = float(total_invested) - float(total_returned)

    # Site investments
    site_investments = db.query(SiteInvestment).filter(
        SiteInvestment.investor_id == investor.id
    ).all()

    site_cards = []
    for si in site_investments:
        site = db.query(Site).filter(Site.id == si.site_id).first()
        if site:
            # Recent photos
            photos = db.query(SitePhoto).filter(
                SitePhoto.site_id == site.id
            ).order_by(SitePhoto.created_at.desc()).limit(5).all()

            site_cards.append({
                "site_id": site.id,
                "site_name": site.name,
                "amount_invested": float(si.allocated_amount),
                "status": site.status,
                "photos": [{"url": p.photo_url, "caption": p.caption} for p in photos]
            })

    # Recent transactions
    transactions = db.query(InvestorTransaction).filter(
        InvestorTransaction.investor_id == investor.id
    ).order_by(InvestorTransaction.transaction_date.desc()).limit(10).all()

    return {
        "summary": {
            "total_invested": float(total_invested),
            "total_returned": float(total_returned),
            "outstanding": outstanding
        },
        "site_cards": site_cards,
        "recent_transactions": [
            {
                "id": t.id,
                "date": t.transaction_date.isoformat(),
                "type": t.transaction_type,
                "amount": float(t.amount),
                "notes": t.notes
            } for t in transactions
        ]
    }

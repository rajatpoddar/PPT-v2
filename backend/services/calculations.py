from decimal import Decimal
from datetime import date, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from models.attendance import Attendance, AttendanceStatus
from models.payment import LabourPayment, PaymentType
from models.work import WorkLog
from models.site import SiteWorkItem
from models.expense import Expense
from models.labour import SiteLabour


def calculate_quantity(work_type: str, length: Optional[float], width: Optional[float],
                       height: Optional[float], manual_quantity: Optional[float]) -> Decimal:
    """Calculate work quantity based on work type and dimensions."""
    if work_type == 'm3':
        if length and width and height:
            return Decimal(str(length * width * height))
        return Decimal('0')
    elif work_type == 'sqm':
        if length and width:
            return Decimal(str(length * width))
        return Decimal('0')
    else:
        return Decimal(str(manual_quantity or 0))


def calculate_daily_salary(labour_id: int, site_id: int, log_date: date, db: Session) -> Decimal:
    """Calculate salary for a labour on a specific date."""
    attendance = db.query(Attendance).filter(
        Attendance.labour_id == labour_id,
        Attendance.site_id == site_id,
        Attendance.date == log_date
    ).first()

    if not attendance:
        return Decimal('0')

    # Get rate at time of assignment
    assignment = db.query(SiteLabour).filter(
        SiteLabour.labour_id == labour_id,
        SiteLabour.site_id == site_id,
        SiteLabour.assigned_date <= log_date,
        (SiteLabour.released_date == None) | (SiteLabour.released_date >= log_date)
    ).first()

    if not assignment:
        return Decimal('0')

    rate = assignment.daily_rate_at_assignment

    if attendance.status == AttendanceStatus.present:
        return rate * Decimal('1.0')
    elif attendance.status == AttendanceStatus.half_day:
        return rate * Decimal('0.5')
    else:
        return Decimal('0')


def calculate_total_salary_earned(labour_id: int, site_id: Optional[int], db: Session) -> Decimal:
    """Calculate total salary earned by a labour (optionally for a specific site)."""
    query = db.query(Attendance).filter(
        Attendance.labour_id == labour_id,
        Attendance.status.in_([AttendanceStatus.present, AttendanceStatus.half_day])
    )
    if site_id:
        query = query.filter(Attendance.site_id == site_id)

    attendance_records = query.all()
    total = Decimal('0')

    for record in attendance_records:
        assignment = db.query(SiteLabour).filter(
            SiteLabour.labour_id == labour_id,
            SiteLabour.site_id == record.site_id,
            SiteLabour.assigned_date <= record.date,
            (SiteLabour.released_date == None) | (SiteLabour.released_date >= record.date)
        ).first()

        if assignment:
            rate = assignment.daily_rate_at_assignment
            if record.status == AttendanceStatus.present:
                total += rate
            elif record.status == AttendanceStatus.half_day:
                total += rate * Decimal('0.5')

    return total


def sum_payments(labour_id: int, site_id: Optional[int], db: Session,
                 types: Optional[list] = None) -> Decimal:
    """Sum all payments made to a labour."""
    query = db.query(func.sum(LabourPayment.amount)).filter(
        LabourPayment.labour_id == labour_id
    )
    if site_id:
        query = query.filter(LabourPayment.site_id == site_id)
    if types:
        query = query.filter(LabourPayment.payment_type.in_(types))

    result = query.scalar()
    return Decimal(str(result or 0))


def get_labour_balance(labour_id: int, site_id: Optional[int], db: Session) -> dict:
    """Get complete balance info for a labour."""
    total_earned = calculate_total_salary_earned(labour_id, site_id, db)
    total_paid = sum_payments(labour_id, site_id, db,
                              types=[PaymentType.daily_salary, PaymentType.advance,
                                     PaymentType.bonus, PaymentType.final_settlement])
    # Deductions reduce what's owed
    deductions = sum_payments(labour_id, site_id, db, types=[PaymentType.deduction])
    balance = total_earned - total_paid + deductions

    if balance > 0:
        status = "owed_to_labour"
    elif balance < 0:
        status = "labour_owes"
    else:
        status = "settled"

    return {
        "total_earned": total_earned,
        "total_paid": total_paid,
        "balance_due": balance,
        "status": status
    }


def calculate_site_earnings(site_id: int, start_date: date, end_date: date, db: Session) -> Decimal:
    """Calculate total earnings from work done on a site in a date range."""
    work_logs = db.query(WorkLog).filter(
        WorkLog.site_id == site_id,
        WorkLog.log_date >= start_date,
        WorkLog.log_date <= end_date
    ).all()

    total = Decimal('0')
    for log in work_logs:
        work_item = db.query(SiteWorkItem).filter(SiteWorkItem.id == log.work_item_id).first()
        if work_item:
            total += Decimal(str(log.quantity_done)) * work_item.rate_per_unit

    return total


def calculate_site_labour_cost(site_id: int, start_date: date, end_date: date, db: Session) -> Decimal:
    """Calculate total labour cost for a site in a date range."""
    result = db.query(func.sum(LabourPayment.amount)).filter(
        LabourPayment.site_id == site_id,
        LabourPayment.payment_date >= start_date,
        LabourPayment.payment_date <= end_date,
        LabourPayment.payment_type.in_([PaymentType.daily_salary, PaymentType.bonus])
    ).scalar()
    return Decimal(str(result or 0))


def calculate_site_expenses(site_id: int, start_date: date, end_date: date, db: Session) -> Decimal:
    """Calculate total expenses for a site in a date range."""
    result = db.query(func.sum(Expense.amount)).filter(
        Expense.site_id == site_id,
        Expense.expense_date >= start_date,
        Expense.expense_date <= end_date
    ).scalar()
    return Decimal(str(result or 0))


def calculate_net_profit(site_id: int, start_date: date, end_date: date, db: Session) -> dict:
    """Calculate net profit for a site in a date range."""
    earned = calculate_site_earnings(site_id, start_date, end_date, db)
    labour_cost = calculate_site_labour_cost(site_id, start_date, end_date, db)
    expenses = calculate_site_expenses(site_id, start_date, end_date, db)
    gross_profit = earned - labour_cost - expenses

    return {
        "earned": earned,
        "labour_cost": labour_cost,
        "expenses": expenses,
        "gross_profit": gross_profit,
        "is_profitable": gross_profit > 0
    }


def get_week_dates(week_start: date) -> tuple:
    """Get start and end of week (Mon-Sun)."""
    # Ensure week_start is Monday
    days_since_monday = week_start.weekday()
    monday = week_start - timedelta(days=days_since_monday)
    sunday = monday + timedelta(days=6)
    return monday, sunday


def calculate_investor_profit(investor, site_id: int, db: Session) -> dict:
    """Calculate profit/loss for an investor on a site."""
    from models.investor import SiteInvestment, InvestorTransaction, InvestorTransactionType

    site_investment = db.query(SiteInvestment).filter(
        SiteInvestment.investor_id == investor.id,
        SiteInvestment.site_id == site_id
    ).first()

    if not site_investment:
        return {"invested": Decimal('0'), "profit": Decimal('0'), "total_due": Decimal('0')}

    invested = site_investment.allocated_amount

    # Get all site investments to calculate ratio
    total_site_funding = db.query(func.sum(SiteInvestment.allocated_amount)).filter(
        SiteInvestment.site_id == site_id
    ).scalar() or Decimal('1')

    investment_ratio = invested / Decimal(str(total_site_funding))

    # Calculate site profit (all time)
    from datetime import date as date_type
    site_profit_data = calculate_net_profit(
        site_id,
        date_type(2000, 1, 1),
        date_type(2099, 12, 31),
        db
    )
    site_gross_profit = site_profit_data["gross_profit"]

    if investor.investment_type == "profit_sharing":
        share_pct = investor.profit_share_percentage or Decimal('0')
        investor_profit = site_gross_profit * investment_ratio * (share_pct / Decimal('100'))
    elif investor.investment_type == "interest_based":
        # Calculate accrued interest
        monthly_rate = investor.interest_rate_monthly or Decimal('0')
        days_outstanding = (date_type.today() - site_investment.allocation_date).days
        monthly_interest = invested * (monthly_rate / Decimal('100'))
        investor_profit = monthly_interest * Decimal(str(days_outstanding / 30))
    else:  # hybrid
        share_pct = investor.profit_share_percentage or Decimal('0')
        monthly_rate = investor.interest_rate_monthly or Decimal('0')
        profit_share = site_gross_profit * investment_ratio * (share_pct / Decimal('100'))
        days_outstanding = (date_type.today() - site_investment.allocation_date).days
        monthly_interest = invested * (monthly_rate / Decimal('100'))
        interest = monthly_interest * Decimal(str(days_outstanding / 30))
        investor_profit = profit_share + interest

    # Total repaid
    total_repaid = db.query(func.sum(InvestorTransaction.amount)).filter(
        InvestorTransaction.investor_id == investor.id,
        InvestorTransaction.site_id == site_id,
        InvestorTransaction.transaction_type.in_([
            InvestorTransactionType.repayment,
            InvestorTransactionType.profit_share_paid,
            InvestorTransactionType.interest_paid
        ])
    ).scalar() or Decimal('0')

    total_due = invested + investor_profit - Decimal(str(total_repaid))

    return {
        "invested": invested,
        "profit": investor_profit,
        "total_repaid": Decimal(str(total_repaid)),
        "total_due": total_due
    }

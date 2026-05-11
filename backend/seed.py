"""
Seed script for PPT Builders
Run: python seed.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import date, timedelta
from decimal import Decimal
import random
from database import SessionLocal, engine, Base
from models import *
from models.user import User, UserRole
from models.labour import Labour, SiteLabour, SkillType, LabourStatus
from models.site import Site, SiteWorkItem, ProjectType, SiteStatus, WorkType
from models.work import WorkLog, SitePhoto, WeatherCondition, PhotoType
from models.attendance import Attendance, AttendanceStatus
from models.payment import LabourPayment, PaymentType, PaymentMode
from models.expense import Expense, ExpenseCategory, ExpensePaymentMode
from models.investor import Investor, InvestorTransaction, SiteInvestment, InvestmentType, InvestorTransactionType, InvestorPaymentMode
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

Base.metadata.create_all(bind=engine)
db = SessionLocal()


def clear_data():
    """Clear existing data."""
    print("Clearing existing data...")
    db.query(SiteInvestment).delete()
    db.query(InvestorTransaction).delete()
    db.query(Investor).delete()
    db.query(Expense).delete()
    db.query(SitePhoto).delete()
    db.query(WorkLog).delete()
    db.query(Attendance).delete()
    db.query(LabourPayment).delete()
    db.query(SiteLabour).delete()
    db.query(SiteWorkItem).delete()
    db.query(Site).delete()
    db.query(Labour).delete()
    db.query(User).delete()
    db.commit()
    print("Data cleared.")


def seed():
    clear_data()
    print("Seeding data...")

    # ── USERS ──────────────────────────────────────────────────────────────────
    owner = User(
        email="owner@pptbuilders.com",
        password_hash=pwd_context.hash("Test@1234"),
        full_name="Ramesh Kumar Sharma",
        phone="9876543210",
        role=UserRole.owner
    )
    incharge1 = User(
        email="incharge1@pptbuilders.com",
        password_hash=pwd_context.hash("Test@1234"),
        full_name="Suresh Yadav",
        phone="9876543211",
        role=UserRole.site_incharge
    )
    incharge2 = User(
        email="incharge2@pptbuilders.com",
        password_hash=pwd_context.hash("Test@1234"),
        full_name="Mahesh Singh",
        phone="9876543212",
        role=UserRole.site_incharge
    )
    investor_user = User(
        email="investor1@pptbuilders.com",
        password_hash=pwd_context.hash("Test@1234"),
        full_name="Anil Gupta",
        phone="9876543213",
        role=UserRole.investor
    )
    db.add_all([owner, incharge1, incharge2, investor_user])
    db.flush()

    # ── SITES ──────────────────────────────────────────────────────────────────
    site1 = Site(
        owner_id=owner.id,
        name="NH-30 PCC Road - Ranchi",
        location="Ranchi, Jharkhand",
        project_type=ProjectType.PCC_road,
        start_date=date.today() - timedelta(days=30),
        expected_end_date=date.today() + timedelta(days=60),
        main_contractor_name="Jharkhand Road Corp",
        main_contractor_phone="9800000001",
        main_contractor_company="JRC Pvt Ltd",
        site_incharge_id=incharge1.id,
        status=SiteStatus.active,
        total_contract_value=Decimal("2500000")
    )
    site2 = Site(
        owner_id=owner.id,
        name="Check Dam - Hazaribagh",
        location="Hazaribagh, Jharkhand",
        project_type=ProjectType.check_dam,
        start_date=date.today() - timedelta(days=20),
        expected_end_date=date.today() + timedelta(days=90),
        main_contractor_name="Water Resources Dept",
        main_contractor_phone="9800000002",
        main_contractor_company="WRD Jharkhand",
        site_incharge_id=incharge2.id,
        status=SiteStatus.active,
        total_contract_value=Decimal("1800000")
    )
    site3 = Site(
        owner_id=owner.id,
        name="Guardwall - Ramgarh",
        location="Ramgarh, Jharkhand",
        project_type=ProjectType.guardwall,
        start_date=date.today() - timedelta(days=45),
        expected_end_date=date.today() + timedelta(days=30),
        main_contractor_name="NHAI Contractor",
        main_contractor_phone="9800000003",
        main_contractor_company="NHAI",
        site_incharge_id=incharge1.id,
        status=SiteStatus.on_hold,
        total_contract_value=Decimal("900000")
    )
    db.add_all([site1, site2, site3])
    db.flush()

    # ── WORK ITEMS ─────────────────────────────────────────────────────────────
    wi1 = SiteWorkItem(site_id=site1.id, work_name="PCC Road Layer 1", work_type=WorkType.running_meter,
                       rate_per_unit=Decimal("180"), unit_label="Running Meter", total_estimated_quantity=Decimal("5000"))
    wi2 = SiteWorkItem(site_id=site1.id, work_name="PCC Road Layer 2", work_type=WorkType.running_meter,
                       rate_per_unit=Decimal("150"), unit_label="Running Meter", total_estimated_quantity=Decimal("5000"))
    wi3 = SiteWorkItem(site_id=site2.id, work_name="Dam Foundation", work_type=WorkType.m3,
                       rate_per_unit=Decimal("4500"), unit_label="Cubic Meter", total_estimated_quantity=Decimal("200"))
    wi4 = SiteWorkItem(site_id=site2.id, work_name="Dam Wall", work_type=WorkType.m3,
                       rate_per_unit=Decimal("5200"), unit_label="Cubic Meter", total_estimated_quantity=Decimal("150"))
    wi5 = SiteWorkItem(site_id=site3.id, work_name="Guardwall Foundation", work_type=WorkType.m3,
                       rate_per_unit=Decimal("3200"), unit_label="Cubic Meter", total_estimated_quantity=Decimal("100"))
    db.add_all([wi1, wi2, wi3, wi4, wi5])
    db.flush()

    # ── LABOURS ────────────────────────────────────────────────────────────────
    skill_data = [
        ("Raju Mahto", "9700000001", SkillType.mason_mistri, 650),
        ("Sanjay Kumar", "9700000002", SkillType.bar_bender, 600),
        ("Deepak Oraon", "9700000003", SkillType.unskilled_labour, 400),
        ("Vijay Munda", "9700000004", SkillType.unskilled_labour, 400),
        ("Arun Yadav", "9700000005", SkillType.skilled_labour, 500),
        ("Mohan Prasad", "9700000006", SkillType.carpenter, 580),
        ("Sunil Tiwari", "9700000007", SkillType.plumber, 560),
        ("Rakesh Giri", "9700000008", SkillType.electrician, 620),
        ("Dinesh Sahu", "9700000009", SkillType.unskilled_labour, 420),
        ("Pawan Singh", "9700000010", SkillType.supervisor, 700),
        ("Ramesh Bind", "9700000011", SkillType.unskilled_labour, 400),
        ("Santosh Kumar", "9700000012", SkillType.mason_mistri, 640),
        ("Birendra Mahto", "9700000013", SkillType.bar_bender, 590),
        ("Naresh Yadav", "9700000014", SkillType.unskilled_labour, 410),
        ("Umesh Oraon", "9700000015", SkillType.skilled_labour, 510),
        ("Ganesh Prasad", "9700000016", SkillType.equipment_operator, 680),
        ("Harish Tiwari", "9700000017", SkillType.unskilled_labour, 400),
        ("Manoj Kumar", "9700000018", SkillType.carpenter, 570),
        ("Suresh Bind", "9700000019", SkillType.unskilled_labour, 420),
        ("Rajesh Mahto", "9700000020", SkillType.mason_mistri, 660),
    ]

    labours = []
    for name, phone, skill, rate in skill_data:
        l = Labour(
            owner_id=owner.id,
            name=name,
            phone=phone,
            skill_type=skill,
            daily_rate=Decimal(str(rate)),
            date_joined=date.today() - timedelta(days=random.randint(30, 180)),
            address=f"Village {random.choice(['Rampur', 'Shivpur', 'Krishnapur'])}, Jharkhand",
            status=LabourStatus.active
        )
        labours.append(l)
        db.add(l)
    db.flush()

    # ── SITE LABOUR ASSIGNMENTS ────────────────────────────────────────────────
    # Site 1: first 10 labours
    for labour in labours[:10]:
        sl = SiteLabour(
            site_id=site1.id,
            labour_id=labour.id,
            assigned_date=date.today() - timedelta(days=25),
            daily_rate_at_assignment=labour.daily_rate
        )
        db.add(sl)

    # Site 2: next 7 labours
    for labour in labours[10:17]:
        sl = SiteLabour(
            site_id=site2.id,
            labour_id=labour.id,
            assigned_date=date.today() - timedelta(days=18),
            daily_rate_at_assignment=labour.daily_rate
        )
        db.add(sl)

    # Site 3: last 3 labours
    for labour in labours[17:]:
        sl = SiteLabour(
            site_id=site3.id,
            labour_id=labour.id,
            assigned_date=date.today() - timedelta(days=40),
            daily_rate_at_assignment=labour.daily_rate
        )
        db.add(sl)
    db.flush()

    # ── ATTENDANCE (2 weeks) ───────────────────────────────────────────────────
    today = date.today()
    for day_offset in range(14):
        att_date = today - timedelta(days=day_offset)
        if att_date.weekday() == 6:  # Skip Sundays
            continue

        # Site 1 attendance
        for labour in labours[:10]:
            status = random.choices(
                [AttendanceStatus.present, AttendanceStatus.absent, AttendanceStatus.half_day],
                weights=[75, 15, 10]
            )[0]
            att = Attendance(
                labour_id=labour.id,
                site_id=site1.id,
                date=att_date,
                status=status,
                marked_by=incharge1.id
            )
            db.add(att)

        # Site 2 attendance
        for labour in labours[10:17]:
            status = random.choices(
                [AttendanceStatus.present, AttendanceStatus.absent, AttendanceStatus.half_day],
                weights=[80, 12, 8]
            )[0]
            att = Attendance(
                labour_id=labour.id,
                site_id=site2.id,
                date=att_date,
                status=status,
                marked_by=incharge2.id
            )
            db.add(att)

    db.flush()

    # ── WORK LOGS (2 weeks) ────────────────────────────────────────────────────
    for day_offset in range(14):
        log_date = today - timedelta(days=day_offset)
        if log_date.weekday() == 6:
            continue

        # Site 1 work logs
        qty1 = Decimal(str(random.uniform(80, 150)))
        wl1 = WorkLog(
            site_id=site1.id,
            work_item_id=wi1.id,
            logged_by=incharge1.id,
            log_date=log_date,
            quantity_done=qty1,
            quantity_unit="Running Meter",
            weather=random.choice([WeatherCondition.sunny, WeatherCondition.cloudy]),
            remarks="Work progressing well"
        )
        db.add(wl1)

        # Site 2 work logs (m3)
        l = Decimal(str(random.uniform(3, 6)))
        w = Decimal(str(random.uniform(2, 4)))
        h = Decimal(str(random.uniform(0.5, 1.5)))
        qty2 = l * w * h
        wl2 = WorkLog(
            site_id=site2.id,
            work_item_id=wi3.id,
            logged_by=incharge2.id,
            log_date=log_date,
            quantity_done=qty2,
            length_m=l,
            width_m=w,
            height_m=h,
            quantity_unit="Cubic Meter",
            weather=random.choice([WeatherCondition.sunny, WeatherCondition.cloudy, WeatherCondition.rainy])
        )
        db.add(wl2)

    db.flush()

    # ── EXPENSES ───────────────────────────────────────────────────────────────
    expense_data = [
        (site1.id, ExpenseCategory.fuel_transport, 3500, "Diesel for JCB"),
        (site1.id, ExpenseCategory.material, 12000, "Cement bags"),
        (site1.id, ExpenseCategory.food_lodging, 2500, "Labour food"),
        (site2.id, ExpenseCategory.fuel_transport, 4200, "Diesel for excavator"),
        (site2.id, ExpenseCategory.material, 8500, "Steel rods"),
        (site2.id, ExpenseCategory.safety_equipment, 3000, "Safety helmets and gloves"),
        (site3.id, ExpenseCategory.equipment_repair, 5000, "Mixer machine repair"),
    ]
    for site_id, category, amount, desc in expense_data:
        exp = Expense(
            site_id=site_id,
            expense_date=today - timedelta(days=random.randint(0, 10)),
            category=category,
            amount=Decimal(str(amount)),
            description=desc,
            payment_mode=ExpensePaymentMode.cash,
            added_by=owner.id
        )
        db.add(exp)

    # ── LABOUR PAYMENTS ────────────────────────────────────────────────────────
    # Pay some labours for last week
    for labour in labours[:8]:
        payment = LabourPayment(
            labour_id=labour.id,
            site_id=site1.id,
            payment_date=today - timedelta(days=7),
            amount=labour.daily_rate * 5,  # 5 days
            payment_type=PaymentType.daily_salary,
            payment_mode=PaymentMode.cash,
            paid_by=owner.id,
            remarks="Weekly salary"
        )
        db.add(payment)

    # Some advances
    for labour in labours[:3]:
        advance = LabourPayment(
            labour_id=labour.id,
            site_id=site1.id,
            payment_date=today - timedelta(days=3),
            amount=Decimal("1000"),
            payment_type=PaymentType.advance,
            payment_mode=PaymentMode.cash,
            paid_by=owner.id,
            remarks="Advance payment"
        )
        db.add(advance)

    # ── INVESTOR ───────────────────────────────────────────────────────────────
    investor = Investor(
        user_id=investor_user.id,
        full_name="Anil Gupta",
        phone="9876543213",
        address="Ranchi, Jharkhand",
        pan_number="ABCPG1234D",
        bank_name="SBI",
        bank_account="12345678901",
        ifsc_code="SBIN0001234",
        investment_type=InvestmentType.profit_sharing,
        profit_share_percentage=Decimal("30")
    )
    db.add(investor)
    db.flush()

    # Investor transaction
    inv_txn = InvestorTransaction(
        investor_id=investor.id,
        transaction_date=today - timedelta(days=25),
        transaction_type=InvestorTransactionType.investment,
        amount=Decimal("500000"),
        site_id=site1.id,
        payment_mode=InvestorPaymentMode.bank_transfer,
        reference_number="TXN20250401001",
        notes="Initial investment for NH-30 project",
        recorded_by=owner.id
    )
    db.add(inv_txn)

    site_inv = SiteInvestment(
        site_id=site1.id,
        investor_id=investor.id,
        allocated_amount=Decimal("500000"),
        allocation_date=today - timedelta(days=25),
        notes="Primary investor for NH-30 PCC Road project"
    )
    db.add(site_inv)

    # ── SITE PHOTOS ────────────────────────────────────────────────────────────
    photo_types = [PhotoType.morning, PhotoType.work_in_progress, PhotoType.evening]
    for site_obj in [site1, site2]:
        for i in range(10):
            photo = SitePhoto(
                site_id=site_obj.id,
                uploaded_by=incharge1.id if site_obj == site1 else incharge2.id,
                photo_url=f"/uploads/site_photos/sample_{site_obj.id}_{i}.jpg",
                caption=f"Site progress - Day {i+1}",
                photo_type=photo_types[i % 3],
                photo_time=None
            )
            db.add(photo)

    db.commit()
    print("✅ Seed data created successfully!")
    print("\n📋 Login Credentials:")
    print("  Owner:      owner@pptbuilders.com / Test@1234")
    print("  Incharge 1: incharge1@pptbuilders.com / Test@1234")
    print("  Incharge 2: incharge2@pptbuilders.com / Test@1234")
    print("  Investor:   investor1@pptbuilders.com / Test@1234")
    print("\n🏗️  Sites created:")
    print("  1. NH-30 PCC Road - Ranchi (Active)")
    print("  2. Check Dam - Hazaribagh (Active)")
    print("  3. Guardwall - Ramgarh (On Hold)")
    print(f"\n👷 {len(labours)} labours created with 2 weeks of attendance data")


if __name__ == "__main__":
    seed()
    db.close()

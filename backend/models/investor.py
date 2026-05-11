from sqlalchemy import Column, Integer, String, DateTime, Date, Enum, Numeric, Text, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from database import Base


class InvestmentType(str, enum.Enum):
    profit_sharing = "profit_sharing"
    interest_based = "interest_based"
    hybrid = "hybrid"


class InvestorTransactionType(str, enum.Enum):
    investment = "investment"
    repayment = "repayment"
    profit_share_paid = "profit_share_paid"
    interest_paid = "interest_paid"
    additional_investment = "additional_investment"


class InvestorPaymentMode(str, enum.Enum):
    cash = "cash"
    upi = "upi"
    bank_transfer = "bank_transfer"
    cheque = "cheque"


class Investor(Base):
    __tablename__ = "investors"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    full_name = Column(String, nullable=False)
    phone = Column(String)
    address = Column(Text)
    pan_number = Column(String)
    bank_name = Column(String)
    bank_account = Column(String)
    ifsc_code = Column(String)
    investment_type = Column(Enum(InvestmentType), nullable=False)
    profit_share_percentage = Column(Numeric(5, 2))
    interest_rate_monthly = Column(Numeric(5, 2))
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    user = relationship("User", back_populates="investor_profile")
    transactions = relationship("InvestorTransaction", back_populates="investor")
    site_investments = relationship("SiteInvestment", back_populates="investor")


class InvestorTransaction(Base):
    __tablename__ = "investor_transactions"

    id = Column(Integer, primary_key=True, index=True)
    investor_id = Column(Integer, ForeignKey("investors.id"), nullable=False)
    transaction_date = Column(Date, nullable=False)
    transaction_type = Column(Enum(InvestorTransactionType), nullable=False)
    amount = Column(Numeric(12, 2), nullable=False)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=True)
    reference_number = Column(String)
    payment_mode = Column(Enum(InvestorPaymentMode))
    cheque_number = Column(String)
    notes = Column(Text)
    recorded_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    investor = relationship("Investor", back_populates="transactions")
    site = relationship("Site")
    recorder = relationship("User", foreign_keys=[recorded_by])


class SiteInvestment(Base):
    __tablename__ = "site_investments"

    id = Column(Integer, primary_key=True, index=True)
    site_id = Column(Integer, ForeignKey("sites.id"), nullable=False)
    investor_id = Column(Integer, ForeignKey("investors.id"), nullable=False)
    allocated_amount = Column(Numeric(12, 2), nullable=False)
    allocation_date = Column(Date, nullable=False)
    notes = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    site = relationship("Site", back_populates="investments")
    investor = relationship("Investor", back_populates="site_investments")

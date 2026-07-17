from flask_sqlalchemy import SQLAlchemy
from datetime import date

db = SQLAlchemy()


def _add_months(d: date, months: int) -> date:
    import calendar
    month = d.month - 1 + months
    year = d.year + month // 12
    month = month % 12 + 1
    day = min(d.day, calendar.monthrange(year, month)[1])
    return date(year, month, day)


def payments_per_month(frequency: str) -> int:
    """How many cutoffs fall in a month for a given frequency."""
    return {"weekly": 4, "biweekly": 2, "monthly": 1}.get(frequency, 1)


def next_due_date(start: date, frequency: str, index: int) -> date:
    """index is 0-based installment number."""
    if frequency == "weekly":
        from datetime import timedelta
        return start + timedelta(days=7 * index)
    if frequency == "biweekly":
        from datetime import timedelta
        return start + timedelta(days=14 * index)
    # monthly (default)
    return _add_months(start, index)


class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    emoji = db.Column(db.String(10), default="🐷")
    password_hash = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    def to_dict(self):
        return {"id": self.id, "name": self.name, "emoji": self.emoji}


class Bank(db.Model):
    __tablename__ = "banks"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class MustHave(db.Model):
    __tablename__ = "must_haves"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    amount = db.Column(db.Numeric(12, 2), default=0, nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name, "amount": float(self.amount or 0)}


class ItemStatusOption(db.Model):
    __tablename__ = "item_statuses"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(50), nullable=False)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class ExpenseList(db.Model):
    __tablename__ = "expense_lists"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    list_type = db.Column(db.Enum("cutoff", "other", name="list_type_enum"), default="cutoff", nullable=False)
    cutoff_month = db.Column(db.String(20), nullable=True)
    cutoff_day = db.Column(db.Enum("15", "30", name="cutoff_day_enum"), nullable=True)
    budget = db.Column(db.Numeric(12, 2), default=0)
    status = db.Column(db.Enum("Open", "Pending", "Closed", name="list_status_enum"), default="Pending", nullable=False)
    icon = db.Column(db.String(80), nullable=True)
    created_at = db.Column(db.DateTime, server_default=db.func.now())
    updated_at = db.Column(db.DateTime, server_default=db.func.now(), onupdate=db.func.now())

    items = db.relationship("ExpenseItem", backref="list", cascade="all, delete-orphan", lazy=True)

    def to_dict(self, include_items=True):
        spent = sum(float(i.amount) for i in self.items)
        data = {
            "id": self.id,
            "name": self.name,
            "type": self.list_type,
            "month": self.cutoff_month,
            "day": self.cutoff_day,
            "budget": float(self.budget),
            "status": self.status,
            "icon": self.icon,
            "spent": spent,
            "remaining": float(self.budget) - spent,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }
        if include_items:
            data["items"] = [i.to_dict() for i in self.items]
        else:
            data["item_count"] = len(self.items)
        return data


class ExpenseItem(db.Model):
    __tablename__ = "expense_items"
    id = db.Column(db.Integer, primary_key=True)
    list_id = db.Column(db.Integer, db.ForeignKey("expense_lists.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Numeric(12, 2), default=0)
    bank = db.Column(db.String(100), nullable=True)
    status = db.Column(db.String(50), default="Pending", nullable=False)
    due_date = db.Column(db.Date, nullable=True)
    remarks = db.Column(db.String(255), nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "list_id": self.list_id,
            "name": self.name,
            "amount": float(self.amount),
            "bank": self.bank,
            "status": self.status,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "remarks": self.remarks,
        }


class SavingsEntry(db.Model):
    __tablename__ = "savings_entries"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    deposit_date = db.Column(db.Date, nullable=False, default=date.today)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    bank = db.Column(db.String(100), nullable=True)
    status = db.Column(db.Enum("Deposited", "Pending", name="savings_status_enum"), default="Deposited", nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "date": self.deposit_date.isoformat(),
            "amount": float(self.amount),
            "bank": self.bank,
            "status": self.status,
        }


class InstallmentPlan(db.Model):
    __tablename__ = "installment_plans"
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name = db.Column(db.String(150), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)  # per cutoff / payment
    months = db.Column(db.Integer, nullable=True)  # duration in months
    total_count = db.Column(db.Integer, nullable=False)  # total payment rows (months × per month)
    frequency = db.Column(db.String(20), nullable=False, default="biweekly")  # weekly|biweekly|monthly
    start_date = db.Column(db.Date, nullable=False)
    bank = db.Column(db.String(100), nullable=True)
    notes = db.Column(db.String(255), nullable=True)
    status = db.Column(db.String(20), nullable=False, default="Active")  # Active|Completed
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    payments = db.relationship(
        "InstallmentPayment",
        backref="plan",
        cascade="all, delete-orphan",
        lazy=True,
        order_by="InstallmentPayment.installment_number",
    )

    def to_dict(self, include_payments=True):
        paid = [p for p in self.payments if p.status == "Paid"]
        pending = [p for p in self.payments if p.status == "Pending"]
        paid_count = len(paid)
        payment_count = len(self.payments) or self.total_count or 0
        per_month = payments_per_month(self.frequency)
        months = self.months
        if not months and payment_count and per_month:
            # Legacy plans: infer months when possible
            months = payment_count // per_month if payment_count % per_month == 0 else payment_count
        pct = round((paid_count / payment_count) * 100) if payment_count else 0
        next_pending = pending[0] if pending else None
        amt = float(self.amount)
        data = {
            "id": self.id,
            "name": self.name,
            "amount": amt,
            "months": months,
            "payments_per_month": per_month,
            "monthly_amount": amt * per_month,
            "total_count": payment_count,
            "frequency": self.frequency,
            "start_date": self.start_date.isoformat() if self.start_date else None,
            "bank": self.bank,
            "notes": self.notes,
            "status": self.status,
            "paid_count": paid_count,
            "pending_count": len(pending),
            "progress_pct": pct,
            "total_amount": amt * payment_count,
            "paid_amount": amt * paid_count,
            "remaining_amount": amt * len(pending),
            "next_due_date": next_pending.due_date.isoformat() if next_pending and next_pending.due_date else None,
            "next_amount": float(next_pending.amount) if next_pending else None,
        }
        if include_payments:
            data["payments"] = [p.to_dict() for p in self.payments]
        return data


class InstallmentPayment(db.Model):
    __tablename__ = "installment_payments"
    id = db.Column(db.Integer, primary_key=True)
    plan_id = db.Column(db.Integer, db.ForeignKey("installment_plans.id", ondelete="CASCADE"), nullable=False)
    installment_number = db.Column(db.Integer, nullable=False)
    due_date = db.Column(db.Date, nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    status = db.Column(db.String(20), nullable=False, default="Pending")  # Pending|Paid
    paid_date = db.Column(db.Date, nullable=True)
    is_advance = db.Column(db.Boolean, default=False, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "plan_id": self.plan_id,
            "installment_number": self.installment_number,
            "due_date": self.due_date.isoformat() if self.due_date else None,
            "amount": float(self.amount),
            "status": self.status,
            "paid_date": self.paid_date.isoformat() if self.paid_date else None,
            "is_advance": bool(self.is_advance),
        }

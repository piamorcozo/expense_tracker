from flask_sqlalchemy import SQLAlchemy
from datetime import date

db = SQLAlchemy()


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

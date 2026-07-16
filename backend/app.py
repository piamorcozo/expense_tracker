from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, date
from collections import Counter
from sqlalchemy import text, inspect
from werkzeug.security import generate_password_hash, check_password_hash

from config import Config
from models import db, User, Bank, MustHave, ExpenseList, ExpenseItem, SavingsEntry, ItemStatusOption


DEFAULT_PASSWORD = "cutoff"
DEFAULT_ITEM_STATUSES = ["Pending", "Paid"]


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    db.init_app(app)
    CORS(app)

    with app.app_context():
        db.create_all()
        _ensure_schema()
        _seed_default_user_if_empty()
        _backfill_user_defaults()

    register_routes(app)
    return app


def _ensure_schema():
    """Apply lightweight migrations for existing databases."""
    engine = db.engine
    insp = inspect(engine)

    def has_column(table, column):
        if table not in insp.get_table_names():
            return False
        return any(c["name"] == column for c in insp.get_columns(table))

    with engine.begin() as conn:
        if "users" in insp.get_table_names() and not has_column("users", "password_hash"):
            conn.execute(text("ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL"))

        if "must_haves" in insp.get_table_names() and not has_column("must_haves", "amount"):
            conn.execute(text(
                "ALTER TABLE must_haves ADD COLUMN amount DECIMAL(12,2) NOT NULL DEFAULT 0"
            ))

        if "item_statuses" not in insp.get_table_names():
            conn.execute(text("""
                CREATE TABLE item_statuses (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    user_id INT NOT NULL,
                    name VARCHAR(50) NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                    UNIQUE KEY uq_item_status_per_user (user_id, name)
                ) ENGINE=InnoDB
            """))

        if "expense_items" in insp.get_table_names():
            # Soften ENUM to VARCHAR so Maintenance status options can be customized
            try:
                conn.execute(text(
                    "ALTER TABLE expense_items MODIFY status VARCHAR(50) NOT NULL DEFAULT 'Pending'"
                ))
            except Exception:
                pass

        if "expense_lists" in insp.get_table_names() and not has_column("expense_lists", "icon"):
            conn.execute(text("ALTER TABLE expense_lists ADD COLUMN icon VARCHAR(80) NULL"))


def _seed_default_user_if_empty():
    if User.query.count() == 0:
        u = User(
            name="Pia",
            emoji="🐷",
            password_hash=generate_password_hash(DEFAULT_PASSWORD),
        )
        db.session.add(u)
        db.session.commit()
        for b in ["BPI", "BDO", "GCash", "Maya"]:
            db.session.add(Bank(user_id=u.id, name=b))
        for m in ["Rent", "Electricity", "Water", "Internet"]:
            db.session.add(MustHave(user_id=u.id, name=m, amount=0))
        for s in DEFAULT_ITEM_STATUSES:
            db.session.add(ItemStatusOption(user_id=u.id, name=s))
        db.session.commit()


def _backfill_user_defaults():
    """Ensure existing users have passwords and default status options."""
    for u in User.query.all():
        changed = False
        if not u.password_hash:
            u.password_hash = generate_password_hash(DEFAULT_PASSWORD)
            changed = True
        existing = {s.name for s in ItemStatusOption.query.filter_by(user_id=u.id).all()}
        for name in DEFAULT_ITEM_STATUSES:
            if name not in existing:
                db.session.add(ItemStatusOption(user_id=u.id, name=name))
                changed = True
        if changed:
            db.session.commit()


def get_user_id():
    uid = request.headers.get("X-User-Id") or request.args.get("user_id")
    if not uid:
        return None
    return int(uid)


def register_routes(app):

    # ---------------- Auth ----------------
    @app.post("/api/login")
    def login():
        data = request.get_json(force=True)
        name = (data.get("username") or data.get("name") or "").strip()
        password = data.get("password") or ""
        if not name or not password:
            return jsonify({"error": "Username and password are required"}), 400
        user = User.query.filter(db.func.lower(User.name) == name.lower()).first()
        if not user or not user.password_hash or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Invalid username or password"}), 401
        return jsonify(user.to_dict())

    @app.post("/api/verify-password")
    def verify_password():
        data = request.get_json(force=True)
        user_id = data.get("user_id")
        password = data.get("password") or ""
        user = User.query.get_or_404(user_id)
        if not user.password_hash or not check_password_hash(user.password_hash, password):
            return jsonify({"error": "Incorrect password"}), 401
        return jsonify(user.to_dict())

    # ---------------- Users ----------------
    @app.get("/api/users")
    def list_users():
        return jsonify([u.to_dict() for u in User.query.order_by(User.id).all()])

    @app.post("/api/users")
    def create_user():
        data = request.get_json(force=True)
        name = (data.get("name") or "").strip()
        password = data.get("password") or ""
        if not name or not password:
            return jsonify({"error": "Name and password are required"}), 400
        if User.query.filter(db.func.lower(User.name) == name.lower()).first():
            return jsonify({"error": "Username already exists"}), 409
        u = User(
            name=name,
            emoji=data.get("emoji", "🐷"),
            password_hash=generate_password_hash(password),
        )
        db.session.add(u)
        db.session.flush()
        for s in DEFAULT_ITEM_STATUSES:
            db.session.add(ItemStatusOption(user_id=u.id, name=s))
        db.session.commit()
        return jsonify(u.to_dict()), 201

    @app.delete("/api/users/<int:user_id>")
    def delete_user(user_id):
        u = User.query.get_or_404(user_id)
        db.session.delete(u)
        db.session.commit()
        return "", 204

    # ---------------- Banks ----------------
    @app.get("/api/banks")
    def list_banks():
        uid = get_user_id()
        q = Bank.query.filter_by(user_id=uid) if uid else Bank.query
        return jsonify([b.to_dict() for b in q.order_by(Bank.id).all()])

    @app.post("/api/banks")
    def create_bank():
        data = request.get_json(force=True)
        b = Bank(user_id=data["user_id"], name=data["name"])
        db.session.add(b)
        db.session.commit()
        return jsonify(b.to_dict()), 201

    @app.delete("/api/banks/<int:bank_id>")
    def delete_bank(bank_id):
        b = Bank.query.get_or_404(bank_id)
        db.session.delete(b)
        db.session.commit()
        return "", 204

    # ---------------- Must-haves ----------------
    @app.get("/api/musthaves")
    def list_musthaves():
        uid = get_user_id()
        q = MustHave.query.filter_by(user_id=uid) if uid else MustHave.query
        return jsonify([m.to_dict() for m in q.order_by(MustHave.id).all()])

    @app.post("/api/musthaves")
    def create_musthave():
        data = request.get_json(force=True)
        m = MustHave(
            user_id=data["user_id"],
            name=data["name"],
            amount=data.get("amount", 0) or 0,
        )
        db.session.add(m)
        db.session.commit()
        return jsonify(m.to_dict()), 201

    @app.delete("/api/musthaves/<int:musthave_id>")
    def delete_musthave(musthave_id):
        m = MustHave.query.get_or_404(musthave_id)
        db.session.delete(m)
        db.session.commit()
        return "", 204

    # ---------------- Item status options ----------------
    @app.get("/api/item-statuses")
    def list_item_statuses():
        uid = get_user_id()
        q = ItemStatusOption.query.filter_by(user_id=uid) if uid else ItemStatusOption.query
        return jsonify([s.to_dict() for s in q.order_by(ItemStatusOption.id).all()])

    @app.post("/api/item-statuses")
    def create_item_status():
        data = request.get_json(force=True)
        name = (data.get("name") or "").strip()
        if not name:
            return jsonify({"error": "Name is required"}), 400
        existing = ItemStatusOption.query.filter_by(user_id=data["user_id"], name=name).first()
        if existing:
            return jsonify({"error": "Status already exists"}), 409
        s = ItemStatusOption(user_id=data["user_id"], name=name)
        db.session.add(s)
        db.session.commit()
        return jsonify(s.to_dict()), 201

    @app.delete("/api/item-statuses/<int:status_id>")
    def delete_item_status(status_id):
        s = ItemStatusOption.query.get_or_404(status_id)
        db.session.delete(s)
        db.session.commit()
        return "", 204

    # ---------------- Expense Lists ----------------
    @app.get("/api/lists")
    def list_lists():
        uid = get_user_id()
        q = ExpenseList.query.filter_by(user_id=uid) if uid else ExpenseList.query
        status = request.args.get("status")
        list_type = request.args.get("type")
        if status:
            q = q.filter_by(status=status)
        if list_type:
            q = q.filter_by(list_type=list_type)
        include_items = request.args.get("include_items", "false").lower() == "true"
        lists = q.order_by(ExpenseList.created_at.desc()).all()
        return jsonify([l.to_dict(include_items=include_items) for l in lists])

    @app.get("/api/lists/<int:list_id>")
    def get_list(list_id):
        l = ExpenseList.query.get_or_404(list_id)
        return jsonify(l.to_dict(include_items=True))

    @app.post("/api/lists")
    def create_list():
        data = request.get_json(force=True)
        user_id = data["user_id"]
        list_type = data.get("type", "cutoff")

        default_icon = "ph:calendar-blank" if list_type == "cutoff" else "ph:shopping-bag"
        l = ExpenseList(
            user_id=user_id,
            name=data["name"],
            list_type=list_type,
            cutoff_month=data.get("month") if list_type == "cutoff" else None,
            cutoff_day=data.get("day") if list_type == "cutoff" else None,
            budget=data.get("budget", 0),
            status="Pending",
            icon=data.get("icon") or default_icon,
        )
        db.session.add(l)
        db.session.flush()

        if list_type == "cutoff":
            musthaves = MustHave.query.filter_by(user_id=user_id).all()
            default_bank = Bank.query.filter_by(user_id=user_id).first()
            default_status = ItemStatusOption.query.filter_by(user_id=user_id, name="Pending").first()
            pending_name = default_status.name if default_status else "Pending"
            for mh in musthaves:
                db.session.add(ExpenseItem(
                    list_id=l.id,
                    name=mh.name,
                    amount=float(mh.amount or 0),
                    bank=default_bank.name if default_bank else None,
                    status=pending_name,
                ))

        db.session.commit()
        return jsonify(l.to_dict()), 201

    @app.put("/api/lists/<int:list_id>")
    def update_list(list_id):
        l = ExpenseList.query.get_or_404(list_id)
        data = request.get_json(force=True)
        for field in ["name", "budget", "status", "icon"]:
            if field in data:
                setattr(l, field, data[field])
        db.session.commit()
        return jsonify(l.to_dict())

    @app.patch("/api/lists/<int:list_id>/status")
    def update_list_status(list_id):
        l = ExpenseList.query.get_or_404(list_id)
        data = request.get_json(force=True)
        l.status = data["status"]
        db.session.commit()
        return jsonify(l.to_dict())

    @app.delete("/api/lists/<int:list_id>")
    def delete_list(list_id):
        l = ExpenseList.query.get_or_404(list_id)
        db.session.delete(l)
        db.session.commit()
        return "", 204

    # ---------------- Expense Items ----------------
    @app.post("/api/lists/<int:list_id>/items")
    def create_item(list_id):
        ExpenseList.query.get_or_404(list_id)
        data = request.get_json(force=True)
        due = _parse_date(data.get("due_date"))
        item = ExpenseItem(
            list_id=list_id,
            name=data["name"],
            amount=data.get("amount", 0),
            bank=data.get("bank"),
            status=data.get("status", "Pending"),
            due_date=due,
            remarks=data.get("remarks"),
        )
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201

    @app.put("/api/items/<int:item_id>")
    def update_item(item_id):
        item = ExpenseItem.query.get_or_404(item_id)
        data = request.get_json(force=True)
        for field in ["name", "amount", "bank", "status", "remarks"]:
            if field in data:
                setattr(item, field, data[field])
        if "due_date" in data:
            item.due_date = _parse_date(data["due_date"])
        db.session.commit()
        return jsonify(item.to_dict())

    @app.patch("/api/lists/<int:list_id>/items/mark-paid")
    def mark_all_items_paid(list_id):
        l = ExpenseList.query.get_or_404(list_id)
        paid = ItemStatusOption.query.filter_by(user_id=l.user_id, name="Paid").first()
        paid_name = paid.name if paid else "Paid"
        for item in l.items:
            item.status = paid_name
        db.session.commit()
        return jsonify(l.to_dict())

    @app.delete("/api/items/<int:item_id>")
    def delete_item(item_id):
        item = ExpenseItem.query.get_or_404(item_id)
        db.session.delete(item)
        db.session.commit()
        return "", 204

    # ---------------- Savings ----------------
    @app.get("/api/savings")
    def list_savings():
        uid = get_user_id()
        q = SavingsEntry.query.filter_by(user_id=uid) if uid else SavingsEntry.query
        entries = q.order_by(SavingsEntry.deposit_date.desc()).all()
        return jsonify([e.to_dict() for e in entries])

    @app.post("/api/savings")
    def create_savings():
        data = request.get_json(force=True)
        e = SavingsEntry(
            user_id=data["user_id"],
            deposit_date=_parse_date(data.get("date")) or date.today(),
            amount=data["amount"],
            bank=data.get("bank"),
            status=data.get("status", "Deposited"),
        )
        db.session.add(e)
        db.session.commit()
        return jsonify(e.to_dict()), 201

    @app.delete("/api/savings/<int:entry_id>")
    def delete_savings(entry_id):
        e = SavingsEntry.query.get_or_404(entry_id)
        db.session.delete(e)
        db.session.commit()
        return "", 204

    @app.get("/api/savings/summary")
    def savings_summary():
        uid = get_user_id()
        entries = SavingsEntry.query.filter_by(user_id=uid).all() if uid else SavingsEntry.query.all()
        deposited = [e for e in entries if e.status == "Deposited"]
        total = sum(float(e.amount) for e in deposited)

        if deposited:
            amounts = [float(e.amount) for e in deposited]
            most_common_amount, _ = Counter(amounts).most_common(1)[0]
        else:
            most_common_amount = 0

        today = date.today()
        remaining_cutoffs = 0
        for month in range(1, 13):
            for day in (15, 30):
                try:
                    d = date(today.year, month, day)
                except ValueError:
                    continue
                if d > today:
                    remaining_cutoffs += 1

        projected = total + (most_common_amount * remaining_cutoffs)

        return jsonify({
            "total": total,
            "most_frequent_amount": most_common_amount,
            "remaining_cutoffs": remaining_cutoffs,
            "projected_year_end": projected,
        })


def _parse_date(val):
    if not val:
        return None
    if isinstance(val, date):
        return val
    return datetime.strptime(val, "%Y-%m-%d").date()


app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5001)

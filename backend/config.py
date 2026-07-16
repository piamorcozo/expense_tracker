import os
from dotenv import load_dotenv

load_dotenv()


def _database_uri() -> str:
    """Resolve DB URL for local + Railway.

    Railway MySQL usually exposes MYSQL_URL (mysql://...).
    SQLAlchemy + PyMySQL needs mysql+pymysql://...
    """
    raw = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("MYSQL_URL")
        or os.environ.get("MYSQL_PRIVATE_URL")
    )

    if not raw:
        # Build from discrete Railway MySQL vars if present
        host = os.environ.get("MYSQLHOST")
        user = os.environ.get("MYSQLUSER")
        password = os.environ.get("MYSQLPASSWORD")
        db = os.environ.get("MYSQLDATABASE")
        port = os.environ.get("MYSQLPORT", "3306")
        if host and user and db:
            password = password or ""
            raw = f"mysql://{user}:{password}@{host}:{port}/{db}"

    if not raw:
        return "mysql+pymysql://root:password@localhost:3306/cutoff_tracker"

    # Railway / standard MySQL URLs → SQLAlchemy PyMySQL driver
    if raw.startswith("mysql://"):
        raw = "mysql+pymysql://" + raw[len("mysql://") :]
    elif raw.startswith("mysql+pymysql://"):
        pass
    return raw


class Config:
    SQLALCHEMY_DATABASE_URI = _database_uri()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

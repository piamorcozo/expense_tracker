import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Example DATABASE_URL formats:
    #   mysql+pymysql://user:password@host:3306/cutoff_tracker
    # Railway/PlanetScale/etc. will give you a connection string — just adapt the driver prefix.
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        "DATABASE_URL",
        "mysql+pymysql://root:password@localhost:3306/cutoff_tracker"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JSON_SORT_KEYS = False

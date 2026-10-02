"""
database.py
------------
Sets up the SQLite database connection and the SQLAlchemy session that
every route uses (via the get_db dependency) to talk to the database.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# SQLite database file will be created in the project's root folder.
SQLALCHEMY_DATABASE_URL = "sqlite:///./pocketsmart.db"

# check_same_thread=False is required for SQLite when it's used with
# FastAPI, because FastAPI can talk to the database from more than
# one thread.
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency that yields a database session and always
    closes it afterwards, even if an error happens mid-request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

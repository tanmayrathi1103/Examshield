from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Initialize Database Engine
engine = create_engine(settings.DATABASE_URL)

# Initialize SessionLocal for generating database sessions
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for SQLAlchemy models
Base = declarative_base()

def get_db():
    """Dependency for generating a new database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

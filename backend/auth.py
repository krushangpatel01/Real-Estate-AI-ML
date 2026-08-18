# EstateAI Python module - implementation will be added step by step.
import os

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from passlib.context import CryptContext


load_dotenv()


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-secret-key",
)


pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:

    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


def create_expiry(minutes: int = 60) -> datetime:

    return datetime.now(timezone.utc) + timedelta(
        minutes=minutes
    )
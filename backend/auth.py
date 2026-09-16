# EstateAI authentication module

import os

from datetime import datetime, timedelta, timezone

from dotenv import load_dotenv

from passlib.context import CryptContext

from jose import jwt


load_dotenv()


# =========================================================
# CONFIGURATION
# =========================================================

SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "development-secret-key",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv(
        "ACCESS_TOKEN_EXPIRE_MINUTES",
        "60",
    )
)


# =========================================================
# PASSWORD HASHING
# =========================================================

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


# =========================================================
# TOKEN EXPIRY
# =========================================================

def create_expiry(
    minutes: int = ACCESS_TOKEN_EXPIRE_MINUTES,
) -> datetime:

    return (
        datetime.now(timezone.utc)
        + timedelta(minutes=minutes)
    )


# =========================================================
# CREATE JWT ACCESS TOKEN
# =========================================================

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:

    to_encode = data.copy()

    if expires_delta:

        expire = (
            datetime.now(timezone.utc)
            + expires_delta
        )

    else:

        expire = create_expiry()

    to_encode.update(
        {
            "exp": expire,
        }
    )

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt
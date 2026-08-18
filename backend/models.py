# EstateAI Python module - implementation will be added step by step.
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    String,
    BigInteger,
    func,
)

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(BigInteger, primary_key=True, index=True, autoincrement=True)

    full_name = Column(String(100), nullable=False)

    username = Column(String(50), unique=True, nullable=False, index=True)

    email = Column(String(150), unique=True, nullable=False, index=True)

    mobile = Column(String(20), unique=True, nullable=True)

    password_hash = Column(String(255), nullable=False)

    role = Column(
        Enum("buyer", "seller", "admin"),
        nullable=False,
        default="buyer",
    )

    status = Column(
        Enum("active", "inactive", "suspended", "pending"),
        nullable=False,
        default="active",
    )

    profile_image = Column(String(500), nullable=True)

    email_verified = Column(Boolean, nullable=False, default=False)

    mobile_verified = Column(Boolean, nullable=False, default=False)

    created_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
    )

    updated_at = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp(),
        onupdate=func.current_timestamp(),
    )
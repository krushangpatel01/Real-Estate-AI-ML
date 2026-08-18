# EstateAI Python module - implementation will be added step by step.
from pydantic import BaseModel, EmailStr, Field, field_validator

import re


class RegisterRequest(BaseModel):
    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    username: str = Field(
        ...,
        min_length=4,
        max_length=50,
    )

    email: EmailStr

    mobile: str | None = Field(
        default=None,
        max_length=20,
    )

    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
    )

    confirm_password: str

    role: str = "buyer"

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str):
        value = value.strip()

        if not re.fullmatch(r"^[A-Za-z][A-Za-z0-9_]{3,49}$", value):
            raise ValueError(
                "Username must start with a letter, "
                "be at least 4 characters long, "
                "and contain only letters, numbers, or underscore."
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "Username must contain at least one number."
            )

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):

        if len(value) < 8:
            raise ValueError(
                "Password must contain at least 8 characters."
            )

        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "Password must contain at least one uppercase letter."
            )

        if not re.search(r"[a-z]", value):
            raise ValueError(
                "Password must contain at least one lowercase letter."
            )

        if not re.search(r"\d", value):
            raise ValueError(
                "Password must contain at least one number."
            )

        if not re.search(r"[^A-Za-z0-9]", value):
            raise ValueError(
                "Password must contain at least one special character."
            )

        return value

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: str):

        if value not in ["buyer", "seller"]:
            raise ValueError(
                "Role must be either buyer or seller."
            )

        return value


class UserResponse(BaseModel):
    id: int
    full_name: str
    username: str
    email: str
    mobile: str | None
    role: str
    status: str

    model_config = {
        "from_attributes": True
    }
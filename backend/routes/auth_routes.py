# EstateAI Python module - implementation will be added step by step.
from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from ..auth import hash_password
from ..database import get_db
from ..models import User
from ..schemas import RegisterRequest, UserResponse


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    if data.password != data.confirm_password:
        raise HTTPException(
            status_code=400,
            detail="Passwords do not match.",
        )

    existing_username = (
        db.query(User)
        .filter(User.username == data.username)
        .first()
    )

    if existing_username:
        raise HTTPException(
            status_code=409,
            detail="Username already exists.",
        )

    existing_email = (
        db.query(User)
        .filter(User.email == data.email)
        .first()
    )

    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="Email already registered.",
        )

    if data.mobile:

        existing_mobile = (
            db.query(User)
            .filter(User.mobile == data.mobile)
            .first()
        )

        if existing_mobile:
            raise HTTPException(
                status_code=409,
                detail="Mobile number already registered.",
            )

    new_user = User(
        full_name=data.full_name.strip(),
        username=data.username,
        email=data.email,
        mobile=data.mobile,
        password_hash=hash_password(data.password),
        role=data.role,
        status="active",
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user
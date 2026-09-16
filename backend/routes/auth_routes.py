# EstateAI authentication routes

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
)

from sqlalchemy.orm import Session

from pydantic import BaseModel, EmailStr

from ..auth import (
    hash_password,
    verify_password,
    create_access_token,
)

from ..database import get_db
from ..models import User
from ..schemas import (
    RegisterRequest,
    UserResponse,
)


router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


# =========================================================
# LOGIN REQUEST
# =========================================================

class LoginRequest(BaseModel):

    email: EmailStr

    password: str


# =========================================================
# REGISTER
# =========================================================

@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # PASSWORD CONFIRMATION
    # -----------------------------------------------------

    if data.password != data.confirm_password:

        raise HTTPException(
            status_code=400,
            detail="Passwords do not match.",
        )


    # -----------------------------------------------------
    # USERNAME CHECK
    # -----------------------------------------------------

    existing_username = (
        db.query(User)
        .filter(
            User.username == data.username
        )
        .first()
    )

    if existing_username:

        raise HTTPException(
            status_code=409,
            detail="Username already exists.",
        )


    # -----------------------------------------------------
    # EMAIL CHECK
    # -----------------------------------------------------

    existing_email = (
        db.query(User)
        .filter(
            User.email == data.email
        )
        .first()
    )

    if existing_email:

        raise HTTPException(
            status_code=409,
            detail="Email already registered.",
        )


    # -----------------------------------------------------
    # MOBILE CHECK
    # -----------------------------------------------------

    if data.mobile:

        existing_mobile = (
            db.query(User)
            .filter(
                User.mobile == data.mobile
            )
            .first()
        )

        if existing_mobile:

            raise HTTPException(
                status_code=409,
                detail="Mobile number already registered.",
            )


    # -----------------------------------------------------
    # CREATE USER
    # -----------------------------------------------------

    new_user = User(

        full_name=data.full_name.strip(),

        username=data.username,

        email=data.email,

        mobile=data.mobile,

        password_hash=hash_password(
            data.password
        ),

        role=data.role,

        status="active",
    )


    db.add(new_user)

    db.commit()

    db.refresh(new_user)


    return new_user


# =========================================================
# LOGIN
# =========================================================

@router.post(
    "/login",
)
def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db),
):

    # -----------------------------------------------------
    # FIND USER
    # -----------------------------------------------------

    user = (
        db.query(User)
        .filter(
            User.email == data.email
        )
        .first()
    )


    # -----------------------------------------------------
    # USER NOT FOUND
    # -----------------------------------------------------

    if not user:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )


    # -----------------------------------------------------
    # VERIFY PASSWORD
    # -----------------------------------------------------

    password_valid = verify_password(
        data.password,
        user.password_hash,
    )


    if not password_valid:

        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )


    # -----------------------------------------------------
    # ACCOUNT STATUS
    # -----------------------------------------------------

    if user.status != "active":

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is inactive.",
        )


    # -----------------------------------------------------
    # CREATE JWT
    # -----------------------------------------------------

    access_token = create_access_token(
        {
            "sub": str(user.id),
            "email": user.email,
            "role": user.role,
        }
    )


    # -----------------------------------------------------
    # RESPONSE
    # -----------------------------------------------------

    return {

        "access_token": access_token,

        "token_type": "bearer",

        "user": {

            "id": user.id,

            "full_name": user.full_name,

            "username": user.username,

            "email": user.email,

            "mobile": user.mobile,

            "role": user.role,

            "status": user.status,

        },

    }
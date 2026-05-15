from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.db.base import get_db
from app.core.security import decode_token
from app.models.user import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_token(token)
    if payload is None:
        raise credentials_exception
    identifier: str = payload.get("sub")
    if identifier is None:
        raise credentials_exception
    # Try employee_id first, then email for backward compatibility
    user = db.query(User).filter(User.employee_id == identifier).first()
    if user is None:
        user = db.query(User).filter(User.email == identifier).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def _has_any_role(user: User, allowed_roles: set) -> bool:
    """Check if user has any of the allowed roles (primary + additional assignments)."""
    if user.is_superuser:
        return True
    if user.role in allowed_roles:
        return True
    user_roles = {ra.role for ra in (user.role_assignments or [])}
    return bool(user_roles.intersection(allowed_roles))


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if not _has_any_role(current_user, {"Administrator"}):
        raise HTTPException(status_code=403, detail="Not enough permissions")
    return current_user


def require_finance(current_user: User = Depends(get_current_active_user)) -> User:
    if not _has_any_role(current_user, {"Administrator", "Finance User"}):
        raise HTTPException(status_code=403, detail="Finance role required")
    return current_user

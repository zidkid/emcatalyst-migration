from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import hashlib
from app.core.config import settings

# Use sha256_crypt instead of bcrypt to avoid bcrypt version compatibility issues
pwd_context = CryptContext(schemes=["sha256_crypt"], deprecated="auto")


def _prep_password(password: str) -> str:
    """Hash password to a fixed length before passing to crypt."""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(_prep_password(plain_password), hashed_password)


def get_password_hash(password: str) -> str:
    return pwd_context.hash(_prep_password(password))


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None

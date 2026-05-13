from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.base import Base


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    page_access = relationship("RolePageAccess", back_populates="role", cascade="all, delete-orphan")


class Page(Base):
    __tablename__ = "pages"

    id = Column(Integer, primary_key=True, index=True)
    page_key = Column(String(100), unique=True, nullable=False, index=True)
    page_label = Column(String(200), nullable=False)
    page_path = Column(String(300), nullable=False)
    nav_group = Column(String(100), nullable=True)
    is_active = Column(Boolean, default=True)

    role_access = relationship("RolePageAccess", back_populates="page", cascade="all, delete-orphan")


class RolePageAccess(Base):
    __tablename__ = "role_page_access"

    id = Column(Integer, primary_key=True, index=True)
    role_id = Column(Integer, ForeignKey("roles.id", ondelete="CASCADE"), nullable=False)
    page_id = Column(Integer, ForeignKey("pages.id", ondelete="CASCADE"), nullable=False)
    can_access = Column(Boolean, default=False)

    role = relationship("Role", back_populates="page_access")
    page = relationship("Page", back_populates="role_access")

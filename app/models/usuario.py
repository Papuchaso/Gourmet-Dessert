from datetime import datetime, timezone
from sqlalchemy import Boolean, Column, DateTime, Integer, String
from app.core.database import Base


class Usuario(Base):
    __tablename__ = "usuarios"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    rol = Column(String, default="customer", nullable=False)
    acepto_tratamiento = Column(Boolean, nullable=False, default=True)
    fecha_consentimiento = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        nullable=False,
    )
    foto_perfil = Column(String, nullable=True, default="/static/images/avatar_default.png")

    @property
    def es_admin(self) -> bool:
        return self.rol == "admin"

    @property
    def is_admin(self) -> bool:
        return self.rol == "admin"

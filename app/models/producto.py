from sqlalchemy import Column, Float, Integer, String
from app.core.database import Base


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    precio = Column(Float, nullable=False)
    imagen = Column(String, nullable=True)
    stock = Column(Integer, default=0, nullable=False)

    @property
    def imagen_url(self) -> str | None:
        return self.imagen

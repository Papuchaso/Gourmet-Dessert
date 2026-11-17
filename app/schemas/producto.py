from pydantic import BaseModel


class ProductoCreate(BaseModel):
    nombre: str
    descripcion: str | None = None
    precio: float
    imagen: str | None = None
    imagen_url: str | None = None
    stock: int = 0


class ProductoUpdate(BaseModel):
    nombre: str | None = None
    descripcion: str | None = None
    precio: float | None = None
    imagen: str | None = None
    imagen_url: str | None = None
    stock: int | None = None


class ProductoOut(BaseModel):
    id: int
    nombre: str
    descripcion: str | None = None
    precio: float
    imagen: str | None = None
    imagen_url: str | None = None
    stock: int

    model_config = {"from_attributes": True}

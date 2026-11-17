from datetime import datetime
from pydantic import BaseModel


class ItemPedidoCreate(BaseModel):
    producto_id: int
    cantidad: int


class PedidoCreate(BaseModel):
    items: list[ItemPedidoCreate]


class DetallePedidoOut(BaseModel):
    id: int
    producto_id: int
    nombre_producto: str | None = None
    imagen_producto: str | None = None
    cantidad: int
    precio_unitario: float
    subtotal: float

    model_config = {"from_attributes": True}


class PedidoOut(BaseModel):
    id: int
    fecha: datetime
    total: float
    estado: str
    items: list[DetallePedidoOut] = []

    model_config = {"from_attributes": True}

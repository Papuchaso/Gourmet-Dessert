from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import get_current_user
from app.models.pedido import DetallePedido, Pedido
from app.models.producto import Producto
from app.models.usuario import Usuario
from app.schemas.pedido import DetallePedidoOut, PedidoCreate, PedidoOut

router = APIRouter(prefix="/pedidos", tags=["Pedidos"])


@router.post("", response_model=PedidoOut, status_code=status.HTTP_201_CREATED)
def crear_pedido(
    pedido_in: PedidoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> Pedido:
    """
    Crea un nuevo pedido a partir de los ítems del carrito.
    Valida y descuenta stock disponible de forma atómica y almacena el snapshot de precios.
    """
    if not pedido_in.items:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El carrito no contiene productos para generar el pedido.",
        )

    total_pedido = 0.0
    detalles = []

    try:
        for item in pedido_in.items:
            if item.cantidad <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"La cantidad del producto ID #{item.producto_id} debe ser mayor a 0.",
                )

            producto = (
                db.query(Producto)
                .filter(Producto.id == item.producto_id)
                .with_for_update()
                .first()
            )
            if not producto:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"El producto con ID #{item.producto_id} no existe en el catálogo.",
                )

            if producto.stock < item.cantidad:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Stock insuficiente para '{producto.nombre}'. Disponibles: {producto.stock}, solicitados: {item.cantidad}.",
                )

            # Descontar stock
            producto.stock -= item.cantidad

            subtotal_item = producto.precio * item.cantidad
            total_pedido += subtotal_item

            detalle = DetallePedido(
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio,
                subtotal=subtotal_item,
            )
            detalles.append(detalle)

        nuevo_pedido = Pedido(
            usuario_id=current_user.id,
            total=total_pedido,
            estado="completado",
            items=detalles,
        )

        db.add(nuevo_pedido)
        db.commit()
        db.refresh(nuevo_pedido)

        # Mapear datos enriquecidos para la respuesta
        items_out = []
        for det in nuevo_pedido.items:
            prod = db.query(Producto).filter(Producto.id == det.producto_id).first()
            items_out.append(
                DetallePedidoOut(
                    id=det.id,
                    producto_id=det.producto_id,
                    nombre_producto=prod.nombre if prod else "Postre Gourmet",
                    imagen_producto=prod.imagen if prod else None,
                    cantidad=det.cantidad,
                    precio_unitario=det.precio_unitario,
                    subtotal=det.subtotal,
                )
            )

        return PedidoOut(
            id=nuevo_pedido.id,
            fecha=nuevo_pedido.fecha,
            total=nuevo_pedido.total,
            estado=nuevo_pedido.estado,
            items=items_out,
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error inesperado al procesar el pedido: {str(e)}",
        )


@router.get("/mis-pedidos", response_model=list[PedidoOut])
def listar_mis_pedidos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> list[PedidoOut]:
    """
    Retorna el historial de compras realizadas por el usuario autenticado con sus detalles.
    """
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == current_user.id)
        .order_by(Pedido.fecha.desc())
        .all()
    )

    resultado = []
    for p in pedidos:
        items_out = []
        for det in p.items:
            prod = db.query(Producto).filter(Producto.id == det.producto_id).first()
            items_out.append(
                DetallePedidoOut(
                    id=det.id,
                    producto_id=det.producto_id,
                    nombre_producto=prod.nombre if prod else "Postre Gourmet",
                    imagen_producto=prod.imagen if prod else None,
                    cantidad=det.cantidad,
                    precio_unitario=det.precio_unitario,
                    subtotal=det.subtotal,
                )
            )

        resultado.append(
            PedidoOut(
                id=p.id,
                fecha=p.fecha,
                total=p.total,
                estado=p.estado,
                items=items_out,
            )
        )

    return resultado


@router.post("/{id}/revocar")
def revocar_pedido(
    id: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    """
    Gestiona solicitudes de arrepentimiento y revocación de compras (Ley N° 24.240).
    Verifica que el pedido pertenezca al usuario, que no haya sido revocado antes y
    que no hayan transcurrido más de 10 días corridos desde su emisión.
    Restaura el stock de los productos y actualiza el estado a 'revocado'.
    """
    pedido = db.query(Pedido).filter(Pedido.id == id).first()
    if not pedido:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El pedido que intentas revocar no fue encontrado.",
        )

    if pedido.usuario_id != current_user.id and current_user.rol != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes autorización para revocar este pedido.",
        )

    if pedido.estado.lower() in ["cancelado", "revocado"]:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este pedido ya ha sido revocado o cancelado previamente.",
        )

    # Validar plazo legal de 10 días (Ley 24.240 de Defensa del Consumidor)
    fecha_pedido = pedido.fecha
    if fecha_pedido.tzinfo is None:
        fecha_pedido = fecha_pedido.replace(tzinfo=timezone.utc)
    ahora = datetime.now(timezone.utc)
    dias_transcurridos = (ahora - fecha_pedido).total_seconds() / (24 * 3600)
    if dias_transcurridos > 10:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El plazo legal de 10 días para ejercer el derecho de arrepentimiento ha expirado.",
        )

    # Reintegrar stock a los productos
    for det in pedido.items:
        prod = db.query(Producto).filter(Producto.id == det.producto_id).first()
        if prod:
            prod.stock += det.cantidad

    pedido.estado = "revocado"
    db.commit()
    db.refresh(pedido)

    codigo_solicitud = f"REV-{pedido.id}-{int(ahora.timestamp())}"
    return {
        "mensaje": f"Pedido #{pedido.id} revocado exitosamente conforme a la Ley 24.240.",
        "codigo_solicitud": codigo_solicitud,
        "codigo": codigo_solicitud,
        "pedido_id": pedido.id,
        "estado": "revocado",
    }


from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.dependencies import require_admin
from app.models.producto import Producto
from app.schemas.producto import ProductoCreate, ProductoOut, ProductoUpdate

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("", response_model=list[ProductoOut])
def listar_productos(db: Session = Depends(get_db)) -> list[Producto]:
    """
    Obtener el catálogo completo de productos (Público).
    """
    return db.query(Producto).all()


@router.get("/{producto_id}", response_model=ProductoOut)
def obtener_producto(producto_id: int, db: Session = Depends(get_db)) -> Producto:
    """
    Obtener detalles de un producto específico por su ID (Público).
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )
    return producto


@router.post("", response_model=ProductoOut, status_code=status.HTTP_201_CREATED)
def crear_producto(
    producto_in: ProductoCreate,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
) -> Producto:
    """
    Crear un nuevo producto en el catálogo (Requiere rol admin).
    """
    imagen_final = producto_in.imagen_url or producto_in.imagen
    nuevo_producto = Producto(
        nombre=producto_in.nombre,
        descripcion=producto_in.descripcion,
        precio=producto_in.precio,
        imagen=imagen_final,
        stock=producto_in.stock,
    )
    db.add(nuevo_producto)
    db.commit()
    db.refresh(nuevo_producto)
    return nuevo_producto


@router.put("/{producto_id}", response_model=ProductoOut)
def actualizar_producto(
    producto_id: int,
    producto_in: ProductoUpdate,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
) -> Producto:
    """
    Actualizar un producto existente (Requiere rol admin).
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )

    datos_actualizacion = producto_in.model_dump(exclude_unset=True)
    if "imagen_url" in datos_actualizacion:
        datos_actualizacion["imagen"] = datos_actualizacion.pop("imagen_url") or datos_actualizacion.get("imagen")

    for clave, valor in datos_actualizacion.items():
        if hasattr(producto, clave):
            setattr(producto, clave, valor)

    db.commit()
    db.refresh(producto)
    return producto


@router.delete("/{producto_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_producto(
    producto_id: int,
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
) -> None:
    """
    Eliminar un producto del catálogo (Requiere rol admin).
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Producto no encontrado",
        )
    db.delete(producto)
    db.commit()
    return None


@router.post("/{producto_id}/imagen", response_model=ProductoOut)
async def subir_imagen_producto(
    producto_id: int,
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    admin: None = Depends(require_admin),
) -> Producto:
    """
    Subir o actualizar la imagen de un producto específico (Requiere rol admin).
    """
    producto = db.query(Producto).filter(Producto.id == producto_id).first()
    if not producto:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El producto no fue encontrado en el catálogo.",
        )

    if not archivo.content_type or not archivo.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="El formato del archivo no es válido. Debe ser una imagen (JPG, PNG, WEBP, GIF, SVG).",
        )

    content = await archivo.read()
    if len(content) > 2 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="El archivo seleccionado supera el límite máximo permitido de 2 MB.",
        )

    media_dir = Path(__file__).resolve().parent.parent / "static" / "images" / "productos"
    media_dir.mkdir(parents=True, exist_ok=True)

    extension = Path(archivo.filename or "producto.jpg").suffix.lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]:
        extension = ".png"

    filename = f"prod_{producto.id}_{int(datetime.now().timestamp())}{extension}"
    file_path = media_dir / filename

    with open(file_path, "wb") as f:
        f.write(content)

    url_estatica = f"/static/images/productos/{filename}"
    producto.imagen = url_estatica
    db.commit()
    db.refresh(producto)
    return producto


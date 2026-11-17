from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_password, verificar_password
from app.dependencies import get_current_user
from app.models.usuario import Usuario

router = APIRouter(prefix="/usuarios", tags=["Usuarios"])


class UsuarioPerfilOut(BaseModel):
    id: int
    email: EmailStr
    nombre: str
    avatar_url: str | None = None
    foto_perfil: str | None = None
    es_admin: bool = False
    rol: str

    model_config = {"from_attributes": True}


class CambiarPasswordSchema(BaseModel):
    password_actual: str
    password_nueva: str


@router.get("/me", response_model=UsuarioPerfilOut)
def obtener_perfil_me(
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    """
    Devuelve el perfil del usuario autenticado (email, nombre, avatar_url, es_admin, rol).
    """
    return {
        "id": current_user.id,
        "email": current_user.email,
        "nombre": current_user.nombre,
        "avatar_url": current_user.foto_perfil,
        "foto_perfil": current_user.foto_perfil,
        "es_admin": current_user.es_admin,
        "rol": current_user.rol,
    }


@router.put("/me/password")
def cambiar_password_me(
    data: CambiarPasswordSchema,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict[str, str]:
    """
    Permite cambiar la contraseña verificando la contraseña actual y encriptando la nueva.
    """
    if not verificar_password(data.password_actual, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual ingresada es incorrecta.",
        )

    if len(data.password_nueva) < 6:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La nueva contraseña debe contener al menos 6 caracteres.",
        )

    current_user.hashed_password = hash_password(data.password_nueva)
    db.commit()
    return {"mensaje": "Contraseña actualizada exitosamente."}


@router.post("/me/avatar", response_model=UsuarioPerfilOut)
async def actualizar_avatar_me(
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
) -> dict:
    """
    Permite subir o actualizar la foto de perfil vía multipart/form-data.
    Valida que el archivo sea tipo imagen y menor a 2MB.
    """
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

    media_dir = Path(__file__).resolve().parent.parent / "static" / "images" / "avatars"
    media_dir.mkdir(parents=True, exist_ok=True)

    extension = Path(archivo.filename or "avatar.png").suffix.lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]:
        extension = ".png"

    filename = f"user_{current_user.id}_{int(datetime.now().timestamp())}{extension}"
    file_path = media_dir / filename

    with open(file_path, "wb") as f:
        f.write(content)

    url_estatica = f"/static/images/avatars/{filename}"
    current_user.foto_perfil = url_estatica
    db.commit()
    db.refresh(current_user)

    return {
        "id": current_user.id,
        "email": current_user.email,
        "nombre": current_user.nombre,
        "avatar_url": current_user.foto_perfil,
        "foto_perfil": current_user.foto_perfil,
        "es_admin": current_user.es_admin,
        "rol": current_user.rol,
    }

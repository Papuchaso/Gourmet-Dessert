import urllib.parse
from datetime import datetime, timedelta, timezone
from pathlib import Path
from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.security import OAuth2PasswordRequestForm
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import crear_token, hash_password, verificar_password
from app.dependencies import get_current_user
from app.models.pedido import Pedido
from app.models.usuario import Usuario
from app.schemas.usuario import (
    ActualizarFotoInput,
    CambiarPasswordInput,
    GoogleAuthInput,
    RecuperarPasswordInput,
    RefreshTokenInput,
    RestablecerPasswordInput,
    Token,
    UsuarioCreate,
    UsuarioOut,
)

router = APIRouter(prefix="/auth", tags=["Autenticación"])


def generar_avatar_iniciales(nombre: str) -> str:
    """
    Genera un avatar SVG local codificado en data URI basado en las iniciales del nombre
    y una paleta pastel, sin consumir ninguna API externa.
    """
    partes = [p for p in nombre.strip().split() if p]
    if len(partes) >= 2:
        iniciales = f"{partes[0][0]}{partes[1][0]}".upper()
    elif len(partes) == 1 and len(partes[0]) >= 2:
        iniciales = partes[0][:2].upper()
    elif len(partes) == 1:
        iniciales = partes[0][0].upper()
    else:
        iniciales = "GD"

    # Paleta de colores pasteles cálidos
    colores = ["#f8a5c2", "#81c784", "#f4a261", "#e77f67", "#778beb", "#cf6a87", "#546de5", "#e15f41"]
    color_bg = colores[sum(ord(c) for c in nombre) % len(colores)]

    svg_content = (
        f'<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">'
        f'<circle cx="64" cy="64" r="64" fill="{color_bg}"/>'
        f'<text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" '
        f'fill="#ffffff" font-family="Segoe UI, Roboto, Helvetica, Arial, sans-serif" '
        f'font-size="46" font-weight="bold">{iniciales}</text>'
        f'</svg>'
    )
    return f"data:image/svg+xml;utf8,{urllib.parse.quote(svg_content)}"


@router.post("/register", response_model=UsuarioOut, status_code=status.HTTP_201_CREATED)
def registrar_usuario(
    usuario_in: UsuarioCreate,
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Registra un nuevo usuario en la plataforma con correo y contraseña.
    Asigna un avatar genérico local con las iniciales de su nombre (sin APIs externas).
    """
    existing_user = db.query(Usuario).filter(Usuario.email == usuario_in.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El email ya se encuentra registrado.",
        )

    foto_inicial = generar_avatar_iniciales(usuario_in.nombre)

    db_usuario = Usuario(
        nombre=usuario_in.nombre,
        email=usuario_in.email,
        hashed_password=hash_password(usuario_in.password),
        rol="customer",
        acepto_tratamiento=usuario_in.acepto_tratamiento,
        fecha_consentimiento=datetime.now(timezone.utc),
        foto_perfil=foto_inicial,
    )
    db.add(db_usuario)
    db.commit()
    db.refresh(db_usuario)
    return db_usuario


@router.post("/login", response_model=Token)
def iniciar_sesion(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Autentica al usuario usando OAuth2 Form Data (el campo 'username' contiene el email).
    Devuelve access_token, refresh_token y token_type.
    """
    user = db.query(Usuario).filter(Usuario.email == form_data.username).first()
    if not user or not verificar_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Credenciales de acceso inválidas",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = crear_token(
        data={"sub": user.email, "rol": user.rol, "tipo": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_MIN),
    )
    refresh_token = crear_token(
        data={"sub": user.email, "rol": user.rol, "tipo": "refresh"},
        expires_delta=timedelta(minutes=settings.REFRESH_MIN),
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.post("/google", response_model=Token)
def autenticar_google(
    data: GoogleAuthInput,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Autentica o registra a un usuario con Google OAuth.
    Si se registra por primera vez, asigna automáticamente la foto de perfil (picture/photoURL) de Google.
    """
    email = data.email
    nombre = data.nombre or "Usuario Google"
    foto_perfil = data.foto_perfil

    if data.credential:
        try:
            unverified_claims = jwt.get_unverified_claims(data.credential)
            email = unverified_claims.get("email", email)
            nombre = unverified_claims.get("name", nombre)
            foto_perfil = unverified_claims.get("picture", foto_perfil)
        except Exception:
            pass

    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se pudo obtener el correo de la cuenta de Google.",
        )

    user = db.query(Usuario).filter(Usuario.email == email).first()
    if not user:
        # Asignar automáticamente la foto provista por Google
        avatar_inicial = foto_perfil or generar_avatar_iniciales(nombre)
        user = Usuario(
            nombre=nombre,
            email=email,
            hashed_password=hash_password(f"oauth_google_{email}"),
            rol="customer",
            acepto_tratamiento=True,
            fecha_consentimiento=datetime.now(timezone.utc),
            foto_perfil=avatar_inicial,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        # Si no tiene foto de perfil o tiene avatar SVG inicial, actualizar con la foto de Google si está disponible
        if foto_perfil and (not user.foto_perfil or user.foto_perfil.startswith("data:image/svg")):
            user.foto_perfil = foto_perfil
            db.commit()
            db.refresh(user)

    access_token = crear_token(
        data={"sub": user.email, "rol": user.rol, "tipo": "access"},
        expires_delta=timedelta(minutes=settings.ACCESS_MIN),
    )
    refresh_token = crear_token(
        data={"sub": user.email, "rol": user.rol, "tipo": "refresh"},
        expires_delta=timedelta(minutes=settings.REFRESH_MIN),
    )
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
    }


@router.get("/me", response_model=UsuarioOut)
def obtener_perfil_actual(
    current_user: Usuario = Depends(get_current_user),
) -> Usuario:
    """
    Devuelve los datos del usuario autenticado sin incluir el hash de la contraseña.
    """
    return current_user


@router.post("/upload-avatar", response_model=UsuarioOut)
async def subir_avatar(
    file: UploadFile = File(...),
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Permite a cualquier usuario autenticado subir un archivo de imagen para actualizar su foto de perfil.
    Guarda la imagen localmente en el servidor estático del backend y actualiza la URL en la base de datos.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El archivo seleccionado debe ser una imagen (JPG, PNG, WEBP, GIF, SVG).",
        )

    avatars_dir = Path(__file__).resolve().parent.parent / "static" / "images" / "avatars"
    avatars_dir.mkdir(parents=True, exist_ok=True)

    extension = Path(file.filename or "avatar.jpg").suffix.lower()
    if extension not in [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"]:
        extension = ".png"

    filename = f"user_{current_user.id}_{int(datetime.now().timestamp())}{extension}"
    file_path = avatars_dir / filename

    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La imagen no debe superar los 5 MB de tamaño.",
        )

    with open(file_path, "wb") as f:
        f.write(content)

    url_estatica = f"/static/images/avatars/{filename}"
    current_user.foto_perfil = url_estatica
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/restore-initials", response_model=UsuarioOut)
def restaurar_avatar_iniciales(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Restablece la foto de perfil del usuario a su avatar de iniciales local.
    """
    current_user.foto_perfil = generar_avatar_iniciales(current_user.nombre)
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/profile-picture", response_model=UsuarioOut)
def actualizar_foto_perfil(
    data: ActualizarFotoInput,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Actualiza la foto de perfil del usuario autenticado con una URL.
    """
    current_user.foto_perfil = data.foto_perfil
    db.commit()
    db.refresh(current_user)
    return current_user


@router.put("/change-password", status_code=status.HTTP_200_OK)
def cambiar_password(
    data: CambiarPasswordInput,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Permite al usuario autenticado cambiar su contraseña.
    Requiere la contraseña actual para verificación. La nueva contraseña se hashea con bcrypt.
    """
    if not verificar_password(data.password_actual, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta.",
        )
    current_user.hashed_password = hash_password(data.password_nueva)
    db.commit()
    return {"mensaje": "Contraseña actualizada correctamente."}


@router.delete("/me", status_code=status.HTTP_200_OK)
def eliminar_cuenta(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Elimina permanentemente la cuenta del usuario autenticado de la base de datos.
    Esta operación es irreversible.
    """
    db.delete(current_user)
    db.commit()
    return {"mensaje": "Tu cuenta ha sido eliminada permanentemente."}


@router.post("/recuperar-contrasena", status_code=status.HTTP_200_OK)
def solicitar_recuperacion_password(
    data: RecuperarPasswordInput,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Solicita el restablecimiento de contraseña.
    Seguridad: Siempre responde con un mensaje genérico para evitar la enumeración de usuarios.
    Genera un token JWT temporal (15 minutos) con tipo 'password_reset'.
    """
    email_normalizado = data.email.lower().strip()
    usuario = db.query(Usuario).filter(Usuario.email == email_normalizado).first()

    respuesta: dict[str, str] = {
        "mensaje": "Si el correo está registrado en nuestro sistema, recibirás un mensaje con las instrucciones para restablecer tu contraseña."
    }

    if usuario:
        # Generar token JWT con expiración corta (15 min)
        expires = timedelta(minutes=15)
        reset_token = crear_token(
            data={"sub": usuario.email, "tipo": "password_reset", "rol": usuario.rol},
            expires_delta=expires,
        )
        url_simulada = f"http://localhost:5173/?ruta=restablecer-contrasena&token={reset_token}"
        
        # Log del enlace en consola
        print(f"\n==========================================")
        print(f"[RECOVERY EMAIL] Enlace para {usuario.email}:")
        print(url_simulada)
        print(f"==========================================\n")

        # Para facilidad en entorno de desarrollo local, incluimos el enlace y token en la respuesta
        respuesta["reset_url"] = url_simulada
        respuesta["token"] = reset_token

    return respuesta



@router.post("/restablecer-contrasena", status_code=status.HTTP_200_OK)
def restablecer_password(
    data: RestablecerPasswordInput,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    """
    Verifica el token de recuperación y actualiza la contraseña del usuario.
    """
    try:
        payload = jwt.decode(data.token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email = payload.get("sub")
        tipo = payload.get("tipo")

        if not email or tipo != "password_reset":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="El enlace de recuperación es inválido o no corresponde a esta acción.",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El enlace de recuperación ha expirado o es inválido. Solicita uno nuevo.",
        )

    if len(data.nueva_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nueva contraseña debe tener al menos 8 caracteres.",
        )

    usuario = db.query(Usuario).filter(Usuario.email == email).first()
    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una cuenta asociada a este correo.",
        )

    usuario.hashed_password = hash_password(data.nueva_password)
    db.commit()

    return {"mensaje": "Tu contraseña ha sido restablecida exitosamente. Ya puedes iniciar sesión con tu nueva clave."}


@router.get("/mis-datos")
def obtener_mis_datos_completos(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Retorna la información personal completa, consentimiento legal e historial
    de compras y solicitudes conforme a la Ley N° 24.240 y normativas de privacidad.
    """
    pedidos = (
        db.query(Pedido)
        .filter(Pedido.usuario_id == current_user.id)
        .order_by(Pedido.fecha.desc())
        .all()
    )

    pedidos_data = []
    solicitudes = []
    for p in pedidos:
        pedidos_data.append({
            "id": p.id,
            "pedido_id": p.id,
            "fecha": p.fecha.isoformat() if p.fecha else None,
            "total": p.total,
            "estado": p.estado,
            "items": [
                {
                    "producto_id": det.producto_id,
                    "cantidad": det.cantidad,
                    "precio_unitario": det.precio_unitario,
                    "subtotal": det.subtotal,
                }
                for det in p.items
            ],
        })
        if p.estado.lower() in ["revocado", "cancelado"]:
            solicitudes.append({
                "codigo_solicitud": f"REV-{p.id}-CONF",
                "codigo": f"REV-{p.id}-CONF",
                "tipo": "Derecho de Arrepentimiento (Ley 24.240)",
                "estado": "Procesada / Aprobada",
                "fecha": p.fecha.isoformat() if p.fecha else None,
                "pedido_id": p.id,
            })

    return {
        "id": current_user.id,
        "nombre": current_user.nombre,
        "email": current_user.email,
        "rol": current_user.rol,
        "es_admin": current_user.es_admin,
        "acepto_tratamiento": current_user.acepto_tratamiento,
        "fecha_consentimiento": current_user.fecha_consentimiento.isoformat() if current_user.fecha_consentimiento else None,
        "foto_perfil": current_user.foto_perfil,
        "pedidos": pedidos_data,
        "solicitudes": solicitudes,
    }



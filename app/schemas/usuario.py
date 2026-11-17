from datetime import datetime
from pydantic import BaseModel, EmailStr, field_validator


class UsuarioCreate(BaseModel):
    nombre: str
    email: EmailStr
    password: str
    acepto_tratamiento: bool

    @field_validator("acepto_tratamiento")
    @classmethod
    def validar_acepto_tratamiento(cls, v: bool) -> bool:
        if v is not True:
            raise ValueError("Debe aceptar el tratamiento de datos personales para registrarse.")
        return v


class UsuarioOut(BaseModel):
    id: int
    nombre: str
    email: EmailStr
    rol: str
    es_admin: bool = False
    is_admin: bool = False
    acepto_tratamiento: bool
    fecha_consentimiento: datetime
    foto_perfil: str | None = None

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshTokenInput(BaseModel):
    refresh_token: str


class GoogleAuthInput(BaseModel):
    credential: str | None = None
    email: EmailStr | None = None
    nombre: str | None = None
    foto_perfil: str | None = None


class ActualizarFotoInput(BaseModel):
    foto_perfil: str


class CambiarPasswordInput(BaseModel):
    password_actual: str
    password_nueva: str


class RecuperarPasswordInput(BaseModel):
    email: EmailStr


class RestablecerPasswordInput(BaseModel):
    token: str
    nueva_password: str


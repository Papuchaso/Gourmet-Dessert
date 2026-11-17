import os
from pathlib import Path
import uvicorn
from fastapi import Depends, FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text
from sqlalchemy.orm import Session

from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import Base, engine, get_db
from app.models.usuario import Usuario
from app.models.producto import Producto
from app.models.pedido import Pedido, DetallePedido
from app.routers import auth, pedidos, productos, usuarios

# Crear todas las tablas en la base de datos si no existen
Base.metadata.create_all(bind=engine)

BASE_DIR = Path(__file__).resolve().parent

# Creación garantizada de directorios para uploads, estáticos, productos y avatares
os.makedirs("uploads/productos", exist_ok=True)
os.makedirs("uploads/images/avatars", exist_ok=True)
os.makedirs("uploads/images/productos", exist_ok=True)
os.makedirs(BASE_DIR / "static" / "demo", exist_ok=True)
os.makedirs(BASE_DIR / "static" / "images" / "productos", exist_ok=True)
os.makedirs(BASE_DIR / "static" / "images" / "avatars", exist_ok=True)

app = FastAPI(
    title="API E-Commerce IRESM - Melería & Postres Ilusión",
    description=(
        "API REST y servidor de interfaz web para el e-commerce de postres engaña-ojos "
        "enfocado a la comunidad del Instituto Remedios Escalada de San Martín (IRESM). "
        "Operaciones comerciales sujetas a la Ley N° 24.240 de Defensa del Consumidor de la República Argentina."
    ),
    version="0.3.0",
)

# Configuración de orígenes permitidos para CORS
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
]

if settings.FRONTEND_URL:
    for url in settings.FRONTEND_URL.split(","):
        cleaned_url = url.strip().rstrip("/")
        if cleaned_url and cleaned_url not in origins:
            origins.append(cleaned_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Montar routers de autenticación, pedidos, productos y usuarios
app.include_router(auth.router)
app.include_router(pedidos.router)
app.include_router(productos.router)
app.include_router(usuarios.router)

# Montar rutas de archivos estáticos y demostración
app.mount("/static", StaticFiles(directory="uploads"), name="static")
app.mount("/demo", StaticFiles(directory=BASE_DIR / "static" / "demo"), name="demo")


@app.get("/salud", tags=["Salud"])
def salud(db: Session = Depends(get_db)):
    """
    Endpoint de verificación de salud de la aplicación y conexión con la base de datos.
    """
    db.execute(text("SELECT 1"))
    return {"estado": "ok", "base": "ok"}


@app.get("/", response_class=FileResponse)
def read_root() -> FileResponse:
    """
    Servir la interfaz web principal del e-commerce estilo Melería Pastel.
    """
    return FileResponse(BASE_DIR / "templates" / "index.html")


@app.get("/api/v1/info")
def read_info() -> dict[str, str]:
    """
    Endpoint informativo sobre el comercio y marco regulatorio argentino.
    """
    return {
        "mensaje": "¡Bienvenido a la API del E-Commerce de Postres Ilusión para IRESM!",
        "negocio": "Postres engaña-ojos (trompe-l'œil) y melería para estudiantes del Instituto Remedios Escalada de San Martín (IRESM)",
        "pais": "Argentina",
        "marco_legal": (
            "Todas las operaciones comerciales y de consumo realizadas a través de esta plataforma "
            "están sujetas a la Ley N° 24.240 de Defensa del Consumidor y sus normas complementarias en la República Argentina."
        ),
        "estado": "Operativo",
    }


if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)

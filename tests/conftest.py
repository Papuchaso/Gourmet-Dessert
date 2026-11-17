import os
import pytest
from datetime import datetime, timezone
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Garantizar que cualquier lectura previa de configuración no apunte a Neon
os.environ["DATABASE_URL"] = "sqlite:///:memory:"

from app.core.database import Base, get_db
from app.core.security import hash_password, crear_token
from app.main import app
from app.models.usuario import Usuario
from app.models.producto import Producto
from app.models.pedido import Pedido, DetallePedido

# Motor SQLite en memoria compartido y aislado
engine_test = create_engine(
    "sqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine_test)


@pytest.fixture(scope="function")
def db_session():
    """
    Crea las tablas limpias en memoria para cada función de prueba
    y las destruye al finalizar para garantizar total aislamiento.
    """
    Base.metadata.create_all(bind=engine_test)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine_test)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Cliente de pruebas de FastAPI con inyección de la base de datos de test.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def usuario_comun(db_session) -> Usuario:
    """Usuario estándar de prueba."""
    user = Usuario(
        nombre="Juan Perez",
        email="juan.perez@test.com",
        hashed_password=hash_password("password123"),
        rol="customer",
        acepto_tratamiento=True,
        fecha_consentimiento=datetime.now(timezone.utc),
        foto_perfil="/static/images/avatar_default.png",
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture
def usuario_admin(db_session) -> Usuario:
    """Usuario administrador de prueba."""
    admin = Usuario(
        nombre="Admin IRESM",
        email="admin@test.com",
        hashed_password=hash_password("admin123"),
        rol="admin",
        acepto_tratamiento=True,
        fecha_consentimiento=datetime.now(timezone.utc),
        foto_perfil="/static/images/avatar_default.png",
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture
def headers_usuario(usuario_comun) -> dict:
    """Headers con Bearer Token para usuario común."""
    token = crear_token({"sub": usuario_comun.email, "tipo": "access"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def headers_admin(usuario_admin) -> dict:
    """Headers con Bearer Token para administrador."""
    token = crear_token({"sub": usuario_admin.email, "tipo": "access"})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def producto_test(db_session) -> Producto:
    """Producto precargado con stock para pruebas."""
    prod = Producto(
        nombre="Postre Hamburguesa Dulce",
        descripcion="Postre ilusión trompe-l'œil relleno de chocolate",
        precio=3500.0,
        imagen="/static/images/hamburguesa_dulce.png",
        stock=10,
    )
    db_session.add(prod)
    db_session.commit()
    db_session.refresh(prod)
    return prod


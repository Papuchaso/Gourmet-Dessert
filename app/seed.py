import os
from datetime import datetime, timezone
import bcrypt
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings
from app.models.usuario import Usuario
from app.models.producto import Producto
from app.models.pedido import Pedido, DetallePedido
from app.core.database import Base

# Configuración de base de datos desde variable de entorno o settings
DATABASE_URL = os.getenv("DATABASE_URL") or settings.DATABASE_URL
ADMIN_EMAIL = os.getenv("SEED_ADMIN_EMAIL", "thiagobenjamindusserremateo@gmail.com")
ADMIN_PASSWORD = os.getenv("SEED_ADMIN_PASSWORD", "1003benja")

PRODUCTOS_DEMO = [
    {
        "id": 1,
        "nombre": "Hamburguesa de Torta",
        "precio": 2500.0,
        "descripcion": "Bizcochuelo de vainilla simulando pan artesanal con sésamo, medallón de ganache de chocolate semiamargo y fondant de lechuga y cheddar.",
        "imagen": "/demo/hamburguesa_dulce.png",
        "stock": 15,
    },
    {
        "id": 2,
        "nombre": "Sushi Dulce",
        "precio": 2200.0,
        "descripcion": "Rolls de coco rallado con arroz con leche dulce, dulce de leche repostero y coulis de frutos rojos simulando salsa de soja.",
        "imagen": "/demo/sushi_dulce.png",
        "stock": 12,
    },
    {
        "id": 3,
        "nombre": "Pizza de Chocolate",
        "precio": 3400.0,
        "descripcion": "Masa sablé crocante con base de Nutella y crema pastelera, decorada con gomitas simulando pimientos y chocolate blanco rallado.",
        "imagen": "/demo/pizza_dulce.png",
        "stock": 10,
    },
    {
        "id": 4,
        "nombre": "Taco Waffle",
        "precio": 1800.0,
        "descripcion": "Masa de waffle crocante plegada rellena de mousse de dulce de leche, frutillas frescas picadas simulando carne y salsa de mango.",
        "imagen": "/demo/taco_dulce.png",
        "stock": 14,
    },
    {
        "id": 5,
        "nombre": "Empanaditas Hojaldradas",
        "precio": 1500.0,
        "descripcion": "Masa de hojaldre crocante y dorada rellena de membrillo artesanal, dulce de batata y trocitos de chocolate con azúcar impalpable.",
        "imagen": "/demo/empanada_dulce.png",
        "stock": 20,
    },
    {
        "id": 6,
        "nombre": "Pancho Dulce",
        "precio": 1900.0,
        "descripcion": "Pan de vainilla glaseado con salchicha de trufa de chocolate belga, decorado con hilos de crema de mango y frambuesa simulando mostaza y ketchup.",
        "imagen": "/demo/hotdog_dulce.png",
        "stock": 16,
    },
]


def seed():
    """
    Script de seed idempotente para poblar la base de datos con el usuario administrador
    y el catálogo oficial de productos con imágenes en /demo/...
    """
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)
    Base.metadata.create_all(bind=engine)
    Session = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = Session()

    try:
        # 1. Cargar o actualizar usuario Administrador (Idempotente)
        admin_user = db.query(Usuario).filter(Usuario.email == ADMIN_EMAIL).first()
        salt = bcrypt.gensalt(rounds=12)
        password_hashed = bcrypt.hashpw(ADMIN_PASSWORD.encode("utf-8"), salt).decode("utf-8")

        if admin_user:
            admin_user.rol = "admin"
            admin_user.hashed_password = password_hashed
            admin_user.nombre = "Thiago Benjamín Dusserre Mateo"
        else:
            nuevo_admin = Usuario(
                nombre="Thiago Benjamín Dusserre Mateo",
                email=ADMIN_EMAIL,
                hashed_password=password_hashed,
                rol="admin",
                acepto_tratamiento=True,
                fecha_consentimiento=datetime.now(timezone.utc),
                foto_perfil="/demo/avatar_default.png",
            )
            db.add(nuevo_admin)

        db.commit()

        # 2. Cargar o actualizar productos de demo (Idempotente)
        for prod_data in PRODUCTOS_DEMO:
            prod = db.query(Producto).filter(
                (Producto.id == prod_data["id"]) | (Producto.nombre == prod_data["nombre"])
            ).first()

            if prod:
                prod.nombre = prod_data["nombre"]
                prod.precio = prod_data["precio"]
                prod.descripcion = prod_data["descripcion"]
                prod.imagen = prod_data["imagen"]
                prod.stock = prod_data["stock"]
            else:
                nuevo_prod = Producto(
                    id=prod_data["id"],
                    nombre=prod_data["nombre"],
                    precio=prod_data["precio"],
                    descripcion=prod_data["descripcion"],
                    imagen=prod_data["imagen"],
                    stock=prod_data["stock"],
                )
                db.add(nuevo_prod)

        db.commit()
        print("Seed listo.")

    except Exception as e:
        db.rollback()
        print(f"Error durante la ejecución del seed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()

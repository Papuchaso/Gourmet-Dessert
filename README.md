# 🛒 E-Commerce IRESM — Melería & Postres Ilusión

Sistema Web Full-Stack para el e-commerce de postres engaña-ojos (*trompe-l'œil*) y melería para la comunidad del **Instituto Remedios Escalada de San Martín (IRESM)**.

---

## 🛠️ Stack Tecnológico

- **Backend**: Python 3.12, FastAPI, Uvicorn.
- **Base de Datos & ORM**: PostgreSQL, SQLAlchemy 2.0, Alembic.
- **Autenticación & Seguridad**: Passlib (Bcrypt), Python-Jose (JWT), Pydantic v2.
- **Frontend**: Vite, JavaScript, HTML5, CSS3.

---

## 📁 Estructura del Proyecto

```text
E-Commerce/
├── .env                    # Variables de entorno (Secretos, DB, JWT)
├── alembic.ini             # Configuración de Alembic
├── requirements.txt        # Dependencias de Python
├── alembic/                # Migraciones de base de datos
│   └── versions/
├── app/                    # Código del Backend FastAPI
│   ├── core/
│   │   ├── config.py       # Configuración con Pydantic Settings
│   │   ├── database.py     # Conexión SQLAlchemy y SessionLocal
│   │   └── security.py     # Hashing (bcrypt) y generación de JWT
│   ├── models/             # Modelos ORM (SQLAlchemy)
│   │   ├── usuario.py
│   │   └── producto.py
│   ├── schemas/            # Esquemas de validación (Pydantic)
│   │   ├── usuario.py
│   │   └── producto.py
│   ├── routers/            # Endpoints de API REST
│   │   ├── auth.py
│   │   └── productos.py
│   ├── dependencies.py     # Inyección de dependencias y permisos
│   └── main.py             # Instancia principal de FastAPI
└── tienda-frontend/        # Proyecto cliente Frontend (Vite)
    ├── package.json
    └── src/
```

---

## 🗄️ Esquema de la Base de Datos

### Tabla `usuarios`
| Columna | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Identificador único |
| `nombre` | String | Not Null | Nombre completo del usuario |
| `email` | String | Unique, Not Null, Index | Correo electrónico institucional / personal |
| `hashed_password` | String | Not Null | Hash de contraseña con Bcrypt |
| `rol` | String | Not Null, Default: `'customer'` | Rol de acceso (`customer` / `admin`) |
| `acepto_tratamiento` | Boolean | Not Null | Consentimiento de tratamiento de datos |
| `fecha_consentimiento` | DateTime | Not Null, UTC | Fecha y hora de aceptación de términos |

### Tabla `productos`
| Columna | Tipo | Restricciones | Descripción |
| :--- | :--- | :--- | :--- |
| `id` | Integer | Primary Key, Auto-increment | Identificador único |
| `nombre` | String | Not Null | Nombre del producto |
| `descripcion` | String | Nullable | Descripción del postre |
| `precio` | Float | Not Null | Precio en ARS |
| `imagen` | String | Nullable | Ruta o URL de la imagen |
| `stock` | Integer | Not Null, Default: `0` | Unidades disponibles |

---

## 🔑 Endpoints de la API

### Autenticación (`/auth`)
- `POST /auth/register` — Registro de usuario (valida `acepto_tratamiento == true`).
- `POST /auth/login` — Inicio de sesión con Form Data (`username`=email). Retorna `access_token` y `refresh_token`.
- `POST /auth/refresh` — Renovación de tokens enviando un `refresh_token` válido.
- `GET /auth/me` — Consulta del perfil del usuario autenticado (requiere `Authorization: Bearer <access_token>`).

### Productos (`/productos`)
- `GET /productos` — Catálogo público de productos.
- `GET /productos/{id}` — Detalle público de un producto.
- `POST /productos` — Crear producto (**Requiere rol `admin`**).
- `PUT /productos/{id}` — Actualizar producto (**Requiere rol `admin`**).
- `DELETE /productos/{id}` — Eliminar producto (**Requiere rol `admin`**).

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Backend (Python + FastAPI)

1. **Crear y activar el entorno virtual**:
   ```powershell
   # En Windows PowerShell (desde la raíz del proyecto)
   python -m venv .venv
   .\.venv\Scripts\Activate.ps1
   ```

2. **Instalar dependencias**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Configurar el archivo `.env`**:
   Crear un archivo `.env` en la raíz con el siguiente contenido:
   ```env
   DATABASE_URL=postgresql://postgres:1234@localhost:5432/ecommerce_db
   SECRET_KEY=4cb32f8f069f8cea39cca7a8dcf3e726f1a042e1dbe31afa52dd9fa499df219a
   ALGORITHM=HS256
   ACCESS_MIN=30
   REFRESH_MIN=10080
   ```

4. **Ejecutar migraciones de la base de datos**:
   ```bash
   alembic upgrade head
   ```

5. **Iniciar el servidor Backend**:
   ```powershell
   # Usando el entorno virtual
   .\.venv\Scripts\uvicorn.exe app.main:app --reload
   ```
   - Swagger UI de documentación: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
   - ReDoc: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend (Vite + JavaScript)

1. **Navegar a la carpeta del frontend**:
   ```bash
   cd tienda-frontend
   ```

2. **Instalar dependencias e iniciar el servidor de desarrollo**:
   ```bash
   npm install
   npm run dev
   ```
   - Servidor local accesible en: [http://localhost:5173/](http://localhost:5173/)
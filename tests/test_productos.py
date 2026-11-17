import io

def test_listar_productos_publico(client, producto_test):
    response = client.get("/productos")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert data[0]["nombre"] == producto_test.nombre


def test_obtener_producto_por_id(client, producto_test):
    response = client.get(f"/productos/{producto_test.id}")
    assert response.status_code == 200
    assert response.json()["id"] == producto_test.id


def test_obtener_producto_inexistente(client):
    response = client.get("/productos/999999")
    assert response.status_code == 404


def test_crear_producto_admin(client, headers_admin):
    payload = {
        "nombre": "Sushi Dulce Trompe l'oeil",
        "descripcion": "Rollo de coco y mango con coulis",
        "precio": 4200.0,
        "stock": 15
    }
    response = client.post("/productos", json=payload, headers=headers_admin)
    assert response.status_code == 201
    assert response.json()["nombre"] == payload["nombre"]


def test_crear_producto_sin_permisos(client, headers_usuario):
    payload = {
        "nombre": "Intento no admin",
        "precio": 1000.0,
        "stock": 5
    }
    response = client.post("/productos", json=payload, headers=headers_usuario)
    assert response.status_code == 403


def test_subir_imagen_producto_admin(client, producto_test, headers_admin):
    file_content = b"\x89PNG\r\n\x1a\nfake-image-bytes"
    files = {"archivo": ("postre.png", io.BytesIO(file_content), "image/png")}
    response = client.post(
        f"/productos/{producto_test.id}/imagen",
        files=files,
        headers=headers_admin
    )
    assert response.status_code == 200
    assert "imagen" in response.json()
    assert response.json()["imagen"].startswith("/static/images/productos/")


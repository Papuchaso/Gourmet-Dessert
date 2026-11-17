def test_registro_usuario_exitoso(client):
    payload = {
        "nombre": "Estudiante IRESM",
        "email": "estudiante@iresm.edu.ar",
        "password": "segura123password",
        "acepto_tratamiento": True
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == payload["email"]
    assert data["nombre"] == payload["nombre"]
    assert data["rol"] == "customer"
    assert data["acepto_tratamiento"] is True


def test_registro_usuario_sin_consentimiento(client):
    payload = {
        "nombre": "Estudiante IRESM",
        "email": "noconsent@iresm.edu.ar",
        "password": "segura123password",
        "acepto_tratamiento": False
    }
    response = client.post("/auth/register", json=payload)
    assert response.status_code == 422


def test_login_exitoso(client, usuario_comun):
    response = client.post(
        "/auth/login",
        data={"username": usuario_comun.email, "password": "password123"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_login_credenciales_invalidas(client, usuario_comun):
    response = client.post(
        "/auth/login",
        data={"username": usuario_comun.email, "password": "wrongpassword"},
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    assert response.status_code == 401


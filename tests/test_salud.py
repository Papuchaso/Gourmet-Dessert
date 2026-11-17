def test_salud_endpoint(client):
    """Verifica que el endpoint /salud responda 200 con la base en memoria aislada."""
    response = client.get("/salud")
    assert response.status_code == 200
    assert response.json() == {"estado": "ok", "base": "ok"}


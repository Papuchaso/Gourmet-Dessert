def test_crear_pedido_exitoso(client, producto_test, headers_usuario):
    payload = {
        "items": [
            {"producto_id": producto_test.id, "cantidad": 2}
        ]
    }
    response = client.post("/pedidos", json=payload, headers=headers_usuario)
    assert response.status_code == 201
    data = response.json()
    assert data["total"] == producto_test.precio * 2
    assert len(data["items"]) == 1
    assert data["items"][0]["cantidad"] == 2


def test_crear_pedido_stock_insuficiente(client, producto_test, headers_usuario):
    payload = {
        "items": [
            {"producto_id": producto_test.id, "cantidad": producto_test.stock + 10}
        ]
    }
    response = client.post("/pedidos", json=payload, headers=headers_usuario)
    assert response.status_code == 409


def test_listar_mis_pedidos(client, producto_test, headers_usuario):
    client.post(
        "/pedidos",
        json={"items": [{"producto_id": producto_test.id, "cantidad": 1}]},
        headers=headers_usuario
    )
    response = client.get("/pedidos/mis-pedidos", headers=headers_usuario)
    assert response.status_code == 200
    pedidos = response.json()
    assert len(pedidos) >= 1


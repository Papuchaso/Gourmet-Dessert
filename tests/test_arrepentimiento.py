def test_revocar_pedido_exitoso(client, producto_test, headers_usuario):
    # Crear pedido inicial
    crear_res = client.post(
        "/pedidos",
        json={"items": [{"producto_id": producto_test.id, "cantidad": 2}]},
        headers=headers_usuario
    )
    assert crear_res.status_code == 201
    pedido_id = crear_res.json()["id"]

    # Revocar compra dentro del plazo
    revocar_res = client.post(f"/pedidos/{pedido_id}/revocar", headers=headers_usuario)
    assert revocar_res.status_code == 200
    data = revocar_res.json()
    assert data["estado"] == "revocado"
    assert "codigo_solicitud" in data
    assert data["codigo_solicitud"].startswith(f"REV-{pedido_id}-")


def test_revocar_pedido_duplicado(client, producto_test, headers_usuario):
    crear_res = client.post(
        "/pedidos",
        json={"items": [{"producto_id": producto_test.id, "cantidad": 1}]},
        headers=headers_usuario
    )
    pedido_id = crear_res.json()["id"]

    # Primera revocación
    res1 = client.post(f"/pedidos/{pedido_id}/revocar", headers=headers_usuario)
    assert res1.status_code == 200

    # Segunda revocación debe dar conflicto 409
    res2 = client.post(f"/pedidos/{pedido_id}/revocar", headers=headers_usuario)
    assert res2.status_code == 409


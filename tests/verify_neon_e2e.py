import os
import sys
import httpx
from fastapi.testclient import TestClient
from app.main import app

def test_neon_e2e():
    print("Iniciando prueba End-to-End con Lakebase Postgres (Neon)...")
    print(f"DATABASE_URL: {os.environ.get('DATABASE_URL', '')[:45]}...")
    
    with TestClient(app) as client:
        # 1. Probar Endpoint de Salud
        res_salud = client.get("/salud")
        print(f"1. /salud -> Status {res_salud.status_code}, Body: {res_salud.json()}")
        assert res_salud.status_code == 200
        assert res_salud.json() == {"estado": "ok", "base": "ok"}
        
        # 2. Probar Login con usuario sembrado en Neon
        res_login = client.post(
            "/auth/login",
            data={"username": "thiagobenjamindusserremateo@gmail.com", "password": "1003benja"},
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        print(f"2. /auth/login -> Status {res_login.status_code}")
        assert res_login.status_code == 200
        tokens = res_login.json()
        token = tokens["access_token"]
        assert token is not None
        print("   Token JWT obtenido exitosamente.")
        
        # 3. Probar Catálogo de Productos consultando Neon
        res_prods = client.get("/productos")
        print(f"3. /productos -> Status {res_prods.status_code}, Total: {len(res_prods.json())} productos")
        assert res_prods.status_code == 200
        productos = res_prods.json()
        assert len(productos) > 0
        for p in productos[:3]:
            print(f"   - #{p['id']}: {p['nombre']} (${p['precio']}) [Stock: {p['stock']}]")
            
        # 4. Probar Perfil Autenticado (/auth/me) contra Neon
        headers = {"Authorization": f"Bearer {token}"}
        res_me = client.get("/auth/me", headers=headers)
        print(f"4. /auth/me -> Status {res_me.status_code}, Usuario: {res_me.json()['email']} (Rol: {res_me.json()['rol']})")
        assert res_me.status_code == 200
        assert res_me.json()["rol"] == "admin"
        
    print("\nTODOS LOS SERVICIOS DE NEON PROBADOS END-TO-END CON ÉXITO.")

if __name__ == "__main__":
    test_neon_e2e()


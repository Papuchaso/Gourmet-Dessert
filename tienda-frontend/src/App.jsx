import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CarritoProvider } from './context/CarritoContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AuthModal } from './components/AuthModal';
import { RutaProtegida } from './components/RutaProtegida';
import { RutaAdmin } from './components/RutaAdmin';
import { Catalogo } from './pages/Catalogo';
import { Carrito } from './pages/Carrito';
import { MisPedidos } from './pages/MisPedidos';
import { MisDatos } from './pages/MisDatos';
import { MiPerfil } from './pages/MiPerfil';
import { AdminProductos } from './pages/AdminProductos';
import { Arrepentimiento } from './pages/Arrepentimiento';
import { RecuperarContrasena } from './pages/RecuperarContrasena';
import { RestablecerContrasena } from './pages/RestablecerContrasena';
import './index.css';

export default function App() {
  const [rutaActual, setRutaActual] = useState('catalogo');
  const [tokenRecuperacion, setTokenRecuperacion] = useState('');

  useEffect(() => {
    window.__setRutaActual = setRutaActual;

    // Detectar si el usuario ingresó mediante un enlace de recuperación con ?token=...
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const ruta = params.get('ruta');
    const pathname = window.location.pathname;

    if (token) {
      setTokenRecuperacion(token);
      setRutaActual('restablecer-contrasena');
    } else if (ruta) {
      setRutaActual(ruta);
    } else if (pathname === '/admin/productos' || pathname === '/admin') {
      setRutaActual('/admin/productos');
    } else if (pathname === '/perfil' || pathname === '/mis-datos') {
      setRutaActual('perfil');
    }
  }, []);

  return (
    <AuthProvider>
      <CarritoProvider>
        <div className="app-layout">
          <Navbar setRutaActual={setRutaActual} />
          
          <main className="main-content">
            {rutaActual === 'catalogo' && <Catalogo />}
            {rutaActual === 'carrito' && <Carrito setRutaActual={setRutaActual} />}
            
            {/* Ruta PÚBLICA de Arrepentimiento (Ley 24.240) */}
            {rutaActual === 'arrepentimiento' && (
              <Arrepentimiento setRutaActual={setRutaActual} />
            )}

            {/* Flujo de Recuperación de Contraseña */}
            {rutaActual === 'recuperar-contrasena' && (
              <RecuperarContrasena
                setRutaActual={setRutaActual}
                onVolverLogin={() => setRutaActual('catalogo')}
              />
            )}

            {/* Flujo de Restablecimiento de Contraseña */}
            {rutaActual === 'restablecer-contrasena' && (
              <RestablecerContrasena
                tokenFromUrl={tokenRecuperacion}
                setRutaActual={setRutaActual}
              />
            )}

            {/* Rutas Protegidas de Usuario */}
            {rutaActual === 'mis-pedidos' && (
              <RutaProtegida>
                <MisPedidos setRutaActual={setRutaActual} />
              </RutaProtegida>
            )}

            {(rutaActual === 'mis-datos' || rutaActual === '/mis-datos' || rutaActual === 'perfil' || rutaActual === '/perfil') && (
              <RutaProtegida>
                <MiPerfil setRutaActual={setRutaActual} />
              </RutaProtegida>
            )}

            {/* Ruta Protegida EXCLUSIVA de Administrador */}
            {(rutaActual === '/admin/productos' || rutaActual === 'admin-productos' || rutaActual === 'admin' || rutaActual === '/admin') && (
              <RutaAdmin setRutaActual={setRutaActual}>
                <AdminProductos setRutaActual={setRutaActual} />
              </RutaAdmin>
            )}
          </main>

          {/* Pie de página con Botón de Arrepentimiento global */}
          <Footer setRutaActual={setRutaActual} />

          {/* Modal Flotante de Autenticación */}
          <AuthModal setRutaActual={setRutaActual} />
        </div>
      </CarritoProvider>
    </AuthProvider>
  );
}



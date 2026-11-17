import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

/**
 * Componente Guard / HOC para proteger rutas exclusivas de administración.
 * Redirige automáticamente a usuarios sin privilegios a la portada.
 */
export const RutaAdmin = ({ children, setRutaActual }) => {
  const { usuario, estaAutenticado, cargandoSesion, abrirModalAuth } = useAuth();
  const esAdmin = usuario?.es_admin === true || usuario?.rol === 'admin';

  useEffect(() => {
    if (!cargandoSesion && (!estaAutenticado || !esAdmin)) {
      const timer = setTimeout(() => {
        if (setRutaActual) {
          setRutaActual('catalogo');
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [cargandoSesion, estaAutenticado, esAdmin, setRutaActual]);

  if (cargandoSesion) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
        <p>Verificando credenciales de administrador...</p>
      </div>
    );
  }

  if (!estaAutenticado) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="unauthorized-card" style={{ maxWidth: '460px', margin: '0 auto' }}>
          <span style={{ fontSize: '3.5rem' }}>🔒</span>
          <h2>Acceso Restringido</h2>
          <p>Debes iniciar sesión con una cuenta de administrador para acceder.</p>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-secondary" onClick={() => setRutaActual && setRutaActual('catalogo')}>
              Ir a la Portada
            </button>
            <button className="btn-primary-action" onClick={abrirModalAuth}>
              Iniciar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!esAdmin) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <div className="unauthorized-card" style={{ maxWidth: '460px', margin: '0 auto' }}>
          <span style={{ fontSize: '3.5rem' }}>🚫</span>
          <h2>Acceso Denegado</h2>
          <p>Tu cuenta no cuenta con permisos de administrador (<code>usuario.es_admin !== true</code>).</p>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Redirigiendo a la portada...</p>
          <button className="btn-primary-action" style={{ marginTop: '12px' }} onClick={() => setRutaActual && setRutaActual('catalogo')}>
            Volver a la Portada
          </button>
        </div>
      </div>
    );
  }

  return children;
};

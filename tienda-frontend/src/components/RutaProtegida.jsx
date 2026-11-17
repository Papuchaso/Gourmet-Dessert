import React from 'react';
import { useAuth } from '../context/AuthContext';

export const RutaProtegida = ({ children, redirigirALogin }) => {
  const { estaAutenticado, cargandoSesion, abrirModalAuth } = useAuth();

  if (cargandoSesion) {
    return <div className="loading-container">Verificando sesión...</div>;
  }

  if (!estaAutenticado) {
    return (
      <div className="unauthorized-card">
        <span style={{ fontSize: '3rem' }}>🔒</span>
        <h2>Acceso Restringido</h2>
        <p>Debes iniciar sesión para ver esta sección.</p>
        <button className="btn-primary-action" onClick={abrirModalAuth}>
          Iniciar Sesión
        </button>
      </div>
    );
  }

  return children;
};

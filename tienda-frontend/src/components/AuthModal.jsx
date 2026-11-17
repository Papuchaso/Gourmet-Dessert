import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { FormLogin } from './FormLogin';
import { FormRegistro } from './FormRegistro';

export const AuthModal = ({ setRutaActual }) => {
  const { modalAuthAbierto, cerrarModalAuth } = useAuth();
  const [tabActiva, setTabActiva] = useState('login'); // 'login' | 'register'

  if (!modalAuthAbierto) return null;

  const irARecuperar = () => {
    cerrarModalAuth();
    if (setRutaActual) {
      setRutaActual('recuperar-contrasena');
    } else if (typeof window !== 'undefined' && window.__setRutaActual) {
      window.__setRutaActual('recuperar-contrasena');
    }
  };

  return (
    <div className="modal-overlay" onClick={cerrarModalAuth}>
      <div className="modal-card auth-modal-card" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close-btn"
          onClick={cerrarModalAuth}
          aria-label="Cerrar modal"
        >
          &times;
        </button>

        <div className="modal-header">
          <span className="modal-icon">🍯</span>
          <h2>
            {tabActiva === 'login' ? '¡Bienvenido a Gourmet Dessert!' : 'Crear Nueva Cuenta'}
          </h2>
          <p className="modal-subtitle">
            {tabActiva === 'login'
              ? 'Iniciá sesión para acceder al catálogo y gestionar tus pedidos.'
              : 'Registrate para pedir tus postres engaña-ojos y chucherías para el IRESM.'}
          </p>
        </div>

        {/* Pestañas de Navegación Login / Registro */}
        <div
          style={{
            display: 'flex',
            background: 'var(--pastel-pink-light)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            marginBottom: '20px',
            border: '1.5px solid var(--pastel-pink)'
          }}
        >
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              background: tabActiva === 'login' ? 'white' : 'transparent',
              color: tabActiva === 'login' ? 'var(--pastel-pink-accent)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: tabActiva === 'login' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setTabActiva('login')}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            style={{
              flex: 1,
              padding: '8px 16px',
              border: 'none',
              borderRadius: 'var(--radius-full)',
              background: tabActiva === 'register' ? 'white' : 'transparent',
              color: tabActiva === 'register' ? 'var(--pastel-pink-accent)' : 'var(--text-muted)',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: tabActiva === 'register' ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setTabActiva('register')}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Formulario Login */}
        {tabActiva === 'login' && (
          <FormLogin
            onSuccess={cerrarModalAuth}
            onSwitchToRegister={() => setTabActiva('register')}
            onForgotPassword={irARecuperar}
          />
        )}

        {/* Formulario Registro */}
        {tabActiva === 'register' && (
          <FormRegistro
            onSuccess={cerrarModalAuth}
            onSwitchToLogin={() => setTabActiva('login')}
          />
        )}
      </div>
    </div>
  );
};

export default AuthModal;

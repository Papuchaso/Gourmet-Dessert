import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { restablecerContrasena } from '../services/api';

/**
 * Vista de Restablecimiento de Contraseña.
 * Recibe el token desde la URL, valida en tiempo real y actualiza la clave.
 */
export const RestablecerContrasena = ({ tokenFromUrl, setRutaActual }) => {
  const { abrirModalAuth } = useAuth();

  // Obtener el token de la URL si no viene por prop
  const [token, setToken] = useState(tokenFromUrl || '');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);

  // Estados de proceso
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);
  const [exito, setExito] = useState(false);
  const [contadorRedireccion, setContadorRedireccion] = useState(5);

  useEffect(() => {
    if (!token) {
      const params = new URLSearchParams(window.location.search);
      const urlToken = params.get('token');
      if (urlToken) {
        setToken(urlToken);
      }
    }
  }, [token]);

  // Validaciones en tiempo real
  const tieneLongitudMinima = nuevaPassword.length >= 8;
  const tieneNumero = /\d/.test(nuevaPassword);
  const coinciden = nuevaPassword.length > 0 && nuevaPassword === confirmarPassword;
  const formularioValido = tieneLongitudMinima && tieneNumero && coinciden;

  // Redirección automática al login tras éxito
  useEffect(() => {
    let intervalo = null;
    if (exito) {
      intervalo = setInterval(() => {
        setContadorRedireccion((prev) => {
          if (prev <= 1) {
            clearInterval(intervalo);
            if (setRutaActual) setRutaActual('catalogo');
            abrirModalAuth();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalo) clearInterval(intervalo);
    };
  }, [exito, setRutaActual, abrirModalAuth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formularioValido || cargando) return;

    if (!token) {
      setError('No se proporcionó un token de recuperación válido. Por favor, solicita un nuevo enlace.');
      return;
    }

    setError(null);
    setCargando(true);

    try {
      await restablecerContrasena(token, nuevaPassword);
      setExito(true);
    } catch (err) {
      setError(err.message || 'El enlace de recuperación es inválido o ha expirado.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container auth-page-container">
      <div className="auth-card-wrapper card-style">
        <div className="auth-card-header">
          <span className="auth-header-icon">🛡️</span>
          <h2>Restablecer Contraseña</h2>
          <p>Crea una nueva contraseña segura para acceder a tu cuenta.</p>
        </div>

        {exito ? (
          <div className="recovery-success-box" role="status">
            <div className="success-icon-badge">🎉</div>
            <h3>¡Contraseña Restablecida!</h3>
            <p>Tu contraseña ha sido actualizada exitosamente.</p>
            <p className="redirect-hint">
              Serás redirigido al inicio de sesión en <strong>{contadorRedireccion}</strong> segundos...
            </p>
            <button
              type="button"
              className="btn-primary-action"
              style={{ marginTop: '16px' }}
              onClick={() => {
                if (setRutaActual) setRutaActual('catalogo');
                abrirModalAuth();
              }}
            >
              Iniciar Sesión Ahora
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-body">
            {error && (
              <div className="alert-box error-alert" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            {!token && (
              <div className="alert-box warning-alert" role="alert">
                <span>⚠️ Advertencia: No se detectó un token en el enlace. Asegúrate de abrir el enlace completo que recibiste por correo.</span>
              </div>
            )}

            {/* Campo Nueva Contraseña */}
            <div className="form-group">
              <label htmlFor="nueva-password">Nueva Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  id="nueva-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                  disabled={cargando}
                  className="input-custom-auth"
                />
                <button
                  type="button"
                  className="btn-toggle-eye"
                  onClick={() => setMostrarPassword(!mostrarPassword)}
                  aria-label="Ver u ocultar contraseña"
                >
                  {mostrarPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Campo Confirmar Contraseña */}
            <div className="form-group">
              <label htmlFor="confirmar-password">Confirmar Nueva Contraseña</label>
              <input
                id="confirmar-password"
                type={mostrarPassword ? 'text' : 'password'}
                placeholder="Repite la nueva contraseña"
                value={confirmarPassword}
                onChange={(e) => setConfirmarPassword(e.target.value)}
                required
                disabled={cargando}
                className="input-custom-auth"
              />
            </div>

            {/* Checklist de Validación en Tiempo Real */}
            <div className="password-validation-checklist">
              <div className={`check-item ${tieneLongitudMinima ? 'valid' : 'invalid'}`}>
                <span>{tieneLongitudMinima ? '✓' : '○'}</span>
                <span>Mínimo 8 caracteres</span>
              </div>
              <div className={`check-item ${tieneNumero ? 'valid' : 'invalid'}`}>
                <span>{tieneNumero ? '✓' : '○'}</span>
                <span>Al menos un número</span>
              </div>
              <div className={`check-item ${coinciden ? 'valid' : 'invalid'}`}>
                <span>{coinciden ? '✓' : '○'}</span>
                <span>Las contraseñas coinciden</span>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primary-action"
              disabled={!formularioValido || cargando || !token}
            >
              {cargando ? 'Actualizando contraseña…' : '🔒 Restablecer Contraseña'}
            </button>

            <div className="auth-footer-links">
              <button
                type="button"
                className="btn-link-simple"
                onClick={() => {
                  if (setRutaActual) setRutaActual('catalogo');
                  abrirModalAuth();
                }}
              >
                ← Cancelar y volver al inicio
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { solicitarRecuperacion } from '../services/api';

/**
 * Vista de Solicitud de Restablecimiento de Contraseña.
 * Implementa prevención de enumeración de usuarios respondiendo siempre con un mensaje genérico.
 */
export const RecuperarContrasena = ({ setRutaActual, onVolverLogin }) => {
  const [email, setEmail] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [error, setError] = useState(null);

  const [infoRecuperacion, setInfoRecuperacion] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cargando) return;

    setError(null);
    setCargando(true);

    try {
      const respuesta = await solicitarRecuperacion(email);
      // Mensaje genérico de seguridad (Prevención de enumeración de usuarios)
      setMensajeExito(
        respuesta.mensaje ||
        'Si el correo ingresado se encuentra registrado en nuestra base de datos, recibirás un mensaje con las instrucciones y el enlace para restablecer tu contraseña.'
      );
      setInfoRecuperacion(respuesta);
      setEmail('');
    } catch (err) {
      setError(err.message || 'Ocurrió un error al procesar tu solicitud. Inténtalo más tarde.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container auth-page-container">
      <div className="auth-card-wrapper card-style">
        <div className="auth-card-header">
          <span className="auth-header-icon">🔐</span>
          <h2>Recuperar Contraseña</h2>
          <p>
            Ingresa el correo electrónico asociado a tu cuenta y te enviaremos un enlace de recuperación seguro.
          </p>
        </div>

        {mensajeExito ? (
          <div className="recovery-success-box" role="status">
            <div className="success-icon-badge">📩</div>
            <h3>¡Instrucciones Generadas!</h3>
            <p>{mensajeExito}</p>

            {/* Enlace directo para pruebas en entorno de desarrollo */}
            {infoRecuperacion?.token && (
              <div className="dev-recovery-link-card">
                <span className="dev-badge">🧪 Entorno de Desarrollo Local</span>
                <p>Simulación del correo de recuperación recibido:</p>
                <button
                  type="button"
                  className="btn-primary-action btn-go-reset"
                  onClick={() => {
                    if (setRutaActual) {
                      // Actualizar token en URL y cambiar a la vista de restablecimiento
                      window.history.pushState({}, '', `?ruta=restablecer-contrasena&token=${infoRecuperacion.token}`);
                      setRutaActual('restablecer-contrasena');
                    }
                  }}
                >
                  🔗 Ir a Restablecer Mi Contraseña Ahora
                </button>
                <div className="dev-url-copy">
                  <small>Enlace directo generado:</small>
                  <code>{`${typeof window !== 'undefined' ? window.location.origin : ''}/?ruta=restablecer-contrasena&token=${infoRecuperacion.token}`}</code>
                </div>
              </div>
            )}

            <div className="recovery-security-tip">
              <small>
                💡 <strong>Consejo de seguridad:</strong> El token de recuperación tiene una validez estricta de 15 minutos.
              </small>
            </div>

            <button
              type="button"
              className="btn-secondary-action"
              style={{ marginTop: '16px', width: '100%' }}
              onClick={() => {
                if (onVolverLogin) onVolverLogin();
                else if (setRutaActual) setRutaActual('catalogo');
              }}
            >
              Volver al Catálogo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form-body">
            {error && (
              <div className="alert-box error-alert" role="alert">
                <span>⚠️ {error}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="recovery-email">Correo Electrónico Registrado</label>
              <input
                id="recovery-email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                disabled={cargando}
                className="input-custom-auth"
              />
            </div>

            <button
              type="submit"
              className="btn-primary-action"
              disabled={cargando || !email.trim()}
            >
              {cargando ? 'Enviando instrucciones…' : 'Enviar instrucciones'}
            </button>

            <div className="auth-footer-links">
              <button
                type="button"
                className="btn-link-simple"
                onClick={() => {
                  if (onVolverLogin) onVolverLogin();
                  else if (setRutaActual) setRutaActual('catalogo');
                }}
              >
                ← Volver al inicio de sesión
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

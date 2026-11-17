import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const FormLogin = ({ onSuccess, onSwitchToRegister, onForgotPassword }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setCargando(true);

    try {
      await login(email, password);
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Credenciales de acceso incorrectas. Por favor, verifica tu correo y contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" id="form-login">
      {error && (
        <div className="alert-error" role="alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="login-email">Correo Electrónico</label>
        <div className="input-wrapper">
          <input
            id="login-email"
            type="email"
            placeholder="tu.nombre@iresm.edu.ar"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={cargando}
          />
        </div>
      </div>

      <div className="form-group">
        <div className="label-with-link">
          <label htmlFor="login-password">Contraseña</label>
          {onForgotPassword && (
            <button
              type="button"
              className="btn-forgot-password"
              onClick={onForgotPassword}
            >
              ¿Olvidaste tu contraseña?
            </button>
          )}
        </div>
        <div className="password-input-wrapper">
          <input
            id="login-password"
            type={mostrarPassword ? 'text' : 'password'}
            placeholder="Tu contraseña secreta"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={cargando}
          />
          <button
            type="button"
            className="btn-toggle-eye"
            onClick={() => setMostrarPassword(!mostrarPassword)}
            tabIndex={-1}
            aria-label="Ver u ocultar contraseña"
          >
            {mostrarPassword ? '🙈' : '👁️'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        className="btn-primary-action"
        disabled={cargando}
        id="btn-submit-login"
      >
        {cargando ? '🚀 Iniciando Sesión...' : '🚀 Iniciar Sesión'}
      </button>

      {onSwitchToRegister && (
        <div className="modal-footer-hint" style={{ marginTop: '16px' }}>
          <span>¿No tienes una cuenta?</span>{' '}
          <button
            type="button"
            className="btn-link-text"
            onClick={onSwitchToRegister}
          >
            Regístrate aquí
          </button>
        </div>
      )}
    </form>
  );
};

export default FormLogin;

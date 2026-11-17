import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const FormRegistro = ({ onSuccess, onSwitchToLogin }) => {
  const { registro } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [aceptoTratamiento, setAceptoTratamiento] = useState(true);
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [error, setError] = useState(null);
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!aceptoTratamiento) {
      setError('Debes aceptar los términos de tratamiento de datos personales para registrarte.');
      return;
    }

    setError(null);
    setCargando(true);

    try {
      await registro({
        nombre,
        email,
        password,
        acepto_tratamiento: aceptoTratamiento
      });
      if (onSuccess) onSuccess();
    } catch (err) {
      setError(err.message || 'Ocurrió un error al registrar tu cuenta.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" id="form-register">
      {error && (
        <div className="alert-error" role="alert">
          <span>⚠️ {error}</span>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="reg-nombre">Nombre y Apellido</label>
        <input
          id="reg-nombre"
          type="text"
          placeholder="Ej: Santiago Giménez"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          autoComplete="name"
          disabled={cargando}
        />
      </div>

      <div className="form-group">
        <label htmlFor="reg-email">Correo Electrónico</label>
        <input
          id="reg-email"
          type="email"
          placeholder="tu.nombre@iresm.edu.ar"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          disabled={cargando}
        />
        <small style={{ display: 'block', marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          ✨ Tu avatar inicial se generará automáticamente con las iniciales de tu nombre.
        </small>
      </div>

      <div className="form-group">
        <label htmlFor="reg-password">Contraseña</label>
        <div className="password-input-wrapper">
          <input
            id="reg-password"
            type={mostrarPassword ? 'text' : 'password'}
            placeholder="Mínimo 6 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
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

      <div className="form-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '14px 0' }}>
        <input
          id="reg-consent"
          type="checkbox"
          checked={aceptoTratamiento}
          onChange={(e) => setAceptoTratamiento(e.target.checked)}
          required
          disabled={cargando}
          style={{ width: 'auto', marginTop: '4px' }}
        />
        <label htmlFor="reg-consent" style={{ fontSize: '0.82rem', fontWeight: 'normal', color: 'var(--text-muted)', lineHeight: '1.4' }}>
          Acepto los términos de tratamiento de datos personales conforme a la <strong>Ley N° 24.240</strong> de Defensa del Consumidor.
        </label>
      </div>

      <button
        type="submit"
        className="btn-primary-action"
        disabled={cargando}
        id="btn-submit-register"
      >
        {cargando ? '🎉 Creando Cuenta...' : '🎉 Registrarse y Entrar'}
      </button>

      {onSwitchToLogin && (
        <div className="modal-footer-hint" style={{ marginTop: '16px' }}>
          <span>¿Ya tienes una cuenta registrada?</span>{' '}
          <button
            type="button"
            className="btn-link-text"
            onClick={onSwitchToLogin}
          >
            Inicia sesión aquí
          </button>
        </div>
      )}
    </form>
  );
};

export default FormRegistro;

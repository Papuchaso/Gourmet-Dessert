import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import {
  getMisDatos,
  cambiarPassword,
  subirAvatarUsuario,
  eliminarMiCuenta,
  obtenerUrlImagen
} from '../services/api';

export const MiPerfil = ({ setRutaActual }) => {
  const { usuario, estaAutenticado, cerrarSesion } = useAuth();
  const { vaciar } = useCarrito();

  // Estados de datos de usuario
  const [datosCompletos, setDatosCompletos] = useState(null);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [errorDatos, setErrorDatos] = useState(null);

  // Estados para Cambiar Contraseña
  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [guardandoPassword, setGuardandoPassword] = useState(false);
  const [mensajeExitoPassword, setMensajeExitoPassword] = useState('');
  const [errorPassword, setErrorPassword] = useState('');

  // Estados para Avatar
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [mensajeExitoAvatar, setMensajeExitoAvatar] = useState('');
  const [errorAvatar, setErrorAvatar] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');

  // Estados para Descargar JSON y Eliminar Cuenta
  const [exportando, setExportando] = useState(false);
  const [palabraEliminar, setPalabraEliminar] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState('');

  const cargarDatos = async () => {
    setCargandoDatos(true);
    setErrorDatos(null);
    try {
      const data = await getMisDatos();
      setDatosCompletos(data);
    } catch (err) {
      console.warn('No se pudieron obtener datos adicionales:', err.message);
      setErrorDatos(err.message);
    } finally {
      setCargandoDatos(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  // 1. Manejo de Subida de Avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorAvatar('El archivo seleccionado debe ser una imagen (JPG, PNG, WEBP).');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setErrorAvatar('La imagen supera el límite máximo permitido de 2 MB.');
      return;
    }

    setErrorAvatar('');
    setMensajeExitoAvatar('');
    setSubiendoAvatar(true);

    try {
      const resultado = await subirAvatarUsuario(file);
      setAvatarPreview(resultado.foto_perfil || resultado.avatar_url || URL.createObjectURL(file));
      setMensajeExitoAvatar('¡Foto de perfil actualizada exitosamente!');
      setTimeout(() => setMensajeExitoAvatar(''), 4000);
      
      // Actualizar localStorage y recargar datos
      const stored = localStorage.getItem('usuario_info');
      if (stored) {
        const parsed = JSON.parse(stored);
        parsed.foto_perfil = resultado.foto_perfil || resultado.avatar_url;
        localStorage.setItem('usuario_info', JSON.stringify(parsed));
      }
      cargarDatos();
    } catch (err) {
      setErrorAvatar(err.message || 'Error al actualizar la foto de perfil.');
    } finally {
      setSubiendoAvatar(false);
    }
  };

  // 2. Manejo de Cambio de Contraseña
  const handleCambiarPassword = async (e) => {
    e.preventDefault();
    setErrorPassword('');
    setMensajeExitoPassword('');

    if (!passwordActual) {
      setErrorPassword('Debes ingresar tu contraseña actual.');
      return;
    }

    if (passwordNueva.length < 6) {
      setErrorPassword('La nueva contraseña debe contener al menos 6 caracteres.');
      return;
    }

    if (passwordNueva !== passwordConfirm) {
      setErrorPassword('La nueva contraseña y su confirmación no coinciden.');
      return;
    }

    setGuardandoPassword(true);

    try {
      const res = await cambiarPassword(passwordActual, passwordNueva);
      setMensajeExitoPassword(res.mensaje || '¡Contraseña modificada correctamente!');
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordConfirm('');
      setTimeout(() => setMensajeExitoPassword(''), 5000);
    } catch (err) {
      setErrorPassword(err.message || 'No se pudo cambiar la contraseña.');
    } finally {
      setGuardandoPassword(false);
    }
  };

  // 3. Exportar JSON de Datos Personales
  const handleExportarJSON = () => {
    const dataAExportar = datosCompletos || {
      id: usuario?.id,
      nombre: usuario?.nombre,
      email: usuario?.email,
      rol: usuario?.rol,
      fecha_consentimiento: usuario?.fecha_consentimiento
    };

    setExportando(true);
    try {
      const jsonString = JSON.stringify(dataAExportar, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = `mis_datos_gourmet_dessert_${Date.now()}.json`;
      document.body.appendChild(enlace);
      enlace.click();
      document.body.removeChild(enlace);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error al exportar datos: ${err.message}`);
    } finally {
      setExportando(false);
    }
  };

  // 4. Eliminación Permanente de Cuenta
  const handleEliminarCuenta = async () => {
    if (palabraEliminar !== 'ELIMINAR') return;

    const confirmacion = window.confirm(
      '¿Estás completamente seguro/a? Esta acción eliminará permanentemente tu cuenta y credenciales de acceso.'
    );
    if (!confirmacion) return;

    setEliminando(true);
    setErrorEliminar('');

    try {
      await eliminarMiCuenta();
      vaciar();
      cerrarSesion();
      alert('Tu cuenta ha sido eliminada permanentemente.');
      if (setRutaActual) setRutaActual('catalogo');
    } catch (err) {
      setErrorEliminar(err.message || 'Error al eliminar la cuenta.');
      setEliminando(false);
    }
  };

  const fotoActual = avatarPreview || obtenerUrlImagen(usuario?.foto_perfil || datosCompletos?.foto_perfil);

  return (
    <div className="container mi-perfil-page">
      {/* Encabezado Principal */}
      <div className="perfil-header-banner">
        <div className="perfil-header-title">
          <span className="perfil-header-icon">👤</span>
          <div>
            <h2>Mis Datos & Privacidad</h2>
            <p className="perfil-subtitle">
              Administra tu información de cuenta, contraseña y derechos conforme a la Ley N° 24.240.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="btn-exportar-perfil"
          onClick={handleExportarJSON}
          disabled={exportando}
        >
          {exportando ? '⏳ Exportando...' : '📥 Descargar Mis Datos (JSON)'}
        </button>
      </div>

      <div className="perfil-grid-layout">
        {/* ========================================================================= */}
        {/* COLUMNA 1: DATOS PERSONALES Y FOTO DE PERFIL                              */}
        {/* ========================================================================= */}
        <div className="perfil-card card-avatar-info">
          <div className="card-header-clean">
            <h3>📷 Foto de Perfil & Datos de Cuenta</h3>
          </div>

          <div className="avatar-section-wrapper">
            <div className="avatar-preview-box">
              <img
                src={fotoActual || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pastel'}
                alt={usuario?.nombre || 'Usuario'}
                className="perfil-img-large"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pastel';
                }}
              />
              {subiendoAvatar && <div className="avatar-upload-overlay">⏳ Subiendo...</div>}
            </div>

            <div className="avatar-controls">
              <label htmlFor="avatar-file-input" className="btn-upload-avatar">
                📁 {subiendoAvatar ? 'Subiendo imagen...' : 'Cambiar Foto de Perfil'}
              </label>
              <input
                id="avatar-file-input"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                disabled={subiendoAvatar}
                style={{ display: 'none' }}
              />
              <small className="help-text">Formatos: JPG, PNG o WEBP (Máx. 2MB)</small>

              {mensajeExitoAvatar && (
                <div className="alert-mini success-mini">✅ {mensajeExitoAvatar}</div>
              )}
              {errorAvatar && (
                <div className="alert-mini error-mini">⚠️ {errorAvatar}</div>
              )}
            </div>
          </div>

          <div className="user-info-fields">
            <div className="info-field-row">
              <span className="info-label">Nombre Completo:</span>
              <strong className="info-value">{usuario?.nombre || datosCompletos?.nombre || 'No disponible'}</strong>
            </div>

            <div className="info-field-row">
              <span className="info-label">Correo Electrónico:</span>
              <strong className="info-value truncate-email">{usuario?.email || datosCompletos?.email || 'No disponible'}</strong>
            </div>

            <div className="info-field-row">
              <span className="info-label">Rol en la Tienda:</span>
              <span className={`badge-rol ${usuario?.es_admin || usuario?.rol === 'admin' ? 'rol-admin' : 'rol-customer'}`}>
                {usuario?.es_admin || usuario?.rol === 'admin' ? '⚡ Administrador' : '🎓 Cliente / Alumno IRESM'}
              </span>
            </div>

            <div className="info-field-row">
              <span className="info-label">Consentimiento de Tratamiento:</span>
              <span className="badge-consentimiento">
                ✅ Aceptado ({usuario?.fecha_consentimiento || datosCompletos?.fecha_consentimiento
                  ? new Date(usuario?.fecha_consentimiento || datosCompletos?.fecha_consentimiento).toLocaleDateString('es-AR')
                  : 'Registrado'})
              </span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* COLUMNA 2: CAMBIO DE CONTRASEÑA                                           */}
        {/* ========================================================================= */}
        <div className="perfil-card card-password-security">
          <div className="card-header-clean">
            <h3>🔒 Seguridad & Cambio de Contraseña</h3>
          </div>

          <form onSubmit={handleCambiarPassword} className="form-perfil-password">
            {mensajeExitoPassword && (
              <div className="alert-box success-alert" role="alert">
                <span>✅ {mensajeExitoPassword}</span>
              </div>
            )}

            {errorPassword && (
              <div className="alert-box error-alert" role="alert">
                <span>⚠️ {errorPassword}</span>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="pwd-actual">Contraseña Actual <span className="req-star">*</span></label>
              <input
                id="pwd-actual"
                type="password"
                className="form-control"
                placeholder="Ingresa tu contraseña actual"
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
                disabled={guardandoPassword}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="pwd-nueva">Nueva Contraseña <span className="req-star">*</span></label>
              <input
                id="pwd-nueva"
                type="password"
                className="form-control"
                placeholder="Mínimo 6 caracteres"
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
                disabled={guardandoPassword}
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="pwd-confirm">Confirmar Nueva Contraseña <span className="req-star">*</span></label>
              <input
                id="pwd-confirm"
                type="password"
                className="form-control"
                placeholder="Repite la nueva contraseña"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                disabled={guardandoPassword}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary-action btn-submit-pwd"
              disabled={guardandoPassword}
            >
              {guardandoPassword ? '⏳ Actualizando Contraseña...' : '💾 Actualizar Contraseña'}
            </button>
          </form>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN 3: ZONA DE ELIMINACIÓN DE CUENTA                                  */}
      {/* ========================================================================= */}
      <div className="perfil-card danger-zone-card">
        <div className="danger-zone-header">
          <span className="danger-zone-icon">⚠️</span>
          <div>
            <h3>Zona de Eliminación Permanente de Cuenta</h3>
            <p className="danger-zone-desc">
              Esta acción es irreversible y removerá de forma definitiva tu información de inicio de sesión y datos personales.
            </p>
          </div>
        </div>

        <div className="danger-action-row">
          <div className="danger-input-wrap">
            <label htmlFor="input-eliminar-perfil">
              Escribe la palabra exacta <strong>ELIMINAR</strong> para confirmar:
            </label>
            <input
              id="input-eliminar-perfil"
              type="text"
              className="form-control input-danger"
              placeholder="ELIMINAR"
              value={palabraEliminar}
              onChange={(e) => setPalabraEliminar(e.target.value)}
              disabled={eliminando}
              autoComplete="off"
            />
          </div>

          <button
            type="button"
            className="btn-danger-confirm"
            onClick={handleEliminarCuenta}
            disabled={palabraEliminar !== 'ELIMINAR' || eliminando}
          >
            {eliminando ? '⏳ Eliminando...' : '🗑️ Eliminar Mi Cuenta'}
          </button>
        </div>

        {errorEliminar && (
          <div className="alert-box error-alert" style={{ marginTop: '14px' }}>
            <span>⚠️ {errorEliminar}</span>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { getMisDatos, eliminarMiCuenta } from '../services/api';

export const MisDatos = ({ setRutaActual }) => {
  const { cerrarSesion } = useAuth();
  const { vaciar } = useCarrito();

  // Estados independientes requeridos
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para eliminación de cuenta
  const [palabraConfirmacion, setPalabraConfirmacion] = useState('');
  const [eliminando, setEliminando] = useState(false);
  const [errorEliminar, setErrorEliminar] = useState(null);

  // Estado para feedback de exportación
  const [exportando, setExportando] = useState(false);

  const cargarMisDatos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisDatos();
      setDatos(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarMisDatos();
  }, []);

  // 1. Exportación de Datos en Formato JSON
  const handleExportarJSON = () => {
    if (!datos) return;
    setExportando(true);
    try {
      const jsonString = JSON.stringify(datos, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);

      // Crear enlace temporal dinámico
      const enlaceDescarga = document.createElement('a');
      enlaceDescarga.href = url;
      enlaceDescarga.download = `mis_datos_gourmet_dessert_${Date.now()}.json`;
      document.body.appendChild(enlaceDescarga);
      enlaceDescarga.click();

      // Limpieza del elemento y del objeto URL
      document.body.removeChild(enlaceDescarga);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`Error al exportar datos: ${err.message}`);
    } finally {
      setExportando(false);
    }
  };

  // 2. Eliminación de Cuenta
  const handleEliminarCuenta = async () => {
    if (palabraConfirmacion !== 'ELIMINAR') return;

    const confirmacionFinal = window.confirm(
      '¿Estás seguro/a? Esta acción es DEFINITIVA y eliminará tu cuenta y tus datos personales.'
    );
    if (!confirmacionFinal) return;

    setEliminando(true);
    setErrorEliminar(null);

    try {
      await eliminarMiCuenta();
      // Vaciar carrito
      vaciar();
      // Remover sesión activa
      cerrarSesion();
      // Notificar y navegar a portada
      alert('Tu cuenta y datos personales han sido eliminados correctamente.');
      setRutaActual('catalogo');
    } catch (err) {
      setErrorEliminar(`Error al eliminar la cuenta: ${err.message}`);
      setEliminando(false);
    }
  };

  // Render Condicional: CARGANDO
  if (cargando) {
    return (
      <div className="state-container">
        <div className="spinner"></div>
        <p>Cargando todos tus datos de usuario...</p>
      </div>
    );
  }

  // Render Condicional: ERROR
  if (error) {
    return (
      <div className="state-container error-state">
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h3>Error al consultar tus datos</h3>
        <p>{error}</p>
        <button className="btn-secondary" onClick={cargarMisDatos}>
          🔄 Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="container mis-datos-page">
      <div className="page-header-row">
        <div>
          <h2>👤 Mis Datos y Privacidad</h2>
          <p className="page-subtitle">
            Transparencia total sobre tu información personal conforme a la Ley N° 24.240 y normativas de protección de datos.
          </p>
        </div>

        <button
          type="button"
          className="btn-exportar-json"
          onClick={handleExportarJSON}
          disabled={exportando}
        >
          {exportando ? '⏳ Exportando...' : '📥 Descargar Mis Datos (JSON)'}
        </button>
      </div>

      {/* BLOQUE 1: Visualización Completa Sin Filtrar */}
      <section className="datos-section card-style">
        <div className="section-title-bar">
          <h3>📋 Información Personal & Registros Completos</h3>
        </div>

        <div className="datos-grid">
          <div className="dato-item">
            <span className="dato-label">Nombre Completo:</span>
            <span className="dato-value">{datos?.nombre || datos?.usuario?.nombre || 'No registrado'}</span>
          </div>

          <div className="dato-item">
            <span className="dato-label">Correo Electrónico:</span>
            <span className="dato-value">{datos?.email || datos?.usuario?.email || 'No registrado'}</span>
          </div>

          <div className="dato-item">
            <span className="dato-label">Rol en la Plataforma:</span>
            <span className="dato-value badge-rol">{datos?.rol || datos?.usuario?.rol || 'customer'}</span>
          </div>

          <div className="dato-item">
            <span className="dato-label">Fecha y Hora de Consentimiento:</span>
            <span className="dato-value">
              {datos?.fecha_consentimiento || datos?.usuario?.fecha_consentimiento
                ? new Date(datos?.fecha_consentimiento || datos?.usuario?.fecha_consentimiento).toLocaleString('es-AR')
                : 'Consentimiento registrado al crear la cuenta'}
            </span>
          </div>
        </div>

        {/* Historial de Pedidos en la respuesta sin filtrar */}
        <div className="sub-bloque">
          <h4>📦 Historial de Pedidos Registrados:</h4>
          {datos?.pedidos && Array.isArray(datos.pedidos) && datos.pedidos.length > 0 ? (
            <ul className="datos-pedidos-lista">
              {datos.pedidos.map((p) => (
                <li key={p.id || p.pedido_id} className="dato-pedido-fila">
                  <span>Pedido #{p.id || p.pedido_id} ({p.estado})</span>
                  <span>${Number(p.total || 0).toLocaleString('es-AR')}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-subtext">No constan pedidos adicionales en este registro.</p>
          )}
        </div>

        {/* Solicitudes de revocación o soporte */}
        <div className="sub-bloque">
          <h4>⚖️ Solicitudes y Trámites de Revocación:</h4>
          {datos?.solicitudes && Array.isArray(datos.solicitudes) && datos.solicitudes.length > 0 ? (
            <ul className="datos-solicitudes-lista">
              {datos.solicitudes.map((s, idx) => (
                <li key={idx} className="dato-solicitud-fila">
                  <span>Código: <code>{s.codigo_solicitud || s.codigo}</code></span>
                  <span>{s.tipo || 'Revocación'} - {s.estado || 'Procesada'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="empty-subtext">No tienes solicitudes de revocación pendientes.</p>
          )}
        </div>

        {/* Visor JSON sin filtrar para máxima transparencia */}
        <details className="raw-json-details">
          <summary>🔍 Ver estructura JSON completa del backend</summary>
          <pre className="raw-json-viewer">{JSON.stringify(datos, null, 2)}</pre>
        </details>
      </section>

      {/* BLOQUE 2: Eliminación de Cuenta */}
      <section className="eliminar-cuenta-section card-style danger-card">
        <div className="danger-header">
          <span className="danger-icon">⚠️</span>
          <h3>Eliminar Mi Cuenta</h3>
        </div>

        <div className="danger-explanation">
          <p>
            Al solicitar la eliminación permanente de tu cuenta en Gourmet Dessert:
          </p>
          <ul className="danger-list">
            <li>
              <strong>Datos que se eliminan definitivamente:</strong> Nombre completo, correo electrónico, contraseñas, avatares, fotos de perfil y sesiones abiertas.
            </li>
            <li>
              <strong>Datos que se conservan anonimizados:</strong> Los registros contables y transacciones de facturación requeridos por la legislación tributaria y normas de Defensa del Consumidor (Ley N° 24.240), disociados de cualquier dato de contacto.
            </li>
          </ul>
        </div>

        <div className="confirmacion-eliminar-box">
          <label htmlFor="input-eliminar">
            Para desbloquear el borrado, escribe la palabra exacta <strong>ELIMINAR</strong> a continuación:
          </label>
          <input
            id="input-eliminar"
            type="text"
            className="input-confirmar-eliminar"
            placeholder="Escribe ELIMINAR"
            value={palabraConfirmacion}
            onChange={(e) => setPalabraConfirmacion(e.target.value)}
            disabled={eliminando}
            autoComplete="off"
          />

          {errorEliminar && (
            <div className="alert-box error-alert" style={{ marginTop: '10px' }}>
              <span>{errorEliminar}</span>
            </div>
          )}

          <button
            type="button"
            className="btn-danger-confirm"
            disabled={palabraConfirmacion !== 'ELIMINAR' || eliminando}
            onClick={handleEliminarCuenta}
          >
            {eliminando ? '⏳ Eliminando cuenta...' : '🗑️ Eliminar Definitivamente Mi Cuenta'}
          </button>
        </div>
      </section>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { getMisPedidos, revocarPedido } from '../services/api';

/**
 * Determina si un pedido es elegible para ser revocado conforme a la Ley 24.240.
 * Retorna false si el estado es 'cancelado'/'revocado' o si han transcurrido más de 10 días corridos.
 */
export const puedeRevocar = (pedido) => {
  if (!pedido) return false;

  const estado = (pedido.estado || '').toLowerCase();
  if (estado === 'cancelado' || estado === 'revocado') {
    return false;
  }

  const fechaBase = pedido.creado_en || pedido.fecha;
  if (!fechaBase) return true;

  const fechaPedido = new Date(fechaBase);
  const ahora = new Date();
  const diferenciaDias = (ahora.getTime() - fechaPedido.getTime()) / (1000 * 60 * 60 * 24);

  return diferenciaDias <= 10;
};

export const MisPedidos = ({ setRutaActual }) => {
  const [pedidos, setPedidos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estados para revocación
  const [enviandoId, setEnviandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorRevocacion, setErrorRevocacion] = useState(null);

  const cargarPedidos = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getMisPedidos();
      setPedidos(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarPedidos();
  }, []);

  const handleRevocar = async (pedidoId) => {
    // Control anti-doble clic
    if (enviandoId) return;

    const confirmado = window.confirm(
      `¿Deseas revocar la compra del Pedido #${pedidoId}? Esta acción cancelará la orden conforme a la Ley 24.240 (Derecho de Arrepentimiento).`
    );
    if (!confirmado) return;

    setEnviandoId(pedidoId);
    setErrorRevocacion(null);
    setMensajeExito(null);

    try {
      const respuesta = await revocarPedido(pedidoId);
      const codigo = respuesta.codigo_solicitud || respuesta.codigo || `REV-${pedidoId}-${Date.now().toString().slice(-4)}`;
      
      setMensajeExito({
        pedidoId,
        codigoSolicitud: codigo,
        mensaje: respuesta.mensaje || 'Revocación procesada exitosamente.'
      });

      // Actualizar listado de pedidos
      await cargarPedidos();
    } catch (err) {
      setErrorRevocacion(`No se pudo revocar el Pedido #${pedidoId}: ${err.message}`);
    } finally {
      setEnviandoId(null);
    }
  };

  // 1. Render Condicional: CARGANDO
  if (cargando) {
    return (
      <div className="state-container">
        <div className="spinner"></div>
        <p>Cargando tu historial de pedidos...</p>
      </div>
    );
  }

  // 2. Render Condicional: ERROR
  if (error) {
    return (
      <div className="state-container error-state">
        <span style={{ fontSize: '3rem' }}>⚠️</span>
        <h3>No pudimos cargar tus pedidos</h3>
        <p>{error}</p>
        <button className="btn-secondary" onClick={cargarPedidos}>
          🔄 Reintentar
        </button>
      </div>
    );
  }

  // 3. Render Condicional: LISTA VACÍA
  if (pedidos.length === 0) {
    return (
      <div className="state-container empty-state">
        <span style={{ fontSize: '4rem' }}>📦</span>
        <h3>Aún no tienes pedidos registrados</h3>
        <p>Tus pedidos confirmados aparecerán en este historial.</p>
        <button
          className="btn-primary-action"
          onClick={() => setRutaActual('catalogo')}
        >
          Ir a Comprar
        </button>
      </div>
    );
  }

  // Render Principal: LISTA DE PEDIDOS
  return (
    <div className="mis-pedidos-page container">
      <div className="page-header-row">
        <h2>Mis Pedidos</h2>
        <button
          type="button"
          className="btn-link-arrepentimiento"
          onClick={() => setRutaActual('arrepentimiento')}
        >
          ⚖️ Conocer derecho de arrepentimiento
        </button>
      </div>

      {/* Banner accesible con role="status" tras revocación exitosa */}
      {mensajeExito && (
        <div className="alert-box success-alert" role="status" aria-live="polite">
          <span className="alert-icon">🎉</span>
          <div className="alert-content">
            <strong>¡Revocación Registrada Exitosamente!</strong>
            <p>
              Tu compra para el Pedido #{mensajeExito.pedidoId} ha sido revocada.
            </p>
            <div className="codigo-solicitud-badge">
              <span>Código de Solicitud:</span>
              <code>{mensajeExito.codigoSolicitud}</code>
            </div>
            <small>Guarda este código como constancia de revocación.</small>
          </div>
          <button
            type="button"
            className="alert-close"
            onClick={() => setMensajeExito(null)}
          >
            &times;
          </button>
        </div>
      )}

      {errorRevocacion && (
        <div className="alert-box error-alert" role="alert">
          <span>⚠️ {errorRevocacion}</span>
          <button
            type="button"
            className="alert-close"
            onClick={() => setErrorRevocacion(null)}
          >
            &times;
          </button>
        </div>
      )}

      <div className="pedidos-list">
        {pedidos.map((pedido) => {
          const pedidoId = pedido.id || pedido.pedido_id;
          const esRevocable = puedeRevocar(pedido);
          const estaEnviando = enviandoId === pedidoId;

          return (
            <div key={pedidoId} className="pedido-card">
              <div className="pedido-header">
                <div>
                  <strong>Pedido #{pedidoId}</strong>
                  <span className="pedido-fecha">
                    {pedido.creado_en || pedido.fecha
                      ? new Date(pedido.creado_en || pedido.fecha).toLocaleDateString('es-AR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'Reciente'}
                  </span>
                </div>
                <span className={`badge-estado ${(pedido.estado || 'completado').toLowerCase()}`}>
                  {pedido.estado || 'Confirmado'}
                </span>
              </div>

              <div className="pedido-items">
                {pedido.items?.map((item) => {
                  const prodKey = item.producto_id || item.id;
                  return (
                    <div key={prodKey} className="pedido-item-row">
                      <span className="item-cant">{item.cantidad}x</span>
                      <span className="item-nombre">{item.nombre || `Producto #${prodKey}`}</span>
                      <span className="item-precio">
                        ${(item.precio ? item.precio * item.cantidad : 0).toLocaleString('es-AR')}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="pedido-footer">
                <div className="total-box">
                  <span>Total Pagado:</span>
                  <strong>${(pedido.total || 0).toLocaleString('es-AR')}</strong>
                </div>

                {/* Botón condicionado a puedeRevocar() */}
                {esRevocable && (
                  <button
                    type="button"
                    className="btn-revocar-compra"
                    onClick={() => handleRevocar(pedidoId)}
                    disabled={estaEnviando}
                    title="Ejercer derecho de arrepentimiento (Ley 24.240)"
                  >
                    {estaEnviando ? '⏳ Procesando...' : '«Arrepentirme de esta compra»'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

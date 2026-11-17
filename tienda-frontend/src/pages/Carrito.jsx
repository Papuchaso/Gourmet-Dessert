import React, { useState } from 'react';
import { useCarrito } from '../context/CarritoContext';
import { useAuth } from '../context/AuthContext';
import { crearPedido } from '../services/api';
import { obtenerUrlImagen } from '../utils/helpers';

export const Carrito = ({ setRutaActual }) => {
  const { items, quitar, actualizarCantidad, vaciar, total } = useCarrito();
  const { estaAutenticado, abrirModalAuth } = useAuth();

  const [enviando, setEnviando] = useState(false);
  const [errorServidor, setErrorServidor] = useState(null);

  const handleConfirmarCompra = async () => {
    // Prevención de doble clic
    if (enviando) return;

    if (!estaAutenticado) {
      abrirModalAuth();
      return;
    }

    if (items.length === 0) return;

    setErrorServidor(null);
    setEnviando(true);

    try {
      // Envía los items transformados al backend
      await crearPedido(items);

      // Tras confirmar la compra de forma exitosa:
      vaciar();
      setRutaActual('mis-pedidos');
    } catch (error) {
      // Procesa 401, 409 (falta de stock) o genéricos
      setErrorServidor(error.message);
    } finally {
      setEnviando(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="carrito-vacio-container">
        <span style={{ fontSize: '4rem' }}>🛒</span>
        <h2>Tu carrito está vacío</h2>
        <p>Aún no has agregado delicias engaña-ojos a tu pedido.</p>
        <button
          className="btn-primary-action"
          onClick={() => setRutaActual('catalogo')}
        >
          Explorar Catálogo
        </button>
      </div>
    );
  }

  return (
    <div className="carrito-page container">
      <h2>Tu Carrito de Compras</h2>

      {errorServidor && (
        <div className="alert-error" role="alert">
          <span>⚠️</span> {errorServidor}
        </div>
      )}

      <div className="carrito-grid">
        <div className="carrito-items-list">
          {items.map((item) => {
            const id = item.producto_id || item.id;
            const srcImg = obtenerUrlImagen(item.imagen_url || item.imagen);
            return (
              <div key={id} className="carrito-item-card">
                <img
                  src={srcImg}
                  alt={item.nombre}
                  className="carrito-item-img"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
                  }}
                />
                <div className="carrito-item-info">
                  <h4>{item.nombre}</h4>
                  <span className="precio-unitario">
                    ${item.precio.toLocaleString('es-AR')} c/u
                  </span>
                </div>

                <div className="carrito-item-controles">
                  <button
                    onClick={() => actualizarCantidad(id, item.cantidad - 1)}
                    aria-label="Disminuir cantidad"
                  >
                    -
                  </button>
                  <span className="cantidad-display">{item.cantidad}</span>
                  <button
                    onClick={() => actualizarCantidad(id, item.cantidad + 1)}
                    aria-label="Aumentar cantidad"
                  >
                    +
                  </button>
                </div>

                <div className="carrito-item-subtotal">
                  ${(item.precio * item.cantidad).toLocaleString('es-AR')}
                </div>

                <button
                  className="btn-quitar"
                  onClick={() => quitar(id)}
                  title="Eliminar producto"
                >
                  🗑️
                </button>
              </div>
            );
          })}
        </div>

        {/* Resumen del Pedido */}
        <aside className="carrito-resumen-card">
          <h3>Resumen del Pedido</h3>
          <div className="resumen-row">
            <span>Productos:</span>
            <span>{items.reduce((acc, i) => acc + i.cantidad, 0)}</span>
          </div>
          <div className="resumen-row total-row">
            <span>Total a Pagar:</span>
            <span className="total-monto">${total.toLocaleString('es-AR')}</span>
          </div>

          <button
            type="button"
            className="btn-confirmar-compra"
            onClick={handleConfirmarCompra}
            disabled={enviando}
          >
            {enviando ? 'Confirmando...' : '✨ Confirmar Compra'}
          </button>

          <button className="btn-vaciar-link" onClick={vaciar}>
            Vaciar Carrito
          </button>
        </aside>
      </div>
    </div>
  );
};

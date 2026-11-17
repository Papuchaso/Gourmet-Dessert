import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { obtenerUrlImagen } from '../utils/helpers';
import { SubirImagenProducto } from './SubirImagenProducto';

/**
 * Medidor visual de stock con barra animada y badge.
 * Estados:
 *   🟢 Alto (> 5)  → teal pastel, barra estable con shimmer
 *   🟡 Poco (1–5)  → amber/naranja, barra con pulso
 *   🔴 Sin stock   → rojo, barra estática agotado
 */
const StockMeter = ({ stock }) => {
  const stockNum = Number(stock) || 0;

  let level, label, icon, badgeClass, barWidth;

  if (stockNum <= 0) {
    level = 'stock-empty';
    label = 'Sin stock';
    icon = '🔴';
    badgeClass = 'badge-empty';
    barWidth = '100%';
  } else if (stockNum <= 5) {
    level = 'stock-medium';
    label = `¡Solo ${stockNum} ${stockNum === 1 ? 'unidad' : 'unidades'}!`;
    icon = '🟡';
    badgeClass = 'badge-medium';
    barWidth = `${Math.max(10, (stockNum / 10) * 100)}%`;
  } else {
    level = 'stock-high';
    label = 'Disponible';
    icon = '🟢';
    badgeClass = 'badge-high';
    const maxRef = 20;
    barWidth = `${Math.min(100, (stockNum / maxRef) * 100)}%`;
  }

  return (
    <div className={`stock-meter-wrap ${level}`}>
      <div className="stock-meter-label">
        <span className="stock-text">
          {icon}
          <span>{label}</span>
        </span>
        <span className={`stock-badge-pill ${badgeClass}`}>
          {stockNum <= 0 ? 'Agotado' : `${stockNum} ud.`}
        </span>
      </div>
      <div className="stock-bar-track">
        <div
          className="stock-bar-fill"
          style={{ width: barWidth }}
          role="progressbar"
          aria-valuenow={stockNum}
          aria-valuemin={0}
          aria-valuemax={20}
          aria-label={`Stock: ${stockNum} unidades`}
        />
      </div>
    </div>
  );
};

/**
 * Tarjeta individual de producto estilo Melería Pastel IRESM.
 * Fondo blanco, bordes rosados suaves, badges verdes, botón coral y medidor de stock.
 */
export const TarjetaProducto = ({ producto, onProductoActualizado, onVerDetalle }) => {
  const { usuario, esAdmin } = useAuth();
  const { agregar } = useCarrito();
  const [mostrarModalCarga, setMostrarModalCarga] = useState(false);

  const tienePermisosAdmin = usuario?.es_admin === true || esAdmin || usuario?.rol === 'admin';
  const srcImagen = obtenerUrlImagen(producto.imagen || producto.imagen_url);

  const handleImagenActualizada = (datosActualizados) => {
    setMostrarModalCarga(false);
    if (onProductoActualizado) {
      onProductoActualizado(datosActualizados);
    }
  };

  const handleCardClick = () => {
    if (onVerDetalle) {
      onVerDetalle(producto);
    }
  };

  return (
    <div className="product-card">
      {/* ─── Imagen + Tags ─── */}
      <div
        className="card-image-box"
        onClick={handleCardClick}
        style={{ cursor: onVerDetalle ? 'pointer' : 'default' }}
      >
        <img
          src={srcImagen}
          alt={producto.nombre}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src =
              'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
          }}
        />

        <span className="card-tag">
          {producto.stock === 0 ? '❌ Agotado' : '✨ Engaña-Ojos'}
        </span>

        {tienePermisosAdmin && (
          <button
            type="button"
            className="btn-admin-edit-img"
            onClick={(e) => {
              e.stopPropagation();
              setMostrarModalCarga(!mostrarModalCarga);
            }}
            title="Cambiar imagen del producto (Admin)"
          >
            📷
          </button>
        )}
      </div>

      {/* ─── Contenido ─── */}
      <div className="card-content">
        <h3
          className="card-title"
          onClick={handleCardClick}
          style={{ cursor: onVerDetalle ? 'pointer' : 'default' }}
        >
          {producto.nombre}
        </h3>

        {producto.descripcion && (
          <p className="card-desc">{producto.descripcion}</p>
        )}

        {/* ── Medidor Visual de Stock ── */}
        <StockMeter stock={producto.stock} />

        <div className="card-footer">
          <div className="card-price">
            ${Number(producto.precio || 0).toLocaleString('es-AR')}
          </div>
          <button
            type="button"
            className="btn-add-card"
            onClick={(e) => {
              e.stopPropagation();
              agregar(producto, 1);
            }}
            disabled={producto.stock === 0}
            title={
              producto.stock === 0
                ? 'Sin stock disponible'
                : 'Agregar al Carrito'
            }
          >
            🛒 {producto.stock === 0 ? 'Agotado' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* ─── Popover Admin: Subir imagen ─── */}
      {mostrarModalCarga && (
        <div className="admin-upload-popover">
          <SubirImagenProducto
            productoId={producto.id || producto.producto_id}
            onImagenSubida={handleImagenActualizada}
            onCancelar={() => setMostrarModalCarga(false)}
          />
        </div>
      )}
    </div>
  );
};

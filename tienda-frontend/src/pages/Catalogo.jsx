import React, { useState, useEffect } from 'react';
import { getProductos } from '../services/api';
import { TarjetaProducto } from '../components/TarjetaProducto';
import { useCarrito } from '../context/CarritoContext';
import { obtenerUrlImagen } from '../utils/helpers';

export const Catalogo = () => {
  const { agregar } = useCarrito();
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  
  // Estado para el carrusel de vitrina destacada
  const [indiceDestacado, setIndiceDestacado] = useState(0);

  // Estado para el modal de detalle de producto
  const [productoDetalle, setProductoDetalle] = useState(null);

  const cargarCatalogo = async () => {
    setCargando(true);
    setError(null);
    try {
      const data = await getProductos();
      if (Array.isArray(data)) {
        setProductos(data);
      }
    } catch (err) {
      console.error('Error al cargar catálogo desde el backend:', err);
      setError(err.message || 'No se pudo cargar el catálogo de productos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarCatalogo();
  }, []);

  const totalProductos = productos.length;
  const postreActual = totalProductos > 0 ? productos[indiceDestacado % totalProductos] : null;

  const handlePrevDestacado = () => {
    setIndiceDestacado((prev) => (prev === 0 ? totalProductos - 1 : prev - 1));
  };

  const handleNextDestacado = () => {
    setIndiceDestacado((prev) => (prev + 1) % totalProductos);
  };

  const handleProductoActualizado = (datosActualizados) => {
    setProductos((prev) =>
      prev.map((p) =>
        (p.id === datosActualizados.id || p.producto_id === datosActualizados.id)
          ? { ...p, ...datosActualizados }
          : p
      )
    );
  };

  return (
    <div className="catalogo-page-container">
      {/* 1. HERO BIENVENIDA */}
      <section className="hero-welcome">
        <div className="container">
          <span className="tag-sweet">✨ ¡Postres que parecen comidas saladas! ✨</span>
          <h2>
            Dulcería & Melería <span className="highlight-brand">Gourmet Dessert</span>
          </h2>
          <p>
            Pedí tu chuchera preferida, sacale una foto para las redes y compartí la ilusión en el IRESM. ¡Sabor irresistible y precios súper accesibles!
          </p>
        </div>
      </section>

      {/* 2. CARRUSEL DE VITRINA / POSTRE DESTACADO */}
      {postreActual && (
        <section className="featured-section container">
          <div className="showcase-container">
            <div className="showcase-header-badge">⭐ Postre Destacado ⭐</div>

            {/* Caja con Flechas < e Imagen Clickeable > */}
            <div className="showcase-box-wrapper">
              <button
                type="button"
                className="arrow-btn"
                onClick={handlePrevDestacado}
                aria-label="Producto Anterior"
              >
                &lt;
              </button>

              <div
                className="display-image-frame"
                onClick={() => setProductoDetalle(postreActual)}
                title="¡Haz clic para ver más detalles!"
              >
                <img
                  src={obtenerUrlImagen(postreActual.imagen || postreActual.imagen_url)}
                  alt={postreActual.nombre}
                />
                <div className="click-hint-overlay">
                  <span className="icon" style={{ fontSize: '2rem', marginBottom: '4px' }}>🔍</span>
                  <span>¡Haz clic para ver detalle!</span>
                </div>
              </div>

              <button
                type="button"
                className="arrow-btn"
                onClick={handleNextDestacado}
                aria-label="Producto Siguiente"
              >
                &gt;
              </button>
            </div>

            {/* Detalles y Precio */}
            <div className="showcase-details">
              <h3 className="showcase-title">{postreActual.nombre}</h3>
              <p className="showcase-subtitle">{postreActual.descripcion || 'Creación artesanal gourmet engaña-ojos.'}</p>

              <div className="showcase-price-tag">
                <span className="label">Precio Estudiantil:</span>
                <span className="amount">
                  ${Number(postreActual.precio || 0).toLocaleString('es-AR')}
                </span>
              </div>

              {/* Indicadores / Puntos */}
              {totalProductos > 1 && (
                <div className="showcase-dots">
                  {productos.map((_, idx) => (
                    <span
                      key={idx}
                      className={`dot ${idx === (indiceDestacado % totalProductos) ? 'active' : ''}`}
                      onClick={() => setIndiceDestacado(idx)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. SECCIÓN PRODUCTOS / CATÁLOGO COMPLETO */}
      <section className="products-section" id="seccion-productos">
        <div className="container">
          <div className="section-header">
            <h2>Productos</h2>
            <p style={{ color: 'var(--text-muted)', marginTop: '8px', fontSize: '1.05rem' }}>
              Descubrí toda nuestra variedad de engaña-ojos y chucherías para el IRESM
            </p>
          </div>

          {cargando ? (
            <div className="state-container">
              <div className="spinner"></div>
              <p>Cargando deliciosos postres...</p>
            </div>
          ) : (
            <div className="products-grid">
              {productos.map((prod) => (
                <TarjetaProducto
                  key={prod.id || prod.producto_id}
                  producto={prod}
                  onProductoActualizado={handleProductoActualizado}
                  onVerDetalle={(p) => setProductoDetalle(p)}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. MODAL DE DETALLE DE PRODUCTO */}
      {productoDetalle && (
        <div className="modal-overlay" onClick={() => setProductoDetalle(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px', padding: 0 }}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => setProductoDetalle(null)}
              aria-label="Cerrar modal"
            >
              &times;
            </button>

            <div className="modal-img-container" style={{ height: '280px' }}>
              <img
                src={obtenerUrlImagen(productoDetalle.imagen || productoDetalle.imagen_url)}
                alt={productoDetalle.nombre}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            <div className="modal-body" style={{ padding: '24px' }}>
              <span className="modal-badge" style={{ marginBottom: '8px' }}>
                ✨ Engaña-Ojos IRESM
              </span>
              <h2 className="modal-title" style={{ fontSize: '1.7rem', color: 'var(--text-heading)', margin: '6px 0 10px 0' }}>
                {productoDetalle.nombre}
              </h2>
              <p className="modal-desc" style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '12px' }}>
                {productoDetalle.descripcion || 'Creación artesanal dulce elaborada especialmente para la comunidad de estudiantes.'}
              </p>

              {/* Indicador de stock en el modal */}
              <div style={{ marginBottom: '16px' }}>
                {productoDetalle.stock <= 0 ? (
                  <span className="stock-badge-pill badge-empty" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                    🔴 Sin stock disponible
                  </span>
                ) : productoDetalle.stock <= 5 ? (
                  <span className="stock-badge-pill badge-medium" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                    🟡 ¡Solo {productoDetalle.stock} {productoDetalle.stock === 1 ? 'unidad' : 'unidades'} disponibles!
                  </span>
                ) : (
                  <span className="stock-badge-pill badge-high" style={{ fontSize: '0.82rem', padding: '4px 12px' }}>
                    🟢 {productoDetalle.stock} unidades disponibles
                  </span>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px dashed var(--pastel-pink)', paddingTop: '16px' }}>
                <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--emerald-price)', fontFamily: 'var(--font-heading)' }}>
                  ${Number(productoDetalle.precio || 0).toLocaleString('es-AR')}
                </div>
                <button
                  type="button"
                  className="btn-primary-action"
                  style={{ width: 'auto', padding: '10px 24px' }}
                  onClick={() => {
                    agregar(productoDetalle, 1);
                    setProductoDetalle(null);
                  }}
                  disabled={productoDetalle.stock === 0}
                >
                  🛒 {productoDetalle.stock === 0 ? 'Sin Stock' : 'Agregar al Carrito'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getProductos, crearProducto, actualizarProducto, eliminarProducto, subirImagen } from '../services/api';
import { obtenerUrlImagen, obtenerUrlImagen as urlImagen } from '../utils/helpers';

/**
 * Componente Badge para representar el estado del Stock visualmente
 */
export const StockBadge = ({ stock }) => {
  const stockNum = Number(stock) || 0;

  if (stockNum <= 0) {
    return (
      <span className="badge-stock badge-agotado" title="Sin existencias disponibles">
        <span className="badge-dot"></span> Agotado (0)
      </span>
    );
  }

  if (stockNum <= 5) {
    return (
      <span className="badge-stock badge-poco" title="Últimas unidades disponibles">
        <span className="badge-dot"></span> Poco Stock ({stockNum})
      </span>
    );
  }

  return (
    <span className="badge-stock badge-disponible" title="Stock suficiente">
      <span className="badge-dot"></span> Disponible ({stockNum})
    </span>
  );
};

export const AdminProductos = ({ setRutaActual }) => {
  const { usuario, esAdmin } = useAuth();
  const tienePermisoAdmin = usuario?.es_admin === true || esAdmin;

  // Estado del catálogo
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [filtroStock, setFiltroStock] = useState('todos');

  // Estados de feedback
  const [mensajeExito, setMensajeExito] = useState('');
  const [mensajeError, setMensajeError] = useState('');

  // Estado del formulario Modal (Crear / Editar)
  const [modalFormularioAbierto, setModalFormularioAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  // Campos del formulario
  const [formValues, setFormValues] = useState({
    nombre: '',
    precio: '',
    stock: '',
    descripcion: '',
    imagen: ''
  });
  const [archivoImagen, setArchivoImagen] = useState(null);
  const [previewImagen, setPreviewImagen] = useState('');

  // Estado del Modal de Confirmación de Eliminación
  const [modalEliminarAbierto, setModalEliminarAbierto] = useState(false);
  const [productoAEliminar, setProductoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // Cargar productos al montar
  useEffect(() => {
    cargarListaProductos();
  }, []);

  const cargarListaProductos = async () => {
    setCargando(true);
    setMensajeError('');
    try {
      const data = await getProductos();
      setProductos(Array.isArray(data) ? data : []);
    } catch (err) {
      setMensajeError(err.message || 'Error al conectar con el servidor para obtener los productos.');
    } finally {
      setCargando(false);
    }
  };

  // Temporizador para limpiar avisos automáticos
  const mostrarNotificacionExito = (texto) => {
    setMensajeExito(texto);
    setTimeout(() => setMensajeExito(''), 4000);
  };

  // Abrir Modal para Crear
  const handleAbrirCrear = () => {
    if (!tienePermisoAdmin) return;
    setModoEdicion(false);
    setProductoSeleccionado(null);
    setFormValues({
      nombre: '',
      precio: '',
      stock: '0',
      descripcion: '',
      imagen: ''
    });
    setArchivoImagen(null);
    setPreviewImagen('');
    setMensajeError('');
    setModalFormularioAbierto(true);
  };

  // Abrir Modal para Editar
  const handleAbrirEditar = (prod) => {
    if (!tienePermisoAdmin) return;
    setModoEdicion(true);
    setProductoSeleccionado(prod);
    setFormValues({
      nombre: prod.nombre || '',
      precio: prod.precio !== undefined ? String(prod.precio) : '',
      stock: prod.stock !== undefined ? String(prod.stock) : '0',
      descripcion: prod.descripcion || '',
      imagen: prod.imagen || prod.imagen_url || ''
    });
    setArchivoImagen(null);
    setPreviewImagen(urlImagen(prod));
    setMensajeError('');
    setModalFormularioAbierto(true);
  };

  // Manejar cambios en inputs de formulario
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));

    if (name === 'imagen' && !archivoImagen) {
      setPreviewImagen(value);
    }
  };

  // Manejar selección de archivo de imagen local
  const handleArchivoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setArchivoImagen(file);
      setPreviewImagen(URL.createObjectURL(file));
    }
  };

  // Enviar formulario (Crear o Actualizar)
  const handleSubmitFormulario = async (e) => {
    e.preventDefault();
    if (!tienePermisoAdmin) return;

    // Validaciones básicas
    if (!formValues.nombre.trim()) {
      setMensajeError('El nombre del producto es obligatorio.');
      return;
    }
    const precioNum = parseFloat(formValues.precio);
    if (isNaN(precioNum) || precioNum < 0) {
      setMensajeError('El precio debe ser un número válido mayor o igual a 0.');
      return;
    }
    const stockNum = parseInt(formValues.stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      setMensajeError('El stock debe ser un número entero mayor o igual a 0.');
      return;
    }

    setGuardando(true);
    setMensajeError('');

    try {
      if (modoEdicion && productoSeleccionado) {
        const prodId = productoSeleccionado.id || productoSeleccionado.producto_id;
        let resultado = await actualizarProducto(prodId, {
          nombre: formValues.nombre,
          precio: precioNum,
          stock: stockNum,
          descripcion: formValues.descripcion,
          imagen: formValues.imagen
        });

        // Si se seleccionó un archivo nuevo, subirlo al endpoint de imagen
        if (archivoImagen) {
          try {
            resultado = await subirImagen(prodId, archivoImagen);
          } catch (imgErr) {
            console.warn('La imagen no pudo subirse:', imgErr.message);
          }
        }

        setProductos((prev) =>
          prev.map((p) =>
            (p.id === prodId || p.producto_id === prodId) ? { ...p, ...resultado } : p
          )
        );
        mostrarNotificacionExito(`Producto "${formValues.nombre}" actualizado con éxito.`);
      } else {
        // Modo Creación
        let nuevoProd = await crearProducto({
          nombre: formValues.nombre,
          precio: precioNum,
          stock: stockNum,
          descripcion: formValues.descripcion,
          imagen: formValues.imagen
        });

        const nuevoId = nuevoProd.id || nuevoProd.producto_id;
        if (archivoImagen && nuevoId) {
          try {
            nuevoProd = await subirImagen(nuevoId, archivoImagen);
          } catch (imgErr) {
            console.warn('Error al adjuntar imagen al nuevo producto:', imgErr.message);
          }
        }

        setProductos((prev) => [nuevoProd, ...prev]);
        mostrarNotificacionExito(`Producto "${formValues.nombre}" creado exitosamente.`);
      }

      setModalFormularioAbierto(false);
    } catch (err) {
      setMensajeError(err.message || 'Error al procesar la solicitud en el servidor.');
    } finally {
      setGuardando(false);
    }
  };

  // Abrir Modal de Confirmación para Eliminar
  const handleAbrirModalEliminar = (prod) => {
    if (!tienePermisoAdmin) return;
    setProductoAEliminar(prod);
    setModalEliminarAbierto(true);
  };

  // Confirmar y ejecutar eliminación
  const handleConfirmarEliminar = async () => {
    if (!productoAEliminar || !tienePermisoAdmin) return;
    const prodId = productoAEliminar.id || productoAEliminar.producto_id;
    const nombreProd = productoAEliminar.nombre;

    setEliminando(true);
    setMensajeError('');

    try {
      await eliminarProducto(prodId);
      setProductos((prev) => prev.filter((p) => (p.id !== prodId && p.producto_id !== prodId)));
      mostrarNotificacionExito(`El producto "${nombreProd}" fue eliminado correctamente.`);
      setModalEliminarAbierto(false);
      setProductoAEliminar(null);
    } catch (err) {
      setMensajeError(err.message || 'No se pudo eliminar el producto.');
    } finally {
      setEliminando(false);
    }
  };

  // Filtrado de productos en memoria
  const productosFiltrados = useMemo(() => {
    return productos.filter((p) => {
      const coincideNombre = (p.nombre || '').toLowerCase().includes(busqueda.toLowerCase()) ||
                             (p.descripcion || '').toLowerCase().includes(busqueda.toLowerCase());
      
      const stock = Number(p.stock) || 0;
      if (filtroStock === 'agotado') return coincideNombre && stock === 0;
      if (filtroStock === 'poco') return coincideNombre && stock > 0 && stock <= 5;
      if (filtroStock === 'disponible') return coincideNombre && stock > 5;
      return coincideNombre;
    });
  }, [productos, busqueda, filtroStock]);

  return (
    <div className="container admin-productos-page">
      {/* Encabezado del Panel de Administración */}
      <div className="admin-header-row">
        <div>
          <div className="admin-title-badge">
            <span className="admin-badge-icon">⚡</span> Panel de Administración
          </div>
          <h1 className="admin-title">Gestión de Catálogo de Productos</h1>
          <p className="admin-subtitle">
            Administra precios, stock en tiempo real y detalles de postres en la plataforma.
          </p>
        </div>

        {/* Botón AGREGAR PRODUCTO (Solo visible para Administradores) */}
        {tienePermisoAdmin && (
          <button
            type="button"
            className="btn-admin-add"
            onClick={handleAbrirCrear}
            id="btn-agregar-producto"
          >
            ➕ Agregar Nuevo Producto
          </button>
        )}
      </div>

      {/* Alertas y Notificaciones */}
      {mensajeExito && (
        <div className="alert-success-banner" role="alert">
          <span>✅ {mensajeExito}</span>
          <button type="button" className="alert-dismiss-btn" onClick={() => setMensajeExito('')}>✕</button>
        </div>
      )}

      {mensajeError && (
        <div className="alert-error-banner" role="alert">
          <span>⚠️ {mensajeError}</span>
          <button type="button" className="alert-dismiss-btn" onClick={() => setMensajeError('')}>✕</button>
        </div>
      )}

      {/* Barra de Búsqueda y Filtros de Stock */}
      <div className="admin-controls-card">
        <div className="admin-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Buscar por nombre o descripción..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="admin-search-input"
          />
          {busqueda && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setBusqueda('')}
              title="Limpiar búsqueda"
            >
              ✕
            </button>
          )}
        </div>

        <div className="admin-stock-filters">
          <span className="filter-label">Filtrar por Stock:</span>
          <div className="filter-buttons-group">
            <button
              type="button"
              className={`btn-filter ${filtroStock === 'todos' ? 'active' : ''}`}
              onClick={() => setFiltroStock('todos')}
            >
              Todos ({productos.length})
            </button>
            <button
              type="button"
              className={`btn-filter ${filtroStock === 'disponible' ? 'active' : ''}`}
              onClick={() => setFiltroStock('disponible')}
            >
              🟢 Disponibles
            </button>
            <button
              type="button"
              className={`btn-filter ${filtroStock === 'poco' ? 'active' : ''}`}
              onClick={() => setFiltroStock('poco')}
            >
              🟡 Poco Stock
            </button>
            <button
              type="button"
              className={`btn-filter ${filtroStock === 'agotado' ? 'active' : ''}`}
              onClick={() => setFiltroStock('agotado')}
            >
              🔴 Agotados
            </button>
          </div>
        </div>
      </div>

      {/* Contenido Principal: Tabla / Grilla */}
      {cargando ? (
        <div className="state-container">
          <div className="spinner"></div>
          <p>Cargando catálogo de productos...</p>
        </div>
      ) : productosFiltrados.length === 0 ? (
        <div className="admin-empty-state">
          <span className="empty-icon">📦</span>
          <h3>No se encontraron productos</h3>
          <p>
            {busqueda || filtroStock !== 'todos'
              ? 'No hay productos que coincidan con los filtros seleccionados.'
              : 'Aún no hay productos cargados en la base de datos.'}
          </p>
          {tienePermisoAdmin && (
            <button type="button" className="btn-primary-action" onClick={handleAbrirCrear} style={{ maxWidth: '240px', margin: '16px auto 0' }}>
              ➕ Crear Primer Producto
            </button>
          )}
        </div>
      ) : (
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Imagen</th>
                <th>Nombre & Descripción</th>
                <th style={{ width: '130px' }}>Precio</th>
                <th style={{ width: '160px' }}>Stock</th>
                {tienePermisoAdmin && <th style={{ width: '170px', textAlign: 'center' }}>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map((prod) => {
                const prodId = prod.id || prod.producto_id;
                const imgUrl = urlImagen(prod);
                return (
                  <tr key={prodId} className="admin-table-row">
                    <td>
                      <div className="table-img-wrapper">
                        {imgUrl ? (
                          <img src={imgUrl} alt={prod.nombre} className="table-thumbnail" />
                        ) : (
                          <div className="table-img-placeholder">🍰</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="product-table-meta">
                        <strong className="product-name">{prod.nombre}</strong>
                        <span className="product-id-tag">ID: #{prodId}</span>
                        {prod.descripcion && (
                          <p className="product-desc-truncate">{prod.descripcion}</p>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="product-price-badge">
                        ${Number(prod.precio || 0).toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td>
                      <StockBadge stock={prod.stock} />
                    </td>
                    {tienePermisoAdmin && (
                      <td>
                        <div className="admin-actions-cell">
                          {/* Botón EDITAR (Solo visible para rol admin) */}
                          <button
                            type="button"
                            className="btn-action-edit"
                            onClick={() => handleAbrirEditar(prod)}
                            title="Editar detalles del producto"
                            id={`btn-editar-${prodId}`}
                          >
                            ✏️ Editar
                          </button>

                          {/* Botón ELIMINAR (Solo visible para rol admin) */}
                          <button
                            type="button"
                            className="btn-action-delete"
                            onClick={() => handleAbrirModalEliminar(prod)}
                            title="Eliminar este producto"
                            id={`btn-eliminar-${prodId}`}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: FORMULARIO AGREGAR / EDITAR PRODUCTO                            */}
      {/* ========================================================================= */}
      {modalFormularioAbierto && (
        <div className="modal-overlay" onClick={() => !guardando && setModalFormularioAbierto(false)}>
          <div className="modal-card modal-admin-form" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => !guardando && setModalFormularioAbierto(false)}
              disabled={guardando}
            >
              ✕
            </button>

            <div className="modal-header">
              <span className="modal-icon">{modoEdicion ? '✏️' : '✨'}</span>
              <h2>{modoEdicion ? 'Editar Producto' : 'Agregar Nuevo Producto'}</h2>
              <p className="modal-subtitle">
                {modoEdicion
                  ? `Modificando: ${productoSeleccionado?.nombre} (ID #${productoSeleccionado?.id || productoSeleccionado?.producto_id})`
                  : 'Completa los campos para publicar un nuevo postre en el catálogo.'}
              </p>
            </div>

            <form onSubmit={handleSubmitFormulario} className="admin-form">
              {/* Campo Nombre */}
              <div className="form-group">
                <label htmlFor="form-nombre">
                  Nombre del Producto <span className="req-star">*</span>
                </label>
                <input
                  id="form-nombre"
                  type="text"
                  name="nombre"
                  value={formValues.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: Tarta Selva Negra Suprema"
                  required
                  disabled={guardando}
                  className="form-control"
                />
              </div>

              {/* Fila: Precio y Stock */}
              <div className="form-row-2">
                <div className="form-group">
                  <label htmlFor="form-precio">
                    Precio ($ ARS) <span className="req-star">*</span>
                  </label>
                  <input
                    id="form-precio"
                    type="number"
                    step="0.01"
                    min="0"
                    name="precio"
                    value={formValues.precio}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                    disabled={guardando}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="form-stock">
                    Stock Disponible <span className="req-star">*</span>
                  </label>
                  <input
                    id="form-stock"
                    type="number"
                    step="1"
                    min="0"
                    name="stock"
                    value={formValues.stock}
                    onChange={handleInputChange}
                    placeholder="0"
                    required
                    disabled={guardando}
                    className="form-control"
                  />
                </div>
              </div>

              {/* Campo Descripción */}
              <div className="form-group">
                <label htmlFor="form-descripcion">Descripción del Postre</label>
                <textarea
                  id="form-descripcion"
                  name="descripcion"
                  rows="3"
                  value={formValues.descripcion}
                  onChange={handleInputChange}
                  placeholder="Detalles sobre ingredientes, textura o presentación..."
                  disabled={guardando}
                  className="form-control textarea-control"
                />
              </div>

              {/* Campo Imagen (URL y/o Archivo) */}
              <div className="form-group">
                <label htmlFor="form-imagen">URL de la Imagen (Opcional)</label>
                <input
                  id="form-imagen"
                  type="url"
                  name="imagen"
                  value={formValues.imagen}
                  onChange={handleInputChange}
                  placeholder="https://ejemplo.com/foto-postre.jpg"
                  disabled={guardando}
                  className="form-control"
                />
              </div>

              <div className="form-group">
                <label htmlFor="form-archivo">O cargar archivo local (JPG, PNG, WEBP máx 2MB):</label>
                <input
                  id="form-archivo"
                  type="file"
                  accept="image/*"
                  onChange={handleArchivoChange}
                  disabled={guardando}
                  className="file-input-control"
                />
              </div>

              {/* Vista Previa de Imagen */}
              {previewImagen && (
                <div className="image-preview-box">
                  <span className="preview-label">Vista previa de imagen:</span>
                  <div className="preview-thumbnail-container">
                    <img src={previewImagen} alt="Previsualización" className="preview-img" />
                  </div>
                </div>
              )}

              {/* Botones de Acción Formulario */}
              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setModalFormularioAbierto(false)}
                  disabled={guardando}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-primary-action"
                  disabled={guardando}
                  id="btn-guardar-producto"
                >
                  {guardando ? (
                    <span className="btn-loading-content">
                      <span className="spinner-small"></span> Guardando...
                    </span>
                  ) : modoEdicion ? (
                    '💾 Guardar Cambios'
                  ) : (
                    '➕ Publicar Producto'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CONFIRMACIÓN DE ELIMINACIÓN                                     */}
      {/* ========================================================================= */}
      {modalEliminarAbierto && productoAEliminar && (
        <div className="modal-overlay" onClick={() => !eliminando && setModalEliminarAbierto(false)}>
          <div className="modal-card modal-confirm-delete" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="modal-close-btn"
              onClick={() => !eliminando && setModalEliminarAbierto(false)}
              disabled={eliminando}
            >
              ✕
            </button>

            <div className="modal-header">
              <span className="modal-icon icon-danger">🗑️</span>
              <h2>Confirmar Eliminación</h2>
              <p className="modal-subtitle">
                ¿Estás seguro de que deseas eliminar permanentemente este producto del catálogo?
              </p>
            </div>

            <div className="delete-target-preview">
              <div className="target-img-wrap">
                {urlImagen(productoAEliminar) ? (
                  <img src={urlImagen(productoAEliminar)} alt={productoAEliminar.nombre} />
                ) : (
                  <span>🍰</span>
                )}
              </div>
              <div className="target-details">
                <strong>{productoAEliminar.nombre}</strong>
                <span>ID: #{productoAEliminar.id || productoAEliminar.producto_id}</span>
                <span>Precio: ${Number(productoAEliminar.precio || 0).toLocaleString('es-AR')}</span>
                <StockBadge stock={productoAEliminar.stock} />
              </div>
            </div>

            <div className="delete-warning-box">
              ⚠️ <strong>Advertencia:</strong> Esta acción es irreversible y removerá el producto de forma permanente.
            </div>

            <div className="modal-actions-row">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setModalEliminarAbierto(false)}
                disabled={eliminando}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-danger-action"
                onClick={handleConfirmarEliminar}
                disabled={eliminando}
                id="btn-confirmar-eliminar"
              >
                {eliminando ? (
                  <span className="btn-loading-content">
                    <span className="spinner-small"></span> Eliminando...
                  </span>
                ) : (
                  '🗑️ Sí, Eliminar Producto'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useCarrito } from '../context/CarritoContext';
import { obtenerUrlImagen } from '../utils/helpers';

export const Navbar = ({ setRutaActual }) => {
  const { usuario, estaAutenticado, esAdmin, abrirModalAuth, cerrarSesion } = useAuth();
  const { cantidadTotalItems } = useCarrito();
  const [menuAbierto, setMenuAbierto] = useState(false);

  const tienePermisosAdmin = usuario?.es_admin === true || esAdmin || usuario?.rol === 'admin';

  return (
    <header className="header navbar">
      <div className="nav-container container">
        {/* Marca / Logo */}
        <div
          className="logo-brand brand"
          onClick={() => setRutaActual('catalogo')}
          id="brand-logo"
          style={{ cursor: 'pointer' }}
        >
          <div className="logo-icon brand-icon">🍯</div>
          <div className="logo-text-box">
            <h1 className="brand-title">Gourmet Dessert</h1>
            <span className="brand-subtitle">Postres Engaña-Ojos & Melería</span>
          </div>
        </div>

        {/* Acciones de Navegación */}
        <nav className="nav-actions nav-links">
          <button
            type="button"
            className="nav-link-btn"
            onClick={() => setRutaActual('catalogo')}
          >
            Catálogo
          </button>

          {/* Enlace oficial IRESM */}
          <a
            href="https://iresm.edu.ar/"
            target="_blank"
            rel="noopener noreferrer"
            className="badge-iresm"
            title="Visitar Instituto Remedios Escalada de San Martín (IRESM)"
          >
            <span>🎓</span> IRESM Oficial
          </a>

          {/* Acceso directo a Administración (Solo para Administradores) */}
          {tienePermisosAdmin && (
            <button
              type="button"
              className="nav-link-btn btn-admin-nav"
              onClick={() => setRutaActual('/admin/productos')}
              title="Panel de Administración de Productos"
              id="nav-btn-admin-productos"
            >
              ⚡ Admin Productos
            </button>
          )}

          {/* Estado de Autenticación */}
          {!estaAutenticado ? (
            <button
              type="button"
              className="btn-auth-login btn-login"
              onClick={abrirModalAuth}
              id="btn-open-auth"
              aria-label="Iniciar Sesión"
            >
              <span>✨</span> Ingresar
            </button>
          ) : (
            <div className="user-widget">
              <button
                type="button"
                className="user-profile-btn"
                onClick={() => setMenuAbierto(!menuAbierto)}
                aria-label="Menú de Usuario"
                id="user-profile-menu-btn"
              >
                <img
                  src={obtenerUrlImagen(usuario.foto_perfil) || 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pastel'}
                  alt={usuario.nombre}
                  className="user-avatar"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Pastel';
                  }}
                />
                <span className="user-name">{usuario.nombre}</span>
                <span className="arrow" style={{ fontSize: '0.75rem' }}>▼</span>
              </button>

              {menuAbierto && (
                <div className="user-dropdown-menu" id="user-dropdown">
                  <div className="dropdown-user-info">
                    <strong>{usuario.nombre}</strong>
                    <small className="user-email-text" title={usuario.email}>
                      {usuario.email}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setRutaActual('mis-pedidos');
                      setMenuAbierto(false);
                    }}
                    id="menu-item-mis-pedidos"
                  >
                    📦 Mis Pedidos
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRutaActual('perfil');
                      setMenuAbierto(false);
                    }}
                    id="menu-item-mis-datos"
                  >
                    👤 Mis Datos & Privacidad
                  </button>

                  {tienePermisosAdmin && (
                    <button
                      type="button"
                      className="admin-dropdown-item"
                      onClick={() => {
                        setRutaActual('/admin/productos');
                        setMenuAbierto(false);
                      }}
                      id="menu-item-admin-productos"
                    >
                      ⚡ Gestión de Productos
                    </button>
                  )}

                  <button
                    type="button"
                    className="logout-btn"
                    onClick={() => {
                      cerrarSesion();
                      setMenuAbierto(false);
                      setRutaActual('catalogo');
                    }}
                    id="menu-item-logout"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Botón Carrito */}
          <button
            type="button"
            className="btn-cart cart-btn"
            onClick={() => setRutaActual('carrito')}
            aria-label="Ver Carrito"
            id="cart-btn"
          >
            🛒
            {cantidadTotalItems > 0 && (
              <span className="cart-count cart-badge">{cantidadTotalItems}</span>
            )}
          </button>
        </nav>
      </div>
    </header>
  );
};

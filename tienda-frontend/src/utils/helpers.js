export const API_BASE_URL = (
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : (import.meta.env.DEV ? 'http://localhost:8000' : '')
).replace(/\/+$/, '');

/**
 * Helper para formatear y normalizar URLs de imágenes de productos.
 * 
 * Reglas:
 * 1. Si path viene vacío/null/undefined, retorna un placeholder por defecto.
 * 2. Si path empieza con http://, https://, blob: o data:, lo retorna tal cual.
 * 3. Si path empieza con /static/ o /uploads/ (o cualquier ruta relativa), le concatena la URL base del backend.
 *
 * @param {string|Object} path - Ruta string o el objeto producto directamente.
 * @returns {string} URL completa lista para ser consumida en etiquetas <img>.
 */
export const obtenerUrlImagen = (path) => {
  // Soporte si se envía el objeto producto
  if (path && typeof path === 'object') {
    path = path.imagen_url || path.imagen || path.foto_url || path.foto_perfil;
  }

  if (!path || typeof path !== 'string' || path.trim() === '') {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
  }

  const rutaLimpia = path.trim();

  // Si ya es una URL absoluta o data URI
  if (/^(?:https?:|\/\/|blob:|data:)/i.test(rutaLimpia)) {
    return rutaLimpia;
  }

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const pathFormateado = rutaLimpia.startsWith('/') ? rutaLimpia : `/${rutaLimpia}`;

  return `${baseUrl}${pathFormateado}`;
};

export default obtenerUrlImagen;

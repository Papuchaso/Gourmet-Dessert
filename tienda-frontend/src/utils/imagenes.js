import { obtenerUrlImagen } from './helpers';

export { obtenerUrlImagen };

/**
 * Helper de compatibilidad para normalizar y construir URLs de imágenes.
 *
 * @param {Object|string} producto - Objeto del producto o string.
 * @returns {string} URL completa de la imagen o placeholder.
 */
export const urlImagen = (producto) => {
  return obtenerUrlImagen(producto);
};

export default urlImagen;

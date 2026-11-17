export const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/+$/, '');

/**
 * Retorna los encabezados con Bearer Token si existe sesión activa.
 */
export const authHeaders = () => {
  const token = localStorage.getItem('access_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

/**
 * Procesa las respuestas HTTP del backend traduciendo los estados de error.
 */
export const manejarRespuesta = async (res) => {
  if (res.status === 401) {
    throw new Error('Tu sesión venció o no está autorizada. Por favor, inicia sesión nuevamente.');
  }

  if (res.status === 403) {
    throw new Error('No tienes permisos de administrador para realizar esta acción.');
  }

  if (res.status === 404) {
    throw new Error('El producto o recurso solicitado no fue encontrado.');
  }

  if (res.status === 204) {
    return { ok: true };
  }

  const data = await res.json().catch(() => ({}));

  if (res.status === 409) {
    // Retorna directamente el mensaje 'detail' enviado por el backend (ej: falta de stock)
    throw new Error(data.detail || 'Conflicto con la solicitud o los productos seleccionados.');
  }

  if (!res.ok) {
    throw new Error(data.detail || 'Ocurrió un error al procesar la solicitud.');
  }

  return data;
};

/**
 * Autenticación de usuario (Login)
 * Envía credenciales como application/x-www-form-urlencoded y almacena access_token en localStorage.
 */
export const login = async (email, password) => {
  const formData = new URLSearchParams();
  formData.append('username', email.trim()); // OAuth2PasswordRequestForm usa username
  formData.append('password', password);

  const res = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: formData.toString()
  });

  const data = await manejarRespuesta(res);
  if (data && data.access_token) {
    localStorage.setItem('access_token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
  }
  return data;
};

export const loginUsuario = login;

/**
 * Registro de un nuevo usuario en la plataforma
 */
export const registrarUsuario = async ({ email, password, nombre, acepto_tratamiento = true }) => {
  const payload = {
    email: email.trim(),
    password,
    nombre: nombre.trim(),
    acepto_tratamiento: Boolean(acepto_tratamiento)
  };

  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  return manejarRespuesta(res);
};

export const registro = registrarUsuario;

/**
 * Obtiene el perfil del usuario autenticado
 */
export const getPerfilActual = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: authHeaders()
  });
  return manejarRespuesta(res);
};

/**
 * Obtiene la lista de productos del catálogo
 */
export const getProductos = async () => {
  const res = await fetch(`${API_BASE_URL}/productos`, {
    method: 'GET'
  });
  return manejarRespuesta(res);
};

/**
 * Envía el pedido al backend transformando los datos a { producto_id, cantidad }
 */
export const crearPedido = async (items) => {
  // Transforma el payload para enviar únicamente producto_id y cantidad
  const payload = {
    items: items.map(({ id, producto_id, cantidad }) => ({
      producto_id: producto_id || id,
      cantidad: Number(cantidad)
    }))
  };

  const res = await fetch(`${API_BASE_URL}/pedidos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  return manejarRespuesta(res);
};

/**
 * Obtiene el historial de pedidos del usuario logueado
 */
export const getMisPedidos = async () => {
  const res = await fetch(`${API_BASE_URL}/pedidos/mis-pedidos`, {
    method: 'GET',
    headers: authHeaders()
  });

  return manejarRespuesta(res);
};

/**
 * Revoca un pedido ejerciendo el derecho de arrepentimiento normativo (Ley 24.240)
 */
export const revocarPedido = async (pedidoId) => {
  const res = await fetch(`${API_BASE_URL}/pedidos/${pedidoId}/revocar`, {
    method: 'POST',
    headers: authHeaders()
  });

  if (res.status === 404) {
    throw new Error('El pedido que intentas revocar no fue encontrado.');
  }

  if (res.status === 409) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || 'No es posible revocar este pedido (el plazo normativo venció o ya fue cancelado).');
  }

  // Código 201 Created o 200 OK con el detalle de la revocación
  return manejarRespuesta(res);
};

/**
 * Obtiene la totalidad de los datos personales, historial de pedidos y solicitudes del usuario
 */
export const getMisDatos = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/mis-datos`, {
    method: 'GET',
    headers: authHeaders()
  });

  return manejarRespuesta(res);
};

/**
 * Elimina permanentemente la cuenta del usuario autenticado
 */
export const eliminarMiCuenta = async () => {
  const res = await fetch(`${API_BASE_URL}/auth/me`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  return manejarRespuesta(res);
};

/**
 * Carga/actualiza la imagen de un producto enviando FormData
 * IMPORTANTE: No se incluye 'Content-Type' para que el navegador fije boundary automáticamente.
 *
 * @param {number|string} productoId - Identificador del producto
 * @param {File} archivo - Archivo de imagen seleccionado
 * @returns {Promise<Object>} Datos actualizados del producto
 */
export const subirImagen = async (productoId, archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  // Únicamente enviamos Authorization si existe token (sin fijar Content-Type manual)
  const token = localStorage.getItem('access_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE_URL}/productos/${productoId}/imagen`, {
    method: 'POST',
    headers,
    body: formData
  });

  // Traducción y mapeo estricto de códigos de error HTTP a español
  if (res.status === 403) {
    throw new Error('No posees permisos de administrador para realizar esta acción.');
  }
  if (res.status === 404) {
    throw new Error('El producto no fue encontrado en el catálogo.');
  }
  if (res.status === 413) {
    throw new Error('El archivo seleccionado supera el límite máximo permitido de 2 MB.');
  }
  if (res.status === 415) {
    throw new Error('El formato del archivo no es válido. Debe ser una imagen (JPG, PNG, WEBP, GIF, SVG).');
  }

  return manejarRespuesta(res);
};

/**
 * Solicita el restablecimiento de contraseña enviando un correo con token
 *
 * @param {string} email - Correo del usuario registrado
 * @returns {Promise<Object>} Mensaje genérico de confirmación
 */
export const solicitarRecuperacion = async (email) => {
  const res = await fetch(`${API_BASE_URL}/auth/recuperar-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  return manejarRespuesta(res);
};

/**
 * Aplica la nueva contraseña utilizando el token de recuperación
 *
 * @param {string} token - Token de recuperación temporal
 * @param {string} nuevaPassword - Nueva contraseña validada
 * @returns {Promise<Object>} Mensaje de confirmación
 */
export const restablecerContrasena = async (token, nuevaPassword) => {
  const res = await fetch(`${API_BASE_URL}/auth/restablecer-contrasena`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      token,
      nueva_password: nuevaPassword
    })
  });
  return manejarRespuesta(res);
};

/**
 * Crea un nuevo producto en el catálogo (Requiere rol admin y JWT)
 *
 * @param {Object} datosProducto - { nombre, precio, stock, descripcion, imagen }
 * @returns {Promise<Object>} Producto creado
 */
export const crearProducto = async (datosProducto) => {
  const img = datosProducto.imagen_url || datosProducto.imagen;
  const payload = {
    nombre: datosProducto.nombre.trim(),
    descripcion: datosProducto.descripcion?.trim() || null,
    precio: parseFloat(datosProducto.precio),
    stock: parseInt(datosProducto.stock, 10) || 0,
    imagen: img?.trim() || null,
    imagen_url: img?.trim() || null
  };

  const res = await fetch(`${API_BASE_URL}/productos`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  return manejarRespuesta(res);
};

/**
 * Actualiza un producto existente en el catálogo (Requiere rol admin y JWT)
 *
 * @param {number|string} productoId - Identificador único del producto
 * @param {Object} datosProducto - Campos a actualizar { nombre, precio, stock, descripcion, imagen, imagen_url }
 * @returns {Promise<Object>} Producto actualizado
 */
export const actualizarProducto = async (productoId, datosProducto) => {
  const payload = {};
  if (datosProducto.nombre !== undefined) payload.nombre = datosProducto.nombre.trim();
  if (datosProducto.descripcion !== undefined) payload.descripcion = datosProducto.descripcion ? datosProducto.descripcion.trim() : null;
  if (datosProducto.precio !== undefined) payload.precio = parseFloat(datosProducto.precio);
  if (datosProducto.stock !== undefined) payload.stock = parseInt(datosProducto.stock, 10);
  
  const img = datosProducto.imagen_url !== undefined ? datosProducto.imagen_url : datosProducto.imagen;
  if (img !== undefined) {
    payload.imagen = img ? img.trim() : null;
    payload.imagen_url = img ? img.trim() : null;
  }

  const res = await fetch(`${API_BASE_URL}/productos/${productoId}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  return manejarRespuesta(res);
};

/**
 * Elimina un producto del catálogo (Requiere rol admin y JWT)
 *
 * @param {number|string} productoId - Identificador del producto a eliminar
 * @returns {Promise<Object>} Confirmación de eliminación
 */
export const eliminarProducto = async (productoId) => {
  const res = await fetch(`${API_BASE_URL}/productos/${productoId}`, {
    method: 'DELETE',
    headers: authHeaders()
  });

  return manejarRespuesta(res);
};

/**
 * Cambiar contraseña del usuario actual (PUT /usuarios/me/password)
 */
export const cambiarPassword = async (passwordActual, passwordNueva) => {
  const res = await fetch(`${API_BASE_URL}/usuarios/me/password`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify({
      password_actual: passwordActual,
      password_nueva: passwordNueva
    })
  });
  return manejarRespuesta(res);
};

/**
 * Subir o actualizar foto de perfil del usuario (POST /usuarios/me/avatar)
 */
export const subirAvatarUsuario = async (archivo) => {
  const formData = new FormData();
  formData.append('archivo', archivo);

  const token = localStorage.getItem('access_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};

  const res = await fetch(`${API_BASE_URL}/usuarios/me/avatar`, {
    method: 'POST',
    headers,
    body: formData
  });

  return manejarRespuesta(res);
};

/**
 * Helper para formatear y normalizar URLs de imágenes con el backend base URL
 */
export const obtenerUrlImagen = (path) => {
  if (path && typeof path === 'object') {
    path = path.imagen_url || path.imagen || path.foto_url || path.foto_perfil;
  }

  if (!path || typeof path !== 'string' || path.trim() === '') {
    return 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80';
  }

  const rutaLimpia = path.trim();

  if (/^(?:https?:|\/\/|blob:|data:)/i.test(rutaLimpia)) {
    return rutaLimpia;
  }

  const baseUrl = API_BASE_URL.endsWith('/') ? API_BASE_URL.slice(0, -1) : API_BASE_URL;
  const pathFormateado = rutaLimpia.startsWith('/') ? rutaLimpia : `/${rutaLimpia}`;

  return `${baseUrl}${pathFormateado}`;
};






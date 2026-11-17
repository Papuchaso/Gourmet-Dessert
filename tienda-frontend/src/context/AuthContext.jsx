import React, { createContext, useContext, useState, useEffect } from 'react';
import { login, loginUsuario, registrarUsuario, getPerfilActual } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [modalAuthAbierto, setModalAuthAbierto] = useState(false);

  const normalizarUsuario = (u) => {
    if (!u) return null;
    return {
      ...u,
      es_admin: u.es_admin !== undefined ? Boolean(u.es_admin) : u.rol === 'admin'
    };
  };

  // Inicializar y restaurar sesión guardada
  useEffect(() => {
    const restaurarSesion = async () => {
      const token = localStorage.getItem('access_token');
      const usuarioGuardado = localStorage.getItem('usuario_info');

      if (token && usuarioGuardado) {
        try {
          const parsed = JSON.parse(usuarioGuardado);
          setUsuario(normalizarUsuario(parsed));
          // Verificación en segundo plano
          const perfilActualizado = await getPerfilActual();
          const normalizado = normalizarUsuario(perfilActualizado);
          setUsuario(normalizado);
          localStorage.setItem('usuario_info', JSON.stringify(normalizado));
        } catch {
          cerrarSesion();
        }
      }
      setCargandoSesion(false);
    };

    restaurarSesion();
  }, []);

  const iniciarSesion = async (email, password) => {
    const data = await login(email, password);
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }

    // Obtener información del usuario autenticado
    const perfil = await getPerfilActual();
    const usuarioNormalizado = normalizarUsuario(perfil);
    setUsuario(usuarioNormalizado);
    localStorage.setItem('usuario_info', JSON.stringify(usuarioNormalizado));
    setModalAuthAbierto(false);
    return usuarioNormalizado;
  };

  const registroUsuario = async ({ email, password, nombre, acepto_tratamiento = true }) => {
    // Registrar usuario en el backend
    await registrarUsuario({ email, password, nombre, acepto_tratamiento });
    // Iniciar sesión automáticamente
    return await iniciarSesion(email, password);
  };

  const cerrarSesion = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('usuario_info');
    setUsuario(null);
  };

  const abrirModalAuth = () => setModalAuthAbierto(true);
  const cerrarModalAuth = () => setModalAuthAbierto(false);

  const esAdmin = usuario?.es_admin === true || usuario?.rol === 'admin';

  return (
    <AuthContext.Provider
      value={{
        usuario,
        estaAutenticado: !!usuario,
        esAdmin,
        cargandoSesion,
        modalAuthAbierto,
        abrirModalAuth,
        cerrarModalAuth,
        login: iniciarSesion,
        iniciarSesion,
        registro: registroUsuario,
        registrarUsuario: registroUsuario,
        cerrarSesion
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};

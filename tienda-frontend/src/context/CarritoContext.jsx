import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const CarritoContext = createContext();

export const CarritoProvider = ({ children }) => {
  // 1. Inicialización segura desde localStorage dentro de try/catch
  const [items, setItems] = useState(() => {
    try {
      const guardados = localStorage.getItem('carrito_items');
      return guardados ? JSON.parse(guardados) : [];
    } catch (error) {
      console.error('Error al parsear el carrito desde localStorage:', error);
      return [];
    }
  });

  // 2. Sincronización automática con localStorage
  useEffect(() => {
    try {
      localStorage.setItem('carrito_items', JSON.stringify(items));
    } catch (error) {
      console.error('Error al guardar el carrito en localStorage:', error);
    }
  }, [items]);

  // 3. Funciones del carrito
  const agregar = (producto, cantidad = 1) => {
    const prodId = producto.producto_id || producto.id;
    const cantNum = Math.max(1, Number(cantidad));

    setItems((prevItems) => {
      const index = prevItems.findIndex(
        (it) => (it.producto_id || it.id) === prodId
      );

      if (index > -1) {
        // Si ya existe, suma la cantidad
        return prevItems.map((it, i) =>
          i === index
            ? { ...it, cantidad: it.cantidad + cantNum }
            : it
        );
      } else {
        // Si no existe, lo agrega al listado
        return [
          ...prevItems,
          {
            producto_id: prodId,
            id: prodId,
            nombre: producto.nombre,
            precio: Number(producto.precio) || 0,
            imagen_url: producto.imagen_url || producto.foto_url || '',
            cantidad: cantNum
          }
        ];
      }
    });
  };

  const quitar = (producto_id) => {
    setItems((prevItems) =>
      prevItems.filter((it) => (it.producto_id || it.id) !== producto_id)
    );
  };

  const actualizarCantidad = (producto_id, nuevaCantidad) => {
    const cant = Number(nuevaCantidad);
    if (cant <= 0) {
      quitar(producto_id);
      return;
    }
    setItems((prevItems) =>
      prevItems.map((it) =>
        (it.producto_id || it.id) === producto_id
          ? { ...it, cantidad: cant }
          : it
      )
    );
  };

  const vaciar = () => {
    setItems([]);
  };

  // Cálculo dinámico del total con .reduce()
  const total = useMemo(() => {
    return items.reduce((acc, item) => acc + item.precio * item.cantidad, 0);
  }, [items]);

  const cantidadTotalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.cantidad, 0);
  }, [items]);

  return (
    <CarritoContext.Provider
      value={{
        items,
        agregar,
        quitar,
        actualizarCantidad,
        vaciar,
        total,
        cantidadTotalItems
      }}
    >
      {children}
    </CarritoContext.Provider>
  );
};

export const useCarrito = () => {
  const context = useContext(CarritoContext);
  if (!context) {
    throw new Error('useCarrito debe usarse dentro de un CarritoProvider');
  }
  return context;
};

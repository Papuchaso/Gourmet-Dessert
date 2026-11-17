import React from 'react';
import { useAuth } from '../context/AuthContext';

export const Arrepentimiento = ({ setRutaActual }) => {
  const { estaAutenticado, abrirModalAuth } = useAuth();

  return (
    <div className="container arrepentimiento-page">
      <div className="arrepentimiento-card">
        <div className="arrepentimiento-header">
          <span className="arrepentimiento-icon">⚖️</span>
          <h2>Derecho de Arrepentimiento y Revocación</h2>
          <span className="legal-badge">Ley N° 24.240 de Defensa del Consumidor</span>
        </div>

        <div className="arrepentimiento-body">
          <section className="legal-explanation">
            <h3>¿En qué consiste el Derecho de Arrepentimiento?</h3>
            <p>
              Conforme a lo establecido en el <strong>Artículo 34 de la Ley Nacional N° 24.240</strong> de Defensa del Consumidor y normas complementarias de la República Argentina:
            </p>
            <ul className="legal-list">
              <li>
                <strong>Plazo legal:</strong> Tienes derecho a revocar la aceptación de la compra dentro del plazo de <strong>10 (diez) días corridos</strong> contados a partir de la fecha de entrega del producto o de la celebración del contrato (lo último que ocurra).
              </li>
              <li>
                <strong>Sin costo ni penalidad:</strong> El ejercicio del derecho de arrepentimiento no generará ningún gasto, costo administrativo ni penalidad para ti.
              </li>
              <li>
                <strong>Sin justificación requerida:</strong> No es necesario fundamentar ni justificar el motivo de tu decisión de arrepentimiento.
              </li>
              <li>
                <strong>Gastos de devolución a cargo del vendedor:</strong> Los gastos originados por el retiro y/o restitución de los productos corren íntegramente por cuenta de Gourmet Dessert.
              </li>
            </ul>
          </section>

          <section className="how-to-cancel">
            <h3>¿Cómo gestionar la revocación de una compra?</h3>
            <p>
              Para solicitar la revocación de un pedido activo realizado en nuestra tienda, debes ingresar a tu historial de compras y presionar el botón <em>«Arrepentirme de esta compra»</em> en el pedido correspondiente.
            </p>

            <div className="arrepentimiento-cta-box">
              {estaAutenticado ? (
                <div className="authenticated-cta">
                  <p>Has iniciado sesión. Puedes acceder directamente a tu historial para revocar pedidos vigentes:</p>
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={() => setRutaActual('mis-pedidos')}
                  >
                    📦 Ir a Mis Pedidos
                  </button>
                </div>
              ) : (
                <div className="unauthenticated-cta">
                  <p>Para gestionar la revocación de un pedido previamente realizado, inicia sesión en tu cuenta:</p>
                  <button
                    type="button"
                    className="btn-primary-action"
                    onClick={abrirModalAuth}
                  >
                    ✨ Iniciar Sesión para Gestionar Revocación
                  </button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

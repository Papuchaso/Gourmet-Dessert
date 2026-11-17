import React from 'react';

export const Footer = ({ setRutaActual }) => {
  return (
    <footer className="footer-global">
      <div className="footer-container container">
        <div className="footer-left">
          <div className="footer-brand">
            <span className="brand-icon">🍯</span>
            <span className="brand-name">Gourmet Dessert</span>
          </div>
          <p className="footer-text">
            Melería & Postres Engaña-Ojos para la comunidad del IRESM.
          </p>
        </div>

        <div className="footer-links-group">
          <div className="footer-normative-box">
            <span className="normative-title">Marco Regulatorio y Defensa del Consumidor:</span>
            <p>Conforme a la <strong>Ley N° 24.240</strong> y Resoluciones complementarias vigentes en la República Argentina.</p>
          </div>

          <div className="footer-actions">
            {/* Enlace con texto exacto exigido por normativa */}
            <button
              type="button"
              className="btn-arrepentimiento-link"
              onClick={() => setRutaActual('arrepentimiento')}
            >
              Botón de arrepentimiento
            </button>
          </div>
        </div>
      </div>

      <div className="footer-bottom-bar">
        <p>&copy; {new Date().getFullYear()} Gourmet Dessert IRESM. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
};

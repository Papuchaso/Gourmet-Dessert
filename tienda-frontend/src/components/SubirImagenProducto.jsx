import React, { useState, useRef, useEffect } from 'react';
import { subirImagen } from '../services/api';

const MAX_TAMANO_BYTES = 2 * 1024 * 1024; // 2 MB

/**
 * Componente modular para la carga de imágenes con input no controlado,
 * validación en cliente, vista previa con gestión de memoria y envío por FormData.
 */
export const SubirImagenProducto = ({ productoId, onImagenSubida, onCancelar }) => {
  const inputRef = useRef(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);

  // 1. Limpieza de memoria para evitar fugas con URL.createObjectURL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Función imperativa para resetear el input y estado
  const limpiarInputImperativo = () => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
    setArchivoSeleccionado(null);
    if (preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  };

  // 2. Manejo y validación estricta de archivo en el cliente
  const handleFileChange = (e) => {
    setError(null);
    setMensajeExito(null);

    const file = e.target.files?.[0];
    if (!file) {
      limpiarInputImperativo();
      return;
    }

    // Validación 1: Tipo MIME de imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor, selecciona un archivo de imagen válido (JPG, PNG, WEBP, GIF, SVG).');
      limpiarInputImperativo();
      return;
    }

    // Validación 2: Tamaño máximo 2 MB
    if (file.size > MAX_TAMANO_BYTES) {
      const tamanoMB = (file.size / (1024 * 1024)).toFixed(2);
      setError(`La imagen pesa ${tamanoMB} MB. El tamaño máximo permitido es de 2 MB.`);
      limpiarInputImperativo();
      return;
    }

    // Si es válido, se libera preview previa si existía y se genera la nueva
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    const nuevaUrlPreview = URL.createObjectURL(file);
    setPreview(nuevaUrlPreview);
    setArchivoSeleccionado(file);
  };

  // 3. Envío asíncrono con FormData
  const handleSubir = async (e) => {
    e.preventDefault();
    if (!archivoSeleccionado || subiendo) return;

    setSubiendo(true);
    setError(null);
    setMensajeExito(null);

    try {
      const dataActualizada = await subirImagen(productoId, archivoSeleccionado);
      setMensajeExito('¡Imagen actualizada con éxito!');
      
      // Limpieza imperativa tras éxito
      limpiarInputImperativo();

      if (onImagenSubida) {
        onImagenSubida(dataActualizada);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendo(false);
    }
  };

  return (
    <div className="subir-imagen-card">
      <div className="subir-imagen-header">
        <h4>📸 Actualizar Imagen del Producto</h4>
        {onCancelar && (
          <button type="button" className="btn-cerrar-mini" onClick={onCancelar}>
            &times;
          </button>
        )}
      </div>

      <form onSubmit={handleSubir} className="subir-imagen-form">
        {/* Input No Controlado con useRef */}
        <div className="file-input-wrapper">
          <input
            type="file"
            accept="image/*"
            ref={inputRef}
            onChange={handleFileChange}
            disabled={subiendo}
            id={`file-input-${productoId}`}
            className="input-file-custom"
          />
          <label htmlFor={`file-input-${productoId}`} className="file-input-label">
            📁 {archivoSeleccionado ? archivoSeleccionado.name : 'Seleccionar imagen (< 2 MB)'}
          </label>
        </div>

        {/* Mensaje de Error en Validación o Subida */}
        {error && (
          <div className="alert-error-mini" role="alert">
            <span>⚠️ {error}</span>
          </div>
        )}

        {/* Mensaje de Éxito */}
        {mensajeExito && (
          <div className="alert-success-mini" role="status">
            <span>✅ {mensajeExito}</span>
          </div>
        )}

        {/* Vista Previa en elemento <img> chico con object-cover */}
        {preview && (
          <div className="preview-container">
            <span className="preview-label">Vista Previa:</span>
            <div className="preview-thumb-box">
              <img
                src={preview}
                alt="Vista previa de imagen a subir"
                className="preview-img object-cover"
              />
            </div>
          </div>
        )}

        <div className="subir-imagen-acciones">
          {preview && (
            <button
              type="button"
              className="btn-cancelar-mini"
              onClick={limpiarInputImperativo}
              disabled={subiendo}
            >
              Cancelar
            </button>
          )}

          <button
            type="submit"
            className="btn-submit-imagen"
            disabled={!archivoSeleccionado || subiendo}
          >
            {subiendo ? 'Subiendo…' : '📤 Subir Imagen'}
          </button>
        </div>
      </form>
    </div>
  );
};

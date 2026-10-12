import React, { useRef } from 'react';
import { CheckCircle2, Download, Gift } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { formatoPrecio } from '../../lib/precios';
import './ConfirmacionReserva.css';

/**
 * ConfirmacionReserva — pantalla final de la reserva (en VistaCanchas): código de reserva, QR
 * (con los datos en texto, ver lib/codigoReserva) para mostrar al llegar,
 * resumen y opción de descargar el QR como imagen.
 *
 * Props: codigo, textoQr, resumen ({ tipoEtiqueta, fechaTexto, horario,
 * canchas, total, packsAgua }), onListo.
 */
function ConfirmacionReserva({ codigo, textoQr, resumen = {}, onListo }) {
  const qrRef = useRef(null);

  const {
    tipoEtiqueta,
    fechaTexto,
    horario,
    canchas = [],
    total = 0,
    packsAgua = 0,
  } = resumen;

  const descargarQr = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const enlace = document.createElement('a');
    enlace.href = canvas.toDataURL('image/png');
    enlace.download = `reserva-${codigo}.png`;
    enlace.click();
  };

  const lineaMeta = [tipoEtiqueta, fechaTexto, horario]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="confirmacion-reserva">
      <CheckCircle2
        size={44}
        color="#0f9d58"
        className="confirmacion-reserva__icono"
        aria-hidden="true"
      />

      <h3 className="confirmacion-reserva__titulo">Reserva confirmada</h3>

      <div className="confirmacion-reserva__codigo-caja">
        <span className="confirmacion-reserva__codigo-etiqueta">
          Código de reserva
        </span>
        <p className="confirmacion-reserva__codigo">{codigo}</p>
      </div>

      <div ref={qrRef} className="confirmacion-reserva__qr">
        <QRCodeCanvas
          value={textoQr}
          size={208}
          level="M"
          marginSize={2}
          bgColor="#ffffff"
          fgColor="#141414"
          title={`Código QR de la reserva ${codigo}`}
        />
      </div>

      <p className="confirmacion-reserva__aviso">
        Muestra este código al llegar: tiene los datos de tu reserva.
      </p>

      <div className="confirmacion-reserva__resumen">
        {lineaMeta && (
          <p className="confirmacion-reserva__meta">{lineaMeta}</p>
        )}

        {canchas.length > 0 && (
          <p className="confirmacion-reserva__canchas">{canchas.join(' · ')}</p>
        )}

        <p className="confirmacion-reserva__total">
          Total: <strong>{formatoPrecio.format(total)}</strong>
        </p>

        {packsAgua > 0 && (
          <p className="confirmacion-reserva__agua">
            <Gift size={16} aria-hidden="true" />
            <span>
              {`Incluye ${packsAgua} ${packsAgua === 1 ? 'pack' : 'packs'} de agua gratis`}
            </span>
          </p>
        )}
      </div>

      <div className="confirmacion-reserva__acciones">
        <button
          type="button"
          className="button hollow confirmacion-reserva__boton-descargar"
          onClick={descargarQr}
        >
          <Download size={16} aria-hidden="true" />
          Descargar QR
        </button>

        <button
          type="button"
          className="button success confirmacion-reserva__boton-listo"
          onClick={onListo}
        >
          Listo
        </button>
      </div>
    </div>
  );
}

export default ConfirmacionReserva;

import React, { useEffect, useId, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import './DialogoHorasSinPartido.css';

const SELECTOR_ENFOCABLES =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Diálogo modal accesible para advertir que alguna fase del torneo tiene
 * más horas marcadas de las que ocupan sus partidos y confirmar si reservar igual.
 */
function DialogoHorasSinPartido({
  abierto,
  mensajes = [],
  onRevisar,
  onReservarIgual,
  onCerrar,
}) {
  const tituloId = useId();
  const dialogRef = useRef(null);
  const btnRevisarRef = useRef(null);

  useEffect(() => {
    if (!abierto) return undefined;

    const focoPrevio =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dlg = dialogRef.current;

    if (dlg) {
      if (typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
    }

    if (btnRevisarRef.current) {
      btnRevisarRef.current.focus();
    }

    return () => {
      if (dlg) {
        if (dlg.open && typeof dlg.close === 'function') {
          dlg.close();
        } else {
          dlg.removeAttribute('open');
        }
      }
      if (focoPrevio && focoPrevio.isConnected) {
        focoPrevio.focus();
      }
    };
  }, [abierto]);

  if (!abierto) return null;

  const listaMensajes = Array.isArray(mensajes) ? mensajes.filter(Boolean) : [];

  const manejarCierreNeutro = () => {
    const fn = onCerrar || onRevisar;
    if (fn) fn();
  };

  const manejarKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      manejarCierreNeutro();
      return;
    }

    if (e.key === 'Tab') {
      const dlg = dialogRef.current;
      if (!dlg) return;
      const enfocables = Array.from(dlg.querySelectorAll(SELECTOR_ENFOCABLES));
      if (enfocables.length === 0) {
        e.preventDefault();
        return;
      }
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === primero || !dlg.contains(document.activeElement)) {
          e.preventDefault();
          ultimo.focus();
        }
      } else if (
        document.activeElement === ultimo ||
        !dlg.contains(document.activeElement)
      ) {
        e.preventDefault();
        primero.focus();
      }
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="dialogo-horas-sin-partido"
      role="dialog"
      aria-modal="true"
      aria-labelledby={tituloId}
      onCancel={(e) => {
        e.preventDefault();
        manejarCierreNeutro();
      }}
      onClick={(e) => {
        if (e.target === dialogRef.current) {
          manejarCierreNeutro();
        }
      }}
      onKeyDown={manejarKeyDown}
    >
      <div className="dialogo-horas-sin-partido__contenido">
        <div className="dialogo-horas-sin-partido__cabecera">
          <span className="dialogo-horas-sin-partido__icono" aria-hidden="true">
            <AlertTriangle size={20} strokeWidth={2.2} />
          </span>
          <h2 id={tituloId} className="dialogo-horas-sin-partido__titulo">
            Hay horas sin partido
          </h2>
        </div>

        {listaMensajes.length === 1 && (
          <p className="dialogo-horas-sin-partido__detalle">{listaMensajes[0]}</p>
        )}

        {listaMensajes.length > 1 && (
          <ul className="dialogo-horas-sin-partido__lista">
            {listaMensajes.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
        )}

        <p className="dialogo-horas-sin-partido__pregunta">
          ¿Quieres reservar igual? Esas horas se cobran.
        </p>

        <div className="dialogo-horas-sin-partido__acciones">
          <button
            ref={btnRevisarRef}
            type="button"
            className="button dialogo-horas-sin-partido__btn-revisar"
            onClick={onRevisar}
          >
            Revisar horas
          </button>
          <button
            type="button"
            className="button hollow dialogo-horas-sin-partido__btn-reservar"
            onClick={onReservarIgual}
          >
            Reservar igual
          </button>
        </div>
      </div>
    </dialog>
  );
}

export default DialogoHorasSinPartido;

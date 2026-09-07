import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReservas } from '../../context/ReservasContext';
import SelectorDia from '../shared/SelectorDia';
import { fechaLarga } from '../../lib/fechas';
import './ReservaModal.css';

/**
 * ReservaModal — modal para reservar un horario de una cancha.
 *
 * - Se abre desde el botón "Reservar" de CanchaCard.
 * - Contenedor con las clases de Reveal de Foundation (`reveal-overlay` +
 *   `reveal`), abierto/cerrado desde React (sin la JS de Foundation).
 * - Selector de día: componente compartido `<SelectorDia>` (mismo que usa el
 *   modal de evento).
 * - Lee la disponibilidad viva del ReservasContext por (cancha, fecha).
 * - Al confirmar revalida el horario y, si ya no está libre, muestra un aviso
 *   en vez de reservar.
 */
function ReservaModal({ cancha, abierto, onCerrar }) {
  const { dias, canchas, disponibilidad, reservar } = useReservas();
  const canchaId = cancha ? cancha.id : null;

  const canchaViva = useMemo(
    () => canchas.find((c) => c.id === canchaId) || cancha,
    [canchas, canchaId, cancha]
  );

  const [fechaSel, setFechaSel] = useState(dias[0]);
  const [horaSel, setHoraSel] = useState(null);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState(null);
  const [confirmada, setConfirmada] = useState(null);

  // Reset al abrir o al cambiar de cancha.
  useEffect(() => {
    if (abierto) {
      setFechaSel(dias[0]);
      setHoraSel(null);
      setNombre('');
      setTelefono('');
      setError(null);
      setConfirmada(null);
    }
  }, [abierto, canchaId, dias]);

  // Cerrar con Escape.
  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  const horarios =
    abierto && canchaViva ? disponibilidad(canchaViva.id, fechaSel) : [];

  // Si el horario elegido se reserva mientras el modal está abierto (choque en
  // la misma sesión), se deselecciona y se avisa.
  useEffect(() => {
    if (!horaSel || !canchaViva) return;
    const h = disponibilidad(canchaViva.id, fechaSel).find(
      (x) => x.hora === horaSel
    );
    if (h && !h.disponible) {
      setHoraSel(null);
      setError('Ese horario acaba de reservarse. Elegí otro.');
    }
  }, [disponibilidad, canchaViva, fechaSel, horaSel]);

  if (!abierto || !canchaViva) return null;

  const confirmar = () => {
    if (!horaSel) return;
    const res = reservar({
      canchaId: canchaViva.id,
      fecha: fechaSel,
      hora: horaSel,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
    });
    if (!res.ok) {
      setError(res.error);
      setHoraSel(null);
      return;
    }
    setError(null);
    setConfirmada({ fecha: fechaSel, hora: horaSel });
  };

  const modal = (
    <div
      className="reveal-overlay reserva-overlay"
      role="presentation"
      onMouseDown={onCerrar}
    >
      <div
        className="reveal reserva-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="reserva-modal-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="close-button"
          aria-label="Cerrar"
          onClick={onCerrar}
        >
          <span aria-hidden="true">&times;</span>
        </button>

        <h2 id="reserva-modal-titulo" className="reserva-modal__titulo">
          Reservar &mdash; {canchaViva.nombre}
        </h2>

        {confirmada ? (
          <div className="callout success reserva-modal__ok">
            <p>
              <strong>Reserva confirmada.</strong> {canchaViva.nombre},{' '}
              {fechaLarga(confirmada.fecha, dias)} a las {confirmada.hora}.
            </p>
            <button type="button" className="button" onClick={onCerrar}>
              Listo
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="callout alert" role="alert">
                {error}
              </div>
            )}

            <fieldset className="reserva-modal__campo">
              <legend>Día</legend>
              <SelectorDia
                dias={dias}
                valor={fechaSel}
                onChange={(iso) => {
                  setFechaSel(iso);
                  setHoraSel(null);
                  setError(null);
                }}
                contarLibres={(iso) =>
                  disponibilidad(canchaViva.id, iso).filter((h) => h.disponible)
                    .length
                }
              />
            </fieldset>

            <fieldset className="reserva-modal__campo">
              <legend>Horario</legend>
              <div className="reserva-modal__horas">
                {horarios.map((h) => {
                  const seleccionado = horaSel === h.hora;
                  return (
                    <button
                      key={h.hora}
                      type="button"
                      className={
                        'button small reserva-modal__hora' +
                        (h.disponible ? '' : ' reserva-modal__hora--ocupado') +
                        (seleccionado
                          ? ' reserva-modal__hora--sel'
                          : ' hollow')
                      }
                      disabled={!h.disponible}
                      aria-pressed={seleccionado}
                      onClick={() => {
                        setHoraSel(h.hora);
                        setError(null);
                      }}
                    >
                      {h.hora}
                      {!h.disponible && (
                        <span className="reserva-modal__hora-tag">
                          {' '}
                          · reservado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid-x grid-padding-x reserva-modal__contacto">
              <label className="cell medium-6">
                Nombre (opcional)
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  autoComplete="off"
                />
              </label>
              <label className="cell medium-6">
                Teléfono (opcional)
                <input
                  type="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  autoComplete="off"
                />
              </label>
            </div>

            <div className="reserva-modal__acciones">
              <button
                type="button"
                className="button clear secondary"
                onClick={onCerrar}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="button success"
                disabled={!horaSel}
                onClick={confirmar}
              >
                Confirmar reserva
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default ReservaModal;

import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck, CheckCircle2, Gift, X } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import SelectorDia from '../shared/SelectorDia';
import { fechaLarga } from '../../lib/fechas';
import {
  DESCUENTO_POR_HORA,
  MAX_HORAS_SEGUIDAS,
  MIN_HORAS_BENEFICIO,
  calcularPrecio,
  finDeFranja,
  formatoPrecio,
} from '../../lib/precios';
import {
  errorNombre,
  empiezaMalTelefono,
  errorTelefono,
  limpiarNombre,
  limpiarTelefono,
} from '../../lib/validacion';
import './ReservaModal.css';

/**
 * ReservaModal — modal para reservar de 1 a 3 horas seguidas de una cancha.
 *
 * - Las horas se eligen con clics sobre los botones de horario: una hora suelta
 *   o varias contiguas (hasta MAX_HORAS_SEGUIDAS). Un clic en una hora vecina
 *   del bloque lo amplía; un clic en una hora ya elegida la quita; un clic en
 *   una hora lejana empieza una selección nueva.
 * - Desde 2 horas seguidas: descuento por hora y pack de agua (ver lib/precios).
 *
 * - Se abre desde el botón "Reservar" del panel de detalle de VistaCanchas.
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
  const [horasSel, setHorasSel] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tocado, setTocado] = useState({ nombre: false, telefono: false });
  const [error, setError] = useState(null);
  const [confirmada, setConfirmada] = useState(null);

  // Reset al abrir o al cambiar de cancha.
  useEffect(() => {
    if (abierto) {
      setFechaSel(dias[0]);
      setHorasSel([]);
      setNombre('');
      setTelefono('');
      setTocado({ nombre: false, telefono: false });
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

  // Si alguna hora elegida se reserva mientras el modal está abierto (choque en
  // la misma sesión), se limpia la selección y se avisa.
  useEffect(() => {
    if (horasSel.length === 0 || !canchaViva) return;
    const lista = disponibilidad(canchaViva.id, fechaSel);
    const algunaOcupada = horasSel.some((hora) => {
      const h = lista.find((x) => x.hora === hora);
      return !h || !h.disponible;
    });
    if (algunaOcupada) {
      setHorasSel([]);
      setError('Ese horario acaba de reservarse. Elige otro.');
    }
  }, [disponibilidad, canchaViva, fechaSel, horasSel]);

  if (!abierto || !canchaViva) return null;

  const errNombre = errorNombre(nombre);
  const errTelefono = errorTelefono(telefono);
  const verErrTelefono =
    !!errTelefono && (tocado.telefono || empiezaMalTelefono(telefono));
  const contactoOk = !errNombre && !errTelefono;

  // `horasSel` siempre es un bloque de horas contiguas (lo garantiza
  // `alternarHora`), ordenado de la más temprana a la más tarde.
  const bloque = horasSel;
  const precio = calcularPrecio(canchaViva.precioHora, bloque.length);
  const finBloque = bloque.length > 0 ? finDeFranja(bloque[bloque.length - 1]) : null;

  const indiceHora = (hora) => horarios.findIndex((h) => h.hora === hora);

  const alternarHora = (hora) => {
    setError(null);

    // Hora ya elegida -> se quita. Si queda en medio de un bloque de 3, se
    // conserva solo la parte anterior para que el resto siga siendo contiguo.
    const pos = horasSel.indexOf(hora);
    if (pos >= 0) {
      if (pos === 0) setHorasSel(horasSel.slice(1));
      else if (pos === horasSel.length - 1) setHorasSel(horasSel.slice(0, -1));
      else setHorasSel(horasSel.slice(0, pos));
      return;
    }

    if (horasSel.length === 0) {
      setHorasSel([hora]);
      return;
    }

    // Hora vecina del bloque -> se amplía (hasta el máximo).
    const i = indiceHora(hora);
    const primero = indiceHora(horasSel[0]);
    const ultimo = indiceHora(horasSel[horasSel.length - 1]);
    if (i === ultimo + 1 || i === primero - 1) {
      if (horasSel.length >= MAX_HORAS_SEGUIDAS) {
        setError(`Puedes reservar hasta ${MAX_HORAS_SEGUIDAS} horas seguidas.`);
        return;
      }
      setHorasSel(i === ultimo + 1 ? [...horasSel, hora] : [hora, ...horasSel]);
      return;
    }

    // Hora lejana -> empieza una selección nueva.
    setHorasSel([hora]);
  };

  const confirmar = () => {
    if (bloque.length === 0 || !contactoOk) return;
    const res = reservar({
      canchaId: canchaViva.id,
      fecha: fechaSel,
      horas: bloque,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
    });
    if (!res.ok) {
      setError(res.error);
      setHorasSel([]);
      return;
    }
    setError(null);
    setConfirmada({
      fecha: fechaSel,
      inicio: bloque[0],
      fin: finBloque,
      total: precio.total,
      aguaGratis: precio.aguaGratis,
    });
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
          className="reserva-modal__cerrar"
          aria-label="Cerrar"
          onClick={onCerrar}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="reserva-modal__encabezado">
          <span className="reserva-modal__encabezado-icono" aria-hidden="true">
            <CalendarCheck size={20} />
          </span>
          <h2 id="reserva-modal-titulo" className="reserva-modal__titulo">
            Reservar &mdash; {canchaViva.nombre}
          </h2>
        </div>

        {confirmada ? (
          <div className="reserva-modal__ok">
            <CheckCircle2
              size={42}
              className="reserva-modal__ok-icono"
              aria-hidden="true"
            />
            <p className="reserva-modal__ok-titulo">Reserva confirmada</p>
            <p className="reserva-modal__ok-resumen">
              <strong>{canchaViva.nombre}</strong>
              <br />
              {fechaLarga(confirmada.fecha, dias)}, de {confirmada.inicio} a{' '}
              {confirmada.fin}
              <br />
              Total: <strong>{formatoPrecio.format(confirmada.total)}</strong>
            </p>
            {confirmada.aguaGratis && (
              <p className="reserva-modal__ok-agua">
                <Gift size={16} aria-hidden="true" /> Incluye un pack de agua gratis
              </p>
            )}
            <button
              type="button"
              className="button success reserva-modal__ok-boton"
              onClick={onCerrar}
            >
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
                  setHorasSel([]);
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
              <p className="reserva-modal__promo">
                <Gift size={16} aria-hidden="true" />
                <span>
                  Desde {MIN_HORAS_BENEFICIO} horas seguidas:{' '}
                  <strong>{formatoPrecio.format(DESCUENTO_POR_HORA)} menos por hora</strong>{' '}
                  y un <strong>pack de agua gratis</strong>.
                </span>
              </p>
              <div className="reserva-modal__horas">
                {horarios.map((h) => {
                  const seleccionado = bloque.includes(h.hora);
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
                      onClick={() => alternarHora(h.hora)}
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
              {bloque.length > 0 && (
                <div className="reserva-modal__resumen" aria-live="polite">
                  <p className="reserva-modal__resumen-rango">
                    {bloque[0]} a {finBloque} · {bloque.length}{' '}
                    {bloque.length === 1 ? 'hora' : 'horas'}
                  </p>
                  {precio.aguaGratis && (
                    <p className="reserva-modal__resumen-ahorro">
                      Ahorras {formatoPrecio.format(precio.ahorro)} y te llevas un
                      pack de agua gratis
                    </p>
                  )}
                  <p className="reserva-modal__resumen-total">
                    {precio.aguaGratis && (
                      <s className="reserva-modal__resumen-tachado">
                        {formatoPrecio.format(precio.subtotal)}
                      </s>
                    )}
                    <strong>{formatoPrecio.format(precio.total)}</strong>
                  </p>
                </div>
              )}
            </fieldset>

            <div className="grid-x grid-padding-x reserva-modal__contacto">
              <div className="cell medium-6">
                <label htmlFor="reserva-nombre">
                  Nombre (opcional)
                </label>
                <input
                  id="reserva-nombre"
                  name="nombre"
                  type="text"
                  className={
                    'reserva-modal__input' +
                    (tocado.nombre && errNombre ? ' is-invalid-input' : '')
                  }
                  placeholder="Ej. Juan Pérez…"
                  value={nombre}
                  onChange={(e) => setNombre(limpiarNombre(e.target.value))}
                  onBlur={() => setTocado((t) => ({ ...t, nombre: true }))}
                  autoComplete="name"
                  aria-invalid={tocado.nombre && !!errNombre}
                  aria-describedby="reserva-nombre-error"
                />
                <span
                  id="reserva-nombre-error"
                  className={'form-error' + (tocado.nombre && errNombre ? ' is-visible' : '')}
                >
                  {errNombre}
                </span>
              </div>
              <div className="cell medium-6">
                <label htmlFor="reserva-telefono">
                  Teléfono (opcional)
                </label>
                <input
                  id="reserva-telefono"
                  name="telefono"
                  type="tel"
                  className={
                    'reserva-modal__input' +
                    (verErrTelefono ? ' is-invalid-input' : '')
                  }
                  placeholder="Ej. 3001234567"
                  value={telefono}
                  onChange={(e) => setTelefono(limpiarTelefono(e.target.value))}
                  onBlur={() => setTocado((t) => ({ ...t, telefono: true }))}
                  inputMode="numeric"
                  maxLength={10}
                  autoComplete="tel-national"
                  aria-invalid={verErrTelefono}
                  aria-describedby="reserva-telefono-error"
                />
                <span
                  id="reserva-telefono-error"
                  className={'form-error' + (verErrTelefono ? ' is-visible' : '')}
                >
                  {errTelefono}
                </span>
              </div>
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
                disabled={bloque.length === 0 || !contactoOk}
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

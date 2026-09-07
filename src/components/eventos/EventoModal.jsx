import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReservas } from '../../context/ReservasContext';
import { deportePorSlug } from '../../data/deportes';
import SelectorDia from '../shared/SelectorDia';
import { fechaLarga } from '../../lib/fechas';
import './EventoModal.css';

const TIPOS = [
  { valor: 'torneo', etiqueta: 'Torneo' },
  { valor: 'cumpleanos', etiqueta: 'Cumpleaños' },
];

/**
 * EventoModal — flujo para reservar un evento especial (torneo o cumpleaños).
 *
 * Flujo adicional al de reserva de una sola cancha, no lo reemplaza. Permite
 * elegir varias canchas y una franja horaria consecutiva (ej. de 15:00 a 18:00);
 * el bloqueo es todo-o-nada.
 *
 * Reutiliza `<SelectorDia>` (mismo selector de 7 días que la reserva normal).
 */
function EventoModal({ abierto, onCerrar }) {
  const { dias, canchas, disponibilidad, reservarEvento } = useReservas();

  const horasBase = useMemo(
    () => (canchas[0] ? canchas[0].horas : []),
    [canchas]
  );
  // Opciones de "hasta": las horas de inicio menos la primera, más el cierre.
  const horasFin = useMemo(
    () => [...horasBase.slice(1), '21:00'],
    [horasBase]
  );

  const [tipo, setTipo] = useState('torneo');
  const [fecha, setFecha] = useState(dias[0]);
  const [canchaIds, setCanchaIds] = useState([]);
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [equipos, setEquipos] = useState('');
  const [canchasNecesarias, setCanchasNecesarias] = useState('');
  const [invitados, setInvitados] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState(null);
  const [confirmado, setConfirmado] = useState(null);

  useEffect(() => {
    if (abierto) {
      setTipo('torneo');
      setFecha(dias[0]);
      setCanchaIds([]);
      setDesde('');
      setHasta('');
      setEquipos('');
      setCanchasNecesarias('');
      setInvitados('');
      setNombre('');
      setTelefono('');
      setError(null);
      setConfirmado(null);
    }
  }, [abierto, dias]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  // Hora libre en TODAS las canchas elegidas, en la fecha elegida.
  const horaLibreEnTodas = (hora) =>
    canchaIds.length > 0 &&
    canchaIds.every((cid) => {
      const h = disponibilidad(cid, fecha).find((x) => x.hora === hora);
      return h && h.disponible;
    });

  // Horas del bloque [desde, hasta): franjas de 1 h.
  const bloqueHoras = useMemo(() => {
    if (!desde || !hasta) return [];
    const i = horasBase.indexOf(desde);
    const finIdx = hasta === '21:00' ? horasBase.length : horasBase.indexOf(hasta);
    if (i < 0 || finIdx <= i) return [];
    return horasBase.slice(i, finIdx);
  }, [desde, hasta, horasBase]);

  const bloqueLibre =
    bloqueHoras.length > 0 && bloqueHoras.every((h) => horaLibreEnTodas(h));

  const camposTipoOk =
    tipo === 'torneo' ? Number(equipos) > 0 : Number(invitados) > 0;

  const puedeConfirmar =
    canchaIds.length > 0 && bloqueLibre && camposTipoOk && !confirmado;

  const toggleCancha = (id) => {
    setCanchaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  };

  const cambiarDesde = (v) => {
    setDesde(v);
    // si "hasta" quedó antes o igual, se limpia
    if (hasta && horasFin.indexOf(hasta) <= horasBase.indexOf(v)) setHasta('');
    setError(null);
  };

  const confirmar = () => {
    if (!puedeConfirmar) return;
    const res = reservarEvento({
      subtipo: tipo,
      fecha,
      canchaIds,
      horas: bloqueHoras,
      equipos: tipo === 'torneo' ? Number(equipos) : null,
      canchasNecesarias:
        tipo === 'torneo'
          ? Number(canchasNecesarias) || canchaIds.length
          : null,
      invitados: tipo === 'cumpleanos' ? Number(invitados) : null,
      nombre: nombre.trim(),
      telefono: telefono.trim(),
    });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setConfirmado({
      tipo,
      fecha,
      canchaNombres: canchaIds.map((cid) => {
        const c = canchas.find((x) => x.id === cid);
        return c ? c.nombre : cid;
      }),
      desde: bloqueHoras[0],
      hasta: hasta === '21:00' ? '21:00' : hasta,
    });
  };

  if (!abierto) return null;

  // Franja de disponibilidad combinada (solo lectura), para elegir mejor.
  const strip =
    canchaIds.length > 0
      ? horasBase.map((h) => ({ hora: h, libre: horaLibreEnTodas(h) }))
      : [];

  const modal = (
    <div
      className="reveal-overlay evento-overlay"
      role="presentation"
      onMouseDown={onCerrar}
    >
      <div
        className="reveal evento-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="evento-modal-titulo"
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

        <h2 id="evento-modal-titulo" className="evento-modal__titulo">
          Reservar un evento
        </h2>

        {confirmado ? (
          <div className="callout success evento-modal__ok">
            <p>
              <strong>
                {confirmado.tipo === 'torneo'
                  ? '¡Torneo reservado!'
                  : '¡Cumpleaños reservado!'}
              </strong>{' '}
              {fechaLarga(confirmado.fecha, dias)}, de {confirmado.desde} a{' '}
              {confirmado.hasta}.
            </p>
            <p className="evento-modal__ok-canchas">
              {confirmado.canchaNombres.join(' · ')}
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

            <fieldset className="evento-modal__campo">
              <legend>Tipo de evento</legend>
              <div className="button-group">
                {TIPOS.map((t) => (
                  <button
                    key={t.valor}
                    type="button"
                    className={'button' + (tipo === t.valor ? '' : ' hollow')}
                    aria-pressed={tipo === t.valor}
                    onClick={() => {
                      setTipo(t.valor);
                      setError(null);
                    }}
                  >
                    {t.etiqueta}
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset className="evento-modal__campo">
              <legend>Día</legend>
              <SelectorDia
                dias={dias}
                valor={fecha}
                onChange={(iso) => {
                  setFecha(iso);
                  setDesde('');
                  setHasta('');
                  setError(null);
                }}
              />
            </fieldset>

            <fieldset className="evento-modal__campo">
              <legend>Canchas</legend>
              <p className="evento-modal__ayuda">
                Elegí una o varias. Podés combinar canchas de distintos deportes.
              </p>
              <div className="evento-modal__canchas">
                {canchas.map((c) => {
                  const info = deportePorSlug(c.deporte);
                  const num = (c.id.match(/(\d+)$/) || [])[1] || '';
                  const marcada = canchaIds.includes(c.id);
                  return (
                    <label
                      key={c.id}
                      className={
                        'evento-modal__cancha' +
                        (marcada ? ' evento-modal__cancha--sel' : '')
                      }
                      style={{ '--acento': info ? info.colorAcento : '#1779ba' }}
                    >
                      <input
                        type="checkbox"
                        checked={marcada}
                        onChange={() => toggleCancha(c.id)}
                      />
                      <span className="evento-modal__cancha-deporte">
                        {info ? info.nombre : c.deporte}
                      </span>
                      <span className="evento-modal__cancha-nombre">
                        Cancha {num}
                      </span>
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="evento-modal__campo">
              <legend>Franja horaria</legend>
              {canchaIds.length === 0 ? (
                <p className="evento-modal__ayuda">
                  Elegí al menos una cancha para ver los horarios libres.
                </p>
              ) : (
                <>
                  <ul className="evento-modal__strip" aria-hidden="true">
                    {strip.map((s) => (
                      <li
                        key={s.hora}
                        className={
                          'evento-modal__strip-slot ' +
                          (s.libre
                            ? 'evento-modal__strip-slot--libre'
                            : 'evento-modal__strip-slot--ocupado')
                        }
                        title={`${s.hora} · ${
                          s.libre ? 'libre en las canchas elegidas' : 'ocupado'
                        }`}
                      >
                        {s.hora.slice(0, 2)}
                      </li>
                    ))}
                  </ul>
                  <p className="evento-modal__leyenda">
                    <span>
                      <span className="evento-modal__punto evento-modal__punto--libre" />
                      Libre en las canchas elegidas
                    </span>
                    <span>
                      <span className="evento-modal__punto evento-modal__punto--ocupado" />
                      Ocupado
                    </span>
                  </p>

                  <div className="grid-x grid-padding-x evento-modal__rango">
                    <label className="cell medium-6">
                      Desde
                      <select
                        value={desde}
                        onChange={(e) => cambiarDesde(e.target.value)}
                      >
                        <option value="">—</option>
                        {horasBase.map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="cell medium-6">
                      Hasta
                      <select
                        value={hasta}
                        onChange={(e) => {
                          setHasta(e.target.value);
                          setError(null);
                        }}
                        disabled={!desde}
                      >
                        <option value="">—</option>
                        {horasFin
                          .filter(
                            (h) =>
                              !desde ||
                              horasFin.indexOf(h) > horasBase.indexOf(desde)
                          )
                          .map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                      </select>
                    </label>
                  </div>

                  {desde && hasta && !bloqueLibre && (
                    <p className="evento-modal__aviso">
                      Ese rango tiene horas ocupadas en alguna de las canchas
                      elegidas. Ajustá la franja o las canchas.
                    </p>
                  )}
                  {bloqueLibre && (
                    <p className="evento-modal__nota">
                      {bloqueHoras.length}{' '}
                      {bloqueHoras.length === 1 ? 'hora' : 'horas'} ·{' '}
                      {canchaIds.length}{' '}
                      {canchaIds.length === 1 ? 'cancha' : 'canchas'}
                    </p>
                  )}
                </>
              )}
            </fieldset>

            {tipo === 'torneo' ? (
              <fieldset className="evento-modal__campo">
                <legend>Datos del torneo</legend>
                <div className="grid-x grid-padding-x">
                  <label className="cell medium-6">
                    Equipos / participantes
                    <input
                      type="number"
                      min="2"
                      value={equipos}
                      onChange={(e) => setEquipos(e.target.value)}
                    />
                  </label>
                  <label className="cell medium-6">
                    Canchas necesarias
                    <input
                      type="number"
                      min="1"
                      value={canchasNecesarias}
                      onChange={(e) => setCanchasNecesarias(e.target.value)}
                      placeholder={String(canchaIds.length || '')}
                    />
                  </label>
                </div>
              </fieldset>
            ) : (
              <fieldset className="evento-modal__campo">
                <legend>Datos del cumpleaños</legend>
                <div className="grid-x grid-padding-x">
                  <label className="cell medium-6">
                    Invitados
                    <input
                      type="number"
                      min="1"
                      value={invitados}
                      onChange={(e) => setInvitados(e.target.value)}
                    />
                  </label>
                </div>
              </fieldset>
            )}

            <fieldset className="evento-modal__campo">
              <legend>Contacto</legend>
              <div className="grid-x grid-padding-x">
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
            </fieldset>

            <div className="evento-modal__acciones">
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
                disabled={!puedeConfirmar}
                onClick={confirmar}
              >
                Confirmar evento
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default EventoModal;

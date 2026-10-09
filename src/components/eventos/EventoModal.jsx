import React, { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES } from '../../data/deportes';
import SelectorDia from '../shared/SelectorDia';
import CanchaEventoCard from './CanchaEventoCard';
import { fechaLarga } from '../../lib/fechas';
import { canchasDelDeporte } from '../../lib/canchas';
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

  // "Elegir todas / Quitar todas" de un deporte: si ya están todas marcadas las
  // quita; si no, suma las que falten sin tocar las de otros deportes.
  const toggleDeporte = (ids) => {
    setCanchaIds((prev) =>
      ids.every((id) => prev.includes(id))
        ? prev.filter((id) => !ids.includes(id))
        : [...prev, ...ids.filter((id) => !prev.includes(id))]
    );
    setError(null);
  };

  const cambiarDesde = (v) => {
    setDesde(v);
    // `horasFin[i]` es el cierre de la franja que empieza en `horasBase[i]`, así
    // que un "hasta" solo queda inválido si cierra antes de ese inicio.
    if (hasta && horasFin.indexOf(hasta) < horasBase.indexOf(v)) setHasta('');
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
                Elige una o varias. Puedes combinar canchas de distintos deportes.
              </p>
              {DEPORTES.map((d) => {
                const delDeporte = canchasDelDeporte(canchas, d.slug);
                if (delDeporte.length === 0) return null;
                const ids = delDeporte.map((c) => c.id);
                const todas = ids.every((id) => canchaIds.includes(id));
                return (
                  <section
                    key={d.slug}
                    className="evento-modal__deporte"
                    style={{ '--acento': d.colorAcento }}
                  >
                    <div className="evento-modal__deporte-cabecera">
                      <h3 className="evento-modal__deporte-nombre">{d.nombre}</h3>
                      <button
                        type="button"
                        className="evento-modal__deporte-todas"
                        onClick={() => toggleDeporte(ids)}
                      >
                        {todas ? 'Quitar todas' : 'Elegir todas'}
                      </button>
                    </div>
                    <div className="grid-x grid-margin-x align-center evento-modal__canchas">
                      {delDeporte.map((c) => {
                        const horarios = disponibilidad(c.id, fecha);
                        return (
                          <div
                            key={c.id}
                            className="cell small-12 medium-6 large-4 evento-modal__celda"
                          >
                            <CanchaEventoCard
                              cancha={c}
                              acento={d.colorAcento}
                              marcada={canchaIds.includes(c.id)}
                              onToggle={() => toggleCancha(c.id)}
                              libresDia={horarios.filter((h) => h.disponible).length}
                              totalDia={horarios.length}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </section>
                );
              })}
              <p className="evento-modal__nota evento-modal__resumen" aria-live="polite">
                {canchaIds.length === 0
                  ? 'Aún no has elegido canchas.'
                  : `${canchaIds.length} ${
                      canchaIds.length === 1 ? 'cancha elegida' : 'canchas elegidas'
                    }`}
              </p>
            </fieldset>

            <fieldset className="evento-modal__campo">
              <legend>Franja horaria</legend>
              {canchaIds.length === 0 ? (
                <p className="evento-modal__ayuda">
                  Elige al menos una cancha para ver los horarios libres.
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
                              horasFin.indexOf(h) >= horasBase.indexOf(desde)
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
                      elegidas. Ajusta la franja o las canchas.
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
                  <div className="cell medium-6">
                    <label htmlFor="evento-equipos">Equipos / participantes</label>
                    <input
                      id="evento-equipos"
                      name="equipos"
                      type="number"
                      min="2"
                      value={equipos}
                      onChange={(e) => setEquipos(e.target.value)}
                    />
                  </div>
                  <div className="cell medium-6">
                    <label htmlFor="evento-canchas-necesarias">Canchas necesarias</label>
                    <input
                      id="evento-canchas-necesarias"
                      name="canchasNecesarias"
                      type="number"
                      min="1"
                      value={canchasNecesarias}
                      onChange={(e) => setCanchasNecesarias(e.target.value)}
                      placeholder={String(canchaIds.length || '')}
                    />
                  </div>
                </div>
              </fieldset>
            ) : (
              <fieldset className="evento-modal__campo">
                <legend>Datos del cumpleaños</legend>
                <div className="grid-x grid-padding-x">
                  <div className="cell medium-6">
                    <label htmlFor="evento-invitados">Invitados</label>
                    <input
                      id="evento-invitados"
                      name="invitados"
                      type="number"
                      min="1"
                      value={invitados}
                      onChange={(e) => setInvitados(e.target.value)}
                    />
                  </div>
                </div>
              </fieldset>
            )}

            <fieldset className="evento-modal__campo">
              <legend>Contacto</legend>
              <div className="grid-x grid-padding-x">
                <div className="cell medium-6">
                  <label htmlFor="evento-nombre">Nombre (opcional)</label>
                  <input
                    id="evento-nombre"
                    name="nombre"
                    type="text"
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    autoComplete="name"
                    placeholder="Ej. Juan Pérez…"
                  />
                </div>
                <div className="cell medium-6">
                  <label htmlFor="evento-telefono">Teléfono (opcional)</label>
                  <input
                    id="evento-telefono"
                    name="telefono"
                    type="tel"
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    autoComplete="tel"
                    placeholder="Ej. 300 123 4567…"
                  />
                </div>
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

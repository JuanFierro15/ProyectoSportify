import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarCheck, Gift, X } from 'lucide-react';
import { useReservas } from '../../context/ReservasContext';
import SelectorDia from '../shared/SelectorDia';
import DepthCarousel from '../reactbits/DepthCarousel';
import TarjetaCanchaCarrusel from './TarjetaCanchaCarrusel';
import VoucherReserva from './VoucherReserva';
import ConfirmacionReserva from './ConfirmacionReserva';
import { fechaCompleta } from '../../lib/fechas';
import { alternarHoraIndividual, seleccionarRango } from '../../lib/horarios';
import {
  DESCUENTO_POR_HORA,
  MAX_HORAS_SEGUIDAS,
  MIN_HORAS_BENEFICIO,
  calcularPrecioEvento,
  finDeFranja,
  formatoPrecio,
} from '../../lib/precios';
import { textoQr } from '../../lib/codigoReserva';
import {
  empiezaMalTelefono,
  errorNombreObligatorio,
  errorTelefono,
  limpiarNombre,
  limpiarTelefono,
} from '../../lib/validacion';
import {
  canchasDelDeporte,
  estiloAcento,
  imagenGrandeCancha,
  imagenPlaceholderCancha,
  tituloCancha,
} from '../../lib/canchas';
import { DEPORTES, deportePorSlug } from '../../data/deportes';
import './ModalReserva.css';

const MODOS = [
  { valor: 'cancha', etiqueta: 'Cancha', titulo: 'Reservar cancha', tipoEtiqueta: 'Reserva de cancha' },
  { valor: 'torneo', etiqueta: 'Torneo', titulo: 'Reservar torneo', tipoEtiqueta: 'Torneo' },
  { valor: 'cumpleanos', etiqueta: 'Cumpleaños', titulo: 'Reservar cumpleaños', tipoEtiqueta: 'Cumpleaños' },
];

const ANCHO_IMAGEN = 720;
const ALTO_IMAGEN = 893;
const TAMANOS_IMAGEN = '(max-width: 640px) 60vw, 300px';

/**
 * ModalReserva — único modal de reserva, con tres modos: cancha (una cancha,
 * de 1 a 3 horas seguidas), torneo y cumpleaños (varias canchas y una franja
 * consecutiva, bloqueo todo-o-nada).
 *
 * - Las canchas se eligen en un `DepthCarousel` filtrable por deporte; cada
 *   tarjeta pinta `TarjetaCanchaCarrusel` encima. En modo cancha la tarjeta
 *   activa es la elegida; en eventos se agregan/quitan con su botón.
 * - Horas: en modo cancha, `alternarHoraIndividual` (bloque de hasta
 *   MAX_HORAS_SEGUIDAS); en eventos, `seleccionarRango` (inicio y fin, con
 *   todas las horas de en medio). Ver lib/horarios.
 * - `VoucherReserva` muestra el total en vivo en todos los modos
 *   (`calcularPrecioEvento`, mismas reglas por cancha).
 * - Al confirmar, `ConfirmacionReserva` muestra el código y el QR.
 * - Contenedor Reveal de Foundation (`reveal-overlay` + `reveal`) abierto y
 *   cerrado desde React, en un portal a `document.body`.
 *
 * Props: abierto, onCerrar, modoInicial ('cancha' | 'torneo' |
 * 'cumpleanos'), canchaInicial (cancha con la que arranca el carrusel).
 */
function ModalReserva({ abierto, onCerrar, modoInicial = 'cancha', canchaInicial = null }) {
  const { dias, canchas, disponibilidad, reservar, reservarEvento } = useReservas();

  const [modo, setModo] = useState(modoInicial);
  const [fecha, setFecha] = useState(dias[0]);
  const [filtro, setFiltro] = useState(canchaInicial ? canchaInicial.deporte : 'todas');
  const [canchaId, setCanchaId] = useState(canchaInicial ? canchaInicial.id : null);
  const [canchaIds, setCanchaIds] = useState([]);
  const [horasSel, setHorasSel] = useState([]);
  const [equipos, setEquipos] = useState('');
  const [invitados, setInvitados] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tocado, setTocado] = useState({ nombre: false, telefono: false });
  const [error, setError] = useState(null);
  const [confirmado, setConfirmado] = useState(null);
  const [angosto, setAngosto] = useState(false);

  const prevAbiertoRef = useRef(false);

  // DepthCarousel se escala para que quepan la tarjeta y sus laterales
  // (cardWidth + spread * 2 + 120 px). En pantallas angostas se reduce el
  // `spread` para que la tarjeta activa no quede diminuta.
  useEffect(() => {
    if (!abierto) return undefined;
    const mq = window.matchMedia('(max-width: 39.9375em)');
    const actualizar = () => setAngosto(mq.matches);
    actualizar();
    mq.addEventListener('change', actualizar);
    return () => mq.removeEventListener('change', actualizar);
  }, [abierto]);

  useEffect(() => {
    if (abierto && !prevAbiertoRef.current) {
      setModo(modoInicial);
      setFecha(dias[0]);
      setFiltro(canchaInicial ? canchaInicial.deporte : 'todas');
      setCanchaId(canchaInicial ? canchaInicial.id : null);
      setCanchaIds([]);
      setHorasSel([]);
      setEquipos('');
      setInvitados('');
      setNombre('');
      setTelefono('');
      setTocado({ nombre: false, telefono: false });
      setError(null);
      setConfirmado(null);
    }
    prevAbiertoRef.current = abierto;
  }, [abierto, modoInicial, canchaInicial, dias]);

  useEffect(() => {
    if (!abierto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [abierto, onCerrar]);

  const esEvento = modo !== 'cancha';

  const canchasFiltradas = useMemo(
    () => (filtro === 'todas' ? canchas : canchasDelDeporte(canchas, filtro)),
    [canchas, filtro]
  );

  const canchaSel = useMemo(
    () => canchas.find((c) => c.id === canchaId) || canchasFiltradas[0] || null,
    [canchas, canchaId, canchasFiltradas]
  );

  const canchasElegidas = useMemo(
    () =>
      esEvento
        ? canchaIds.map((id) => canchas.find((c) => c.id === id)).filter(Boolean)
        : canchaSel
        ? [canchaSel]
        : [],
    [esEvento, canchaIds, canchas, canchaSel]
  );

  const horasBase = useMemo(
    () => (canchas[0] ? canchas[0].horas : []),
    [canchas]
  );

  const esLibre = useCallback(
    (hora) => {
      if (!esEvento) {
        return (
          !!canchaSel &&
          disponibilidad(canchaSel.id, fecha).some(
            (h) => h.hora === hora && h.disponible
          )
        );
      }
      return (
        canchaIds.length > 0 &&
        canchaIds.every((id) =>
          disponibilidad(id, fecha).some(
            (h) => h.hora === hora && h.disponible
          )
        )
      );
    },
    [esEvento, canchaSel, disponibilidad, fecha, canchaIds]
  );

  const precio = useMemo(
    () => calcularPrecioEvento(canchasElegidas, horasSel.length),
    [canchasElegidas, horasSel.length]
  );

  const errNombre = errorNombreObligatorio(nombre);
  const errTelefono = errorTelefono(telefono);
  const verErrNombre = tocado.nombre && !!errNombre;
  const verErrTelefono = !!errTelefono && (tocado.telefono || empiezaMalTelefono(telefono));

  const motivoBloqueo = useMemo(() => {
    if (esEvento ? canchaIds.length === 0 : !canchaSel) {
      return esEvento ? 'Elige al menos una cancha.' : 'Elige una cancha.';
    }
    if (horasSel.length === 0) {
      return 'Elige el horario.';
    }
    if (modo === 'torneo' && Number(equipos) < 2) {
      return 'Indica cuántos equipos participan (mínimo 2).';
    }
    if (modo === 'cumpleanos' && Number(invitados) < 1) {
      return 'Indica cuántos invitados vienen.';
    }
    if (errNombre) {
      return 'Escribe tu nombre para confirmar.';
    }
    if (errTelefono) {
      return 'Revisa el teléfono.';
    }
    return '';
  }, [esEvento, canchaIds.length, canchaSel, horasSel.length, modo, equipos, invitados, errNombre, errTelefono]);

  const puedeConfirmar = motivoBloqueo === '' && !confirmado;

  // Si cambian la fecha, las canchas o la disponibilidad y la franja elegida
  // queda con choques, se limpia y se avisa. Quitar todas las canchas de un
  // evento no es un choque: solo se limpia, sin aviso.
  useEffect(() => {
    if (horasSel.length === 0) return;
    if (esEvento && canchaIds.length === 0) {
      setHorasSel([]);
      return;
    }
    const algunaNoLibre = horasSel.some((h) => !esLibre(h));
    if (algunaNoLibre) {
      setHorasSel([]);
      setError('Ese horario ya no está libre en las canchas elegidas. Elige otro.');
    }
  }, [horasSel, esLibre, esEvento, canchaIds.length]);

  const cambiarModo = (nuevo) => {
    if (nuevo === modo) return;
    if (modo === 'cancha' && nuevo !== 'cancha') {
      setCanchaIds(canchaSel ? [canchaSel.id] : []);
    } else if (modo !== 'cancha' && nuevo === 'cancha') {
      setCanchaId(canchaIds[0] || (canchaSel ? canchaSel.id : null));
    }
    setModo(nuevo);
    setHorasSel([]);
    setError(null);
  };

  const cambiarFiltro = (slug) => {
    setFiltro(slug);
    if (modo === 'cancha') {
      const nuevaLista = slug === 'todas' ? canchas : canchasDelDeporte(canchas, slug);
      setCanchaId(nuevaLista[0] ? nuevaLista[0].id : null);
      setHorasSel([]);
      setError(null);
    }
  };

  const alternarCancha = (id) => {
    setCanchaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    setError(null);
  };

  const alternarDeporte = (slug) => {
    const ids = canchasDelDeporte(canchas, slug).map((c) => c.id);
    setCanchaIds((prev) =>
      ids.every((id) => prev.includes(id))
        ? prev.filter((id) => !ids.includes(id))
        : [...prev, ...ids.filter((id) => !prev.includes(id))]
    );
    setError(null);
  };

  const elegirHora = (hora) => {
    const r = esEvento
      ? seleccionarRango(horasSel, hora, horasBase, esLibre)
      : alternarHoraIndividual(horasSel, hora, horasBase);
    setHorasSel(r.sel);
    setError(r.error);
  };

  const cambiarFecha = (iso) => {
    setFecha(iso);
    setHorasSel([]);
    setError(null);
  };

  const confirmar = () => {
    if (!puedeConfirmar) return;

    let res;
    if (modo === 'cancha') {
      res = reservar({
        canchaId: canchaSel.id,
        fecha,
        horas: horasSel,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
    } else {
      res = reservarEvento({
        subtipo: modo,
        fecha,
        canchaIds,
        horas: horasSel,
        equipos: modo === 'torneo' ? Number(equipos) : null,
        canchasNecesarias: modo === 'torneo' ? canchaIds.length : null,
        invitados: modo === 'cumpleanos' ? Number(invitados) : null,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
      });
    }

    if (!res.ok) {
      setError(res.error);
      setHorasSel([]);
      return;
    }

    const horario = `${horasSel[0]} a ${finDeFranja(horasSel[horasSel.length - 1])}`;
    const fechaTexto = fechaCompleta(fecha);
    const nombresCanchas = canchasElegidas.map((c) => c.nombre);
    const modoActual = MODOS.find((m) => m.valor === modo) || MODOS[0];
    const tipoEtiqueta = modoActual.tipoEtiqueta;

    setConfirmado({
      codigo: res.codigo,
      textoQr: textoQr({
        codigo: res.codigo,
        tipo: tipoEtiqueta,
        fecha: fechaTexto,
        horario,
        canchas: nombresCanchas,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        total: precio.total,
      }),
      resumen: {
        tipoEtiqueta,
        fechaTexto,
        horario,
        canchas: nombresCanchas,
        total: precio.total,
        packsAgua: precio.packsAgua,
      },
    });
  };

  if (!abierto) return null;

  const modoInfo = MODOS.find((m) => m.valor === modo) || MODOS[0];

  // El carrusel arranca centrado en la cancha elegida (en eventos, la primera
  // de la selección), también al cambiar de modo o de filtro.
  const idInicialCarrusel = esEvento ? canchaIds[0] : canchaSel && canchaSel.id;
  const indiceInicialCarrusel = idInicialCarrusel
    ? Math.max(0, canchasFiltradas.findIndex((c) => c.id === idInicialCarrusel))
    : 0;

  const contarLibresDia =
    !esEvento && canchaSel
      ? (iso) => disponibilidad(canchaSel.id, iso).filter((h) => h.disponible).length
      : esEvento && canchaIds.length > 0
      ? (iso) =>
          horasBase.filter((hora) =>
            canchaIds.every((id) =>
              disponibilidad(id, iso).some((h) => h.hora === hora && h.disponible)
            )
          ).length
      : undefined;

  const modal = (
    <div
      className="reveal-overlay modal-reserva-overlay"
      role="presentation"
      onMouseDown={onCerrar}
    >
      <div
        className="reveal modal-reserva"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-reserva-titulo"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="modal-reserva__cerrar"
          aria-label="Cerrar"
          onClick={onCerrar}
        >
          <X size={18} aria-hidden="true" />
        </button>

        <div className="modal-reserva__encabezado">
          <span className="modal-reserva__encabezado-icono" aria-hidden="true">
            <CalendarCheck size={20} />
          </span>
          <h2 id="modal-reserva-titulo" className="modal-reserva__titulo">
            {modoInfo.titulo}
          </h2>
        </div>

        {confirmado ? (
          <ConfirmacionReserva
            codigo={confirmado.codigo}
            textoQr={confirmado.textoQr}
            resumen={confirmado.resumen}
            onListo={onCerrar}
          />
        ) : (
          <>
            <div
              className="modal-reserva__modos"
              role="group"
              aria-label="Tipo de reserva"
            >
              {MODOS.map((m) => (
                <button
                  key={m.valor}
                  type="button"
                  className={
                    'modal-reserva__modo' +
                    (modo === m.valor ? ' modal-reserva__modo--activo' : '')
                  }
                  aria-pressed={modo === m.valor}
                  onClick={() => cambiarModo(m.valor)}
                >
                  {m.etiqueta}
                </button>
              ))}
            </div>

            <div className="modal-reserva__cuerpo">
              <div className="modal-reserva__form">
                {error && (
                  <div className="callout alert" role="alert">
                    {error}
                  </div>
                )}

                <fieldset className="modal-reserva__campo">
                  <legend>{esEvento ? 'Canchas' : 'Cancha'}</legend>
                  <p className="modal-reserva__ayuda">
                    {esEvento
                      ? 'Desliza el carrusel y agrega una o varias canchas; puedes combinar deportes.'
                      : 'Desliza el carrusel para elegir la cancha.'}
                  </p>

                  <div
                    className="modal-reserva__filtros"
                    role="group"
                    aria-label="Filtrar por deporte"
                  >
                    <button
                      type="button"
                      className={
                        'modal-reserva__filtro modal-reserva__filtro--todas' +
                        (filtro === 'todas' ? ' modal-reserva__filtro--activo' : '')
                      }
                      aria-pressed={filtro === 'todas'}
                      onClick={() => cambiarFiltro('todas')}
                    >
                      Todas
                    </button>
                    {DEPORTES.map((d) => (
                      <button
                        key={d.slug}
                        type="button"
                        className={
                          'modal-reserva__filtro' +
                          (filtro === d.slug ? ' modal-reserva__filtro--activo' : '')
                        }
                        style={{ '--acento': d.colorAcento }}
                        aria-pressed={filtro === d.slug}
                        onClick={() => cambiarFiltro(d.slug)}
                      >
                        {d.nombre}
                      </button>
                    ))}
                  </div>

                  <div className="modal-reserva__carrusel">
                    <DepthCarousel
                      key={`${modo === 'cancha' ? 'cancha' : 'evento'}-${filtro}`}
                      items={canchasFiltradas.map((c) => {
                        const d = deportePorSlug(c.deporte);
                        const degradado = imagenPlaceholderCancha(
                          d ? d.colorAcento : undefined
                        );
                        return c.imagen
                          ? {
                              id: c.id,
                              image: c.imagen,
                              srcSet: `${c.imagen} 720w, ${imagenGrandeCancha(c.imagen)} 1440w`,
                              sizes: TAMANOS_IMAGEN,
                              fallback: degradado,
                              width: ANCHO_IMAGEN,
                              height: ALTO_IMAGEN,
                              alt: `${tituloCancha(c)} de ${d ? d.nombre.toLowerCase() : c.deporte}`,
                            }
                          : { id: c.id, image: degradado, alt: '' };
                      })}
                      initialIndex={indiceInicialCarrusel}
                      cardWidth={250}
                      cardHeight={330}
                      radius={14}
                      tint="#05060a"
                      spread={angosto ? 30 : 90}
                      falloff={0.32}
                      blur={8}
                      visibleCards={angosto ? 2 : 3}
                      ariaLabel="Canchas"
                      prevLabel="Cancha anterior"
                      nextLabel="Cancha siguiente"
                      getSlideLabel={(i, n) => `Cancha ${i + 1} de ${n}`}
                      getDotLabel={(i) => `Ir a la cancha ${i + 1}`}
                      onChange={(_, item) => {
                        if (modo === 'cancha') {
                          setCanchaId(item.id);
                          setHorasSel([]);
                          setError(null);
                        }
                      }}
                      renderOverlay={(item, i, esActiva) => {
                        const c = canchasFiltradas.find((x) => x.id === item.id);
                        if (!c) return null;
                        const horarios = disponibilidad(c.id, fecha);
                        return (
                          <TarjetaCanchaCarrusel
                            cancha={c}
                            deporte={deportePorSlug(c.deporte)}
                            modo={esEvento ? 'evento' : 'cancha'}
                            activa={esActiva}
                            marcada={esEvento ? canchaIds.includes(c.id) : false}
                            libresDia={horarios.filter((h) => h.disponible).length}
                            totalDia={horarios.length}
                            onAlternar={() => alternarCancha(c.id)}
                          />
                        );
                      }}
                    />
                  </div>

                  {esEvento && (
                    <div className="modal-reserva__elegidas" aria-live="polite">
                      {canchaIds.length === 0 ? (
                        <p className="modal-reserva__nota">
                          Aún no has elegido canchas.
                        </p>
                      ) : (
                        canchasElegidas.map((c) => {
                          const d = deportePorSlug(c.deporte);
                          return (
                            <span
                              key={c.id}
                              className="modal-reserva__chip"
                              style={estiloAcento(d ? d.colorAcento : undefined)}
                            >
                              {c.nombre}
                              <button
                                type="button"
                                className="modal-reserva__chip-quitar"
                                aria-label={`Quitar ${c.nombre}`}
                                onClick={() => alternarCancha(c.id)}
                              >
                                ×
                              </button>
                            </span>
                          );
                        })
                      )}
                      {filtro !== 'todas' && (() => {
                        const d = deportePorSlug(filtro);
                        const idsFiltro = canchasFiltradas.map((c) => c.id);
                        const todas =
                          idsFiltro.length > 0 &&
                          idsFiltro.every((id) => canchaIds.includes(id));
                        return (
                          <button
                            type="button"
                            className="modal-reserva__todas"
                            onClick={() => alternarDeporte(filtro)}
                          >
                            {todas
                              ? `Quitar todas de ${d ? d.nombre : ''}`
                              : `Elegir todas de ${d ? d.nombre : ''}`}
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </fieldset>

                <fieldset className="modal-reserva__campo">
                  <legend>Día</legend>
                  <SelectorDia
                    dias={dias}
                    valor={fecha}
                    onChange={cambiarFecha}
                    contarLibres={contarLibresDia}
                  />
                </fieldset>

                <fieldset className="modal-reserva__campo">
                  <legend>Horario</legend>
                  <p className="modal-reserva__promo">
                    <Gift size={16} aria-hidden="true" />
                    <span>
                      Desde {MIN_HORAS_BENEFICIO} horas seguidas:{' '}
                      <strong>
                        {formatoPrecio.format(DESCUENTO_POR_HORA)} menos por hora
                      </strong>{' '}
                      y un <strong>pack de agua gratis</strong>
                      {esEvento ? ' por cancha' : ''}.
                    </span>
                  </p>
                  <p className="modal-reserva__ayuda">
                    {esEvento
                      ? 'Toca la hora de inicio y luego la de fin: se eligen todas las horas de en medio.'
                      : `Elige una hora o hasta ${MAX_HORAS_SEGUIDAS} horas seguidas.`}
                  </p>
                  {esEvento && canchaIds.length === 0 && (
                    <p className="modal-reserva__nota">
                      Elige al menos una cancha para ver los horarios libres.
                    </p>
                  )}
                  <div className="modal-reserva__horas">
                    {horasBase.map((hora) => {
                      const libre = esLibre(hora);
                      const sel = horasSel.includes(hora);
                      return (
                        <button
                          key={hora}
                          type="button"
                          className={
                            'button small modal-reserva__hora' +
                            (libre ? '' : ' modal-reserva__hora--ocupado') +
                            (sel ? ' modal-reserva__hora--sel' : ' hollow')
                          }
                          disabled={!libre}
                          aria-pressed={sel}
                          onClick={() => elegirHora(hora)}
                        >
                          {hora}
                          {!libre && (!esEvento || canchaIds.length > 0) && (
                            <span className="modal-reserva__hora-tag">
                              {' '}
                              · {esEvento ? 'ocupado' : 'reservado'}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </fieldset>

                {modo === 'torneo' && (
                  <fieldset className="modal-reserva__campo">
                    <legend>Datos del torneo</legend>
                    <div className="grid-x grid-padding-x">
                      <div className="cell medium-6">
                        <label htmlFor="modal-reserva-equipos">
                          Equipos o participantes
                        </label>
                        <input
                          id="modal-reserva-equipos"
                          name="equipos"
                          type="number"
                          min="2"
                          className="modal-reserva__input"
                          value={equipos}
                          onChange={(e) => setEquipos(e.target.value)}
                        />
                      </div>
                    </div>
                  </fieldset>
                )}

                {modo === 'cumpleanos' && (
                  <fieldset className="modal-reserva__campo">
                    <legend>Datos del cumpleaños</legend>
                    <div className="grid-x grid-padding-x">
                      <div className="cell medium-6">
                        <label htmlFor="modal-reserva-invitados">
                          Invitados
                        </label>
                        <input
                          id="modal-reserva-invitados"
                          name="invitados"
                          type="number"
                          min="1"
                          className="modal-reserva__input"
                          value={invitados}
                          onChange={(e) => setInvitados(e.target.value)}
                        />
                      </div>
                    </div>
                  </fieldset>
                )}

                <div className="grid-x grid-padding-x modal-reserva__contacto">
                  <div className="cell medium-6">
                    <label htmlFor="modal-reserva-nombre">
                      Nombre
                    </label>
                    <input
                      id="modal-reserva-nombre"
                      name="nombre"
                      type="text"
                      className={
                        'modal-reserva__input' +
                        (verErrNombre ? ' is-invalid-input' : '')
                      }
                      placeholder="Ej. Juan Pérez…"
                      value={nombre}
                      onChange={(e) => setNombre(limpiarNombre(e.target.value))}
                      onBlur={() => setTocado((t) => ({ ...t, nombre: true }))}
                      autoComplete="name"
                      aria-invalid={verErrNombre}
                      aria-describedby="modal-reserva-nombre-error"
                    />
                    <span
                      id="modal-reserva-nombre-error"
                      className={
                        'form-error' + (verErrNombre ? ' is-visible' : '')
                      }
                    >
                      {errNombre}
                    </span>
                  </div>
                  <div className="cell medium-6">
                    <label htmlFor="modal-reserva-telefono">
                      Teléfono (opcional)
                    </label>
                    <input
                      id="modal-reserva-telefono"
                      name="telefono"
                      type="tel"
                      className={
                        'modal-reserva__input' +
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
                      aria-describedby="modal-reserva-telefono-error"
                    />
                    <span
                      id="modal-reserva-telefono-error"
                      className={
                        'form-error' + (verErrTelefono ? ' is-visible' : '')
                      }
                    >
                      {errTelefono}
                    </span>
                  </div>
                </div>
              </div>

              <VoucherReserva
                tipoEtiqueta={modoInfo.tipoEtiqueta}
                fechaTexto={fechaCompleta(fecha)}
                horas={horasSel}
                precio={precio}
                puedeConfirmar={puedeConfirmar}
                motivoBloqueo={motivoBloqueo}
                onConfirmar={confirmar}
                onCancelar={onCerrar}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

export default ModalReserva;

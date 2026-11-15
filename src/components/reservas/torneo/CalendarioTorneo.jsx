import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AlertTriangle } from 'lucide-react';
import SelectorDia from '../../shared/SelectorDia';
import AlertaTiempo from './AlertaTiempo';
import { tituloCancha } from '../../../lib/canchas';
import { etiquetaDia } from '../../../lib/fechas';
import { finDeFranja } from '../../../lib/precios';
import { horasDeJornada } from '../../../lib/torneo';
import './Bracket.css';
import './CalendarioTorneo.css';

function contarHorasFase(jornada, fase) {
  const mapa = jornada?.horasPorCancha || {};
  const cids =
    Array.isArray(fase?.canchaIds) && fase.canchaIds.length > 0
      ? fase.canchaIds
      : Object.keys(mapa);
  return cids.reduce(
    (acc, cid) => acc + (Array.isArray(mapa[cid]) ? mapa[cid].length : 0),
    0
  );
}

/**
 * CalendarioTorneo — Programación por fases del torneo multi-día.
 *
 * Permite seleccionar el día y las horas por cancha de cada fase de eliminación
 * directa (Octavos de final, Cuartos de final, Semifinal, Final), mostrando
 * las canchas de la fase, validaciones de suficiencia de tiempo, alertas de
 * orden cronológico entre fases y aviso de horas sin partido.
 */
export function CalendarioTorneo({
  fases = [],
  jornadas = {},
  validacionesJornadas = [],
  sugerenciasPorFase = {},
  horasSinPartidoPorFase = {},
  dias = [],
  horasBase = [],
  canchas = [],
  canchaIds = [],
  duracionPartido,
  minutosTurno,
  faseARevisar = null,
  marcaFaseARevisar = 0,
  onCambiarDuracion,
  onCambiarFechaFase,
  onElegirHoraFase,
  esLibreFase,
  contarLibresFase,
  esDiaBloqueadoFase,
}) {
  const rootRef = useRef(null);
  const tabsRef = useRef([]);
  const panelsRef = useRef({});
  const ultimaMarcaRevisarRef = useRef(0);
  const [faseActiva, setFaseActiva] = useState(() =>
    faseARevisar != null && fases.some((f) => f.ronda === faseARevisar)
      ? faseARevisar
      : fases[0]
      ? fases[0].ronda
      : 1
  );

  const rondaActiva = fases.some((f) => f.ronda === faseActiva)
    ? faseActiva
    : (fases[0]?.ronda ?? 1);

  useEffect(() => {
    if (fases.length > 0 && !fases.some((f) => f.ronda === faseActiva)) {
      setFaseActiva(fases[0].ronda);
    }
  }, [fases, faseActiva]);

  useEffect(() => {
    if (!marcaFaseARevisar || marcaFaseARevisar === ultimaMarcaRevisarRef.current) {
      return;
    }
    if (faseARevisar == null || !fases.some((f) => f.ronda === faseARevisar)) {
      return;
    }
    if (rondaActiva !== faseARevisar) {
      setFaseActiva(faseARevisar);
      return;
    }
    ultimaMarcaRevisarRef.current = marcaFaseARevisar;
    const panel = panelsRef.current[faseARevisar];
    if (panel && !panel.hasAttribute('hidden')) {
      panel.focus();
      panel.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }
  }, [marcaFaseARevisar, faseARevisar, fases, rondaActiva]);

  useEffect(() => {
    if (!rootRef.current?.querySelector('.calendario-torneo__fase:not([hidden])')) {
      return undefined;
    }

    const mm = gsap.matchMedia(rootRef);
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.from('.calendario-torneo__fase:not([hidden])', {
        opacity: 0,
        y: 8,
        duration: 0.25,
        ease: 'power2.out',
      });
    });

    return () => mm.revert();
  }, [rondaActiva]);

  const nombreCanchaDe = (id) => {
    const c = Array.isArray(canchas)
      ? canchas.find((cancha) => cancha.id === id)
      : null;
    if (c) return tituloCancha(c);
    const match = String(id).match(/(\d+)$/);
    return match ? `Cancha ${match[1]}` : String(id);
  };

  const activarFase = (ronda, idx, enfocar = false) => {
    setFaseActiva(ronda);
    const tab = tabsRef.current[idx];
    if (enfocar) {
      tab?.focus();
    }
    tab?.scrollIntoView?.({
      block: 'nearest',
      inline: 'nearest',
      container: 'nearest',
    });
  };

  const manejarTecladoPestana = (e, idxActual) => {
    const total = fases.length;
    if (total === 0) return;

    let nuevoIdx = -1;
    if (e.key === 'ArrowRight') {
      nuevoIdx = (idxActual + 1) % total;
    } else if (e.key === 'ArrowLeft') {
      nuevoIdx = (idxActual - 1 + total) % total;
    } else if (e.key === 'Home') {
      nuevoIdx = 0;
    } else if (e.key === 'End') {
      nuevoIdx = total - 1;
    }

    if (nuevoIdx !== -1) {
      e.preventDefault();
      const nuevaFase = fases[nuevoIdx];
      if (nuevaFase) {
        activarFase(nuevaFase.ronda, nuevoIdx, true);
      }
    }
  };

  return (
    <div
      ref={rootRef}
      className="calendario-torneo"
      role="region"
      aria-label="Programación por fases del torneo"
    >
      {canchaIds.length === 0 && (
        <p className="formulario-reserva__nota">
          Elige primero las canchas del torneo para habilitar los horarios de cada fase.
        </p>
      )}

      <p className="formulario-reserva__nota">
        Toca una hora para marcarla o desmarcarla en cada cancha. Puedes elegir horas salteadas y distintas en cada cancha.
      </p>

      {fases.length > 0 && (
        <div className="calendario-torneo__tarjeta">
          <div
            className="calendario-torneo__pestanas"
            role="tablist"
            aria-label="Fases del torneo"
          >
            {fases.map((fase, idx) => {
              const esActiva = fase.ronda === rondaActiva;
              const jornada = jornadas[fase.ronda] || {
                fecha: dias[0] || '',
                horasPorCancha: {},
              };
              const val = validacionesJornadas.find(
                (v) => v.ronda === fase.ronda
              );
              const totalHoras = contarHorasFase(jornada, fase);
              const extraFase = horasSinPartidoPorFase[fase.ronda] || {};
              const tieneHorasDeMas =
                Array.isArray(extraFase.lista) && extraFase.lista.length > 0;
              const tieneAviso =
                totalHoras > 0 &&
                (Boolean(val && (val.ordenValido === false || val.alcanza === false)) ||
                  tieneHorasDeMas);

              const diaEtiqueta = jornada.fecha
                ? etiquetaDia(jornada.fecha, dias)
                : '';
              const etiquetaHoras = `${totalHoras} ${totalHoras === 1 ? 'hora' : 'horas'}`;
              const subtextoEstado =
                totalHoras > 0
                  ? diaEtiqueta
                    ? `${diaEtiqueta} · ${etiquetaHoras}`
                    : etiquetaHoras
                  : 'Sin horario';

              return (
                <button
                  key={fase.ronda}
                  ref={(el) => {
                    tabsRef.current[idx] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`tab-fase-${fase.ronda}`}
                  aria-controls={`panel-fase-${fase.ronda}`}
                  aria-selected={esActiva}
                  tabIndex={esActiva ? 0 : -1}
                  className={
                    'calendario-torneo__pestana' +
                    (esActiva ? ' calendario-torneo__pestana--activa' : '') +
                    (tieneAviso ? ' calendario-torneo__pestana--alerta' : '')
                  }
                  onClick={() => activarFase(fase.ronda, idx)}
                  onKeyDown={(e) => manejarTecladoPestana(e, idx)}
                >
                  <span className="calendario-torneo__pestana-cabecera">
                    <span className="calendario-torneo__pestana-nombre">
                      {fase.nombreRonda}
                    </span>
                    {tieneAviso && (
                      <AlertTriangle
                        size={14}
                        aria-hidden="true"
                        className="calendario-torneo__pestana-icono"
                      />
                    )}
                  </span>
                  {' '}
                  <span className="calendario-torneo__pestana-estado">
                    {subtextoEstado}
                  </span>
                  {tieneAviso && (
                    <>
                      {' '}
                      <span className="calendario-torneo__pestana-aviso">
                        Revisa el horario
                      </span>
                    </>
                  )}
                </button>
              );
            })}
          </div>

          {fases.map((fase, idx) => {
            const esActiva = fase.ronda === rondaActiva;
            const jornada = jornadas[fase.ronda] || {
              fecha: dias[0] || '',
              horasPorCancha: {},
            };
            const val = validacionesJornadas.find((v) => v.ronda === fase.ronda);
            const totalHoras = contarHorasFase(jornada, fase);
            const extraFase = horasSinPartidoPorFase[fase.ronda] || {};
            const tieneHorasDeMas =
              Array.isArray(extraFase.lista) && extraFase.lista.length > 0;
            const canchasDeLaFase = Array.isArray(fase.canchaIds)
              ? fase.canchaIds
              : [];

            const partesResumen = canchasDeLaFase
              .map((cid) => {
                const hrs = Array.isArray(jornada.horasPorCancha?.[cid])
                  ? jornada.horasPorCancha[cid]
                  : [];
                if (hrs.length === 0) return null;
                return `${nombreCanchaDe(cid)}: ${hrs.join(', ')}`;
              })
              .filter(Boolean);

            const minTurnoFase = fase.minutosTurno || minutosTurno;
            const sufijoTurno = minTurnoFase ? ` · turnos de ${minTurnoFase} min` : '';

            return (
              <section
                key={fase.ronda}
                ref={(el) => {
                  panelsRef.current[fase.ronda] = el;
                }}
                id={`panel-fase-${fase.ronda}`}
                role="tabpanel"
                tabIndex={-1}
                aria-labelledby={`tab-fase-${fase.ronda}`}
                className="calendario-torneo__fase"
                data-ronda={fase.ronda}
                aria-label={`Fase ${fase.ronda}: ${fase.nombreRonda}`}
                hidden={!esActiva}
              >
                <div className="calendario-torneo__cabecera">
                  <h4 className="calendario-torneo__titulo">
                    Fase {fase.ronda}: {fase.nombreRonda}
                  </h4>
                  <div className="calendario-torneo__badges">
                    <span className="calendario-torneo__badge">
                      {`${fase.partidos} ${fase.partidos === 1 ? 'partido' : 'partidos'}${sufijoTurno}`}
                    </span>
                    <span className="calendario-torneo__badge">
                      {`Mínimo: ${fase.horasMinimas} ${
                        fase.horasMinimas === 1 ? 'hora' : 'horas'
                      } con ${fase.canchasEfectivas} ${
                        fase.canchasEfectivas === 1 ? 'cancha' : 'canchas'
                      }`}
                    </span>
                  </div>
                </div>

                <div className="calendario-torneo__campo">
                  <span className="calendario-torneo__etiqueta">
                    Día de {fase.nombreRonda}
                  </span>
                  <SelectorDia
                    dias={dias}
                    valor={jornada.fecha}
                    onChange={(iso) =>
                      onCambiarFechaFase && onCambiarFechaFase(fase.ronda, iso)
                    }
                    contarLibres={
                      contarLibresFase ? contarLibresFase(fase.ronda) : undefined
                    }
                    esDiaBloqueado={
                      esDiaBloqueadoFase
                        ? esDiaBloqueadoFase(fase.ronda)
                        : undefined
                    }
                  />
                </div>

                <div className="calendario-torneo__campo">
                  <span className="calendario-torneo__etiqueta">
                    Horario de {fase.nombreRonda}
                    {totalHoras > 0 && (
                      <span className="formulario-reserva__rango" aria-live="polite">
                        {` · ${partesResumen.join(' · ')} (${totalHoras} ${
                          totalHoras === 1 ? 'hora' : 'horas'
                        })`}
                      </span>
                    )}
                  </span>
                  {canchasDeLaFase.length > 0 ? (
                    <div className="calendario-torneo__canchas-grid">
                      {canchasDeLaFase.map((cid) => {
                        const nombreCancha = nombreCanchaDe(cid);
                        const horasCancha = Array.isArray(jornada.horasPorCancha?.[cid])
                          ? jornada.horasPorCancha[cid]
                          : [];

                        return (
                          <div
                            key={cid}
                            className="calendario-torneo__cancha-fila"
                            data-cancha-fila={cid}
                          >
                            <div className="calendario-torneo__cancha-cabecera">
                              <span className="calendario-torneo__cancha-nombre">
                                {nombreCancha}
                              </span>
                              {horasCancha.length > 0 && (
                                <span className="calendario-torneo__cancha-resumen">
                                  {horasCancha.join(', ')}
                                </span>
                              )}
                            </div>
                            <div className="formulario-reserva__horas calendario-torneo__cancha-horas">
                              {horasBase.map((hora) => {
                                const libre = esLibreFase
                                  ? esLibreFase(fase.ronda, cid, hora)
                                  : false;
                                let bloqueadaPorPrevia = false;
                                for (let rPrev = 1; rPrev < fase.ronda; rPrev += 1) {
                                  const jPrev = jornadas[rPrev];
                                  if (jPrev && jPrev.fecha === jornada.fecha) {
                                    const horasPrev = horasDeJornada(jPrev);
                                    if (horasPrev.length > 0) {
                                      const finPrev = finDeFranja(
                                        horasPrev[horasPrev.length - 1]
                                      );
                                      if (hora < finPrev) {
                                        bloqueadaPorPrevia = true;
                                        break;
                                      }
                                    }
                                  }
                                }

                                const ocupada =
                                  !libre &&
                                  !bloqueadaPorPrevia &&
                                  Array.isArray(canchaIds) &&
                                  canchaIds.length > 0;
                                const sel = horasCancha.includes(hora);
                                const ariaLabel = ocupada
                                  ? `${fase.nombreRonda}, ${nombreCancha}, ${hora}, reservada`
                                  : `${fase.nombreRonda}, ${nombreCancha}, ${hora}`;

                                return (
                                  <button
                                    key={hora}
                                    type="button"
                                    className={
                                      'button small formulario-reserva__hora' +
                                      (ocupada ? ' formulario-reserva__hora--ocupado' : '') +
                                      (sel ? ' formulario-reserva__hora--sel' : ' hollow')
                                    }
                                    disabled={!libre && !sel}
                                    aria-pressed={sel}
                                    aria-label={ariaLabel}
                                    data-hora={hora}
                                    data-cancha={cid}
                                    onClick={() =>
                                      onElegirHoraFase &&
                                      onElegirHoraFase(fase.ronda, cid, hora)
                                    }
                                  >
                                    {hora}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="formulario-reserva__nota">
                      Elige al menos una cancha arriba para marcar sus horas.
                    </p>
                  )}
                  <p className="formulario-reserva__leyenda" aria-hidden="true">
                    <span className="formulario-reserva__leyenda-item">
                      <span className="formulario-reserva__muestra formulario-reserva__muestra--libre"></span>
                      Libre
                    </span>
                    <span className="formulario-reserva__leyenda-item">
                      <span className="formulario-reserva__muestra formulario-reserva__muestra--elegida"></span>
                      Elegida
                    </span>
                    <span className="formulario-reserva__leyenda-item">
                      <span className="formulario-reserva__muestra formulario-reserva__muestra--reservada"></span>
                      Reservada
                    </span>
                  </p>
                </div>

                {totalHoras > 0 && (
                  <>
                    {val && !val.ordenValido && (
                      <div
                        className="callout alert calendario-torneo__alerta-orden"
                        role="alert"
                      >
                        {val.error}
                      </div>
                    )}
                    {val && val.ordenValido && !val.alcanza && (
                      <AlertaTiempo
                        equipos={fase.partidos * 2}
                        canchasCount={fase.canchasEfectivas}
                        minutosRequeridos={fase.minutosRequeridos}
                        disponibles={val.disponibles}
                        deficit={val.deficit}
                        sugerencias={sugerenciasPorFase[fase.ronda] || []}
                        duracionPartido={duracionPartido}
                        onCambiarDuracion={onCambiarDuracion}
                      />
                    )}
                    {tieneHorasDeMas && (
                      <div
                        className="callout warning calendario-torneo__alerta-extra"
                        role="status"
                      >
                        <p className="calendario-torneo__alerta-extra-mensaje">
                          {extraFase.mensaje}
                        </p>
                        <ul className="calendario-torneo__alerta-extra-lista">
                          {extraFase.lista.map((item) => (
                            <li key={`${item.canchaId}-${item.hora}`}>
                              {`${nombreCanchaDe(item.canchaId)} · ${item.hora}`}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </>
                )}

                {idx < fases.length - 1 && (
                  <div className="calendario-torneo__pie-panel">
                    <button
                      type="button"
                      className="button hollow small calendario-torneo__siguiente-fase"
                      onClick={() =>
                        activarFase(fases[idx + 1].ronda, idx + 1, true)
                      }
                    >
                      {`Siguiente fase: ${fases[idx + 1].nombreRonda}`}
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default CalendarioTorneo;

import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { AlertTriangle } from 'lucide-react';
import SelectorDia from '../../shared/SelectorDia';
import AlertaTiempo from './AlertaTiempo';
import { tituloCancha } from '../../../lib/canchas';
import { etiquetaDia } from '../../../lib/fechas';
import { finDeFranja } from '../../../lib/precios';
import './Bracket.css';
import './CalendarioTorneo.css';

const FRANJAS_CONFIG = [
  { id: 'manana', nombre: 'Mañana', min: 0, max: 11 },
  { id: 'tarde', nombre: 'Tarde', min: 12, max: 17 },
  { id: 'noche', nombre: 'Noche', min: 18, max: 23 },
];

function agruparPorFranjas(horas) {
  return FRANJAS_CONFIG.map((f) => ({
    ...f,
    horas: (horas || []).filter((h) => {
      const num = parseInt(h, 10);
      return num >= f.min && num <= f.max;
    }),
  })).filter((f) => f.horas.length > 0);
}

/**
 * CalendarioTorneo — Programación por fases del torneo multi-día.
 *
 * Permite seleccionar el día y la franja horaria de cada fase de eliminación
 * directa (Octavos de final, Cuartos de final, Semifinal, Final), mostrando
 * las canchas efectivas, validaciones de suficiencia de tiempo y alertas
 * de orden cronológico entre fases.
 */
export function CalendarioTorneo({
  fases = [],
  jornadas = {},
  validacionesJornadas = [],
  sugerenciasPorFase = {},
  dias = [],
  horasBase = [],
  canchas = [],
  canchaIds = [],
  duracionPartido,
  onCambiarDuracion,
  onCambiarFechaFase,
  onElegirHoraFase,
  esLibreFase,
  contarLibresFase,
  esDiaBloqueadoFase,
}) {
  const rootRef = useRef(null);
  const tabsRef = useRef([]);
  const [faseActiva, setFaseActiva] = useState(() =>
    fases[0] ? fases[0].ronda : 1
  );
  const franjas = agruparPorFranjas(horasBase);

  const rondaActiva = fases.some((f) => f.ronda === faseActiva)
    ? faseActiva
    : (fases[0]?.ronda ?? 1);

  useEffect(() => {
    if (fases.length > 0 && !fases.some((f) => f.ronda === faseActiva)) {
      setFaseActiva(fases[0].ronda);
    }
  }, [fases, faseActiva]);

  useEffect(() => {
    if (!rootRef.current?.querySelector('.calendario-torneo__fase:not([hidden])')) {
      return undefined;
    }

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.calendario-torneo__fase:not([hidden])', {
          opacity: 0,
          y: 8,
          duration: 0.25,
          ease: 'power2.out',
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [rondaActiva]);

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
        Para elegir 2 o más horas seguidas, toca la hora de inicio y luego la hora final.
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
                horas: [],
              };
              const val = validacionesJornadas.find(
                (v) => v.ronda === fase.ronda
              );
              const horasFase = Array.isArray(jornada.horas)
                ? jornada.horas
                : [];
              const tieneAviso =
                horasFase.length > 0 &&
                Boolean(val && (val.ordenValido === false || val.alcanza === false));

              const diaEtiqueta = jornada.fecha
                ? etiquetaDia(jornada.fecha, dias)
                : '';
              const rangoHoras =
                horasFase.length > 0
                  ? `${horasFase[0]} a ${finDeFranja(horasFase[horasFase.length - 1])}`
                  : '';
              const subtextoEstado =
                horasFase.length > 0
                  ? diaEtiqueta
                    ? `${diaEtiqueta} · ${rangoHoras}`
                    : rangoHoras
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
                      <>
                        {' '}
                        <AlertTriangle
                          size={14}
                          aria-hidden="true"
                          className="calendario-torneo__pestana-icono"
                        />
                        <span className="show-for-sr"> (tiene un aviso)</span>
                      </>
                    )}
                  </span>
                  {' '}
                  <span className="calendario-torneo__pestana-estado">
                    {subtextoEstado}
                  </span>
                </button>
              );
            })}
          </div>

          {fases.map((fase, idx) => {
            const esActiva = fase.ronda === rondaActiva;
            const jornada = jornadas[fase.ronda] || {
              fecha: dias[0] || '',
              horas: [],
            };
            const val = validacionesJornadas.find((v) => v.ronda === fase.ronda);
            const horasFase = Array.isArray(jornada.horas) ? jornada.horas : [];

            const nombresEfectivas = Array.isArray(fase.canchaIds)
              ? fase.canchaIds
                  .map((id) => {
                    const c = Array.isArray(canchas)
                      ? canchas.find((cancha) => cancha.id === id)
                      : null;
                    if (c) return tituloCancha(c);
                    const match = String(id).match(/(\d+)$/);
                    return match ? `Cancha ${match[1]}` : String(id);
                  })
                  .filter(Boolean)
              : [];

            const sufijoNombres =
              nombresEfectivas.length > 0 ? ` (${nombresEfectivas.join(', ')})` : '';

            return (
              <section
                key={fase.ronda}
                id={`panel-fase-${fase.ronda}`}
                role="tabpanel"
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
                      {fase.partidos} {fase.partidos === 1 ? 'partido' : 'partidos'}
                    </span>
                    <span className="calendario-torneo__badge">
                      {fase.canchasEfectivas}{' '}
                      {fase.canchasEfectivas === 1
                        ? 'cancha efectiva'
                        : 'canchas efectivas'}
                      {sufijoNombres}
                    </span>
                    <span className="calendario-torneo__badge">
                      Requiere ~{fase.minutosRequeridos} min (mín. {fase.horasMinimas} h)
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
                    {horasFase.length > 0 && (
                      <span className="formulario-reserva__rango" aria-live="polite">
                        {` · ${horasFase[0]} a ${finDeFranja(horasFase[horasFase.length - 1])} (${horasFase.length} h)`}
                      </span>
                    )}
                  </span>
                  <div className="formulario-reserva__franjas">
                    {franjas.map((franja) => (
                      <div key={franja.id} className="formulario-reserva__franja">
                        <span className="formulario-reserva__franja-etiqueta">
                          {franja.nombre}
                        </span>
                        <div className="formulario-reserva__horas formulario-reserva__franja-horas">
                          {franja.horas.map((hora) => {
                            const libre = esLibreFase ? esLibreFase(fase.ronda, hora) : false;
                            let bloqueadaPorPrevia = false;
                            for (let rPrev = 1; rPrev < fase.ronda; rPrev += 1) {
                              const jPrev = jornadas[rPrev];
                              if (
                                jPrev &&
                                jPrev.fecha === jornada.fecha &&
                                Array.isArray(jPrev.horas) &&
                                jPrev.horas.length > 0
                              ) {
                                const finPrev = finDeFranja(jPrev.horas[jPrev.horas.length - 1]);
                                if (hora < finPrev) {
                                  bloqueadaPorPrevia = true;
                                  break;
                                }
                              }
                            }

                            const ocupada =
                              !libre &&
                              !bloqueadaPorPrevia &&
                              Array.isArray(canchaIds) &&
                              canchaIds.length > 0;
                            const sel = horasFase.includes(hora);
                            const ariaLabel = ocupada
                              ? `${fase.nombreRonda} ${hora}, reservada`
                              : `${fase.nombreRonda} ${hora}`;

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
                                onClick={() =>
                                  onElegirHoraFase && onElegirHoraFase(fase.ronda, hora)
                                }
                              >
                                {hora}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
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

                {horasFase.length > 0 && (
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

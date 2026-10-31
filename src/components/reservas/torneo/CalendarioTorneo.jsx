import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import SelectorDia from '../../shared/SelectorDia';
import AlertaTiempo from './AlertaTiempo';
import { tituloCancha } from '../../../lib/canchas';
import './Bracket.css';

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
  onCambiarFechaFase,
  onElegirHoraFase,
  esLibreFase,
  contarLibresFase,
  esDiaBloqueadoFase,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.calendario-torneo__fase', {
          opacity: 0,
          y: 8,
          duration: 0.25,
          stagger: 0.05,
          ease: 'power2.out',
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [fases.length]);

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

      {fases.map((fase) => {
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
            className="calendario-torneo__fase"
            data-ronda={fase.ronda}
            aria-label={`Fase ${fase.ronda}: ${fase.nombreRonda}`}
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
              </span>
              <div className="formulario-reserva__horas">
                {horasBase.map((hora) => {
                  const libre = esLibreFase ? esLibreFase(fase.ronda, hora) : false;
                  const sel = horasFase.includes(hora);

                  return (
                    <button
                      key={hora}
                      type="button"
                      className={
                        'button small formulario-reserva__hora' +
                        (libre ? '' : ' formulario-reserva__hora--ocupado') +
                        (sel ? ' formulario-reserva__hora--sel' : ' hollow')
                      }
                      disabled={!libre}
                      aria-pressed={sel}
                      aria-label={`${fase.nombreRonda} ${hora}`}
                      data-hora={hora}
                      onClick={() =>
                        onElegirHoraFase && onElegirHoraFase(fase.ronda, hora)
                      }
                    >
                      {hora}
                      {!libre && canchaIds.length > 0 && (
                        <span className="formulario-reserva__hora-tag">
                          {' '}
                          · ocupado
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
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
                  />
                )}
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}

export default CalendarioTorneo;

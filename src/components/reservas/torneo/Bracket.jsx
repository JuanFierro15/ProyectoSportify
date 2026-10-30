import React, { useEffect, useMemo, useRef } from 'react';
import { gsap } from 'gsap';
import { Trophy, Clock, MapPin } from 'lucide-react';
import { tituloCancha } from '../../../lib/canchas';
import './Bracket.css';

function resolverNombreCancha(canchaId, canchas) {
  if (canchaId === null || canchaId === undefined || canchaId === '') {
    return 'Cancha por elegir';
  }
  const canchaObj = canchas.find((c) => c.id === canchaId);
  if (canchaObj) {
    return tituloCancha(canchaObj);
  }
  const match = String(canchaId).match(/(\d+)$/);
  return match ? `Cancha ${match[1]}` : 'Cancha 1';
}

export function Bracket({
  partidos = [],
  canchas = [],
  compacto = false,
}) {
  const rootRef = useRef(null);

  const gruposRondas = useMemo(() => {
    const mapa = new Map();
    partidos.forEach((p) => {
      const r = p.ronda ?? 1;
      if (!mapa.has(r)) {
        mapa.set(r, []);
      }
      mapa.get(r).push(p);
    });

    return Array.from(mapa.entries())
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([ronda, lista]) => ({
        ronda: Number(ronda),
        nombreRonda: lista[0]?.nombreRonda || `Ronda ${ronda}`,
        partidos: lista,
      }));
  }, [partidos]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia();
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.bracket-torneo__partido', {
          opacity: 0,
          y: 10,
          duration: 0.28,
          stagger: 0.035,
          ease: 'power2.out',
        });
      });
    }, rootRef);

    return () => ctx.revert();
  }, [partidos.length, compacto]);

  return (
    <div
      ref={rootRef}
      className={'bracket-torneo' + (compacto ? ' bracket-torneo--compacto' : '')}
      role="region"
      aria-label="Llaves y cronograma del torneo"
    >
      {partidos.length === 0 ? (
        <p className="bracket-torneo__vacio">No hay partidos programados todavía.</p>
      ) : (
        <div className="bracket-torneo__rondas">
          {gruposRondas.map((grupo) => {
            const esFinal =
              typeof grupo.nombreRonda === 'string' &&
              grupo.nombreRonda.trim().toLowerCase() === 'final';

            return (
              <div
                key={grupo.ronda}
                className="bracket-torneo__columna"
                data-ronda={grupo.ronda}
              >
                <h4 className="bracket-torneo__ronda-titulo">
                  {esFinal && (
                    <Trophy
                      size={16}
                      aria-hidden="true"
                      className="bracket-torneo__trophy"
                    />
                  )}
                  <span>{grupo.nombreRonda}</span>
                </h4>

                <div className="bracket-torneo__lista-partidos">
                  {grupo.partidos.map((p) => {
                    const nombreCancha = resolverNombreCancha(p.canchaId, canchas);

                    return (
                      <article
                        key={p.id}
                        className="bracket-torneo__partido"
                        aria-label={`Partido ${p.id}: ${p.local || 'Por definir'} contra ${p.visitante || 'Por definir'}`}
                      >
                        <header className="bracket-torneo__partido-meta">
                          <div className="bracket-torneo__partido-header">
                            <span className="bracket-torneo__badge">{p.id}</span>
                            {p.turno != null && (
                              <span className="bracket-torneo__turno">
                                {`Turno ${p.turno}`}
                              </span>
                            )}
                          </div>
                          <div className="bracket-torneo__partido-detalles">
                            <span className="bracket-torneo__horario">
                              <Clock size={12} aria-hidden="true" />
                              <span>{p.inicio || 'Hora por definir'}</span>
                            </span>
                            <span className="bracket-torneo__cancha">
                              <MapPin size={12} aria-hidden="true" />
                              <span>{nombreCancha}</span>
                            </span>
                          </div>
                        </header>

                        <div className="bracket-torneo__equipos">
                          <div className="bracket-torneo__equipo">
                            <span className="bracket-torneo__equipo-nombre">
                              {p.local || 'Por definir'}
                            </span>
                          </div>
                          <span className="bracket-torneo__vs" aria-hidden="true">
                            vs
                          </span>
                          <div className="bracket-torneo__equipo">
                            <span className="bracket-torneo__equipo-nombre">
                              {p.visitante || 'Por definir'}
                            </span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Bracket;

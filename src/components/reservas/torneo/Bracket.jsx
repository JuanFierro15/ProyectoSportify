import React, { useEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { Trophy } from 'lucide-react';
import { aDate, DIA_SEMANA, MES_CORTO } from '../../../lib/fechas';
import { tituloCancha } from '../../../lib/canchas';
import './Bracket.css';

export function fechaCorta(iso) {
  if (!iso || typeof iso !== 'string') return '';
  const d = aDate(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const dia = DIA_SEMANA[d.getDay()];
  const mes = MES_CORTO[d.getMonth()];
  return `${dia} ${d.getDate()} ${mes}`;
}

function resolverNombreCancha(canchaId, canchas = []) {
  if (canchaId === null || canchaId === undefined || canchaId === '') {
    return null;
  }
  const canchaObj = canchas.find((c) => c.id === canchaId);
  if (canchaObj) {
    return tituloCancha(canchaObj);
  }
  const match = String(canchaId).match(/(\d+)$/);
  return match ? `Cancha ${match[1]}` : null;
}

function formatearEquipo(nombre, mapaIdANumero) {
  if (!nombre) return 'Por definir';
  const match = String(nombre).match(/^Ganador\s+(.+)$/i);
  if (match) {
    const idRef = match[1].trim();
    const num = mapaIdANumero.get(idRef);
    if (num) {
      return `Ganador del partido ${num}`;
    }
  }
  return nombre;
}

function obtenerTextoMeta(numero, p, canchas) {
  const nombreCancha = resolverNombreCancha(p.canchaId, canchas);
  const hora = p.inicio;
  if (!hora) {
    return nombreCancha
      ? `Partido ${numero}, Por programar · ${nombreCancha}`
      : `Partido ${numero}, Por programar`;
  }
  return nombreCancha
    ? `Partido ${numero}, ${hora} · ${nombreCancha}`
    : `Partido ${numero}, ${hora}`;
}

function obtenerFechaYHorarioRonda(listaPartidos) {
  if (!listaPartidos || listaPartidos.length === 0) return '';
  const primer = listaPartidos[0];
  const fechaTxt = fechaCorta(primer.fecha);
  const horas = listaPartidos.map((p) => p.inicio).filter(Boolean);
  if (horas.length === 0) {
    return fechaTxt;
  }
  const minHora = horas[0];
  const maxHora = horas[horas.length - 1];
  const horarioTxt = minHora === maxHora ? minHora : `${minHora} a ${maxHora}`;
  return fechaTxt ? `${fechaTxt}, ${horarioTxt}` : horarioTxt;
}

function useEsMovil(breakpoint = 900) {
  const [esMovil, setEsMovil] = useState(() => {
    if (typeof window !== 'undefined' && typeof window.innerWidth === 'number') {
      return window.innerWidth < breakpoint;
    }
    return false;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const manejarResize = () => {
      setEsMovil(window.innerWidth < breakpoint);
    };
    window.addEventListener('resize', manejarResize);
    return () => window.removeEventListener('resize', manejarResize);
  }, [breakpoint]);

  return esMovil;
}

export function Bracket({
  partidos = [],
  canchas = [],
  compacto = false,
}) {
  const rootRef = useRef(null);
  const esMovil = useEsMovil(900);

  const colAncho = compacto ? 180 : 190;
  const colGap = 38;

  const mapaIdANumero = useMemo(() => {
    return new Map(partidos.map((p, idx) => [p.id, idx + 1]));
  }, [partidos]);

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
        fecha: lista[0]?.fecha || null,
        fechaYHorario: obtenerFechaYHorarioRonda(lista),
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
  }, [partidos.length, compacto, esMovil]);

  // Layout simétrico para escritorio (>= 900 px)
  const layoutSimetrico = useMemo(() => {
    if (gruposRondas.length === 0) return null;

    const R = gruposRondas.length;
    const rondaFinal = gruposRondas[R - 1];
    const partidoFinal = rondaFinal.partidos[0];

    // Caso especial: solo hay una ronda (final)
    if (R === 1) {
      const totalAncho = colAncho;
      const canvasAlto = 250;
      return {
        totalAncho,
        canvasAlto,
        numCols: 1,
        columnasHeader: [
          {
            key: 'final',
            nombreRonda: rondaFinal.nombreRonda,
            fechaYHorario: rondaFinal.fechaYHorario,
            tipo: 'centro',
          },
        ],
        tarjetas: [
          {
            partido: partidoFinal,
            numero: mapaIdANumero.get(partidoFinal?.id) || 1,
            x: 0,
            yCenter: 126,
            esFinal: true,
            lado: 'centro',
          },
        ],
        lineas: [],
      };
    }

    const numCols = 2 * R - 1;
    const totalAncho = numCols * colAncho + (numCols - 1) * colGap;

    const rondasPrevias = gruposRondas.slice(0, R - 1);
    const K1 = Math.max(1, Math.floor(rondasPrevias[0].partidos.length / 2));
    const step1 = 128;

    // Calcular centros preliminares con base 62
    const centrosPreliminares = [];
    centrosPreliminares[0] = Array.from({ length: K1 }, (_, i) => 62 + i * step1);

    for (let r = 1; r < rondasPrevias.length; r += 1) {
      const prevCentros = centrosPreliminares[r - 1];
      const count = Math.max(1, Math.floor(prevCentros.length / 2));
      centrosPreliminares[r] = Array.from({ length: count }, (_, j) => {
        const y1 = prevCentros[2 * j] ?? 126;
        const y2 = prevCentros[2 * j + 1] ?? y1;
        return (y1 + y2) / 2;
      });
    }

    const semiCentrosPreliminar = centrosPreliminares[centrosPreliminares.length - 1];
    const yCenterFinalPreliminar = semiCentrosPreliminar[0] ?? 126;

    // La tarjeta final mide 96px (radio 48px), y arriba lleva el trofeo + meta (56px).
    // topIcono = yCenter - 48 - 56 = yCenter - 104.
    // Con 4 equipos, yCenterFinalPreliminar = 62 -> topIcono = -42 (invadía los encabezados).
    // Calculamos el desplazamiento mínimo para que topIcono >= 8 (en todos los tamaños):
    const offsetY = Math.max(0, 104 + 8 - yCenterFinalPreliminar);
    const yBase = 62 + offsetY;
    const canvasAlto = Math.max(250, K1 * step1 + offsetY);

    // Centros reales con el desplazamiento aplicado
    const centrosYPorRonda = [];
    centrosYPorRonda[0] = Array.from({ length: K1 }, (_, i) => yBase + i * step1);

    for (let r = 1; r < rondasPrevias.length; r += 1) {
      const prevCentros = centrosYPorRonda[r - 1];
      const count = Math.max(1, Math.floor(prevCentros.length / 2));
      centrosYPorRonda[r] = Array.from({ length: count }, (_, j) => {
        const y1 = prevCentros[2 * j] ?? (yBase + 64);
        const y2 = prevCentros[2 * j + 1] ?? y1;
        return (y1 + y2) / 2;
      });
    }

    const semiCentros = centrosYPorRonda[centrosYPorRonda.length - 1];
    const yCenterFinal = semiCentros[0] ?? (yBase + 64);

    // Encabezados de columnas (de izquierda a derecha)
    const columnasHeader = [];
    for (let r = 0; r < rondasPrevias.length; r += 1) {
      columnasHeader.push({
        key: `izq-r${rondasPrevias[r].ronda}`,
        nombreRonda: rondasPrevias[r].nombreRonda,
        fechaYHorario: rondasPrevias[r].fechaYHorario,
        tipo: 'izq',
      });
    }
    columnasHeader.push({
      key: 'centro-final',
      nombreRonda: rondaFinal.nombreRonda,
      fechaYHorario: rondaFinal.fechaYHorario,
      tipo: 'centro',
    });
    for (let r = rondasPrevias.length - 1; r >= 0; r -= 1) {
      columnasHeader.push({
        key: `der-r${rondasPrevias[r].ronda}`,
        nombreRonda: rondasPrevias[r].nombreRonda,
        fechaYHorario: rondasPrevias[r].fechaYHorario,
        tipo: 'der',
      });
    }

    const tarjetas = [];
    const lineas = [];

    // 1. Tarjetas del lado izquierdo
    for (let r = 0; r < rondasPrevias.length; r += 1) {
      const colIdx = r;
      const x = colIdx * (colAncho + colGap);
      const lista = rondasPrevias[r].partidos;
      const mitad = Math.floor(lista.length / 2);
      const partidosIzq = lista.slice(0, mitad);
      const centros = centrosYPorRonda[r];

      partidosIzq.forEach((p, j) => {
        const yCenter = centros[j] ?? (yBase + 64);
        tarjetas.push({
          partido: p,
          numero: mapaIdANumero.get(p.id) || 1,
          x,
          yCenter,
          esFinal: false,
          lado: 'izq',
        });
      });

      // Conectores hacia la siguiente columna (derecha)
      const nextColIdx = colIdx + 1;
      const esHaciaFinal = nextColIdx === R - 1;
      const xStart = x + colAncho;
      const xVertical = xStart + colGap / 2;
      const xEnd = nextColIdx * (colAncho + colGap);

      if (centros.length === 1) {
        const y = centros[0];
        lineas.push({
          x1: xStart,
          y1: y,
          x2: xEnd,
          y2: y,
          final: esHaciaFinal,
        });
      } else {
        const nextCentros = centrosYPorRonda[r + 1] || [yCenterFinal];
        for (let j = 0; j < Math.floor(centros.length / 2); j += 1) {
          const y1 = centros[2 * j];
          const y2 = centros[2 * j + 1] ?? y1;
          const yMid = nextCentros[j] ?? (y1 + y2) / 2;

          lineas.push({ x1: xStart, y1, x2: xVertical, y2: y1, final: false });
          if (y2 !== y1) {
            lineas.push({ x1: xStart, y1: y2, x2: xVertical, y2: y2, final: false });
            lineas.push({ x1: xVertical, y1, x2: xVertical, y2: y2, final: false });
          }
          lineas.push({
            x1: xVertical,
            y1: yMid,
            x2: xEnd,
            y2: yMid,
            final: esHaciaFinal,
          });
        }
      }
    }

    // 2. Tarjeta central de la Final
    const colIdxFinal = R - 1;
    const xFinal = colIdxFinal * (colAncho + colGap);
    if (partidoFinal) {
      tarjetas.push({
        partido: partidoFinal,
        numero: mapaIdANumero.get(partidoFinal.id) || partidos.length,
        x: xFinal,
        yCenter: yCenterFinal,
        esFinal: true,
        lado: 'centro',
      });
    }

    // 3. Tarjetas del lado derecho (espejo)
    for (let r = 0; r < rondasPrevias.length; r += 1) {
      const colIdx = numCols - 1 - r;
      const x = colIdx * (colAncho + colGap);
      const lista = rondasPrevias[r].partidos;
      const mitad = Math.floor(lista.length / 2);
      const partidosDer = lista.slice(mitad);
      const centros = centrosYPorRonda[r];

      partidosDer.forEach((p, j) => {
        const yCenter = centros[j] ?? (yBase + 64);
        tarjetas.push({
          partido: p,
          numero: mapaIdANumero.get(p.id) || 1,
          x,
          yCenter,
          esFinal: false,
          lado: 'der',
        });
      });

      // Conectores hacia la siguiente columna (izquierda)
      const nextColIdx = colIdx - 1;
      const esHaciaFinal = nextColIdx === R - 1;
      const xStart = x;
      const xVertical = xStart - colGap / 2;
      const xEnd = nextColIdx * (colAncho + colGap) + colAncho;

      if (centros.length === 1) {
        const y = centros[0];
        lineas.push({
          x1: xStart,
          y1: y,
          x2: xEnd,
          y2: y,
          final: esHaciaFinal,
        });
      } else {
        const nextCentros = centrosYPorRonda[r + 1] || [yCenterFinal];
        for (let j = 0; j < Math.floor(centros.length / 2); j += 1) {
          const y1 = centros[2 * j];
          const y2 = centros[2 * j + 1] ?? y1;
          const yMid = nextCentros[j] ?? (y1 + y2) / 2;

          lineas.push({ x1: xStart, y1, x2: xVertical, y2: y1, final: false });
          if (y2 !== y1) {
            lineas.push({ x1: xStart, y1: y2, x2: xVertical, y2: y2, final: false });
            lineas.push({ x1: xVertical, y1, x2: xVertical, y2: y2, final: false });
          }
          lineas.push({
            x1: xVertical,
            y1: yMid,
            x2: xEnd,
            y2: yMid,
            final: esHaciaFinal,
          });
        }
      }
    }

    return {
      totalAncho,
      canvasAlto,
      numCols,
      columnasHeader,
      tarjetas,
      lineas,
    };
  }, [gruposRondas, mapaIdANumero, partidos.length, colAncho, colGap]);

  // Layout de izquierda a derecha para celular (< 900 px)
  const layoutMovil = useMemo(() => {
    if (gruposRondas.length === 0) return null;

    const R = gruposRondas.length;
    const rondaFinal = gruposRondas[R - 1];
    const partidoFinal = rondaFinal.partidos[0];

    if (R === 1) {
      const totalAncho = colAncho;
      const canvasAlto = 250;
      return {
        totalAncho,
        canvasAlto,
        numCols: 1,
        columnasHeader: [
          {
            key: 'movil-final',
            nombreRonda: rondaFinal.nombreRonda,
            fechaYHorario: rondaFinal.fechaYHorario,
            tipo: 'final',
          },
        ],
        tarjetas: [
          {
            partido: partidoFinal,
            numero: mapaIdANumero.get(partidoFinal?.id) || 1,
            x: 0,
            yCenter: 126,
            esFinal: true,
            lado: 'centro',
          },
        ],
        lineas: [],
      };
    }

    const numCols = R;
    const totalAncho = numCols * colAncho + (numCols - 1) * colGap;

    const N0 = gruposRondas[0].partidos.length;
    const step0 = 128;

    // Centros preliminares para calcular desplazamiento
    const centrosPreliminares = [];
    centrosPreliminares[0] = Array.from({ length: N0 }, (_, i) => 62 + i * step0);
    for (let r = 1; r < R; r += 1) {
      const prevCentros = centrosPreliminares[r - 1];
      const count = gruposRondas[r].partidos.length;
      centrosPreliminares[r] = Array.from({ length: count }, (_, j) => {
        const y1 = prevCentros[2 * j] ?? 126;
        const y2 = prevCentros[2 * j + 1] ?? y1;
        return (y1 + y2) / 2;
      });
    }

    const yCenterFinalPreliminar = centrosPreliminares[R - 1][0] ?? 126;
    const offsetY = Math.max(0, 104 + 8 - yCenterFinalPreliminar);
    const yBase = 62 + offsetY;
    const canvasAlto = Math.max(250, N0 * step0 + offsetY);

    // Centros reales por ronda
    const centrosPorRonda = [];
    centrosPorRonda[0] = Array.from({ length: N0 }, (_, i) => yBase + i * step0);
    for (let r = 1; r < R; r += 1) {
      const prevCentros = centrosPorRonda[r - 1];
      const count = gruposRondas[r].partidos.length;
      centrosPorRonda[r] = Array.from({ length: count }, (_, j) => {
        const y1 = prevCentros[2 * j] ?? (yBase + 64);
        const y2 = prevCentros[2 * j + 1] ?? y1;
        return (y1 + y2) / 2;
      });
    }

    const columnasHeader = gruposRondas.map((grupo, idx) => ({
      key: `movil-col-${grupo.ronda}`,
      nombreRonda: grupo.nombreRonda,
      fechaYHorario: grupo.fechaYHorario,
      tipo: idx === R - 1 ? 'final' : 'col',
    }));

    const tarjetas = [];
    const lineas = [];

    // Tarjetas por ronda
    for (let r = 0; r < R; r += 1) {
      const colIdx = r;
      const x = colIdx * (colAncho + colGap);
      const esFinalCol = r === R - 1;
      const lista = gruposRondas[r].partidos;
      const centros = centrosPorRonda[r];

      lista.forEach((p, j) => {
        const yCenter = centros[j] ?? (yBase + 64);
        tarjetas.push({
          partido: p,
          numero: mapaIdANumero.get(p.id) || 1,
          x,
          yCenter,
          esFinal: esFinalCol,
          lado: esFinalCol ? 'centro' : 'izq',
        });
      });

      // Conectores hacia la ronda siguiente
      if (r < R - 1) {
        const nextColIdx = colIdx + 1;
        const esHaciaFinal = nextColIdx === R - 1;
        const xStart = x + colAncho;
        const xVertical = xStart + colGap / 2;
        const xEnd = nextColIdx * (colAncho + colGap);
        const nextCentros = centrosPorRonda[r + 1];

        if (centros.length === 1 && nextCentros.length === 1) {
          const y1 = centros[0];
          const y2 = nextCentros[0];
          if (y1 === y2) {
            lineas.push({
              x1: xStart,
              y1,
              x2: xEnd,
              y2,
              final: esHaciaFinal,
            });
          } else {
            lineas.push({ x1: xStart, y1, x2: xVertical, y2: y1, final: false });
            lineas.push({ x1: xVertical, y1, x2: xVertical, y2, final: false });
            lineas.push({
              x1: xVertical,
              y1: y2,
              x2: xEnd,
              y2,
              final: esHaciaFinal,
            });
          }
        } else {
          for (let j = 0; j < nextCentros.length; j += 1) {
            const y1 = centros[2 * j];
            const y2 = centros[2 * j + 1] ?? y1;
            const yMid = nextCentros[j] ?? (y1 + y2) / 2;

            lineas.push({ x1: xStart, y1, x2: xVertical, y2: y1, final: false });
            if (y2 !== y1) {
              lineas.push({ x1: xStart, y1: y2, x2: xVertical, y2: y2, final: false });
              lineas.push({ x1: xVertical, y1, x2: xVertical, y2: y2, final: false });
            }
            lineas.push({
              x1: xVertical,
              y1: yMid,
              x2: xEnd,
              y2: yMid,
              final: esHaciaFinal,
            });
          }
        }
      }
    }

    return {
      totalAncho,
      canvasAlto,
      numCols,
      columnasHeader,
      tarjetas,
      lineas,
    };
  }, [gruposRondas, mapaIdANumero, colAncho, colGap]);

  const renderTarjeta = (item) => {
    const p = item.partido;
    const numero = item.numero;
    const nombreLocal = formatearEquipo(p.local, mapaIdANumero);
    const nombreVisitante = formatearEquipo(p.visitante, mapaIdANumero);
    const metaTexto = obtenerTextoMeta(numero, p, canchas);
    const esGanadorLocal = nombreLocal.startsWith('Ganador del partido');
    const esGanadorVisitante = nombreVisitante.startsWith('Ganador del partido');

    if (item.esFinal) {
      const topCaja = item.yCenter - 48;
      const topIcono = topCaja - 56;
      const topPremio = topCaja + 96 + 8;

      return (
        <article
          key={p.id}
          className="bracket-torneo__partido bracket-torneo__partido--final bracket-torneo__partido--absoluto"
          style={{
            left: `${item.x}px`,
            top: `${topIcono}px`,
            width: `${colAncho}px`,
          }}
          aria-label={`Partido ${numero}: ${nombreLocal} contra ${nombreVisitante}`}
        >
          <div className="bracket-torneo__final-header">
            <Trophy
              size={28}
              strokeWidth={1.75}
              aria-hidden="true"
              className="bracket-torneo__trophy"
            />
            <span className="bracket-torneo__partido-meta bracket-torneo__partido-meta--centro">
              {metaTexto}
            </span>
          </div>

          <div className="bracket-torneo__caja bracket-torneo__caja--final">
            <div className="bracket-torneo__equipo-fila bracket-torneo__equipo-fila--centro">
              <span
                className={`bracket-torneo__equipo-nombre${esGanadorLocal ? ' bracket-torneo__equipo-nombre--ganador' : ''}`}
              >
                {nombreLocal}
              </span>
            </div>
            <div className="bracket-torneo__equipo-fila bracket-torneo__equipo-fila--centro">
              <span
                className={`bracket-torneo__equipo-nombre${esGanadorVisitante ? ' bracket-torneo__equipo-nombre--ganador' : ''}`}
              >
                {nombreVisitante}
              </span>
            </div>
          </div>

          <p
            className="bracket-torneo__final-premio"
            style={{
              position: 'absolute',
              left: 0,
              top: `${topPremio - topIcono}px`,
              width: `${colAncho}px`,
            }}
          >
            Trofeo y premiación al terminar.
          </p>
        </article>
      );
    }

    const topCaja = item.yCenter - 38;
    const topMeta = topCaja - 20;

    return (
      <article
        key={p.id}
        className={`bracket-torneo__partido bracket-torneo__partido--absoluto bracket-torneo__partido--${item.lado}`}
        style={{
          left: `${item.x}px`,
          top: `${topMeta}px`,
          width: `${colAncho}px`,
        }}
        aria-label={`Partido ${numero}: ${nombreLocal} contra ${nombreVisitante}`}
      >
        <span
          className={`bracket-torneo__partido-meta bracket-torneo__partido-meta--${item.lado}`}
        >
          {metaTexto}
        </span>
        <div className="bracket-torneo__caja">
          <div
            className={`bracket-torneo__equipo-fila bracket-torneo__equipo-fila--${item.lado}`}
          >
            <span
              className={`bracket-torneo__equipo-nombre${esGanadorLocal ? ' bracket-torneo__equipo-nombre--ganador' : ''}`}
            >
              {nombreLocal}
            </span>
          </div>
          <div
            className={`bracket-torneo__equipo-fila bracket-torneo__equipo-fila--${item.lado}`}
          >
            <span
              className={`bracket-torneo__equipo-nombre${esGanadorVisitante ? ' bracket-torneo__equipo-nombre--ganador' : ''}`}
            >
              {nombreVisitante}
            </span>
          </div>
        </div>
      </article>
    );
  };

  return (
    <div
      ref={rootRef}
      className={`bracket-torneo${compacto ? ' bracket-torneo--compacto' : ''}`}
      role="region"
      aria-label="Llaves y cronograma del torneo"
    >
      {partidos.length === 0 ? (
        <p className="bracket-torneo__vacio">No hay partidos programados todavía.</p>
      ) : esMovil ? (
        // Vista Celular (< 900 px): rondas de izquierda a derecha con scroll horizontal y conectores
        layoutMovil && (
          <div
            className="bracket-torneo__movil"
            tabIndex={0}
            role="region"
            aria-label="Llaves del torneo"
          >
            <div
              className="bracket-torneo__simetrico"
              style={{ width: `${layoutMovil.totalAncho}px` }}
            >
              {/* Encabezados de columnas */}
              <div
                className="bracket-torneo__columnas-grid"
                style={{
                  gridTemplateColumns: `repeat(${layoutMovil.numCols}, ${colAncho}px)`,
                  columnGap: `${colGap}px`,
                }}
              >
                {layoutMovil.columnasHeader.map((col) => {
                  const esFinal = col.tipo === 'final';
                  return (
                    <div
                      key={col.key}
                      className="bracket-torneo__col-header bracket-torneo__col-header--izq"
                    >
                      <h4
                        className={`bracket-torneo__ronda-heading${esFinal ? ' bracket-torneo__ronda-heading--final' : ''}`}
                      >
                        {col.nombreRonda}
                      </h4>
                      {col.fechaYHorario && (
                        <p className="bracket-torneo__ronda-fecha">
                          {col.fechaYHorario}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lienzo absoluto para tarjetas y conectores */}
              <div
                className="bracket-torneo__lienzo"
                style={{
                  width: `${layoutMovil.totalAncho}px`,
                  height: `${layoutMovil.canvasAlto}px`,
                }}
              >
                <svg
                  className="bracket-torneo__conectores"
                  width={layoutMovil.totalAncho}
                  height={layoutMovil.canvasAlto}
                  aria-hidden="true"
                >
                  {layoutMovil.lineas.map((linea, idx) => (
                    <line
                      key={idx}
                      x1={linea.x1}
                      y1={linea.y1}
                      x2={linea.x2}
                      y2={linea.y2}
                      stroke={linea.final ? 'var(--accent, #5bd67d)' : 'var(--reserva-linea, #3a3a3a)'}
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                {layoutMovil.tarjetas.map((item) => renderTarjeta(item))}
              </div>
            </div>
          </div>
        )
      ) : (
        // Vista Escritorio (>= 900 px): simétrica con final en el centro
        layoutSimetrico && (
          <div
            className="bracket-torneo__canvas-scroll"
            tabIndex={0}
            role="region"
            aria-label="Llaves del torneo"
          >
            <div
              className="bracket-torneo__simetrico"
              style={{ width: `${layoutSimetrico.totalAncho}px` }}
            >
              {/* Encabezados de columnas */}
              <div
                className="bracket-torneo__columnas-grid"
                style={{
                  gridTemplateColumns: `repeat(${layoutSimetrico.numCols}, ${colAncho}px)`,
                  columnGap: `${colGap}px`,
                }}
              >
                {layoutSimetrico.columnasHeader.map((col) => {
                  const esCentro = col.tipo === 'centro';
                  const esDer = col.tipo === 'der';

                  return (
                    <div
                      key={col.key}
                      className={`bracket-torneo__col-header bracket-torneo__col-header--${col.tipo}`}
                    >
                      {esDer ? (
                        <span className="bracket-torneo__ronda-heading bracket-torneo__ronda-heading--espejo">
                          {col.nombreRonda}
                        </span>
                      ) : (
                        <h4
                          className={`bracket-torneo__ronda-heading${esCentro ? ' bracket-torneo__ronda-heading--final' : ''}`}
                        >
                          {col.nombreRonda}
                        </h4>
                      )}
                      {col.fechaYHorario && (
                        <p className="bracket-torneo__ronda-fecha">
                          {col.fechaYHorario}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Lienzo absoluto para tarjetas y conectores */}
              <div
                className="bracket-torneo__lienzo"
                style={{
                  width: `${layoutSimetrico.totalAncho}px`,
                  height: `${layoutSimetrico.canvasAlto}px`,
                }}
              >
                {/* Conectores SVG */}
                <svg
                  className="bracket-torneo__conectores"
                  width={layoutSimetrico.totalAncho}
                  height={layoutSimetrico.canvasAlto}
                  aria-hidden="true"
                >
                  {layoutSimetrico.lineas.map((linea, idx) => (
                    <line
                      key={idx}
                      x1={linea.x1}
                      y1={linea.y1}
                      x2={linea.x2}
                      y2={linea.y2}
                      stroke={linea.final ? 'var(--accent, #5bd67d)' : 'var(--reserva-linea, #3a3a3a)'}
                      strokeWidth="2"
                    />
                  ))}
                </svg>

                {/* Tarjetas de partidos */}
                {layoutSimetrico.tarjetas.map((item) => renderTarjeta(item))}
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}

export default Bracket;

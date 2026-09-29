import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { X, Tag } from 'lucide-react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES, deportePorSlug } from '../../data/deportes';
import {
  canchasDelDeporte,
  tituloCancha,
  imagenPlaceholderCancha,
  colorContraste,
} from '../../lib/canchas';
import DepthCarousel from '../reactbits/DepthCarousel';
import ReservaModal from '../reservas/ReservaModal';
import TexturaCancha from './TexturaCancha';
import './VistaCanchas.css';

const formatoPrecio = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

// Por debajo de este número de canchas, el carrusel 3D no aporta nada (y se
// ve vacío): se usa un grid estático centrado en su lugar.
const MINIMO_PARA_CARRUSEL = 3;

// Primer horario de hoy que sigue disponible y todavía no pasó (comparado
// contra la hora real del navegador). Puramente de presentación: no toca el
// cálculo de disponibilidad del ReservasContext.
function proximaHoraLibre(horariosHoy) {
  const ahora = new Date();
  const minutosAhora = ahora.getHours() * 60 + ahora.getMinutes();
  const siguiente = horariosHoy.find((h) => {
    if (!h.disponible) return false;
    const [hh, mm] = h.hora.split(':').map(Number);
    return hh * 60 + mm >= minutosAhora;
  });
  return siguiente ? siguiente.hora : null;
}

/**
 * Panel de detalle, sincronizado con la card activa del carrusel (o la card
 * elegida en el layout estático). Vive dentro del mismo archivo por ser un
 * detalle de presentación exclusivo de VistaCanchas (no se reutiliza en
 * ningún otro sitio). El color de acento no se pasa por prop: se hereda de
 * `--accent` definida en el contenedor `.vista-canchas` (tema por deporte).
 */
function PanelDetalle({ cancha, dias, disponibilidad, onReservar }) {
  const horariosHoy = disponibilidad(cancha.id, dias[0]);
  const libresHoy = horariosHoy.filter((h) => h.disponible).length;
  const totalHoras = horariosHoy.length;
  const hayCuposSemana = dias.some((d) =>
    disponibilidad(cancha.id, d).some((h) => h.disponible)
  );
  const proximoLibre = proximaHoraLibre(horariosHoy);
  const porcentajeLibre = totalHoras > 0 ? Math.round((libresHoy / totalHoras) * 100) : 0;

  return (
    <div className="vista-canchas__panel">
      <div className="vista-canchas__panel-info">
        <p className="vista-canchas__panel-nombre">{tituloCancha(cancha)}</p>
        <p className="vista-canchas__panel-precio">
          <Tag size={15} aria-hidden="true" />
          {formatoPrecio.format(cancha.precioHora)}
          <span className="vista-canchas__panel-unidad"> / hora</span>
        </p>
        <p className="vista-canchas__panel-disp">
          {libresHoy === 0 ? (
            'Sin horarios disponibles hoy'
          ) : (
            <>
              <strong>{libresHoy}</strong> de {totalHoras} horarios libres hoy
            </>
          )}
        </p>

        {proximoLibre ? (
          <>
            <div
              className="vista-canchas__ocupacion"
              role="img"
              aria-label={`${libresHoy} de ${totalHoras} horarios libres hoy`}
            >
              <div
                className="vista-canchas__ocupacion-barra"
                style={{ width: `${porcentajeLibre}%` }}
              />
            </div>
            <p className="vista-canchas__panel-proximo">
              Próximo libre: <strong>{proximoLibre}</strong>
            </p>
          </>
        ) : (
          <p className="vista-canchas__panel-proximo vista-canchas__panel-proximo--vacio">
            Sin horarios libres hoy
          </p>
        )}

        {cancha.caracteristicas && cancha.caracteristicas.length > 0 && (
          <ul className="vista-canchas__badges">
            {cancha.caracteristicas.map((c) => (
              <li key={c} className="vista-canchas__badge">
                {c}
              </li>
            ))}
          </ul>
        )}
      </div>
      <button
        type="button"
        className="button vista-canchas__panel-cta"
        disabled={!hayCuposSemana}
        onClick={onReservar}
      >
        {hayCuposSemana ? 'Reservar' : 'Sin disponibilidad'}
      </button>
    </div>
  );
}

function VistaCanchas() {
  const { deporteAbierto, cambiarDeporte, cerrarVista, restaurarFoco } = useVistaCanchas();
  const { canchas, dias, disponibilidad } = useReservas();

  // El componente sigue montado (para poder animar la salida) un instante
  // después de que `deporteAbierto` ya pasó a null.
  const [montado, setMontado] = useState(false);
  const [deporteMostrado, setDeporteMostrado] = useState(null);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [canchaActivaId, setCanchaActivaId] = useState(null);
  const [reservaAbierta, setReservaAbierta] = useState(false);

  const rootRef = useRef(null);
  const cerrarBtnRef = useRef(null);
  const salirRef = useRef(null);
  const montadoPrevioRef = useRef(false);

  useEffect(() => {
    if (deporteAbierto) {
      setDeporteMostrado(deporteAbierto);
      setMontado(true);
    }
  }, [deporteAbierto]);

  // Nuevo deporte -> se limpia el filtro y la selección de card.
  useEffect(() => {
    setSoloDisponibles(false);
    setCanchaActivaId(null);
  }, [deporteMostrado]);

  const infoDeporte = deporteMostrado ? deportePorSlug(deporteMostrado) : null;
  const acento = infoDeporte ? infoDeporte.colorAcento : '#1779ba';
  const acentoContraste = colorContraste(acento);

  const totalDelDeporte = deporteMostrado
    ? canchasDelDeporte(canchas, deporteMostrado).length
    : 0;

  const canchasFiltradas = useMemo(() => {
    if (!deporteMostrado) return [];
    const delDeporte = canchasDelDeporte(canchas, deporteMostrado);
    if (!soloDisponibles) return delDeporte;
    return delDeporte.filter((c) =>
      disponibilidad(c.id, dias[0]).some((h) => h.disponible)
    );
  }, [canchas, deporteMostrado, soloDisponibles, disponibilidad, dias]);

  // Si la selección explícita ya no está en la lista filtrada (cambio de
  // filtro o de pestaña), se cae de vuelta a la primera card visible.
  const canchaActiva =
    canchasFiltradas.find((c) => c.id === canchaActivaId) || canchasFiltradas[0] || null;

  // Animación de entrada/salida (fade + scale del contenedor, stagger de
  // pestañas y título). Respeta prefers-reduced-motion vía gsap.matchMedia().
  useEffect(() => {
    if (!montado) return undefined;
    const root = rootRef.current;

    const mm = gsap.matchMedia();
    mm.add(
      {
        normal: '(prefers-reduced-motion: no-preference)',
        reducida: '(prefers-reduced-motion: reduce)',
      },
      (ctx) => {
        const { normal } = ctx.conditions;
        const escala = normal ? 0.96 : 1;

        // Opacity en vez de autoAlpha: autoAlpha deja `visibility: hidden` un
        // instante al arrancar, y eso impide mover el foco al botón de cerrar
        // justo después (el efecto de foco corre en el mismo ciclo).
        gsap.set(root, { opacity: 0, scale: escala });
        gsap.to(root, {
          opacity: 1,
          scale: 1,
          duration: normal ? 0.4 : 0.15,
          ease: 'power2.out',
        });
        if (normal) {
          gsap.from('.vista-canchas__tabs .tabs-title, .vista-canchas__titulo', {
            opacity: 0,
            y: 16,
            duration: 0.35,
            stagger: 0.06,
            delay: 0.1,
            ease: 'power2.out',
          });
        }

        salirRef.current = (onDone) => {
          gsap.to(root, {
            opacity: 0,
            scale: escala,
            duration: normal ? 0.25 : 0.15,
            ease: 'power2.in',
            onComplete: onDone,
          });
        };
      },
      rootRef
    );

    return () => mm.revert();
  }, [montado]);

  // La vista se cerró (deporteAbierto -> null): anima la salida y, al
  // terminar, recién ahí desmonta.
  useEffect(() => {
    if (deporteAbierto || !montado) return;
    salirRef.current?.(() => setMontado(false));
  }, [deporteAbierto, montado]);

  // Foco al abrir (botón de cerrar) y de vuelta al hero cuando termina de
  // cerrarse del todo.
  useEffect(() => {
    if (montado && !montadoPrevioRef.current) {
      cerrarBtnRef.current?.focus();
    } else if (!montado && montadoPrevioRef.current) {
      restaurarFoco();
    }
    montadoPrevioRef.current = montado;
  }, [montado, restaurarFoco]);

  // Bloquea el scroll del body mientras está abierta, compensando el ancho
  // de la barra de scroll con padding-right para no disparar un resize que
  // recalcule los ScrollTrigger de los heros.
  useEffect(() => {
    if (!montado) return undefined;
    const anchoBarra = window.innerWidth - document.documentElement.clientWidth;
    const overflowPrevio = document.body.style.overflow;
    const paddingPrevio = document.body.style.paddingRight;
    document.body.style.overflow = 'hidden';
    if (anchoBarra > 0) {
      document.body.style.paddingRight = `${anchoBarra}px`;
    }
    return () => {
      document.body.style.overflow = overflowPrevio;
      document.body.style.paddingRight = paddingPrevio;
    };
  }, [montado]);

  // Escape cierra la vista, salvo que el modal de reserva esté abierto encima
  // (ese modal ya tiene su propio Escape; si no se frena aquí, un solo Escape
  // cerraría el modal Y la vista a la vez).
  useEffect(() => {
    if (!montado || reservaAbierta) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrarVista();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [montado, reservaAbierta, cerrarVista]);

  if (!montado) return null;

  const idFiltro = 'vista-canchas-filtro-hoy';

  const contenido = (
    <div
      className="vista-canchas"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vista-canchas-titulo"
      data-sport={deporteMostrado || undefined}
      style={{
        '--accent': acento,
        '--accent-soft': `color-mix(in srgb, ${acento} 25%, white)`,
        '--accent-contrast': acentoContraste,
      }}
    >
      <div className="vista-canchas__marco grid-container">
        <button
          type="button"
          className="vista-canchas__cerrar"
          aria-label="Cerrar vista de canchas"
          onClick={cerrarVista}
          ref={cerrarBtnRef}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <h2 id="vista-canchas-titulo" className="vista-canchas__titulo">
          Elige tu cancha
        </h2>

        <ul className="tabs vista-canchas__tabs" role="tablist" aria-label="Deporte">
          {DEPORTES.map((d) => (
            <li
              key={d.slug}
              className={'tabs-title' + (deporteMostrado === d.slug ? ' is-active' : '')}
              style={{ '--acento': d.colorAcento }}
            >
              <a
                href={`#canchas-${d.slug}`}
                role="tab"
                aria-selected={deporteMostrado === d.slug}
                onClick={(e) => {
                  e.preventDefault();
                  cambiarDeporte(d.slug);
                }}
              >
                {d.nombre}
              </a>
            </li>
          ))}
        </ul>

        <div className="vista-canchas__filtro">
          <div className="switch small">
            <input
              className="switch-input"
              id={idFiltro}
              type="checkbox"
              role="switch"
              checked={soloDisponibles}
              onChange={(e) => setSoloDisponibles(e.target.checked)}
            />
            <label className="switch-paddle" htmlFor={idFiltro}>
              <span className="show-for-sr">Solo disponibles hoy</span>
            </label>
          </div>
          <label htmlFor={idFiltro} className="vista-canchas__filtro-texto">
            Solo disponibles hoy
          </label>
        </div>

        <div className="vista-canchas__cuerpo">
          <div className="vista-canchas__escenario-fondo" aria-hidden="true">
            {canchaActiva && canchaActiva.imagen && (
              <div
                key={canchaActiva.id}
                className="vista-canchas__backdrop"
                style={{ backgroundImage: `url(${canchaActiva.imagen})` }}
              />
            )}
            <TexturaCancha deporte={deporteMostrado} />
          </div>

          {canchasFiltradas.length === 0 ? (
            <div className="vista-canchas__vacio">
              <p>
                Ninguna cancha de {infoDeporte ? infoDeporte.nombre.toLowerCase() : 'este deporte'}{' '}
                tiene horarios libres hoy.
              </p>
              {soloDisponibles && (
                <button
                  type="button"
                  className="button hollow small"
                  onClick={() => setSoloDisponibles(false)}
                >
                  Ver todas de todas formas
                </button>
              )}
            </div>
          ) : totalDelDeporte < MINIMO_PARA_CARRUSEL ? (
            <div className="vista-canchas__grid-estatico grid-x grid-padding-x align-center">
              {canchasFiltradas.map((c) => (
                <div key={c.id} className="cell small-12 medium-6 vista-canchas__grid-celda">
                  <button
                    type="button"
                    className={
                      'card cancha-card vista-canchas__card-estatica' +
                      (canchaActiva && canchaActiva.id === c.id
                        ? ' vista-canchas__card-estatica--activa'
                        : '')
                    }
                    aria-pressed={!!canchaActiva && canchaActiva.id === c.id}
                    onClick={() => setCanchaActivaId(c.id)}
                  >
                    <span className="vista-canchas__card-nombre">{tituloCancha(c)}</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <DepthCarousel
              key={deporteMostrado}
              items={canchasFiltradas.map((c) => ({
                id: c.id,
                image: imagenPlaceholderCancha(acento),
                alt: '',
              }))}
              cardWidth={240}
              cardHeight={300}
              radius={12}
              tint={acento}
              onChange={(_, item) => setCanchaActivaId(item.id)}
              renderOverlay={(item) => {
                const c = canchasFiltradas.find((x) => x.id === item.id);
                return c ? (
                  <div className="card cancha-card vista-canchas__card-overlay">
                    <span className="vista-canchas__card-nombre">{tituloCancha(c)}</span>
                  </div>
                ) : null;
              }}
            />
          )}
        </div>

        {canchaActiva && (
          <PanelDetalle
            cancha={canchaActiva}
            dias={dias}
            disponibilidad={disponibilidad}
            onReservar={() => setReservaAbierta(true)}
          />
        )}
      </div>

      <ReservaModal
        cancha={canchaActiva}
        abierto={reservaAbierta}
        onCerrar={() => setReservaAbierta(false)}
      />
    </div>
  );

  return createPortal(contenido, document.body);
}

export default VistaCanchas;

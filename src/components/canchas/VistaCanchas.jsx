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
  imagenGrandeCancha,
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

// Dimensiones reales de las fotos en public/img/canchas/ (720x893): se pasan
// como width/height del <img> para que el navegador reserve el espacio antes
// de que cargue y no haya salto de layout.
const ANCHO_IMAGEN = 720;
const ALTO_IMAGEN = 893;

// `sizes` del <img> del carrusel: la tarjeta activa mide hasta 451px de
// ancho real en pantallas anchas (min(88cqh, 560px) de alto por el aspect
// ratio 720/893); en pantallas angostas ronda la mitad del viewport. Sirve
// para que el navegador elija la foto de 720 o la de 1440 según densidad.
const TAMANOS_IMAGEN_CARRUSEL = '(max-width: 640px) 50vw, 451px';

// Texto alternativo de cada card del carrusel, ej. "Cancha 2 de vóley playa
// con iluminación nocturna" (nombre corto + deporte + primera característica).
function altCancha(cancha, infoDeporte) {
  const base = `${tituloCancha(cancha)} de ${infoDeporte ? infoDeporte.nombre.toLowerCase() : cancha.deporte}`;
  const rasgo = cancha.caracteristicas && cancha.caracteristicas[0];
  return rasgo ? `${base} con ${rasgo.toLowerCase()}` : base;
}

// Etiqueta accesible del botón que abre el visor en grande, ej. "Ver Cancha 2
// de vóley playa en grande".
function etiquetaVerGrande(cancha, infoDeporte) {
  const deporte = infoDeporte ? infoDeporte.nombre.toLowerCase() : cancha.deporte;
  return `Ver ${tituloCancha(cancha)} de ${deporte} en grande`;
}

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

/**
 * Visor a pantalla completa de la foto de la cancha activa del carrusel:
 * <dialog> nativo (showModal), sin librería de modales. Vive en este mismo
 * archivo por la misma razón que PanelDetalle: es un detalle de presentación
 * exclusivo de VistaCanchas, no se reutiliza en ningún otro sitio.
 *
 * `abierto` es la fuente de verdad (estado de VistaCanchas); el efecto solo
 * sincroniza el <dialog> nativo con ese estado. Al cerrarse por Esc, por el
 * botón o por clic en el fondo, el navegador dispara `close` (onClose), que
 * VistaCanchas usa para poner `visorAbierto` en false y así el guard de su
 * propio Escape (ver más abajo) deja de bloquearse.
 */
function VisorCancha({ cancha, infoDeporte, abierto, onCerrar, onReservar }) {
  const dialogRef = useRef(null);
  const reducidoRef = useRef(false);

  useEffect(() => {
    reducidoRef.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (abierto && !dlg.open) {
      dlg.showModal();
      if (!reducidoRef.current) {
        // Doble rAF: fuerza el estado "cerrado" (opacity/scale de partida) en
        // un frame ya pintado antes de quitar la clase, para que el navegador
        // tenga algo de qué transicionar (si se quitara en el mismo tick que
        // showModal(), no habría cambio de estilo que animar).
        dlg.classList.add('vista-canchas__visor--abriendo');
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            dlg.classList.remove('vista-canchas__visor--abriendo');
          });
        });
      }
    } else if (!abierto && dlg.open) {
      dlg.close();
    }
  }, [abierto]);

  if (!cancha) return null;

  const deporte = infoDeporte ? infoDeporte.nombre.toLowerCase() : cancha.deporte;
  const tituloId = `visor-cancha-titulo-${cancha.id}`;

  return (
    <dialog
      ref={dialogRef}
      className="vista-canchas__visor"
      aria-labelledby={tituloId}
      onClose={onCerrar}
      onClick={(e) => {
        if (e.target === dialogRef.current) onCerrar();
      }}
    >
      <div className="vista-canchas__visor-contenido">
        <button
          type="button"
          className="vista-canchas__visor-cerrar"
          aria-label="Cerrar imagen en grande"
          onClick={onCerrar}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="vista-canchas__visor-imagen-wrap">
          {/* Sin width/height: con ambos atributos, el navegador infiere un
              aspect-ratio implícito (para evitar salto de layout) que pisa el
              width/height: 100% + object-fit: contain de abajo y termina
              mostrando solo un recorte de la imagen. Aquí no hace falta esa
              reserva de espacio: el envoltorio ya tiene su propio tamaño y
              fondo (ver .vista-canchas__visor-imagen-wrap). */}
          <img
            className="vista-canchas__visor-imagen"
            src={imagenGrandeCancha(cancha.imagen)}
            alt={`${tituloCancha(cancha)} de ${deporte}`}
          />
        </div>

        <div className="vista-canchas__visor-info">
          <h3 id={tituloId} className="vista-canchas__visor-nombre">
            {tituloCancha(cancha)}
          </h3>
          <p className="vista-canchas__visor-precio">
            {formatoPrecio.format(cancha.precioHora)}
            <span className="vista-canchas__panel-unidad"> / hora</span>
          </p>
          {cancha.caracteristicas && cancha.caracteristicas.length > 0 && (
            <ul className="vista-canchas__badges">
              {cancha.caracteristicas.map((c) => (
                <li key={c} className="vista-canchas__badge">
                  {c}
                </li>
              ))}
            </ul>
          )}
          <button type="button" className="button vista-canchas__visor-cta" onClick={onReservar}>
            Reservar
          </button>
        </div>
      </div>
    </dialog>
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
  const [visorAbierto, setVisorAbierto] = useState(false);

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

  // Nuevo deporte -> se limpia el filtro, la selección de card y el visor.
  useEffect(() => {
    setSoloDisponibles(false);
    setCanchaActivaId(null);
    setVisorAbierto(false);
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

  // Precarga la foto en grande de la cancha activa así el visor no tiene que
  // esperar a que cargue cuando el usuario haga clic para abrirlo.
  useEffect(() => {
    if (!canchaActiva || !canchaActiva.imagen) return;
    const img = new Image();
    img.src = imagenGrandeCancha(canchaActiva.imagen);
  }, [canchaActiva]);

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

  // Escape cierra la vista, salvo que el modal de reserva o el visor en
  // grande estén abiertos encima (ambos manejan su propio Escape: el modal
  // de reserva con este mismo patrón de window keydown, el visor de forma
  // nativa vía <dialog>. Si no se frena aquí, un solo Escape cerraría eso Y
  // la vista a la vez, porque ninguno de los dos detiene la propagación del
  // keydown hacia este listener de window).
  useEffect(() => {
    if (!montado || reservaAbierta || visorAbierto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrarVista();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [montado, reservaAbierta, visorAbierto, cerrarVista]);

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
              items={canchasFiltradas.map((c) => {
                const degradado = imagenPlaceholderCancha(acento);
                return c.imagen
                  ? {
                      id: c.id,
                      image: c.imagen,
                      srcSet: `${c.imagen} 720w, ${imagenGrandeCancha(c.imagen)} 1440w`,
                      sizes: TAMANOS_IMAGEN_CARRUSEL,
                      fallback: degradado,
                      width: ANCHO_IMAGEN,
                      height: ALTO_IMAGEN,
                      alt: altCancha(c, infoDeporte),
                      viewable: true,
                    }
                  : { id: c.id, image: degradado, alt: '' };
              })}
              cardWidth={240}
              cardHeight={300}
              radius={12}
              tint={acento}
              // Tarjetas laterales más discretas ahora que la activa es
              // mucho más grande (container query en VistaCanchas.css):
              // falloff 0.2->0.32 y blur 6->10 (oscurecen/desenfocan más
              // rápido según la distancia a la activa) y visibleCards 4->3
              // (menos tarjetas compitiendo a la vez). No se toca `spread`:
              // ese valor entra también en el cálculo de escala de
              // DepthCarousel para que el carrusel quepa en el ancho
              // disponible (ver ResizeObserver en DepthCarousel.jsx), y
              // subirlo fuerza ESE cálculo a achicar la tarjeta activa en
              // pantallas angostas, justo el efecto contrario al buscado.
              falloff={0.32}
              blur={10}
              visibleCards={3}
              onChange={(_, item) => setCanchaActivaId(item.id)}
              onOpenViewer={() => setVisorAbierto(true)}
              getViewerLabel={(item) => {
                const c = canchasFiltradas.find((x) => x.id === item.id);
                return c ? etiquetaVerGrande(c, infoDeporte) : 'Ver imagen en grande';
              }}
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

      <VisorCancha
        cancha={canchaActiva}
        infoDeporte={infoDeporte}
        abierto={visorAbierto}
        onCerrar={() => setVisorAbierto(false)}
        onReservar={() => {
          setVisorAbierto(false);
          setReservaAbierta(true);
        }}
      />
    </div>
  );

  return createPortal(contenido, document.body);
}

export default VistaCanchas;

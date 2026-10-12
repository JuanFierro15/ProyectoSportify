import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { X } from 'lucide-react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { useReservas } from '../../context/ReservasContext';
import { DEPORTES, deportePorSlug } from '../../data/deportes';
import {
  canchasDelDeporte,
  tituloCancha,
  imagenPlaceholderCancha,
  imagenGrandeCancha,
  estiloAcento,
} from '../../lib/canchas';
import { formatoPrecio } from '../../lib/precios';
import { fechaCompleta } from '../../lib/fechas';
import DepthCarousel from '../reactbits/DepthCarousel';
import useReserva from '../reservas/useReserva';
import SelectorModo from '../reservas/SelectorModo';
import CanchasElegidas from '../reservas/CanchasElegidas';
import FormularioReserva from '../reservas/FormularioReserva';
import VoucherReserva from '../reservas/VoucherReserva';
import ConfirmacionReserva from '../reservas/ConfirmacionReserva';
import TarjetaCanchaCarrusel from '../reservas/TarjetaCanchaCarrusel';
import TexturaCancha from './TexturaCancha';
import './VistaCanchas.css';

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

// Título del visor con el deporte, ej. "Cancha 3 · Fútbol".
function tituloConDeporte(cancha, infoDeporte) {
  return infoDeporte ? `${tituloCancha(cancha)} · ${infoDeporte.nombre}` : tituloCancha(cancha);
}

function VisorCancha({
  cancha,
  infoDeporte,
  acento,
  abierto,
  onCerrar,
  textoAccion,
  onAccion,
}) {
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
      data-sport={infoDeporte ? infoDeporte.slug : undefined}
      style={estiloAcento(acento)}
      aria-labelledby={tituloId}
      onClose={onCerrar}
      onClick={(e) => {
        if (!e.target.closest('.vista-canchas__visor-imagen-wrap, .vista-canchas__visor-info')) {
          onCerrar();
        }
      }}
    >
      <div className="vista-canchas__visor-contenido">
        <div
          className="vista-canchas__visor-fondo"
          aria-hidden="true"
          style={cancha.imagen ? { backgroundImage: `url(${cancha.imagen})` } : undefined}
        />

        <button
          type="button"
          className="vista-canchas__visor-cerrar"
          aria-label="Cerrar imagen en grande"
          onClick={onCerrar}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="vista-canchas__visor-imagen-wrap">
          <img
            className="vista-canchas__visor-imagen"
            src={imagenGrandeCancha(cancha.imagen)}
            alt={`${tituloCancha(cancha)} de ${deporte}`}
          />
        </div>

        <div className="vista-canchas__visor-info">
          <h3 id={tituloId} className="vista-canchas__visor-nombre">
            {tituloConDeporte(cancha, infoDeporte)}
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
          <button type="button" className="button vista-canchas__visor-cta" onClick={onAccion}>
            {textoAccion}
          </button>
        </div>
      </div>
    </dialog>
  );
}

function VistaCanchas() {
  const { deporteAbierto, modoInicial, cambiarDeporte, cerrarVista, restaurarFoco } = useVistaCanchas();
  const { canchas, dias, disponibilidad } = useReservas();

  // El componente sigue montado (para poder animar la salida) un instante
  // después de que `deporteAbierto` ya pasó a null.
  const [montado, setMontado] = useState(false);
  const [deporteMostrado, setDeporteMostrado] = useState(null);
  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [canchaActivaId, setCanchaActivaId] = useState(null);
  const [visorAbierto, setVisorAbierto] = useState(false);

  const reserva = useReserva({
    activo: montado,
    modoInicial,
    canchaInicial: deporteMostrado ? canchasDelDeporte(canchas, deporteMostrado)[0] || null : null,
  });

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

  const totalDelDeporte = deporteMostrado
    ? canchasDelDeporte(canchas, deporteMostrado).length
    : 0;

  const canchasFiltradas = useMemo(() => {
    if (!deporteMostrado) return [];
    const delDeporte = canchasDelDeporte(canchas, deporteMostrado);
    if (!soloDisponibles) return delDeporte;
    return delDeporte.filter((c) =>
      disponibilidad(c.id, reserva.fecha).some((h) => h.disponible)
    );
  }, [canchas, deporteMostrado, soloDisponibles, disponibilidad, reserva.fecha]);

  const idActivaPorDefecto = reserva.esEvento
    ? reserva.canchaIds.find((id) => canchasFiltradas.some((c) => c.id === id))
    : reserva.canchaSel && reserva.canchaSel.id;
  const canchaActiva =
    canchasFiltradas.find((c) => c.id === canchaActivaId) ||
    canchasFiltradas.find((c) => c.id === idActivaPorDefecto) ||
    canchasFiltradas[0] ||
    null;

  useEffect(() => {
    setCanchaActivaId(null);
  }, [reserva.esEvento]);

  // Modo cancha: la cancha elegida siempre es una de la pestaña visible. Si
  // no lo es (se volvió de un evento con canchas de otro deporte, el filtro
  // la ocultó, o la vista se reabrió con el estado de la sesión anterior),
  // se elige la primera de la pestaña: manda la pestaña que el usuario mira.
  const { modo: modoReserva, canchaSel: canchaReserva, elegirCancha } = reserva;
  useEffect(() => {
    if (!montado || modoReserva !== 'cancha' || !canchasFiltradas[0]) return;
    if (!canchaReserva || !canchasFiltradas.some((c) => c.id === canchaReserva.id)) {
      elegirCancha(canchasFiltradas[0].id);
    }
  }, [montado, modoReserva, canchaReserva, canchasFiltradas, elegirCancha]);

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

  // El scroll de la PÁGINA ya queda bloqueado arriba mientras la vista está
  // montada, pero `.vista-canchas` (este contenedor, `rootRef`) tiene su
  // propio `overflow-y: auto` -- es el que de verdad hace scroll detrás del
  // visor -- así que con el visor abierto se bloquea también a él, con el
  // mismo truco de compensar el ancho de su propia barra con padding-right
  // para que no haya salto de layout al aparecer/desaparecer. No se toca
  // `scrollTop`: al volver a poner `overflow: auto` el navegador conserva la
  // posición de scroll tal como estaba.
  useEffect(() => {
    if (!visorAbierto) return undefined;
    const el = rootRef.current;
    if (!el) return undefined;
    const anchoBarra = el.offsetWidth - el.clientWidth;
    const overflowPrevio = el.style.overflow;
    const paddingPrevio = el.style.paddingRight;
    el.style.overflow = 'hidden';
    if (anchoBarra > 0) {
      el.style.paddingRight = `${anchoBarra}px`;
    }
    return () => {
      el.style.overflow = overflowPrevio;
      el.style.paddingRight = paddingPrevio;
    };
  }, [visorAbierto]);

  // Escape cierra la vista, salvo que el visor en grande esté abierto encima.
  useEffect(() => {
    if (!montado || visorAbierto) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') cerrarVista();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [montado, visorAbierto, cerrarVista]);

  if (!montado) return null;

  const idFiltro = 'vista-canchas-filtro-libres';

  const contenido = (
    <div
      className="vista-canchas"
      ref={rootRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="vista-canchas-titulo"
      data-sport={deporteMostrado || undefined}
      style={estiloAcento(acento)}
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
          {reserva.modoInfo.titulo}
        </h2>

        {!reserva.confirmado && (
          <div className="vista-canchas__modo">
            <SelectorModo modo={reserva.modo} onCambiar={reserva.cambiarModo} />
          </div>
        )}

        {reserva.confirmado ? (
          <div className="vista-canchas__confirmacion">
            <ConfirmacionReserva
              codigo={reserva.confirmado.codigo}
              textoQr={reserva.confirmado.textoQr}
              resumen={reserva.confirmado.resumen}
              onListo={cerrarVista}
            />
          </div>
        ) : (
          <>
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
                      if (reserva.modo === 'cancha') {
                        reserva.elegirCancha((canchasDelDeporte(canchas, d.slug)[0] || {}).id || null);
                      }
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
                  <span className="show-for-sr">Solo con horarios libres ese día</span>
                </label>
              </div>
              <label htmlFor={idFiltro} className="vista-canchas__filtro-texto">
                Solo con horarios libres ese día
              </label>
            </div>

            <div className="vista-canchas__reserva">
              <div className="vista-canchas__principal">
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
                        tiene horarios libres ese día.
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
                      {canchasFiltradas.map((c) => {
                        const esActiva = reserva.esEvento
                          ? reserva.canchaIds.includes(c.id)
                          : !!reserva.canchaSel && reserva.canchaSel.id === c.id;
                        return (
                          <div key={c.id} className="cell small-12 medium-6 vista-canchas__grid-celda">
                            <button
                              type="button"
                              className={
                                'card cancha-card vista-canchas__card-estatica' +
                                (esActiva ? ' vista-canchas__card-estatica--activa' : '')
                              }
                              aria-pressed={esActiva}
                              onClick={() => {
                                if (reserva.esEvento) {
                                  reserva.alternarCancha(c.id);
                                } else {
                                  setCanchaActivaId(c.id);
                                  reserva.elegirCancha(c.id);
                                }
                              }}
                            >
                              <span className="vista-canchas__card-nombre">{tituloCancha(c)}</span>
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <DepthCarousel
                      key={`${deporteMostrado}-${reserva.esEvento ? 'evento' : 'cancha'}`}
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
                      initialIndex={Math.max(
                        0,
                        canchasFiltradas.findIndex((c) => canchaActiva && c.id === canchaActiva.id)
                      )}
                      cardWidth={240}
                      cardHeight={300}
                      radius={12}
                      tint={acento}
                      falloff={0.32}
                      blur={10}
                      visibleCards={3}
                      ariaLabel="Canchas"
                      prevLabel="Cancha anterior"
                      nextLabel="Cancha siguiente"
                      getSlideLabel={(i, n) => `Cancha ${i + 1} de ${n}`}
                      getDotLabel={(i) => `Ir a la cancha ${i + 1}`}
                      onChange={(_, item) => {
                        setCanchaActivaId(item.id);
                        if (!reserva.esEvento) reserva.elegirCancha(item.id);
                      }}
                      onOpenViewer={() => setVisorAbierto(true)}
                      getViewerLabel={(item) => {
                        const c = canchasFiltradas.find((x) => x.id === item.id);
                        return c ? etiquetaVerGrande(c, infoDeporte) : 'Ver imagen en grande';
                      }}
                      renderOverlay={(item, i, esActiva) => {
                        const c = canchasFiltradas.find((x) => x.id === item.id);
                        if (!c) return null;
                        const horarios = disponibilidad(c.id, reserva.fecha);
                        return (
                          <TarjetaCanchaCarrusel
                            cancha={c}
                            deporte={deportePorSlug(c.deporte)}
                            modo={reserva.esEvento ? 'evento' : 'cancha'}
                            activa={esActiva}
                            marcada={reserva.esEvento ? reserva.canchaIds.includes(c.id) : false}
                            libresDia={horarios.filter((h) => h.disponible).length}
                            totalDia={horarios.length}
                            onAlternar={() => reserva.alternarCancha(c.id)}
                          />
                        );
                      }}
                    />
                  )}
                </div>

                {reserva.esEvento && (
                  <CanchasElegidas
                    canchas={reserva.canchasElegidas}
                    deporte={infoDeporte}
                    idsDeporte={canchasDelDeporte(canchas, deporteMostrado).map((c) => c.id)}
                    onQuitar={reserva.alternarCancha}
                    onAlternarDeporte={reserva.alternarDeporte}
                  />
                )}

                <FormularioReserva reserva={reserva} dias={dias} />
              </div>

              <VoucherReserva
                tipoEtiqueta={reserva.modoInfo.tipoEtiqueta}
                fechaTexto={fechaCompleta(reserva.fecha)}
                horas={reserva.horasSel}
                precio={reserva.precio}
                puedeConfirmar={reserva.puedeConfirmar}
                motivoBloqueo={reserva.motivoBloqueo}
                onConfirmar={reserva.confirmar}
                onCancelar={cerrarVista}
              />
            </div>
          </>
        )}
      </div>

      {canchaActiva && (
        <VisorCancha
          cancha={canchaActiva}
          infoDeporte={infoDeporte}
          acento={acento}
          abierto={visorAbierto}
          onCerrar={() => setVisorAbierto(false)}
          textoAccion={
            reserva.esEvento
              ? reserva.canchaIds.includes(canchaActiva.id)
                ? 'Quitar del evento'
                : 'Agregar al evento'
              : 'Elegir horario'
          }
          onAccion={() => {
            if (reserva.esEvento) {
              reserva.alternarCancha(canchaActiva.id);
              setVisorAbierto(false);
            } else {
              setVisorAbierto(false);
              reserva.elegirCancha(canchaActiva.id);
              requestAnimationFrame(() => {
                document.getElementById('reserva-horario')?.scrollIntoView({
                  behavior: 'smooth',
                  block: 'start',
                });
              });
            }
          }}
        />
      )}
    </div>
  );

  return createPortal(contenido, document.body);
}

export default VistaCanchas;

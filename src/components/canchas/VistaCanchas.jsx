import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ArrowLeft, X } from 'lucide-react';
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
import { formatoPrecio, MAX_HORAS_SEGUIDAS } from '../../lib/precios';
import { MAX_CANCHAS_TORNEO } from '../../lib/torneo';
import { fechaCompleta } from '../../lib/fechas';
import { esClicNormal, rutaReserva } from '../../lib/rutas';
import DepthCarousel from '../reactbits/DepthCarousel';
import useReserva from '../reservas/useReserva';
import SelectorModo from '../reservas/SelectorModo';
import CanchasElegidas from '../reservas/CanchasElegidas';
import FormularioReserva from '../reservas/FormularioReserva';
import VoucherReserva from '../reservas/VoucherReserva';
import ConfirmacionReserva from '../reservas/ConfirmacionReserva';
import TarjetaCanchaCarrusel from '../reservas/TarjetaCanchaCarrusel';
import IndicadorPasos from '../reservas/torneo/IndicadorPasos';
import SeccionLlaves from '../reservas/torneo/SeccionLlaves';
import AsistenteTorneo from '../reservas/torneo/AsistenteTorneo';
import useAsistenteTorneo from '../reservas/torneo/useAsistenteTorneo';
import './VistaCanchas.css';

// Por debajo de este número de canchas, el carrusel 3D no aporta nada (y se
// ve vacío): se usa un grid estático centrado en su lugar.
const MINIMO_PARA_CARRUSEL = 3;

// Subtítulos del encabezado de la página de reserva según el modo activo
const SUBTITULOS = {
  cancha: `Elige la cancha, el día y hasta ${MAX_HORAS_SEGUIDAS} horas seguidas.`,
  torneo: `Elige hasta ${MAX_CANCHAS_TORNEO} canchas de un deporte, el formato y la fecha de cada fase.`,
  cumpleanos: 'Elige las canchas, el día, el horario y cuántos invitados vienen.',
};

// Dimensiones reales de las fotos en public/img/canchas/ (720x893): se pasan
// como width/height del <img> para que el navegador reserve el espacio antes
// de que cargue y no haya salto de layout.
const ANCHO_IMAGEN = 720;
const ALTO_IMAGEN = 893;

// `sizes` del <img> del carrusel: la tarjeta activa mide hasta 612px de
// ancho real en pantallas anchas (760px de alto como máximo por el aspect
// ratio 720/893); en celular ronda el 82 % del ancho del viewport. Sirve
// para que el navegador elija la foto de 720 o la de 1440 según densidad.
const TAMANOS_IMAGEN_CARRUSEL = '(max-width: 639px) 82vw, 612px';

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
          {cancha.descripcion && (
            <p className="vista-canchas__visor-descripcion">{cancha.descripcion}</p>
          )}
          <button type="button" className="button vista-canchas__visor-cta" onClick={onAccion}>
            {textoAccion}
          </button>
        </div>
      </div>
    </dialog>
  );
}

// Página de reserva (`/reservar/<deporte>`): selector de modo, pestañas por
// deporte, carrusel 3D de canchas con visor a pantalla completa, formulario
// de fecha/horario/contacto y voucher lateral.
function VistaCanchas() {
  const { deporteAbierto, modoInicial, cambiarDeporte, actualizarModo, cerrarVista } =
    useVistaCanchas();
  const { canchas, dias, disponibilidad } = useReservas();

  const [soloDisponibles, setSoloDisponibles] = useState(false);
  const [canchaActivaId, setCanchaActivaId] = useState(null);
  const [visorAbierto, setVisorAbierto] = useState(false);

  const reserva = useReserva({
    activo: true,
    modoInicial,
    canchaInicial: deporteAbierto ? canchasDelDeporte(canchas, deporteAbierto)[0] || null : null,
  });

  const asistente = useAsistenteTorneo({ reserva });
  const esAsistenteMovil = reserva.modo === 'torneo' && asistente.esMovil;

  const rootRef = useRef(null);
  const tituloRef = useRef(null);
  const tabsRef = useRef([]);

  const activarPestanaDeporte = (slug, enfocar = false) => {
    if (reserva.modo === 'cancha') {
      reserva.elegirCancha(
        (canchasDelDeporte(canchas, slug)[0] || {}).id || null
      );
    }
    cambiarDeporte(slug);
    if (enfocar) {
      const idx = DEPORTES.findIndex((dep) => dep.slug === slug);
      if (idx !== -1) {
        tabsRef.current[idx]?.focus();
      }
    }
  };

  const manejarTecladoPestana = (e, idxActual) => {
    const total = DEPORTES.length;
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
      activarPestanaDeporte(DEPORTES[nuevoIdx].slug, true);
    }
  };

  // Al entrar a la página se coloca el scroll arriba antes del primer pintado.
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Restaura el título original del documento al salir de la página de reserva.
  useEffect(() => {
    const tituloPrevio = document.title;
    return () => {
      document.title = tituloPrevio;
    };
  }, []);

  useEffect(() => {
    document.title = `${reserva.modoInfo.titulo} · Sportify`;
  }, [reserva.modoInfo.titulo]);

  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    actualizarModo(reserva.modo);
  }, [reserva.modo, actualizarModo]);

  // Nuevo deporte -> se limpia el filtro, la selección de card y el visor.
  useEffect(() => {
    setSoloDisponibles(false);
    setCanchaActivaId(null);
    setVisorAbierto(false);
  }, [deporteAbierto]);

  const infoDeporte = deporteAbierto ? deportePorSlug(deporteAbierto) : null;
  const acento = infoDeporte ? infoDeporte.colorAcento : '#1779ba';

  const totalDelDeporte = deporteAbierto
    ? canchasDelDeporte(canchas, deporteAbierto).length
    : 0;

  const canchasFiltradas = useMemo(() => {
    if (!deporteAbierto) return [];
    const delDeporte = canchasDelDeporte(canchas, deporteAbierto);
    if (!soloDisponibles) return delDeporte;
    return delDeporte.filter((c) =>
      disponibilidad(c.id, reserva.fecha).some((h) => h.disponible)
    );
  }, [canchas, deporteAbierto, soloDisponibles, disponibilidad, reserva.fecha]);

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
  // no lo es (se volvió de un evento con canchas de otro deporte o el filtro
  // la ocultó), se elige la primera de la pestaña: manda la pestaña activa.
  const { modo: modoReserva, canchaSel: canchaReserva, elegirCancha } = reserva;
  useEffect(() => {
    if (modoReserva !== 'cancha' || !canchasFiltradas[0]) return;
    if (!canchaReserva || !canchasFiltradas.some((c) => c.id === canchaReserva.id)) {
      elegirCancha(canchasFiltradas[0].id);
    }
  }, [modoReserva, canchaReserva, canchasFiltradas, elegirCancha]);

  // Precarga la foto en grande de la cancha activa así el visor no tiene que
  // esperar a que cargue cuando el usuario haga clic para abrirlo.
  useEffect(() => {
    if (!canchaActiva || !canchaActiva.imagen) return;
    const img = new Image();
    img.src = imagenGrandeCancha(canchaActiva.imagen);
  }, [canchaActiva]);

  // Animación de entrada del marco, las pestañas y el título (solo si no se
  // prefiere movimiento reducido).
  useEffect(() => {
    const mm = gsap.matchMedia();
    mm.add(
      '(prefers-reduced-motion: no-preference)',
      () => {
        gsap.fromTo(
          '.vista-canchas__marco',
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out' }
        );
        gsap.from('.vista-canchas__tabs .tabs-title, .vista-canchas__titulo', {
          opacity: 0,
          y: 16,
          duration: 0.35,
          stagger: 0.06,
          delay: 0.05,
          ease: 'power2.out',
        });
      },
      rootRef
    );

    return () => mm.revert();
  }, []);

  // Al confirmar la reserva se sube al tope para que se vea el comprobante con QR.
  useEffect(() => {
    if (reserva.confirmado) {
      window.scrollTo({ top: 0 });
    }
  }, [reserva.confirmado]);

  // Con el visor (<dialog> modal) abierto se bloquea el scroll del documento
  // compensando el ancho de la barra con padding-right para que no haya salto.
  useEffect(() => {
    if (!visorAbierto) return undefined;
    const html = document.documentElement;
    const anchoBarra = window.innerWidth - html.clientWidth;
    const overflowPrevio = html.style.overflow;
    const paddingPrevio = html.style.paddingRight;
    html.style.overflow = 'hidden';
    if (anchoBarra > 0) {
      html.style.paddingRight = `${anchoBarra}px`;
    }
    return () => {
      html.style.overflow = overflowPrevio;
      html.style.paddingRight = paddingPrevio;
    };
  }, [visorAbierto]);

  const idFiltro = 'vista-canchas-filtro-libres';

  const canchaEncabezado =
    canchaActiva ||
    canchasDelDeporte(canchas, deporteAbierto)[0] ||
    null;
  const fotoEncabezado = canchaEncabezado?.imagen
    ? imagenGrandeCancha(canchaEncabezado.imagen)
    : null;

  const renderBloqueCanchas = () => (
    <>
      <div className="vista-canchas__cuerpo">
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
              const motivoGrid = reserva.esEvento ? reserva.motivoNoAgregable(c.id) : null;
              return (
                <div key={c.id} className="cell small-12 medium-6 vista-canchas__grid-celda">
                  <button
                    type="button"
                    disabled={reserva.esEvento && motivoGrid !== null}
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
                    {reserva.esEvento && motivoGrid !== null && (
                      <small className="vista-canchas__card-motivo">{motivoGrid}</small>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <DepthCarousel
            key={`${deporteAbierto}-${reserva.esEvento ? 'evento' : 'cancha'}`}
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
            cardWidth={420}
            cardHeight={520}
            radius={16}
            spread={140}
            tint={acento}
            falloff={0.18}
            blur={3}
            visibleCards={3}
            autoScale={false}
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
                  motivoBloqueo={reserva.motivoNoAgregable(c.id)}
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
          idsDeporte={canchasDelDeporte(canchas, deporteAbierto).map((c) => c.id)}
          bloqueadoTodas={reserva.deporteBloqueado(deporteAbierto)}
          onQuitar={reserva.alternarCancha}
          onAlternarDeporte={reserva.alternarDeporte}
        />
      )}
    </>
  );

  return (
    <main
      className="vista-canchas"
      ref={rootRef}
      data-sport={deporteAbierto || undefined}
      style={estiloAcento(acento)}
    >
      <section
        className={
          'vista-canchas__encabezado' +
          (reserva.modo === 'torneo' ? ' vista-canchas__encabezado--torneo' : '')
        }
      >
        {fotoEncabezado && (
          <img
            src={fotoEncabezado}
            alt=""
            aria-hidden="true"
            className="vista-canchas__encabezado-img"
          />
        )}
        <div className="vista-canchas__encabezado-velo" aria-hidden="true" />
        <div className="vista-canchas__encabezado-contenido grid-container">
          <a
            href="/"
            className="vista-canchas__volver"
            onClick={(e) => {
              if (esClicNormal(e)) {
                e.preventDefault();
                cerrarVista();
              }
            }}
          >
            <ArrowLeft size={18} aria-hidden="true" /> Volver al inicio
          </a>

          <h1
            id="vista-canchas-titulo"
            className="vista-canchas__titulo"
            tabIndex={-1}
            ref={tituloRef}
          >
            {reserva.modoInfo.titulo}
          </h1>

          <p className="vista-canchas__subtitulo">
            {SUBTITULOS[reserva.modo] || SUBTITULOS.cancha}
          </p>

          {!reserva.confirmado && (
            <div className="vista-canchas__modo">
              <SelectorModo modo={reserva.modo} onCambiar={reserva.cambiarModo} />
            </div>
          )}
        </div>
      </section>

      <div className="vista-canchas__marco grid-container">
        {reserva.confirmado ? (
          <div className={'vista-canchas__confirmacion' + (reserva.confirmado?.resumen?.torneo ? ' vista-canchas__confirmacion--torneo' : '')}>
            <ConfirmacionReserva
              codigo={reserva.confirmado.codigo}
              textoQr={reserva.confirmado.textoQr}
              resumen={reserva.confirmado.resumen}
              onListo={cerrarVista}
            />
          </div>
        ) : (
          <>
            {(!esAsistenteMovil || asistente.pasoActual === 'canchas') && (
              <div className="vista-canchas__cabecera-deportes">
                <ul className="tabs vista-canchas__tabs" role="tablist" aria-label="Deporte">
                  {DEPORTES.map((d, idx) => {
                    const esActiva = deporteAbierto === d.slug;
                    return (
                      <li
                        key={d.slug}
                        role="presentation"
                        className={'tabs-title' + (esActiva ? ' is-active' : '')}
                        style={{ '--acento': d.colorAcento }}
                      >
                        <a
                          ref={(el) => {
                            tabsRef.current[idx] = el;
                          }}
                          href={rutaReserva(d.slug, reserva.modo)}
                          role="tab"
                          aria-selected={esActiva}
                          tabIndex={esActiva ? 0 : -1}
                          onClick={(e) => {
                            if (esClicNormal(e)) {
                              e.preventDefault();
                              activarPestanaDeporte(d.slug);
                            }
                          }}
                          onKeyDown={(e) => manejarTecladoPestana(e, idx)}
                        >
                          {d.nombre}
                        </a>
                      </li>
                    );
                  })}
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
              </div>
            )}

            <div className="vista-canchas__reserva">
              {esAsistenteMovil ? (
                <AsistenteTorneo
                  reserva={reserva}
                  dias={dias}
                  canchas={canchas}
                  asistente={asistente}
                  renderCanchas={renderBloqueCanchas}
                />
              ) : (
                <>
                  <div className="vista-canchas__fila-reserva">
                    <div className="vista-canchas__principal">
                      {reserva.modo === 'torneo' && <IndicadorPasos reserva={reserva} />}

                      {renderBloqueCanchas()}

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
                      onCancelar={reserva.reiniciar}
                      torneo={reserva.modo === 'torneo' ? reserva.torneoPlan : null}
                      invitados={reserva.modo === 'cumpleanos' ? reserva.invitados : null}
                    />
                  </div>

                  {reserva.modo === 'torneo' && (
                    <SeccionLlaves reserva={reserva} canchas={canchas} />
                  )}
                </>
              )}
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
              ? reserva.motivoNoAgregable(canchaActiva.id) ||
                (reserva.canchaIds.includes(canchaActiva.id)
                  ? 'Quitar del evento'
                  : 'Agregar al evento')
              : 'Elegir horario'
          }
          onAccion={() => {
            if (reserva.esEvento) {
              if (!reserva.motivoNoAgregable(canchaActiva.id)) {
                reserva.alternarCancha(canchaActiva.id);
              }
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
    </main>
  );
}

export default VistaCanchas;

import React, { useEffect, useRef } from 'react';
import IndicadorPasos from './IndicadorPasos';
import FormularioReserva from '../FormularioReserva';
import VoucherReserva from '../VoucherReserva';
import SeccionLlaves from './SeccionLlaves';
import useAsistenteTorneo from './useAsistenteTorneo';
import { fechaCompleta } from '../../../lib/fechas';
import './AsistenteTorneo.css';

/**
 * Asistente por pasos del modo torneo en móvil (< 64em).
 *
 * Muestra un paso a la vez (S3):
 * 1. canchas: carrusel y canchas elegidas
 * 2. formato: cantidad de equipos, duración y desempate
 * 3. fechas: fechas y horarios por fase (CalendarioTorneo)
 * 4. llaves: emparejamiento y visualización de llaves
 * 5. datos: nombre y teléfono
 * 6. resumen: voucher de confirmación y torneos reservados
 */
export function AsistenteTorneo({
  reserva,
  dias,
  canchas = [],
  renderCanchas,
  asistente: asistenteProp,
}) {
  const hookAsistente = useAsistenteTorneo({ reserva });
  const a = asistenteProp || hookAsistente;
  const barraRef = useRef(null);

  // Publica el alto de la barra fija para que el botón del chat se ubique
  // encima de ella en lugar de tapar "Siguiente".
  useEffect(() => {
    const barra = barraRef.current;
    if (!barra) return undefined;
    const raiz = document.documentElement;
    const publicar = () => {
      raiz.style.setProperty('--alto-barra-inferior', `${barra.offsetHeight}px`);
    };
    publicar();
    const observador =
      typeof ResizeObserver === 'function' ? new ResizeObserver(publicar) : null;
    if (observador) observador.observe(barra);
    return () => {
      if (observador) observador.disconnect();
      raiz.style.removeProperty('--alto-barra-inferior');
    };
  }, []);

  if (!reserva || reserva.modo !== 'torneo') return null;

  return (
    <div className="asistente-torneo" data-testid="asistente-torneo">
      {/* Encabezado del paso */}
      <div className="asistente-torneo__cabecera">
        <h2
          ref={a.encabezadoRef}
          tabIndex={-1}
          className="asistente-torneo__titulo-paso"
        >
          {a.pasoActualInfo?.etiqueta}
        </h2>
        <span className="asistente-torneo__badge-paso">
          Paso {a.numeroPaso} de {a.totalPasos}
        </span>
      </div>

      {/* Indicador de pasos interactivo */}
      <IndicadorPasos
        reserva={reserva}
        pasoActual={a.pasoActual}
        onSeleccionarPaso={a.irA}
        pasosAlcanzables={a.alcanzables}
        seisPasos
      />

      {/* Contenido del paso activo */}
      <div className="asistente-torneo__paso-contenido">
        {a.pasoActual === 'canchas' && (
          <div data-testid="paso-canchas">
            {renderCanchas ? renderCanchas() : null}
          </div>
        )}

        {a.pasoActual === 'formato' && (
          <div data-testid="paso-formato">
            <FormularioReserva reserva={reserva} dias={dias} seccion="formato" />
          </div>
        )}

        {a.pasoActual === 'fechas' && (
          <div data-testid="paso-fechas">
            <FormularioReserva reserva={reserva} dias={dias} seccion="fechas" />
          </div>
        )}

        {a.pasoActual === 'llaves' && (
          <div data-testid="paso-llaves">
            <FormularioReserva reserva={reserva} dias={dias} seccion="llaves" />
            <SeccionLlaves reserva={reserva} canchas={canchas} />
          </div>
        )}

        {a.pasoActual === 'datos' && (
          <div data-testid="paso-datos">
            <FormularioReserva reserva={reserva} dias={dias} seccion="datos" />
          </div>
        )}

        {a.pasoActual === 'resumen' && (
          <div data-testid="paso-resumen">
            <VoucherReserva
              tipoEtiqueta={reserva.modoInfo?.tipoEtiqueta}
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
            <FormularioReserva reserva={reserva} dias={dias} seccion="guardados" />
          </div>
        )}
      </div>

      {/* Barra de navegación fija inferior */}
      <nav
        ref={barraRef}
        className="asistente-torneo__barra-inferior"
        aria-label="Navegación del asistente"
      >
        <div className="asistente-torneo__barra-contenido">
          <button
            type="button"
            className="button hollow asistente-torneo__boton-nav asistente-torneo__boton-anterior"
            onClick={a.anterior}
            disabled={!a.puedeRetroceder}
          >
            Anterior
          </button>

          <div className="asistente-torneo__info-barra">
            <span className="asistente-torneo__texto-paso">
              Paso {a.numeroPaso} de {a.totalPasos}
            </span>
            {!a.pasoActualInfo?.completo && a.pasoActualInfo?.motivo && (
              <span className="asistente-torneo__motivo-bloqueo">
                {a.pasoActualInfo.motivo}
              </span>
            )}
          </div>

          {a.pasoActual !== 'resumen' && (
            <button
              type="button"
              className="button asistente-torneo__boton-nav asistente-torneo__boton-siguiente"
              onClick={a.siguiente}
              disabled={!a.puedeAvanzar}
            >
              Siguiente
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}

export default AsistenteTorneo;

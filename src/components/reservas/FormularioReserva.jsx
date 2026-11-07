import React, { useContext } from 'react';
import { Gift } from 'lucide-react';
import SelectorDia from '../shared/SelectorDia';
import ReservasContext from '../../context/ReservasContext';
import {
  DESCUENTO_POR_HORA,
  MAX_HORAS_SEGUIDAS,
  MIN_HORAS_BENEFICIO,
  finDeFranja,
  formatoPrecio,
} from '../../lib/precios';
import PasoFormato from './torneo/PasoFormato';
import PasoLlaves from './torneo/PasoLlaves';
import PasoCapacidad from './torneo/PasoCapacidad';
import PasoFechas from './torneo/PasoFechas';
import PasoDatos from './torneo/PasoDatos';
import PasoGuardados from './torneo/PasoGuardados';
import './FormularioReserva.css';

const SECCIONES_VALIDAS = ['formato', 'fechas', 'llaves', 'datos', 'guardados'];

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
 * Formulario de reserva de canchas individuales y eventos.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @param {string[]} props.dias Lista de fechas ISO para el selector de día
 * @param {'formato' | 'fechas' | 'llaves' | 'datos' | 'guardados'} [props.seccion] Sección a renderizar en modo torneo
 * @returns {React.ReactElement}
 */
function FormularioReserva({ reserva, dias, seccion }) {
  const reservasCtx = useContext(ReservasContext);
  const reservas = reservasCtx?.reservas || [];
  const canchas = reservasCtx?.canchas || [];

  const torneosGuardados = reservas.filter(
    (r) => r.tipo === 'evento' && r.subtipo === 'torneo' && r.torneo
  );

  const franjas = agruparPorFranjas(reserva.horasBase);
  const esSeccionTorneo =
    reserva.modo === 'torneo' && SECCIONES_VALIDAS.includes(seccion);

  return (
    <div className="formulario-reserva">
      {reserva.error && (
        <div className="callout alert" role="alert">
          {reserva.error}
        </div>
      )}

      {esSeccionTorneo ? (
        <>
          {seccion === 'formato' && (
            <fieldset className="formulario-reserva__campo">
              <legend>Formato del torneo</legend>
              <PasoFormato reserva={reserva} />
            </fieldset>
          )}

          {seccion === 'fechas' && (
            <>
              <PasoFechas reserva={reserva} dias={dias} canchas={canchas} />
              <PasoCapacidad reserva={reserva} />
            </>
          )}

          {seccion === 'llaves' && (
            <fieldset className="formulario-reserva__campo">
              <legend>Emparejamiento</legend>
              <PasoLlaves reserva={reserva} />
            </fieldset>
          )}

          {seccion === 'datos' && <PasoDatos reserva={reserva} />}

          {seccion === 'guardados' && (
            <PasoGuardados
              torneosGuardados={torneosGuardados}
              canchas={canchas}
            />
          )}
        </>
      ) : (
        <>
          {reserva.modo !== 'torneo' && (
            <>
              <fieldset className="formulario-reserva__campo">
                <legend>Día</legend>
                <SelectorDia
                  dias={dias}
                  valor={reserva.fecha}
                  onChange={reserva.cambiarFecha}
                  contarLibres={reserva.contarLibresDia}
                />
              </fieldset>

              <fieldset id="reserva-horario" className="formulario-reserva__campo">
                <legend className="formulario-reserva__legend-horario">
                  <span>Horario</span>
                  {reserva.horasSel.length > 0 ? (
                    <span className="formulario-reserva__rango" aria-live="polite">
                      {` · ${reserva.horasSel[0]} a ${finDeFranja(reserva.horasSel[reserva.horasSel.length - 1])} (${reserva.horasSel.length} h)`}
                    </span>
                  ) : (
                    <span className="formulario-reserva__subtexto-horario">
                      {reserva.esEvento
                        ? 'Toca inicio y fin'
                        : `Una hora o hasta ${MAX_HORAS_SEGUIDAS} seguidas`}
                    </span>
                  )}
                </legend>
                <p className="formulario-reserva__promo">
                  <Gift size={16} aria-hidden="true" />
                  <span>
                    Desde {MIN_HORAS_BENEFICIO} horas seguidas:{' '}
                    <strong>
                      {formatoPrecio.format(DESCUENTO_POR_HORA)} menos por hora
                    </strong>{' '}
                    y un <strong>pack de agua gratis</strong>
                    {reserva.esEvento ? ' por cancha' : ''}.
                  </span>
                </p>
                <p className="formulario-reserva__ayuda">
                  {reserva.esEvento
                    ? 'Toca la hora de inicio y luego la de fin: se eligen todas las horas de en medio.'
                    : `Elige una hora o hasta ${MAX_HORAS_SEGUIDAS} horas seguidas.`}
                </p>
                {reserva.esEvento && reserva.canchaIds.length === 0 && (
                  <p className="formulario-reserva__nota">
                    Elige al menos una cancha para ver los horarios libres.
                  </p>
                )}
                <div className="formulario-reserva__franjas">
                  {franjas.map((franja) => (
                    <div key={franja.id} className="formulario-reserva__franja">
                      <span className="formulario-reserva__franja-etiqueta">
                        {franja.nombre}
                      </span>
                      <div className="formulario-reserva__horas formulario-reserva__franja-horas">
                        {franja.horas.map((hora) => {
                          const libre = reserva.esLibre(hora);
                          const ocupada =
                            !libre && (!reserva.esEvento || (reserva.canchaIds && reserva.canchaIds.length > 0));
                          const sel = reserva.horasSel.includes(hora);
                          return (
                            <button
                              key={hora}
                              type="button"
                              className={
                                'button small formulario-reserva__hora' +
                                (ocupada ? ' formulario-reserva__hora--ocupado' : '') +
                                (sel ? ' formulario-reserva__hora--sel' : ' hollow')
                              }
                              disabled={!libre}
                              aria-pressed={sel}
                              aria-label={ocupada ? `${hora}, reservada` : undefined}
                              data-hora={hora}
                              onClick={() => reserva.elegirHora(hora)}
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
              </fieldset>
            </>
          )}

          {reserva.modo === 'torneo' && (
            <div className="formulario-reserva__torneo">
              <fieldset className="formulario-reserva__campo">
                <legend>Formato del torneo</legend>
                <PasoFormato reserva={reserva} />
                <PasoLlaves reserva={reserva} />
                <PasoCapacidad reserva={reserva} />
              </fieldset>

              <PasoFechas reserva={reserva} dias={dias} canchas={canchas} />
              <PasoGuardados
                torneosGuardados={torneosGuardados}
                canchas={canchas}
              />
            </div>
          )}

          <PasoDatos reserva={reserva} />
        </>
      )}
    </div>
  );
}

export default FormularioReserva;

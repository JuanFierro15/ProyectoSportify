import React from 'react';
import { Gift } from 'lucide-react';
import SelectorDia from '../shared/SelectorDia';
import {
  DESCUENTO_POR_HORA,
  MAX_HORAS_SEGUIDAS,
  MIN_HORAS_BENEFICIO,
  formatoPrecio,
} from '../../lib/precios';
import './FormularioReserva.css';

/**
 * Formulario de reserva de canchas individuales y eventos.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @param {string[]} props.dias Lista de fechas ISO para el selector de día
 * @returns {React.ReactElement}
 */
function FormularioReserva({ reserva, dias }) {
  return (
    <div className="formulario-reserva">
      {reserva.error && (
        <div className="callout alert" role="alert">
          {reserva.error}
        </div>
      )}

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
        <legend>Horario</legend>
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
        <div className="formulario-reserva__horas">
          {reserva.horasBase.map((hora) => {
            const libre = reserva.esLibre(hora);
            const sel = reserva.horasSel.includes(hora);
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
                onClick={() => reserva.elegirHora(hora)}
              >
                {hora}
                {!libre && (!reserva.esEvento || reserva.canchaIds.length > 0) && (
                  <span className="formulario-reserva__hora-tag">
                    {' '}
                    · {reserva.esEvento ? 'ocupado' : 'reservado'}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </fieldset>

      {reserva.modo === 'torneo' && (
        <fieldset className="formulario-reserva__campo">
          <legend>Datos del torneo</legend>
          <div className="grid-x grid-padding-x">
            <div className="cell medium-6">
              <label htmlFor="reserva-equipos">
                Equipos o participantes
              </label>
              <input
                id="reserva-equipos"
                name="equipos"
                type="number"
                min="2"
                className="formulario-reserva__input"
                value={reserva.equipos}
                onChange={(e) => reserva.setEquipos(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      )}

      {reserva.modo === 'cumpleanos' && (
        <fieldset className="formulario-reserva__campo">
          <legend>Datos del cumpleaños</legend>
          <div className="grid-x grid-padding-x">
            <div className="cell medium-6">
              <label htmlFor="reserva-invitados">
                Invitados
              </label>
              <input
                id="reserva-invitados"
                name="invitados"
                type="number"
                min="1"
                className="formulario-reserva__input"
                value={reserva.invitados}
                onChange={(e) => reserva.setInvitados(e.target.value)}
              />
            </div>
          </div>
        </fieldset>
      )}

      <div className="grid-x grid-padding-x formulario-reserva__contacto">
        <div className="cell medium-6">
          <label htmlFor="reserva-nombre">
            Nombre
          </label>
          <input
            id="reserva-nombre"
            name="nombre"
            type="text"
            className={
              'formulario-reserva__input' +
              (reserva.verErrNombre ? ' is-invalid-input' : '')
            }
            placeholder="Ej. Juan Pérez…"
            value={reserva.nombre}
            onChange={(e) => reserva.cambiarNombre(e.target.value)}
            onBlur={() => reserva.marcarTocado('nombre')}
            autoComplete="name"
            aria-invalid={reserva.verErrNombre}
            aria-describedby="reserva-nombre-error"
          />
          <span
            id="reserva-nombre-error"
            className={
              'form-error' + (reserva.verErrNombre ? ' is-visible' : '')
            }
          >
            {reserva.errNombre}
          </span>
        </div>
        <div className="cell medium-6">
          <label htmlFor="reserva-telefono">
            Teléfono (opcional)
          </label>
          <input
            id="reserva-telefono"
            name="telefono"
            type="tel"
            className={
              'formulario-reserva__input' +
              (reserva.verErrTelefono ? ' is-invalid-input' : '')
            }
            placeholder="Ej. 3001234567"
            value={reserva.telefono}
            onChange={(e) => reserva.cambiarTelefono(e.target.value)}
            onBlur={() => reserva.marcarTocado('telefono')}
            inputMode="numeric"
            maxLength={10}
            autoComplete="tel-national"
            aria-invalid={reserva.verErrTelefono}
            aria-describedby="reserva-telefono-error"
          />
          <span
            id="reserva-telefono-error"
            className={
              'form-error' + (reserva.verErrTelefono ? ' is-visible' : '')
            }
          >
            {reserva.errTelefono}
          </span>
        </div>
      </div>
    </div>
  );
}

export default FormularioReserva;

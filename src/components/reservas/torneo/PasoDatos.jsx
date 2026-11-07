import React from 'react';
import { MAX_INVITADOS } from '../useReserva';

/**
 * Bloque de contacto del titular de la reserva: nombre, teléfono
 * y cantidad de invitados cuando aplica en cumpleaños.
 *
 * @param {Object} props
 * @param {Object} props.reserva Objeto de estado y acciones devuelto por useReserva
 * @returns {React.ReactElement}
 */
function PasoDatos({ reserva }) {
  return (
    <fieldset className="formulario-reserva__campo formulario-reserva__contacto">
      <legend>Tus datos</legend>
      <div className="grid-x grid-padding-x">
        {reserva.modo === 'cumpleanos' && (
          <div className="cell medium-4">
            <label htmlFor="reserva-invitados">
              Invitados
            </label>
            <input
              id="reserva-invitados"
              name="invitados"
              type="number"
              min="1"
              max={MAX_INVITADOS}
              placeholder="Ej. 20"
              className="formulario-reserva__input"
              value={reserva.invitados}
              onChange={(e) => reserva.setInvitados(e.target.value)}
            />
          </div>
        )}
        <div className={`cell ${reserva.modo === 'cumpleanos' ? 'medium-4' : 'medium-6'}`}>
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
        <div className={`cell ${reserva.modo === 'cumpleanos' ? 'medium-4' : 'medium-6'}`}>
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
      <p className="formulario-reserva__nota-contacto">
        Con el teléfono puedes cancelar desde el chat. Sin él, solo con el código de la reserva.
      </p>
    </fieldset>
  );
}

export default PasoDatos;

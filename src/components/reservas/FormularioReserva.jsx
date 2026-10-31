import React, { useContext } from 'react';
import { Gift, ShieldCheck, Shuffle } from 'lucide-react';
import SelectorDia from '../shared/SelectorDia';
import ReservasContext from '../../context/ReservasContext';
import {
  DESCUENTO_POR_HORA,
  MAX_HORAS_SEGUIDAS,
  MIN_HORAS_BENEFICIO,
  finDeFranja,
  formatoPrecio,
} from '../../lib/precios';
import {
  OPCIONES_EQUIPOS,
  OPCIONES_DURACION,
  TRANSICION_MIN,
} from '../../lib/torneo';
import AlertaTiempo from './torneo/AlertaTiempo';
import AsignacionManual from './torneo/AsignacionManual';
import Bracket, { fechaCorta } from './torneo/Bracket';
import CalendarioTorneo from './torneo/CalendarioTorneo';
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
  const reservasCtx = useContext(ReservasContext);
  const reservas = reservasCtx?.reservas || [];
  const canchas = reservasCtx?.canchas || [];

  const torneosGuardados = reservas.filter(
    (r) => r.tipo === 'evento' && r.subtipo === 'torneo' && r.torneo
  );

  return (
    <div className="formulario-reserva">
      {reserva.error && (
        <div className="callout alert" role="alert">
          {reserva.error}
        </div>
      )}

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
        </>
      )}

      {reserva.modo === 'torneo' && (
        <fieldset className="formulario-reserva__campo formulario-reserva__torneo">
          <legend>Organización del torneo</legend>

          {reserva.torneoPlan?.errorCanchas && reserva.canchaIds.length > 0 && (
            <div className="callout alert" role="alert">
              {reserva.torneoPlan.errorCanchas}
            </div>
          )}

          <div className="formulario-reserva__seccion-torneo">
            <span className="formulario-reserva__subtitulo">
              Cantidad de equipos (Eliminación directa)
            </span>
            <div
              className="formulario-reserva__pills"
              role="group"
              aria-label="Cantidad de equipos"
            >
              {OPCIONES_EQUIPOS.map((n) => (
                <button
                  key={n}
                  type="button"
                  className={
                    'button small formulario-reserva__pill' +
                    (Number(reserva.equipos) === n
                      ? ' formulario-reserva__pill--activo'
                      : ' hollow')
                  }
                  aria-pressed={Number(reserva.equipos) === n}
                  onClick={() => reserva.cambiarEquiposTorneo(n)}
                >
                  {n} equipos ({n - 1} partidos)
                </button>
              ))}
            </div>
          </div>

          <div className="formulario-reserva__seccion-torneo">
            <span className="formulario-reserva__subtitulo">
              Duración por partido
            </span>
            <div
              className="formulario-reserva__pills"
              role="group"
              aria-label="Duración por partido"
            >
              {OPCIONES_DURACION.map((min) => (
                <button
                  key={min}
                  type="button"
                  className={
                    'button small formulario-reserva__pill' +
                    (Number(reserva.duracionPartido) === min
                      ? ' formulario-reserva__pill--activo'
                      : ' hollow')
                  }
                  aria-pressed={Number(reserva.duracionPartido) === min}
                  onClick={() => reserva.setDuracionPartido(min)}
                >
                  {min} min
                </button>
              ))}
            </div>
            <p className="formulario-reserva__nota-torneo">
              {`Cada turno suma ${reserva.duracionPartido} min de partido + ${reserva.torneoPlan?.desempate?.minutos ?? 5} min de desempate + ${TRANSICION_MIN} min de transición = ${reserva.torneoPlan?.minutosTurno ?? 30} min por turno.`}
            </p>
          </div>

          {reserva.torneoPlan?.desempate && (
            <div className="formulario-reserva__desempate">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>
                <strong>
                  Desempate ({reserva.torneoPlan.desempate.etiqueta || reserva.torneoPlan.desempate.metodo}):
                </strong>{' '}
                {reserva.torneoPlan.desempate.descripcion}
              </span>
            </div>
          )}

          <div className="formulario-reserva__seccion-torneo">
            <span className="formulario-reserva__subtitulo">
              Emparejamiento de 1.ª ronda
            </span>
            <div className="formulario-reserva__emparejamiento-controles">
              <div
                className="formulario-reserva__pills"
                role="group"
                aria-label="Tipo de emparejamiento"
              >
                <button
                  type="button"
                  className={
                    'button small formulario-reserva__pill' +
                    (reserva.emparejamiento === 'aleatorio'
                      ? ' formulario-reserva__pill--activo'
                      : ' hollow')
                  }
                  aria-pressed={reserva.emparejamiento === 'aleatorio'}
                  onClick={() => reserva.cambiarEmparejamiento('aleatorio')}
                >
                  Aleatorio
                </button>
                <button
                  type="button"
                  className={
                    'button small formulario-reserva__pill' +
                    (reserva.emparejamiento === 'manual'
                      ? ' formulario-reserva__pill--activo'
                      : ' hollow')
                  }
                  aria-pressed={reserva.emparejamiento === 'manual'}
                  onClick={() => reserva.cambiarEmparejamiento('manual')}
                >
                  Manual
                </button>
              </div>

              {reserva.emparejamiento === 'aleatorio' && (
                <button
                  type="button"
                  className="button small hollow formulario-reserva__sortear"
                  onClick={reserva.resortearTorneo}
                >
                  <Shuffle size={14} aria-hidden="true" />
                  Volver a sortear llaves
                </button>
              )}
            </div>

            {reserva.emparejamiento === 'manual' && (
              <AsignacionManual
                equipos={Number(reserva.equipos)}
                orden={reserva.ordenEquipos}
                error={reserva.torneoPlan?.errorCruces || ''}
                onCambiarPosicion={reserva.cambiarCruceManual}
              />
            )}
          </div>

          <div className="formulario-reserva__seccion-torneo">
            <span className="formulario-reserva__subtitulo">
              Programación por fases (días y horarios)
            </span>
            <CalendarioTorneo
              fases={reserva.torneoPlan?.fases || []}
              jornadas={reserva.torneoPlan?.jornadas || {}}
              validacionesJornadas={reserva.torneoPlan?.validacionesJornadas || []}
              sugerenciasPorFase={reserva.torneoPlan?.sugerenciasPorFase || {}}
              dias={dias}
              horasBase={reserva.horasBase}
              canchas={canchas}
              canchaIds={reserva.canchaIds}
              onCambiarFechaFase={reserva.cambiarFechaFase}
              onElegirHoraFase={reserva.elegirHoraFase}
              esLibreFase={reserva.esLibreFase}
              contarLibresFase={reserva.contarLibresFase}
            />
          </div>

          <div className="formulario-reserva__seccion-torneo">
            <span className="formulario-reserva__subtitulo">
              Capacidad y tiempo estimado
            </span>
            <div className="formulario-reserva__metricas">
              <span className="formulario-reserva__metrica">
                {`Canchas seleccionadas: ${reserva.canchaIds.length || 1} (hasta ${(reserva.canchaIds.length || 1) * 2} equipos simultáneos)`}
              </span>
              <span className="formulario-reserva__metrica">
                {`Turnos requeridos: ${reserva.torneoPlan?.turnosTotales ?? 0}`}
              </span>
              <span className="formulario-reserva__metrica">
                {`Tiempo estimado (peor caso): ${reserva.torneoPlan?.minutosRequeridos ?? 0} min`}
              </span>
            </div>

            {reserva.torneoPlan?.fases && reserva.torneoPlan.fases.length > 0 && (
              <div className="formulario-reserva__fases-detalle">
                <span className="formulario-reserva__fases-titulo">
                  Canchas efectivas por fase:
                </span>
                <div className="formulario-reserva__fases-pills">
                  {reserva.torneoPlan.fases.map((fase) => {
                    const nombreCorto = fase.nombreRonda.replace(/ de final$/i, '');
                    return (
                      <span key={fase.ronda} className="formulario-reserva__metrica">
                        {`${nombreCorto}: ${fase.canchasEfectivas} ${fase.canchasEfectivas === 1 ? 'cancha' : 'canchas'}`}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {reserva.horasSel.length > 0 &&
              reserva.torneoPlan?.validacionFranja &&
              !reserva.torneoPlan.validacionFranja.alcanza && (
                <AlertaTiempo
                  equipos={Number(reserva.equipos)}
                  canchasCount={Math.max(1, reserva.canchaIds.length)}
                  minutosRequeridos={reserva.torneoPlan.minutosRequeridos}
                  disponibles={reserva.torneoPlan.validacionFranja.disponibles}
                  deficit={reserva.torneoPlan.validacionFranja.deficit}
                  sugerencias={reserva.torneoPlan.sugerencias}
                />
              )}
          </div>

          <div className="formulario-reserva__seccion-torneo">
            <span className="formulario-reserva__subtitulo">
              Llaves y cronograma del torneo
            </span>
            <Bracket
              partidos={reserva.torneoPlan?.partidos || []}
              canchas={canchas}
            />
          </div>

          {torneosGuardados.length > 0 && (
            <details className="formulario-reserva__torneos-guardados">
              <summary>Torneos reservados ({torneosGuardados.length})</summary>
              <div className="formulario-reserva__torneos-lista">
                {torneosGuardados.map((t) => {
                  const horarioTexto =
                    t.horario ||
                    (t.horas && t.horas.length > 0
                      ? `${t.horas[0]} a ${t.horas[t.horas.length - 1]}`
                      : '');
                  const desempateTexto =
                    t.torneo?.desempate?.descripcion ||
                    t.torneo?.desempate?.etiqueta ||
                    t.torneo?.desempate?.metodo ||
                    '';
                  const tieneJornadas =
                    t.torneo?.jornadas &&
                    (Array.isArray(t.torneo.jornadas)
                      ? t.torneo.jornadas.length > 0
                      : Object.keys(t.torneo.jornadas).length > 0);
                  const listaJornadas = tieneJornadas
                    ? Array.isArray(t.torneo.jornadas)
                      ? t.torneo.jornadas
                      : Object.values(t.torneo.jornadas)
                    : [];

                  return (
                    <div
                      key={t.codigo || t.id}
                      className="formulario-reserva__torneo-guardado"
                    >
                      <div className="formulario-reserva__torneo-guardado-info">
                        <strong className="formulario-reserva__torneo-guardado-codigo">
                          Código: {t.codigo}
                        </strong>
                        <span className="formulario-reserva__torneo-guardado-meta">
                          {t.fechaTexto || t.fecha}
                          {horarioTexto && ` · ${horarioTexto}`}
                          {` · ${t.torneo?.equipos} equipos`}
                          {desempateTexto && ` · Desempate: ${desempateTexto}`}
                        </span>
                      </div>
                      {listaJornadas.length > 0 && (
                        <div className="formulario-reserva__torneo-guardado-jornadas">
                          {listaJornadas.map((j, idx) => {
                            const horasTxt =
                              Array.isArray(j.horas) && j.horas.length > 0
                                ? `${j.horas[0]} a ${finDeFranja(j.horas[j.horas.length - 1])}`
                                : '';
                            const numC =
                              j.canchasEfectivas ||
                              (Array.isArray(j.canchaIds) ? j.canchaIds.length : null);
                            return (
                              <span
                                key={j.ronda || idx}
                                className="formulario-reserva__torneo-guardado-jornada-item"
                              >
                                <strong>{j.nombreRonda || `Fase ${j.ronda || idx + 1}`}:</strong>{' '}
                                {fechaCorta(j.fecha)}
                                {horasTxt && ` · ${horasTxt}`}
                                {numC && ` (${numC} ${numC === 1 ? 'cancha' : 'canchas'})`}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      {t.torneo?.partidos && (
                        <Bracket
                          partidos={t.torneo.partidos}
                          canchas={canchas}
                          compacto
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </details>
          )}
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

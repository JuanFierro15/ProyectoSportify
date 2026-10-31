import React, { useMemo } from 'react';
import { finDeFranja, formatoPrecio } from '../../lib/precios';
import { fechaCorta } from './torneo/Bracket';
import './VoucherReserva.css';

/**
 * VoucherReserva — resumen en vivo de lo que se paga, en todos los modos de
 * la vista de reserva (VistaCanchas): una línea por cancha (horas × precio, con descuento si
 * aplica), packs de agua, ahorro, total y los botones de confirmar/cancelar.
 *
 * Props: tipoEtiqueta, fechaTexto, horas (bloque elegido), precio (resultado
 * de calcularPrecioEvento o calcularPrecioJornadas), puedeConfirmar, motivoBloqueo (por qué aún no se
 * puede confirmar), onConfirmar, onCancelar, torneo (opcional).
 */
function VoucherReserva({
  tipoEtiqueta,
  fechaTexto,
  horas = [],
  precio,
  puedeConfirmar,
  motivoBloqueo,
  onConfirmar,
  onCancelar,
  torneo = null,
}) {
  const n = horas.length;
  const lineas = precio?.lineas || [];
  const esModoTorneo = !!torneo;
  const sinSeleccion = esModoTorneo
    ? lineas.length === 0
    : lineas.length === 0 || n === 0;

  const textoHorario =
    n > 0
      ? `${horas[0]} a ${finDeFranja(horas[n - 1])} · ${n} ${n === 1 ? 'hora' : 'horas'}`
      : 'Sin elegir';

  const jornadasConfiguradas = useMemo(() => {
    if (!torneo) return [];

    if (Array.isArray(torneo.fases) && torneo.fases.length > 0) {
      const jMap = torneo.jornadas || {};
      return torneo.fases
        .map((fase) => {
          const j = Array.isArray(jMap)
            ? jMap.find((x) => x.ronda === fase.ronda)
            : jMap[fase.ronda];
          const horasFase = Array.isArray(j?.horas) ? j.horas : [];
          if (horasFase.length === 0) return null;
          const fechaStr = fechaCorta(j.fecha);
          const franja = `${horasFase[0]} a ${finDeFranja(horasFase[horasFase.length - 1])}`;
          const cCount = fase.canchasEfectivas;
          const cTxt = `${cCount} ${cCount === 1 ? 'cancha' : 'canchas'}`;
          return {
            ronda: fase.ronda,
            nombreRonda: fase.nombreRonda,
            texto: `${fase.nombreRonda}: ${fechaStr} · ${franja} (${cTxt})`,
          };
        })
        .filter(Boolean);
    }

    if (Array.isArray(torneo.jornadas) && torneo.jornadas.length > 0) {
      return torneo.jornadas
        .map((j) => {
          const horasFase = Array.isArray(j?.horas) ? j.horas : [];
          if (horasFase.length === 0) return null;
          const fechaStr = fechaCorta(j.fecha);
          const franja = `${horasFase[0]} a ${finDeFranja(horasFase[horasFase.length - 1])}`;
          const cCount =
            j.canchasEfectivas ||
            (Array.isArray(j.canchaIds) ? j.canchaIds.length : 1);
          const cTxt = `${cCount} ${cCount === 1 ? 'cancha' : 'canchas'}`;
          const nom = j.nombreRonda || `Fase ${j.ronda}`;
          return {
            ronda: j.ronda,
            nombreRonda: nom,
            texto: `${nom}: ${fechaStr} · ${franja} (${cTxt})`,
          };
        })
        .filter(Boolean);
    }

    return [];
  }, [torneo]);

  return (
    <aside className="voucher-reserva" aria-label="Resumen de tu reserva">
      <div className="voucher-reserva__cabecera">
        <h3 className="voucher-reserva__titulo">Tu reserva</h3>
        {tipoEtiqueta && (
          <span className="voucher-reserva__tipo">{tipoEtiqueta}</span>
        )}
      </div>

      <div className="voucher-reserva__meta">
        {jornadasConfiguradas.length > 0 ? (
          <div className="voucher-reserva__jornadas">
            {jornadasConfiguradas.map((j) => (
              <div
                key={j.ronda}
                className="voucher-reserva__fila voucher-reserva__fila--fase"
              >
                <span className="voucher-reserva__fase-item">{j.texto}</span>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="voucher-reserva__fila">
              <span className="voucher-reserva__etiqueta">Fecha</span>
              <span className="voucher-reserva__valor">{fechaTexto || 'Sin elegir'}</span>
            </div>
            <div className="voucher-reserva__fila">
              <span className="voucher-reserva__etiqueta">Horario</span>
              <span className="voucher-reserva__valor">{textoHorario}</span>
            </div>
          </>
        )}

        {torneo && (
          <>
            <div className="voucher-reserva__fila">
              <span className="voucher-reserva__etiqueta">Formato</span>
              <span className="voucher-reserva__valor">
                {`${torneo.equipos} equipos (${torneo.partidos ? torneo.partidos.length : torneo.equipos - 1} partidos)`}
              </span>
            </div>
            <div className="voucher-reserva__fila">
              <span className="voucher-reserva__etiqueta">Duración est.</span>
              <span className="voucher-reserva__valor">
                {`${torneo.minutosRequeridos} min (${torneo.duracionPartido}m + desempate + transición)`}
              </span>
            </div>
            <div className="voucher-reserva__fila">
              <span className="voucher-reserva__etiqueta">Desempate</span>
              <span className="voucher-reserva__valor">
                {torneo.desempate?.etiqueta || torneo.desempate?.metodo || '5 min'}
              </span>
            </div>
          </>
        )}
      </div>

      <div className="voucher-reserva__cuerpo" aria-live="polite">
        {sinSeleccion ? (
          <p className="voucher-reserva__vacio">
            Elige cancha y horario para ver el total.
          </p>
        ) : (
          <>
            <div className="voucher-reserva__lineas">
              {lineas.map((l) => {
                const horasLinea = l.nHoras != null ? l.nHoras : n;
                return (
                  <div key={l.canchaId} className="voucher-reserva__linea">
                    <div className="voucher-reserva__linea-info">
                      <span className="voucher-reserva__linea-nombre">{l.nombre}</span>
                      <span className="voucher-reserva__linea-calculo">
                        {`${horasLinea} h × ${formatoPrecio.format(l.precioHoraFinal)}`}
                        {l.descuentoHora > 0 &&
                          ` (−${formatoPrecio.format(l.descuentoHora)}/h)`}
                      </span>
                    </div>
                    <div className="voucher-reserva__linea-precio">
                      {l.descuentoHora > 0 && (
                        <s className="voucher-reserva__linea-tachado">
                          {formatoPrecio.format(l.subtotal)}
                        </s>
                      )}
                      <span className="voucher-reserva__linea-total">
                        {formatoPrecio.format(l.total)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="voucher-reserva__separador" />

            <div className="voucher-reserva__desglose">
              {precio.packsAgua > 0 && (
                <div className="voucher-reserva__fila voucher-reserva__fila--agua">
                  <span className="voucher-reserva__etiqueta">
                    Packs de agua gratis
                  </span>
                  <span className="voucher-reserva__valor">
                    {precio.packsAgua}
                  </span>
                </div>
              )}

              {precio.ahorro > 0 && (
                <div className="voucher-reserva__fila voucher-reserva__fila--ahorro">
                  <span className="voucher-reserva__etiqueta">Ahorras</span>
                  <span className="voucher-reserva__valor voucher-reserva__valor--ahorro">
                    {formatoPrecio.format(precio.ahorro)}
                  </span>
                </div>
              )}

              <div className="voucher-reserva__fila voucher-reserva__fila--total">
                <span className="voucher-reserva__etiqueta-total">Total</span>
                <strong className="voucher-reserva__valor-total">
                  {formatoPrecio.format(precio.total)}
                </strong>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="voucher-reserva__acciones">
        <button
          type="button"
          className="button success expanded"
          disabled={!puedeConfirmar}
          onClick={onConfirmar}
        >
          Confirmar reserva
        </button>

        {motivoBloqueo && (
          <p className="voucher-reserva__bloqueo">{motivoBloqueo}</p>
        )}

        <button
          type="button"
          className="button clear secondary expanded"
          onClick={onCancelar}
        >
          Cancelar
        </button>
      </div>
    </aside>
  );
}

export default VoucherReserva;

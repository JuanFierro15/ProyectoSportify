import React from 'react';
import { finDeFranja, formatoPrecio } from '../../lib/precios';
import './VoucherReserva.css';

/**
 * VoucherReserva — resumen en vivo de lo que se paga, en todos los modos de
 * la vista de reserva (VistaCanchas): una línea por cancha (horas × precio, con descuento si
 * aplica), packs de agua, ahorro, total y los botones de confirmar/cancelar.
 *
 * Props: tipoEtiqueta, fechaTexto, horas (bloque elegido), precio (resultado
 * de calcularPrecioEvento), puedeConfirmar, motivoBloqueo (por qué aún no se
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
  const sinSeleccion = lineas.length === 0 || n === 0;

  const textoHorario =
    n > 0
      ? `${horas[0]} a ${finDeFranja(horas[n - 1])} · ${n} ${n === 1 ? 'hora' : 'horas'}`
      : 'Sin elegir';

  return (
    <aside className="voucher-reserva" aria-label="Resumen de tu reserva">
      <div className="voucher-reserva__cabecera">
        <h3 className="voucher-reserva__titulo">Tu reserva</h3>
        {tipoEtiqueta && (
          <span className="voucher-reserva__tipo">{tipoEtiqueta}</span>
        )}
      </div>

      <div className="voucher-reserva__meta">
        <div className="voucher-reserva__fila">
          <span className="voucher-reserva__etiqueta">Fecha</span>
          <span className="voucher-reserva__valor">{fechaTexto || 'Sin elegir'}</span>
        </div>
        <div className="voucher-reserva__fila">
          <span className="voucher-reserva__etiqueta">Horario</span>
          <span className="voucher-reserva__valor">{textoHorario}</span>
        </div>
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
              {lineas.map((l) => (
                <div key={l.canchaId} className="voucher-reserva__linea">
                  <div className="voucher-reserva__linea-info">
                    <span className="voucher-reserva__linea-nombre">{l.nombre}</span>
                    <span className="voucher-reserva__linea-calculo">
                      {`${n} h × ${formatoPrecio.format(l.precioHoraFinal)}`}
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
              ))}
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

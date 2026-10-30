import React from 'react';

export function AsignacionManual({
  equipos = 8,
  orden = [],
  error = '',
  onCambiarPosicion,
}) {
  const numPartidos = Math.floor(equipos / 2);
  const opciones = Array.from({ length: equipos }, (_, i) => i + 1);

  return (
    <div className="asignacion-manual">
      <div className="asignacion-manual__grid">
        {Array.from({ length: numPartidos }, (_, m) => {
          const indiceLocal = 2 * m;
          const indiceVisitante = 2 * m + 1;
          const valorLocal = orden[indiceLocal] ?? '';
          const valorVisitante = orden[indiceVisitante] ?? '';
          const etiqueta = `R1-P${m + 1}`;

          return (
            <div key={etiqueta} className="asignacion-manual__tarjeta">
              <span className="asignacion-manual__tarjeta-titulo">{etiqueta}</span>
              <div className="asignacion-manual__partido">
                <select
                  className="formulario-reserva__input asignacion-manual__select"
                  aria-label={`Llave ${etiqueta} equipo local`}
                  value={valorLocal}
                  onChange={(e) =>
                    onCambiarPosicion?.(
                      indiceLocal,
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Elegir equipo...</option>
                  {opciones.map((num) => {
                    const enUso = orden.some(
                      (val, idx) => idx !== indiceLocal && Number(val) === num
                    );
                    return (
                      <option key={num} value={num}>
                        Equipo {num}
                        {enUso ? ' (en uso)' : ''}
                      </option>
                    );
                  })}
                </select>

                <span className="asignacion-manual__vs">vs</span>

                <select
                  className="formulario-reserva__input asignacion-manual__select"
                  aria-label={`Llave ${etiqueta} equipo visitante`}
                  value={valorVisitante}
                  onChange={(e) =>
                    onCambiarPosicion?.(
                      indiceVisitante,
                      e.target.value ? Number(e.target.value) : null
                    )
                  }
                >
                  <option value="">Elegir equipo...</option>
                  {opciones.map((num) => {
                    const enUso = orden.some(
                      (val, idx) => idx !== indiceVisitante && Number(val) === num
                    );
                    return (
                      <option key={num} value={num}>
                        Equipo {num}
                        {enUso ? ' (en uso)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          );
        })}
      </div>

      {error ? (
        <p className="form-error is-visible asignacion-manual__error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export default AsignacionManual;

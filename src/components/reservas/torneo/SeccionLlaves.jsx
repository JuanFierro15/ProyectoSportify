import React from 'react';
import Bracket from './Bracket';
import './SeccionLlaves.css';

export function SeccionLlaves({ reserva, canchas }) {
  if (!reserva || reserva.modo !== 'torneo') return null;

  return (
    <section className="seccion-llaves" aria-labelledby="seccion-llaves-titulo">
      <div className="seccion-llaves__cabecera">
        <h2 id="seccion-llaves-titulo" className="seccion-llaves__titulo">
          Llaves y cronograma del torneo
        </h2>
      </div>
      <Bracket
        partidos={reserva.torneoPlan?.partidos || []}
        canchas={canchas}
      />
    </section>
  );
}

export default SeccionLlaves;

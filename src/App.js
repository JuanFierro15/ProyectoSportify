import React from 'react';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import './App.css';

/**
 * Esqueleto de la aplicación (Bloque 1).
 * Estructura: Navbar + contenedor grid de Foundation con placeholders + Footer.
 * Los placeholders se llenan en bloques posteriores:
 *  - #hero-placeholder     -> Bloque 2 (hero + GSAP)
 *  - #canchas-placeholder  -> Bloque 3 (catálogo de canchas)
 *  - #reservas-placeholder -> Bloque 4 (sistema de reservas)
 */
function App() {
  return (
    <div className="App">
      <Navbar />

      <main className="grid-container">
        <div className="grid-x grid-padding-x">
          <section className="cell" id="hero-placeholder">
            <h1>Hero</h1>
            <p>Placeholder del hero y las animaciones (Bloque 2).</p>
          </section>
        </div>

        <div className="grid-x grid-padding-x">
          <section className="cell" id="canchas-placeholder">
            <h2>Catálogo de canchas</h2>
            <p>Placeholder del catálogo de voley playa, pádel y fútbol (Bloque 3).</p>
          </section>
        </div>

        <div className="grid-x grid-padding-x">
          <section className="cell" id="reservas-placeholder">
            <h2>Sistema de reservas</h2>
            <p>Placeholder del selector de horarios y validación de reservas (Bloque 4).</p>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;

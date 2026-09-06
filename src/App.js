import React from 'react';
import Navbar from './components/layout/Navbar';
import DeporteHero from './components/hero/DeporteHero';
import Footer from './components/layout/Footer';
import './App.css';

// Placeholder de video para los heros por deporte (Bloque 2.5).
// TODO: reemplazar por un video propio de cada deporte.
const VIDEO_DEPORTE_PLACEHOLDER = `${process.env.PUBLIC_URL}/media/hero.mp4`;

/**
 * Esqueleto de la aplicación.
 * Estructura: Navbar + heros por deporte con pinning (Bloque 2.5) + contenedor
 * grid de Foundation con placeholders + Footer.
 * El contenedor de los heros lleva `id="hero-placeholder"` para que el enlace
 * "Inicio" del navbar (sin tocar) siga funcionando.
 * Placeholders pendientes:
 *  - #canchas-placeholder  -> Bloque 3 (catálogo de canchas)
 *  - #reservas-placeholder -> Bloque 4 (sistema de reservas)
 */
function App() {
  return (
    <div className="App">
      <Navbar />

      <div id="hero-placeholder">
        <DeporteHero
          nombre="Voley Playa"
          videoSrc={VIDEO_DEPORTE_PLACEHOLDER}
          tituloCTA="Ver canchas de voley playa"
          colorAcento="#f6a94b"
        />
        <DeporteHero
          nombre="Pádel"
          videoSrc={VIDEO_DEPORTE_PLACEHOLDER}
          tituloCTA="Ver canchas de pádel"
          colorAcento="#3fa9f5"
        />
        <DeporteHero
          nombre="Fútbol"
          videoSrc={VIDEO_DEPORTE_PLACEHOLDER}
          tituloCTA="Ver canchas de fútbol"
          colorAcento="#5bd67d"
        />
      </div>

      <main className="grid-container">
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

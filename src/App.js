import React from 'react';
import { ReservasProvider } from './context/ReservasContext';
import { DEPORTES } from './data/deportes';
import Navbar from './components/layout/Navbar';
import DeporteHero from './components/hero/DeporteHero';
import TransicionCatalogo from './components/canchas/TransicionCatalogo';
import Catalogo from './components/canchas/Catalogo';
import Footer from './components/layout/Footer';
import './App.css';

// Videos de fondo de los heros por deporte (en public/media/).
// Son versiones web ligeras: 1080p, keyframe por frame (para que el scrubbing
// por scroll sea fluido) y +faststart. Los originales en alta calidad están
// en public/media/fuente/ (fuera del repo).
const BASE = process.env.PUBLIC_URL;
const VIDEOS = {
  'voley-playa': `${BASE}/media/hero_voleyplaya.mp4`,
  padel: `${BASE}/media/hero_padel.mp4`,
  futbol: `${BASE}/media/hero_futbol.mp4`,
};

/**
 * Esqueleto de la aplicación.
 * Navbar + heros por deporte (Bloque 2.5) + transición + catálogo (Bloque 3) +
 * Footer, todo envuelto en <ReservasProvider> (Bloque 4).
 *
 * Los deportes (nombre + colorAcento) salen de `src/data/deportes.js`, misma
 * fuente para heros, transición y cards -> continuidad visual.
 *
 * Ids que otros componentes referencian (sin tocarlos):
 *  - #hero-placeholder    -> enlace "Inicio" del navbar
 *  - #canchas-placeholder -> enlaces "Ver canchas de..." de los DeporteHero
 */
function App() {
  return (
    <ReservasProvider>
      <div className="App">
        <Navbar />

        <div id="hero-placeholder">
          {DEPORTES.map((d) => (
            <DeporteHero
              key={d.slug}
              nombre={d.nombre}
              videoSrc={VIDEOS[d.slug]}
              tituloCTA={`Ver canchas de ${d.nombre.toLowerCase()}`}
              colorAcento={d.colorAcento}
            />
          ))}
        </div>

        <TransicionCatalogo />

        <main className="grid-container">
          <Catalogo />

          <div className="grid-x grid-padding-x">
            <section className="cell" id="reservas-placeholder">
              <h2>Reservas</h2>
              <p>
                Cada cancha del catálogo tiene su propio botón de reserva, con el
                detalle de horarios disponibles día por día.
              </p>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </ReservasProvider>
  );
}

export default App;

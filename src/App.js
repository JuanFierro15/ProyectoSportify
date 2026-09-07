import React from 'react';
import { ReservasProvider } from './context/ReservasContext';
import Navbar from './components/layout/Navbar';
import DeporteHero from './components/hero/DeporteHero';
import Catalogo from './components/canchas/Catalogo';
import Footer from './components/layout/Footer';
import './App.css';

// Videos de fondo de los heros por deporte (en public/media/).
// Son versiones web ligeras: 1080p, keyframe por frame (para que el scrubbing
// por scroll sea fluido) y +faststart. Los originales en alta calidad están
// en public/media/fuente/ (fuera del repo).
const BASE = process.env.PUBLIC_URL;
const VIDEO_VOLEY = `${BASE}/media/hero_voleyplaya.mp4`;
const VIDEO_PADEL = `${BASE}/media/hero_padel.mp4`;
const VIDEO_FUTBOL = `${BASE}/media/hero_futbol.mp4`;

/**
 * Esqueleto de la aplicación.
 * Estructura: Navbar + heros por deporte con pinning (Bloque 2.5) + contenedor
 * grid de Foundation con placeholders + Footer.
 * El contenedor de los heros lleva `id="hero-placeholder"` para que el enlace
 * "Inicio" del navbar (sin tocar) siga funcionando.
 * El catálogo (Bloque 3) conserva el id="canchas-placeholder" para los enlaces
 * "Ver canchas de..." de los DeporteHero (sin tocar).
 * Toda la app va envuelta en <ReservasProvider> (Bloque 4): disponibilidad y
 * reservas en Context + localStorage.
 */
function App() {
  return (
    <ReservasProvider>
      <div className="App">
        <Navbar />

        <div id="hero-placeholder">
          <DeporteHero
            nombre="Voley Playa"
            videoSrc={VIDEO_VOLEY}
            tituloCTA="Ver canchas de voley playa"
            colorAcento="#f6a94b"
          />
          <DeporteHero
            nombre="Pádel"
            videoSrc={VIDEO_PADEL}
            tituloCTA="Ver canchas de pádel"
            colorAcento="#3fa9f5"
          />
          <DeporteHero
            nombre="Fútbol"
            videoSrc={VIDEO_FUTBOL}
            tituloCTA="Ver canchas de fútbol"
            colorAcento="#5bd67d"
          />
        </div>

        <main className="grid-container">
          <Catalogo />

          <div className="grid-x grid-padding-x">
            <section className="cell" id="reservas-placeholder">
              <h2>Reservas</h2>
              <p>
                Las reservas se hacen desde cada cancha del catálogo con el botón
                &ldquo;Reservar&rdquo;. La disponibilidad se guarda en tu
                navegador (localStorage).
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

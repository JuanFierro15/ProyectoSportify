import React from 'react';
import { ReservasProvider } from './context/ReservasContext';
import { VistaCanchasProvider, useVistaCanchas } from './context/VistaCanchasContext';
import { DEPORTES } from './data/deportes';
import Navbar from './components/layout/Navbar';
import DeporteHero from './components/hero/DeporteHero';
import TransicionCatalogo from './components/canchas/TransicionCatalogo';
import VistaCanchas from './components/canchas/VistaCanchas';
import EventoCTA from './components/eventos/EventoCTA';
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
 * Navbar + heros por deporte (Bloque 2.5) + transición + vista superpuesta de
 * canchas (Bloque 3, rediseñado) + Footer, envuelto en <ReservasProvider>
 * (Bloque 4) y <VistaCanchasProvider> (estado de la vista de canchas).
 *
 * Los deportes (nombre + colorAcento) salen de `src/data/deportes.js`, misma
 * fuente para heros, transición, cards y la vista de canchas -> continuidad
 * visual.
 *
 * Ids que otros componentes referencian (sin tocarlos):
 *  - #hero-placeholder     -> enlace "Inicio" del navbar
 *  - #reservas-placeholder -> enlace "Reservar" del navbar (lo lleva EventoCTA)
 *
 * `#canchas-placeholder` ya NO existe en el DOM: el catálogo dejó de vivir en
 * el flujo de scroll. Los botones "Ver canchas de..." de los DeporteHero y los
 * enlaces "Canchas" del navbar/footer abren la vista superpuesta con
 * `abrirVista(slug)` de VistaCanchasContext en vez de saltar a un ancla.
 */
function App() {
  return (
    <ReservasProvider>
      <VistaCanchasProvider>
        <AppContenido />
      </VistaCanchasProvider>
    </ReservasProvider>
  );
}

function AppContenido() {
  const { abrirVista } = useVistaCanchas();

  return (
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
            eyebrow={d.eyebrow}
            descripcion={d.descripcion}
            onVerCanchas={() => abrirVista(d.slug)}
          />
        ))}
      </div>

      <TransicionCatalogo />

      <EventoCTA />

      <Footer />

      <VistaCanchas />
    </div>
  );
}

export default App;

import React from 'react';
import { ReservasProvider } from './context/ReservasContext';
import { VistaCanchasProvider, useVistaCanchas } from './context/VistaCanchasContext';
import Navbar from './components/layout/Navbar';
import PaginaInicio from './components/layout/PaginaInicio';
import VistaCanchas from './components/canchas/VistaCanchas';
import Chatbot from './components/chatbot/Chatbot';
import Footer from './components/layout/Footer';
import { esClicNormal } from './lib/rutas';
import './App.css';

// Esqueleto de la aplicación.
// Envuelve todo en <ReservasProvider> y <VistaCanchasProvider> (sincronizado
// con la ruta `/` o `/reservar/<deporte>`). El Navbar, el Footer y el
// asistente (<Chatbot>) quedan siempre montados; entre el Navbar y el Footer
// se alterna la página de inicio (<PaginaInicio />) y la página de reserva
// (<VistaCanchas key={apertura} />).
//
// Ids de anclaje de la página de inicio:
//  - #hero-placeholder -> enlace "Inicio" del navbar/footer
//  - #eventos          -> enlace "Eventos especiales" del navbar/footer (EventoCTA)
//  - #ubicacion        -> enlace "Ubicación" del navbar/footer (Ubicacion)
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
  const { deporteAbierto, apertura } = useVistaCanchas();

  const manejarSkipLink = (e) => {
    if (!esClicNormal(e)) return;
    e.preventDefault();
    const principal = document.getElementById('contenido-principal');
    if (!principal) return;
    principal.focus({ preventScroll: true });
    const prefiereReducido =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    principal.scrollIntoView?.({
      behavior: prefiereReducido ? 'auto' : 'smooth',
      block: 'start',
    });
  };

  return (
    <div className="App">
      <a
        href="#contenido-principal"
        className="skip-link"
        onClick={manejarSkipLink}
      >
        Saltar al contenido principal
      </a>

      <Navbar />

      {deporteAbierto ? <VistaCanchas key={apertura} /> : <PaginaInicio />}

      <Footer />

      <Chatbot />
    </div>
  );
}

export default App;

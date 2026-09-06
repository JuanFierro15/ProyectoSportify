import React from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/hero/Hero';
import Footer from './components/layout/Footer';
import './App.css';

/**
 * Esqueleto de la aplicación.
 * Estructura: Navbar + Hero (Bloque 2) + contenedor grid de Foundation con
 * placeholders + Footer.
 * El Hero se monta a ancho completo (fuera de `main.grid-container`) porque su
 * fondo con parallax necesita ocupar todo el viewport; conserva su
 * `id="hero-placeholder"` para el enlace "Inicio" del navbar.
 * Placeholders pendientes:
 *  - #canchas-placeholder  -> Bloque 3 (catálogo de canchas)
 *  - #reservas-placeholder -> Bloque 4 (sistema de reservas)
 */
function App() {
  return (
    <div className="App">
      <Navbar />

      <Hero />

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

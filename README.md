# Reservas de Canchas — Voley playa · Pádel · Fútbol

Proyecto final de la materia **Lenguajes para la Web**. Página web para un
local deportivo donde los usuarios pueden reservar canchas de voley playa,
pádel y fútbol, además de gestionar torneos, cumpleaños y eventos especiales.

## Stack

- **React** (Create React App)
- **Foundation** (`foundation-sites`) para la maquetación
- **GSAP + ScrollTrigger** para animaciones
- **Sin base de datos**: estado de React + `localStorage` + JSON semilla

## Scripts

```bash
npm install     # instalar dependencias
npm start       # servidor de desarrollo en http://localhost:3000
npm run build   # build de producción en /build
npm test        # tests
```

## Estructura

```
src/
├── components/
│   ├── layout/     Navbar, Footer (Bloque 1)
│   ├── hero/       DeporteHero: heros por deporte con pinning GSAP/ScrollTrigger (Bloque 2.5)
│   ├── canchas/    Catálogo de canchas (Bloque 3)
│   ├── reservas/   Sistema de reservas (Bloque 4)
│   └── chatbot/    Chatbot (Bloque 6)
├── data/           JSON semilla
├── App.js          Esqueleto: Navbar + grid con placeholders + Footer
└── index.js        Punto de entrada (importa el CSS de Foundation)
```

## Avance por bloques

1. Estructura base con Foundation (navbar, footer, grid, placeholders)
2. Animaciones GSAP/ScrollTrigger
   - 2.5 **Heros por deporte (voley playa, pádel, fútbol) con pinned sections** ← actual
3. Catálogo de canchas
4. Sistema de reservas (horarios, validación de choques, `localStorage`)
5. Modo evento especial (torneos, cumpleaños)
6. Chatbot
7. Panel de estado/admin (opcional)

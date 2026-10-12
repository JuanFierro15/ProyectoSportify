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
│   ├── canchas/    VistaCanchas: ventana de reserva a pantalla completa con Depth Carousel (Bloques 3 a 5)
│   ├── reactbits/  DepthCarousel y AccordionGallery: componentes de React Bits
│   ├── reservas/   useReserva + formulario, voucher en vivo y confirmación con QR,
│   │               que usa la vista de canchas (Bloques 4 y 5)
│   ├── eventos/    EventoCTA: sección de eventos y torneos (Bloque 5)
│   ├── ubicacion/  Ubicacion: sección "Visítanos" con dirección, teléfono, horario y mapa
│   ├── shared/     SelectorDia: tira de 7 días del formulario de reserva
│   └── chatbot/    Chatbot (Bloque 6, pendiente)
├── context/
│   ├── ReservasContext.jsx    Context + useReducer: disponibilidad por día (7 días);
│   │                          reservas "individual" y "evento" (bloqueo todo-o-nada),
│   │                          persistidas en el navegador
│   └── VistaCanchasContext.jsx  Estado de la vista de canchas (qué deporte está
│                                abierto), sincronizado con el hash de la URL
├── data/
│   ├── deportes.js    Nombre y colorAcento de cada deporte (fuente única)
│   ├── canchas.json   Semilla: horas base + ocupación por día de cada cancha
│   └── local.json     Dirección, teléfono, días de atención y mapa del local (fuente única)
├── lib/
│   ├── fechas.js         Helpers de fecha compartidos (etiquetas, meses...)
│   ├── canchas.js        Agrupar canchas por deporte, título corto de cada una
│   ├── precios.js        Reglas de precio (descuento desde 2 horas, eventos por cancha)
│   ├── horarios.js       Selección de horas: bloque de hasta 3 o rango inicio-fin
│   ├── codigoReserva.js  Código de reserva y texto del QR
│   ├── local.js          Teléfono del local (formato y enlace) y horario a partir de las franjas
│   └── validacion.js     Nombre y teléfono del formulario
├── App.js          <ReservasProvider> + <VistaCanchasProvider> + Navbar + heros + evento + ubicación + Footer
└── index.js        Punto de entrada (importa el CSS de Foundation)
```

## Cómo se reservan las canchas

Todo se reserva desde una sola ventana a pantalla completa: la vista de
canchas. Se abre desde cada hero o desde "Canchas" en el navbar/footer (modo
cancha), y desde "Reserva un evento" (modo torneo). Tiene pestañas por
deporte, un filtro "Solo con horarios libres ese día", un carrusel 3D con la
información de cada cancha, el formulario (día, horario, datos y contacto) y,
a la derecha, el voucher. La URL cambia junto con la vista
(`#canchas-<deporte>`), así que se puede compartir un enlace directo a un
deporte o usar "atrás" en el navegador para cerrarla.

La ventana tiene tres modos:

- **Cancha**: se elige la cancha en el carrusel y de 1 a 3 horas seguidas;
  desde 2 horas hay $5.000 menos por hora y un pack de agua gratis.
- **Torneo / Cumpleaños**: se agregan una o varias canchas desde el carrusel
  y se toca la hora de inicio y la de fin: quedan elegidas todas las de en
  medio. El bloqueo es todo-o-nada y el precio sigue las mismas reglas por
  cancha.

Un voucher a la derecha muestra el total en vivo. Al confirmar se ve un
código de reserva y un QR con los datos (tipo, fecha, horario, canchas, a
nombre de quién y total) para mostrarlo al llegar. Sin backend, el QR lleva la
información dentro; comprobarlo contra las reservas guardadas queda para el
panel de administración.

## Ubicación y contacto

La sección "Visítanos" (`#ubicacion`, enlazada desde el navbar y el footer)
muestra la dirección, el teléfono (con enlace para llamar), el horario y un
mapa de Google con el botón "Cómo llegar". Los datos salen de
`src/data/local.json` y el horario se calcula de las franjas de
`canchas.json` (de la primera a la última hora reservable), así que el footer
y la sección siempre coinciden.

## Avance por bloques

1. ✅ Estructura base con Foundation (navbar, footer, grid, placeholders)
2. ✅ Animaciones GSAP/ScrollTrigger
   - 2.5 ✅ Heros por deporte (voley playa, pádel, fútbol) con pinned sections
3. ✅ Catálogo de canchas — vista superpuesta con Depth Carousel
4. ✅ Sistema de reservas (horarios, validación de choques, `localStorage`)
5. ✅ Modo evento especial: torneos y cumpleaños (varias canchas + franja consecutiva, bloqueo todo-o-nada)
6. Chatbot ← siguiente
7. Panel de estado/admin (opcional)

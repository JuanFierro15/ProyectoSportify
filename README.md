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
│   ├── canchas/    VistaCanchas: vista superpuesta con Depth Carousel (Bloque 3, rediseñado)
│   ├── reactbits/  DepthCarousel y AccordionGallery: componentes de React Bits
│   ├── reservas/   ModalReserva: un solo modal para cancha, torneo y cumpleaños, con carrusel,
│   │               voucher en vivo y confirmación con QR (Bloques 4 y 5)
│   ├── eventos/    EventoCTA: sección de eventos y torneos (Bloque 5)
│   ├── shared/     SelectorDia: tira de 7 días del modal de reserva
│   └── chatbot/    Chatbot (Bloque 6, pendiente)
├── context/
│   ├── ReservasContext.jsx    Context + useReducer: disponibilidad por día (7 días);
│   │                          reservas "individual" y "evento" (bloqueo todo-o-nada),
│   │                          persistidas en el navegador
│   └── VistaCanchasContext.jsx  Estado de la vista de canchas (qué deporte está
│                                abierto), sincronizado con el hash de la URL
├── data/
│   ├── deportes.js    Nombre y colorAcento de cada deporte (fuente única)
│   └── canchas.json   Semilla: horas base + ocupación por día de cada cancha
├── lib/
│   ├── fechas.js         Helpers de fecha compartidos (etiquetas, meses...)
│   ├── canchas.js        Agrupar canchas por deporte, título corto de cada una
│   ├── precios.js        Reglas de precio (descuento desde 2 horas, eventos por cancha)
│   ├── horarios.js       Selección de horas: bloque de hasta 3 o rango inicio-fin
│   ├── codigoReserva.js  Código de reserva y texto del QR
│   └── validacion.js     Nombre y teléfono del formulario
├── App.js          <ReservasProvider> + <VistaCanchasProvider> + Navbar + heros + evento + Footer
└── index.js        Punto de entrada (importa el CSS de Foundation)
```

## Cómo se reservan las canchas

Desde cada hero (o desde "Canchas" en el navbar/footer) se abre una vista a
pantalla completa con pestañas por deporte, un filtro de disponibilidad de
hoy y un carrusel 3D (o un grid, si el deporte tiene pocas canchas) con el
panel de precio y horarios de cada una. La URL cambia junto con la vista
(`#canchas-<deporte>`), así que se puede compartir un enlace directo a un
deporte o usar "atrás" en el navegador para cerrarla.

Tanto "Reservar" (desde una cancha) como "Reserva un evento" abren el mismo
modal, con tres modos:

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

## Avance por bloques

1. ✅ Estructura base con Foundation (navbar, footer, grid, placeholders)
2. ✅ Animaciones GSAP/ScrollTrigger
   - 2.5 ✅ Heros por deporte (voley playa, pádel, fútbol) con pinned sections
3. ✅ Catálogo de canchas — vista superpuesta con Depth Carousel
4. ✅ Sistema de reservas (horarios, validación de choques, `localStorage`)
5. ✅ Modo evento especial: torneos y cumpleaños (varias canchas + franja consecutiva, bloqueo todo-o-nada)
6. Chatbot ← siguiente
7. Panel de estado/admin (opcional)

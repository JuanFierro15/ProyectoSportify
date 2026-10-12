# Reservas de Canchas — Voley playa · Pádel · Fútbol

Proyecto final de la materia **Lenguajes para la Web**. Página web para un
local deportivo donde los usuarios pueden reservar canchas de voley playa,
pádel y fútbol, además de gestionar torneos, cumpleaños y eventos especiales.

## Stack

- **React** (Create React App)
- **Foundation** (`foundation-sites`) para la maquetación
- **GSAP + ScrollTrigger** para animaciones
- **Sin base de datos**: estado de React + `localStorage` + JSON semilla
- **Chatbot**: función de servidor en Vercel (`/api/chat`) con Gemini
  (`@google/genai`); la función no guarda nada

## Scripts

```bash
npm install     # instalar dependencias
npm start       # servidor de desarrollo en http://localhost:3000 (sin /api)
vercel dev      # sitio + /api/chat en local (necesita el proyecto enlazado y .env.local)
npm run build   # build de producción en /build
npm test        # tests
node scripts/probar-chat.mjs [url]  # casos de prueba del chat (por defecto, localhost:3000)
```

## Estructura

```
api/
├── chat.js         POST /api/chat: valida la petición, llama a Gemini una vez y
│                   convierte su respuesta en texto, sugerencias y una acción propuesta
└── _lib/           Validación de la petición, instrucciones del asistente y funciones
scripts/
└── probar-chat.mjs Casos de prueba de /api/chat
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
│   └── chatbot/    Asistente (Bloque 6): botón flotante + panel en todas las vistas,
│                   con useChatbot (conversación), useDeporteActivo (acento) y
│                   useAccionesChat (botones que abren canchas, eventos o ubicación)
├── context/
│   ├── ReservasContext.jsx    Context + useReducer: disponibilidad por día (7 días);
│   │                          reservas "individual" y "evento" (bloqueo todo-o-nada)
│   │                          y cancelación de las individuales, persistidas en el navegador
│   └── VistaCanchasContext.jsx  Estado de la vista de canchas (qué deporte está
│                                abierto), sincronizado con el hash de la URL
├── data/
│   ├── deportes.js    Nombre y colorAcento de cada deporte (fuente única)
│   ├── canchas.json   Semilla: horas base + ocupación por día de cada cancha
│   └── negocio.json   Datos del local (fuente única): contacto, mapa, pagos, cancelación,
│                      servicios y tipos de evento; lo usan el sitio y el chat
├── lib/
│   ├── fechas.js         Helpers de fecha compartidos (etiquetas, meses...)
│   ├── canchas.js        Agrupar canchas por deporte, título corto de cada una
│   ├── precios.js        Reglas de precio (descuento desde 2 horas, eventos por cancha)
│   ├── horarios.js       Selección de horas: bloque de hasta 3 o rango inicio-fin
│   ├── codigoReserva.js  Código de reserva y texto del QR
│   ├── chat.js           Contexto que el chat envía (franjas libres de 7 días), historial,
│   │                     validación de la respuesta, sí/no y textos fijos
│   ├── cancelacion.js    Cancelación de reservas: plazo, estado resultante y búsqueda
│   ├── negocio.js        Teléfono del local (formato y enlace) y horario a partir de las franjas
│   └── validacion.js     Nombre y teléfono (formulario y chat) y validación de una
│                         reserva propuesta desde el chat
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
`src/data/negocio.json` y el horario se calcula de las franjas de
`canchas.json` (de la primera a la última hora reservable), así que el footer
y la sección siempre coinciden.

## Chatbot (Bloque 6)

El asistente responde preguntas sobre el local (horarios libres, precios,
servicios, pagos, cancelación, ubicación) y propone acciones; nunca reserva
por su cuenta.

- **El navegador es la única fuente de verdad.** En cada mensaje envía a
  `/api/chat` el historial reciente y las franjas libres de hoy y los 6 días
  siguientes. La función no guarda estado.
- **Una sola llamada a Gemini por mensaje.** La información del local
  (`negocio.json`), los precios (`canchas.json`, `precios.js`) y la
  disponibilidad van en las instrucciones del modelo.
- **El modelo propone, el código valida.** Cuando el usuario quiere reservar,
  cancelar o ver una sección, Gemini llama una función; el servidor valida los
  datos con `src/lib/validacion.js` (el mismo módulo del formulario) y
  devuelve una acción propuesta que el sitio ejecuta solo si el usuario
  confirma. Si algo no es válido, responde un mensaje fijo sin volver a llamar
  al modelo.

En el sitio, el asistente es un botón flotante abajo a la derecha que abre un
panel (a pantalla completa en el celular). Está disponible en todas las
vistas, también encima de la ventana de reserva, y la conversación se
conserva al abrir y cerrar esa ventana y al recargar la pestaña ("Nueva
conversación" la borra). Toma el color del deporte que se está viendo y,
cuando la respuesta lo amerita, muestra un botón para abrir las canchas, la
reserva de eventos o la sección de ubicación.

También reserva y cancela canchas, siempre con una confirmación explícita:

- **Reservar**: cuando tiene cancha, fecha, horas seguidas (1 a 3), nombre y
  teléfono, muestra una tarjeta con el resumen y el total. La reserva se hace
  solo al tocar "Confirmar" o responder "sí", con la misma función que el
  formulario: si alguna franja se ocupó entretanto, no reserva nada y ofrece
  las otras libres. Después muestra el código, el abono y un botón para ver
  el comprobante con el QR.
- **Cancelar**: busca las reservas futuras con el mismo nombre y teléfono
  (las hechas sin teléfono no se pueden encontrar; en ese caso sugiere llamar
  al local) y, tras confirmar, libera la franja. No cancela eventos ni
  reservas a menos de 6 horas de empezar (política en `negocio.json`).

### Configurar la key

1. Crea una API key en [Google AI Studio](https://aistudio.google.com/apikey)
   ("Create API key").
2. En Vercel, agrégala al proyecto como variable secreta, junto con el modelo:
   ```bash
   vercel env add GEMINI_API_KEY production,preview --sensitive
   vercel env add GEMINI_MODEL production,preview --value gemini-3.5-flash-lite --no-sensitive
   ```
   También se puede hacer en *Settings → Environment Variables* del proyecto.
   Las variables nuevas aplican desde el siguiente deploy.
3. En local, copia `.env.example` a `.env.local` y pon tu key. Nunca uses el
   prefijo `REACT_APP_`: esas variables quedan dentro del bundle público.

### Probar en local

`npm start` solo sirve el sitio: no ejecuta las funciones de `/api`. Para
probar el chat usa `vercel dev` (con el proyecto enlazado mediante
`vercel link`), que levanta el sitio y `/api/chat` en `http://localhost:3000`.
`vercel dev` no le pasa a las funciones lo que hay en `.env.local`, pero sí
las variables del entorno de la terminal, así que cárgalas antes (Git Bash):

```bash
set -a; . <(tr -d '\r' < .env.local); set +a; vercel dev
```

Después corre `node scripts/probar-chat.mjs` para ver las respuestas de los
casos de prueba. No lo corras junto a `npm start`.

## Avance por bloques

1. ✅ Estructura base con Foundation (navbar, footer, grid, placeholders)
2. ✅ Animaciones GSAP/ScrollTrigger
   - 2.5 ✅ Heros por deporte (voley playa, pádel, fútbol) con pinned sections
3. ✅ Catálogo de canchas — vista superpuesta con Depth Carousel
4. ✅ Sistema de reservas (horarios, validación de choques, `localStorage`)
5. ✅ Modo evento especial: torneos y cumpleaños (varias canchas + franja consecutiva, bloqueo todo-o-nada)
6. ✅ Chatbot: datos del negocio y `/api/chat`, widget en todas las vistas, y reservas y cancelaciones desde el chat
7. Panel de estado/admin (opcional)

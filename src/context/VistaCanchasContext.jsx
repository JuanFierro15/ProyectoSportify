import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { DEPORTES } from '../data/deportes';
import { MODOS } from '../components/reservas/useReserva';
import { leerRuta, rutaReserva } from '../lib/rutas';

// Estado de navegación entre la página de inicio (`/`) y la página de reserva
// (`/reservar/<deporte>`), sincronizado con la History API:
// - `abrirVista(slug, { modo })`: guarda el scroll actual del inicio en la
//   entrada de historial, navega a `/reservar/<slug>` (con `?modo=` si es
//   evento; si ya se está en la página, reemplaza la entrada) e incrementa
//   `apertura` para reiniciar la página de reserva.
// - `cambiarDeporte(slug)`: cambia de pestaña dentro de la página de reserva
//   con `replaceState` (conservando `?modo`) para no apilar entradas.
// - `actualizarModo(modo)`: sincroniza `?modo=` en la URL con `replaceState`
//   cuando el usuario cambia entre cancha, torneo y cumpleaños.
// - `cerrarVista()`: vuelve al inicio con `history.back()` si se llegó desde
//   el inicio en esta sesión, o con `pushState('/')` si se entró por enlace
//   directo, recordando a qué altura de scroll regresar.
// - `irASeccion(id)`: desplaza a la sección si ya se está en el inicio, o
//   deja la sección como destino pendiente y vuelve al inicio.

const SLUGS_VALIDOS = DEPORTES.map((d) => d.slug);
const MODOS_VALIDOS = MODOS.map((m) => m.valor);
const OPCIONES_RUTA = { slugs: SLUGS_VALIDOS, modos: MODOS_VALIDOS };

function leerRutaActual() {
  if (typeof window === 'undefined') {
    return { deporte: null, modo: 'cancha', redirigir: null };
  }
  return leerRuta(window.location, OPCIONES_RUTA);
}

const VistaCanchasContext = createContext(null);

export function VistaCanchasProvider({ children }) {
  const rutaInicial = leerRutaActual();
  const [deporteAbierto, setDeporteAbierto] = useState(rutaInicial.deporte);
  const [modoInicial, setModoInicial] = useState(rutaInicial.modo);
  const [apertura, setApertura] = useState(0);

  const deporteAbiertoRef = useRef(deporteAbierto);
  deporteAbiertoRef.current = deporteAbierto;

  const desdeInicioRef = useRef(false);
  const destinoInicioRef = useRef(null);

  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
    const inicial = leerRutaActual();
    if (inicial.redirigir) {
      window.history.replaceState(null, '', inicial.redirigir);
    }

    const onPopState = (event) => {
      const siguiente = leerRutaActual();
      const estabaEnReserva = Boolean(deporteAbiertoRef.current);

      if (estabaEnReserva && !siguiente.deporte) {
        desdeInicioRef.current = false;
        if (!destinoInicioRef.current?.seccion) {
          destinoInicioRef.current = { y: event.state?.inicioScrollY ?? 0 };
        }
      } else if (!estabaEnReserva && !siguiente.deporte) {
        return;
      } else if (!estabaEnReserva && siguiente.deporte) {
        desdeInicioRef.current = true;
      }

      deporteAbiertoRef.current = siguiente.deporte;
      setDeporteAbierto(siguiente.deporte);
      setModoInicial(siguiente.modo);
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const abrirVista = useCallback((slug, { modo = 'cancha' } = {}) => {
    if (!SLUGS_VALIDOS.includes(slug)) return;
    const modoValido = MODOS_VALIDOS.includes(modo) ? modo : 'cancha';

    if (!deporteAbiertoRef.current) {
      desdeInicioRef.current = true;
      window.history.replaceState(
        { ...window.history.state, inicioScrollY: window.scrollY },
        ''
      );
    }

    // Ya en la página de reserva (p. ej. el asistente abre eventos): se
    // reemplaza la entrada en vez de apilar otra, para que "Volver al inicio"
    // (history.back) siga llevando al inicio y no a la reserva anterior.
    const metodo = deporteAbiertoRef.current ? 'replaceState' : 'pushState';
    window.history[metodo]({ vistaCanchas: true }, '', rutaReserva(slug, modoValido));
    deporteAbiertoRef.current = slug;
    setModoInicial(modoValido);
    setDeporteAbierto(slug);
    setApertura((n) => n + 1);
  }, []);

  const cambiarDeporte = useCallback((slug) => {
    if (!SLUGS_VALIDOS.includes(slug)) return;
    const { modo } = leerRutaActual();
    window.history.replaceState(
      { vistaCanchas: true },
      '',
      rutaReserva(slug, modo)
    );
    deporteAbiertoRef.current = slug;
    setDeporteAbierto(slug);
  }, []);

  const actualizarModo = useCallback((modo) => {
    const slugActual = deporteAbiertoRef.current;
    if (!slugActual) return;
    const modoValido = MODOS_VALIDOS.includes(modo) ? modo : 'cancha';
    window.history.replaceState(
      { ...window.history.state, vistaCanchas: true },
      '',
      rutaReserva(slugActual, modoValido)
    );
  }, []);

  const cerrarVista = useCallback(() => {
    if (window.history.state?.vistaCanchas && desdeInicioRef.current) {
      window.history.back();
    } else {
      desdeInicioRef.current = false;
      if (!destinoInicioRef.current) {
        destinoInicioRef.current = { y: 0 };
      }
      window.history.pushState(null, '', '/');
      deporteAbiertoRef.current = null;
      setDeporteAbierto(null);
      setModoInicial('cancha');
    }
  }, []);

  const irASeccion = useCallback(
    (id) => {
      if (!deporteAbiertoRef.current) {
        const prefiereReducido =
          typeof window !== 'undefined' &&
          typeof window.matchMedia === 'function' &&
          window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        document.getElementById(id)?.scrollIntoView({
          behavior: prefiereReducido ? 'auto' : 'smooth',
          block: 'start',
        });
        return;
      }
      destinoInicioRef.current = { seccion: id };
      cerrarVista();
    },
    [cerrarVista]
  );

  const leerDestinoInicio = useCallback(() => destinoInicioRef.current, []);

  const limpiarDestinoInicio = useCallback(() => {
    destinoInicioRef.current = null;
  }, []);

  const value = useMemo(
    () => ({
      deporteAbierto,
      modoInicial,
      apertura,
      abrirVista,
      cambiarDeporte,
      actualizarModo,
      cerrarVista,
      irASeccion,
      leerDestinoInicio,
      limpiarDestinoInicio,
    }),
    [
      deporteAbierto,
      modoInicial,
      apertura,
      abrirVista,
      cambiarDeporte,
      actualizarModo,
      cerrarVista,
      irASeccion,
      leerDestinoInicio,
      limpiarDestinoInicio,
    ]
  );

  return (
    <VistaCanchasContext.Provider value={value}>
      {children}
    </VistaCanchasContext.Provider>
  );
}

export function useVistaCanchas() {
  const ctx = useContext(VistaCanchasContext);
  if (!ctx) {
    throw new Error('useVistaCanchas debe usarse dentro de <VistaCanchasProvider>');
  }
  return ctx;
}

export default VistaCanchasContext;

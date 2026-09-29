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

/**
 * VistaCanchasContext — estado de la vista superpuesta de canchas (Bloque 3
 * rediseñado): qué deporte está abierto, si hay alguno, y su sincronización
 * con el hash de la URL (para que "atrás" y los enlaces directos funcionen).
 *
 * - `abrirVista(slug)`: usada por los CTA de los heros y el navbar/footer.
 *   Guarda qué elemento tenía el foco (para devolvérselo al cerrar) y añade
 *   una entrada nueva al historial (`#canchas-<slug>`).
 * - `cambiarDeporte(slug)`: usada por las pestañas DENTRO de la vista ya
 *   abierta. Actualiza el hash sin apilar una entrada nueva, para que el
 *   botón "atrás" cierre la vista de un solo paso sin importar cuántas
 *   pestañas se hayan visitado.
 * - `cerrarVista()`: si la vista se abrió en esta sesión (hay una entrada de
 *   historial propia), retrocede -> dispara `popstate` -> lo cierra. Si la
 *   página cargó directamente con el hash (enlace directo), no hay a dónde
 *   retroceder: limpia el estado y el hash a mano.
 * - `restaurarFoco()`: la llama VistaCanchas cuando termina su animación de
 *   salida, para devolver el foco al botón que abrió la vista.
 */

const SLUGS_VALIDOS = DEPORTES.map((d) => d.slug);

function leerDeporteDesdeHash() {
  if (typeof window === 'undefined') return null;
  const m = /^#canchas-([a-z-]+)$/.exec(window.location.hash);
  return m && SLUGS_VALIDOS.includes(m[1]) ? m[1] : null;
}

const VistaCanchasContext = createContext(null);

export function VistaCanchasProvider({ children }) {
  const [deporteAbierto, setDeporteAbierto] = useState(leerDeporteDesdeHash);
  const focoPrevioRef = useRef(null);

  useEffect(() => {
    const onPopState = () => setDeporteAbierto(leerDeporteDesdeHash());
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const abrirVista = useCallback((slug) => {
    if (!SLUGS_VALIDOS.includes(slug)) return;
    focoPrevioRef.current = document.activeElement;
    setDeporteAbierto(slug);
    window.history.pushState({ vistaCanchas: slug }, '', `#canchas-${slug}`);
  }, []);

  const cambiarDeporte = useCallback((slug) => {
    if (!SLUGS_VALIDOS.includes(slug)) return;
    setDeporteAbierto(slug);
    window.history.replaceState({ vistaCanchas: slug }, '', `#canchas-${slug}`);
  }, []);

  const cerrarVista = useCallback(() => {
    if (window.history.state && window.history.state.vistaCanchas) {
      window.history.back();
    } else {
      setDeporteAbierto(null);
      if (/^#canchas-/.test(window.location.hash)) {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      }
    }
  }, []);

  const restaurarFoco = useCallback(() => {
    const el = focoPrevioRef.current;
    focoPrevioRef.current = null;
    if (el && typeof el.focus === 'function' && document.contains(el)) {
      el.focus();
    }
  }, []);

  const value = useMemo(
    () => ({ deporteAbierto, abrirVista, cambiarDeporte, cerrarVista, restaurarFoco }),
    [deporteAbierto, abrirVista, cambiarDeporte, cerrarVista, restaurarFoco]
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

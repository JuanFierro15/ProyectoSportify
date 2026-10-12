import { useCallback } from 'react';
import { useVistaCanchas } from '../../context/VistaCanchasContext';
import { DEPORTES } from '../../data/deportes';

// Navegación de la acción ABRIR_SECCION, reutilizando la del sitio
// (abrirVista, cambiarDeporte, cerrarVista). Para eventos y ubicación, si la
// vista está abierta primero se cierra y se espera a que termine su animación
// de salida: abrirVista no cambia de modo con la vista ya abierta, y el scroll
// de la página sigue bloqueado mientras la vista está montada.

// Se resuelve cuando la vista ya no está en el DOM (o tras 2 s como máximo).
function esperarCierreVista() {
  return new Promise((resolve) => {
    const inicio = Date.now();
    const verificar = () => {
      if (
        typeof document === 'undefined' ||
        !document.querySelector('.vista-canchas') ||
        Date.now() - inicio >= 2000
      ) {
        resolve();
        return;
      }
      requestAnimationFrame(verificar);
    };
    requestAnimationFrame(verificar);
  });
}

export default function useAccionesChat() {
  const { deporteAbierto, abrirVista, cambiarDeporte, cerrarVista } = useVistaCanchas();

  const cerrarVistaSiHaceFalta = useCallback(async () => {
    if (deporteAbierto) {
      cerrarVista();
      if (typeof document !== 'undefined' && document.querySelector('.vista-canchas')) {
        await esperarCierreVista();
      }
    }
  }, [deporteAbierto, cerrarVista]);

  const irACanchas = useCallback(
    (slug) => {
      if (deporteAbierto) {
        cambiarDeporte(slug);
      } else {
        abrirVista(slug);
      }
    },
    [deporteAbierto, cambiarDeporte, abrirVista]
  );

  const irAEventos = useCallback(async () => {
    await cerrarVistaSiHaceFalta();
    abrirVista(DEPORTES[0].slug, { modo: 'torneo' });
  }, [cerrarVistaSiHaceFalta, abrirVista]);

  const irAUbicacion = useCallback(async () => {
    await cerrarVistaSiHaceFalta();
    const prefiereReducir =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const elemento = typeof document !== 'undefined' ? document.getElementById('ubicacion') : null;
    if (elemento) {
      elemento.scrollIntoView({
        behavior: prefiereReducir ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [cerrarVistaSiHaceFalta]);

  return {
    irACanchas,
    irAEventos,
    irAUbicacion,
  };
}

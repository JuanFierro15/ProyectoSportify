import { useState, useEffect, useRef, useCallback } from 'react';
import { useReservas } from '../../context/ReservasContext';
import {
  CLAVE_SESION,
  MAX_MENSAJE,
  TEXTO_ERROR_CHAT,
  crearId,
  mensajeBienvenida,
  contextoChat,
  historialParaEnviar,
  normalizarRespuesta,
  parsearConversacion,
} from '../../lib/chat';

// Estado del chat: mensajes (persistidos en sessionStorage, con respaldo en
// memoria), envío a /api/chat con el contexto de disponibilidad del sitio,
// espera y error. Solo lee de useReservas; nunca envía reservas ni datos
// personales en el contexto.
export default function useChatbot() {
  const { dias, canchas, disponibilidad } = useReservas();

  const [mensajes, setMensajes] = useState(() => {
    try {
      if (typeof window !== 'undefined') {
        const guardado = window.sessionStorage.getItem(CLAVE_SESION);
        const parseado = parsearConversacion(guardado);
        if (parseado) {
          return parseado;
        }
      }
    } catch {
      // Si falla la lectura, se inicia con el mensaje por defecto.
    }
    return [mensajeBienvenida()];
  });

  const [esperando, setEsperando] = useState(false);
  const [error, setError] = useState(false);

  const peticionEnCursoRef = useRef(false);
  // Sube con cada "Nueva conversación": una respuesta que llega de una
  // conversación ya reiniciada se descarta.
  const generacionRef = useRef(0);
  const abortControllerRef = useRef(null);
  const timeoutIdRef = useRef(null);
  const mensajesRef = useRef(mensajes);
  mensajesRef.current = mensajes;

  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify(mensajes));
      }
    } catch {
      // Si la sesión no permite escritura, el estado persiste en memoria.
    }
  }, [mensajes]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, []);

  const enviar = useCallback(
    async (texto) => {
      const textoLimpio = typeof texto === 'string' ? texto.trim() : '';
      if (!textoLimpio || peticionEnCursoRef.current) {
        return;
      }

      const mensaje = textoLimpio.slice(0, MAX_MENSAJE);
      const historial = historialParaEnviar(mensajesRef.current);
      const generacion = generacionRef.current;

      peticionEnCursoRef.current = true;
      setEsperando(true);
      setError(false);

      const mensajeUsuario = {
        id: crearId(),
        rol: 'usuario',
        texto: mensaje,
      };
      setMensajes((prev) => [...prev, mensajeUsuario]);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 20000);
      timeoutIdRef.current = timeoutId;

      try {
        const contexto = contextoChat({ dias, canchas, disponibilidad });
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mensaje,
            historial,
            contexto,
          }),
          signal: controller.signal,
        });

        let json = null;
        try {
          json = await res.json();
        } catch {
          json = null;
        }
        if (generacion !== generacionRef.current) return;

        const respuestaNormalizada = normalizarRespuesta(json);
        if (respuestaNormalizada) {
          setMensajes((prev) => [
            ...prev,
            {
              id: crearId(),
              rol: 'bot',
              texto: respuestaNormalizada.respuesta,
              sugerencias: respuestaNormalizada.sugerencias,
              accion: respuestaNormalizada.accion,
            },
          ]);
        } else {
          setError(true);
          setMensajes((prev) => [
            ...prev,
            {
              id: crearId(),
              rol: 'bot',
              texto: TEXTO_ERROR_CHAT,
              sugerencias: [],
              accion: null,
              error: true,
            },
          ]);
        }
      } catch {
        // Abortada por "Nueva conversación": no se agrega nada.
        if (generacion !== generacionRef.current) return;
        setError(true);
        setMensajes((prev) => [
          ...prev,
          {
            id: crearId(),
            rol: 'bot',
            texto: TEXTO_ERROR_CHAT,
            sugerencias: [],
            accion: null,
            error: true,
          },
        ]);
      } finally {
        clearTimeout(timeoutId);
        if (timeoutIdRef.current === timeoutId) {
          timeoutIdRef.current = null;
        }
        if (abortControllerRef.current === controller) {
          abortControllerRef.current = null;
        }
        // Si se reinició, reiniciar() ya liberó el envío (y puede haber otro
        // en curso): no se toca.
        if (generacion === generacionRef.current) {
          peticionEnCursoRef.current = false;
          setEsperando(false);
        }
      }
    },
    [dias, canchas, disponibilidad]
  );

  const reiniciar = useCallback(() => {
    generacionRef.current += 1;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    peticionEnCursoRef.current = false;
    setEsperando(false);
    setError(false);
    setMensajes([mensajeBienvenida()]);
    try {
      if (typeof window !== 'undefined') {
        window.sessionStorage.removeItem(CLAVE_SESION);
      }
    } catch {
      // Ignora error si no es posible limpiar el almacenamiento.
    }
  }, []);

  return {
    mensajes,
    enviar,
    esperando,
    error,
    reiniciar,
  };
}

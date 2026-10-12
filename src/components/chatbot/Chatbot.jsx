import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { gsap } from 'gsap';
import { MessageCircle, X, RotateCcw, Send } from 'lucide-react';
import useChatbot from './useChatbot';
import useDeporteActivo from './useDeporteActivo';
import { deportePorSlug } from '../../data/deportes';
import { estiloAcento } from '../../lib/canchas';
import { MAX_MENSAJE } from '../../lib/chat';
import MensajeChat from './MensajeChat';
import ConfirmacionReserva from '../reservas/ConfirmacionReserva';
import './Chatbot.css';

// Asistente Sportify: botón flotante + panel, en un portal a document.body.
// Se monta una sola vez en App.js, así que la conversación (useChatbot) se
// conserva al abrir y cerrar la vista de canchas. El acento sigue al deporte
// activo (useDeporteActivo); sin deporte, los tokens de marca de App.css.
// El panel sigue montado mientras anima su salida, como VistaCanchas.
function Chatbot() {
  const {
    mensajes,
    enviar,
    esperando,
    reiniciar,
    confirmarTarjeta,
    rechazarTarjeta,
    elegirReserva,
  } = useChatbot();
  const slug = useDeporteActivo();

  const [abierto, setAbierto] = useState(false);
  const [montado, setMontado] = useState(false);
  const [texto, setTexto] = useState('');
  const [comprobante, setComprobante] = useState(null);

  const panelRef = useRef(null);
  const botonRef = useRef(null);
  const inputRef = useRef(null);
  const listaRef = useRef(null);
  const comprobanteRef = useRef(null);
  const comprobantePrevioRef = useRef(false);
  const entrarRef = useRef(null);
  const salirRef = useRef(null);
  const abiertoRef = useRef(abierto);
  abiertoRef.current = abierto;

  const deporte = slug ? deportePorSlug(slug) : null;
  const acento = deporte?.colorAcento;

  const abrir = useCallback(() => {
    setMontado(true);
    setAbierto(true);
  }, []);

  const cerrar = useCallback(() => {
    setAbierto(false);
    setComprobante(null);
  }, []);

  const alternar = useCallback(() => {
    if (abierto) {
      cerrar();
    } else {
      abrir();
    }
  }, [abierto, cerrar, abrir]);

  // Con el panel a pantalla completa (móvil), usar un botón de sección lo
  // cierra para que se vea la sección; en escritorio queda abierto encima.
  const alUsarAccion = useCallback(() => {
    if (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(max-width: 39.9375em)').matches
    ) {
      cerrar();
    }
  }, [cerrar]);

  // Al montar el panel se preparan la entrada y la salida dentro de un
  // gsap.context (revert al desmontar). Con movimiento reducido no hay tweens.
  useEffect(() => {
    if (!montado) return undefined;
    const panel = panelRef.current;
    if (!panel) return undefined;

    const prefiereReducido =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefiereReducido) {
      entrarRef.current = () => inputRef.current?.focus();
      salirRef.current = (onDone) => onDone();
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.set(panel, { autoAlpha: 0, y: 16, scale: 0.96, transformOrigin: 'bottom right' });
    }, panelRef);

    // overwrite: una entrada a mitad de la salida (o al revés) reemplaza la
    // animación en curso en vez de competir con ella.
    // El foco va al input al terminar la entrada: con autoAlpha 0 el panel
    // está en visibility: hidden y un focus() antes no tendría efecto.
    entrarRef.current = () => {
      ctx.add(() => {
        gsap.to(panel, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.25,
          ease: 'power2.out',
          overwrite: true,
          onComplete: () => inputRef.current?.focus(),
        });
      });
    };
    salirRef.current = (onDone) => {
      ctx.add(() => {
        gsap.to(panel, { autoAlpha: 0, y: 16, scale: 0.96, duration: 0.18, ease: 'power2.in', overwrite: true, onComplete: onDone });
      });
    };

    return () => {
      entrarRef.current = null;
      salirRef.current = null;
      ctx.revert();
    };
  }, [montado]);

  // Abrir anima la entrada (también si el panel estaba saliendo). Cerrar anima
  // la salida y solo desmonta si al terminar sigue cerrado; entonces el foco
  // vuelve al botón flotante.
  useEffect(() => {
    if (!montado) return;
    if (abierto) {
      entrarRef.current?.();
      return;
    }
    const alTerminar = () => {
      if (abiertoRef.current) return;
      setMontado(false);
      botonRef.current?.focus();
    };
    if (salirRef.current) {
      salirRef.current(alTerminar);
    } else {
      alTerminar();
    }
  }, [abierto, montado]);

  useEffect(() => {
    if (listaRef.current) {
      listaRef.current.scrollTop = listaRef.current.scrollHeight;
    }
  }, [mensajes, esperando, montado]);

  useEffect(() => {
    if (comprobante) {
      comprobanteRef.current?.focus();
      comprobantePrevioRef.current = true;
    } else if (comprobantePrevioRef.current) {
      comprobantePrevioRef.current = false;
      inputRef.current?.focus();
    }
  }, [comprobante]);

  // Escape: si hay comprobante abierto, lo cierra (y stopPropagation); si no,
  // cierra el panel. stopPropagation evita que llegue al listener de window con
  // el que la vista de canchas también se cierra con Escape.
  const manejarKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      if (comprobante) {
        setComprobante(null);
      } else {
        cerrar();
      }
    }
  };

  const manejarEnvio = (e) => {
    e.preventDefault();
    const textoLimpio = texto.trim();
    if (!textoLimpio || esperando) return;
    enviar(textoLimpio);
    setTexto('');
    inputRef.current?.focus();
  };

  const ultimoMensaje = mensajes[mensajes.length - 1];
  const mostrarSugerencias =
    !esperando &&
    ultimoMensaje?.rol === 'bot' &&
    Array.isArray(ultimoMensaje.sugerencias) &&
    ultimoMensaje.sugerencias.length > 0;

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div
      className={`chatbot${abierto ? ' chatbot--abierto' : ''}`}
      data-sport={slug || undefined}
      style={acento ? estiloAcento(acento) : undefined}
    >
      <button
        ref={botonRef}
        type="button"
        className="chatbot__boton"
        aria-label={abierto ? 'Cerrar asistente' : 'Abrir asistente'}
        aria-expanded={abierto}
        aria-controls="chatbot-panel"
        onClick={alternar}
      >
        {abierto ? (
          <X size={26} aria-hidden="true" />
        ) : (
          <MessageCircle size={26} aria-hidden="true" />
        )}
      </button>

      {montado && (
        <section
          id="chatbot-panel"
          ref={panelRef}
          className="chatbot__panel"
          role="dialog"
          aria-labelledby="chatbot-titulo"
          onKeyDown={manejarKeyDown}
        >
          <header className="chatbot__cabecera">
            <h2 id="chatbot-titulo" className="chatbot__titulo">
              Asistente Sportify
            </h2>
            <div className="chatbot__cabecera-acciones">
              <button
                type="button"
                className="chatbot__cabecera-boton"
                aria-label="Nueva conversación"
                title="Nueva conversación"
                onClick={() => {
                  reiniciar();
                  setComprobante(null);
                  inputRef.current?.focus();
                }}
              >
                <RotateCcw size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="chatbot__cabecera-boton"
                aria-label="Cerrar asistente"
                onClick={cerrar}
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
          </header>

          {comprobante ? (
            <div
              className="chatbot__comprobante"
              tabIndex={-1}
              ref={comprobanteRef}
            >
              <ConfirmacionReserva
                codigo={comprobante.codigo}
                textoQr={comprobante.textoQr}
                resumen={comprobante.resumen}
                onListo={() => setComprobante(null)}
              />
            </div>
          ) : (
            <>
              <ol className="chatbot__mensajes" aria-live="polite" ref={listaRef}>
                {mensajes.map((m) => (
                  <MensajeChat
                    key={m.id}
                    mensaje={m}
                    onAccion={alUsarAccion}
                    onConfirmarTarjeta={confirmarTarjeta}
                    onRechazarTarjeta={rechazarTarjeta}
                    onElegirReserva={elegirReserva}
                    onVerComprobante={setComprobante}
                  />
                ))}
                {esperando && (
                  <li className="chatbot__escribiendo">
                    <span className="chatbot__punto" aria-hidden="true" />
                    <span className="chatbot__punto" aria-hidden="true" />
                    <span className="chatbot__punto" aria-hidden="true" />
                    <span className="show-for-sr">Escribiendo…</span>
                  </li>
                )}
              </ol>

              {mostrarSugerencias && (
                <div className="chatbot__sugerencias">
                  {ultimoMensaje.sugerencias.map((sugerencia) => (
                    <button
                      key={sugerencia}
                      type="button"
                      className="chatbot__chip"
                      onClick={() => enviar(sugerencia)}
                    >
                      {sugerencia}
                    </button>
                  ))}
                </div>
              )}

              <form className="chatbot__formulario" onSubmit={manejarEnvio}>
                <label htmlFor="chatbot-input" className="show-for-sr">
                  Escribe tu mensaje
                </label>
                <input
                  id="chatbot-input"
                  ref={inputRef}
                  type="text"
                  className="chatbot__input"
                  placeholder="Escribe tu pregunta…"
                  maxLength={MAX_MENSAJE}
                  autoComplete="off"
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                />
                <button
                  type="submit"
                  className="chatbot__enviar"
                  aria-label="Enviar"
                  disabled={esperando || !texto.trim()}
                >
                  <Send size={18} aria-hidden="true" />
                </button>
              </form>
            </>
          )}
        </section>
      )}
    </div>,
    document.body
  );
}

export default Chatbot;

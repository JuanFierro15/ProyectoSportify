import React, { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  QrCode,
  Search,
  Ticket,
  X,
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { gsap } from 'gsap';
import { useReservas } from '../../context/ReservasContext';
import { fechaCompleta } from '../../lib/fechas';
import { finDeFranja, formatoPrecio } from '../../lib/precios';
import { textoQr } from '../../lib/codigoReserva';
import {
  errorTelefono,
  limpiarNombre,
  limpiarTelefono,
} from '../../lib/validacion';
import {
  buscarReservaPorCodigo,
  buscarReservasDePersona,
  horasDeReserva,
  verificarCancelable,
} from '../../lib/cancelacion';
import './MisReservas.css';

function obtenerTipoEtiqueta(r) {
  if (r.tipo === 'evento') {
    if (r.subtipo === 'torneo') return 'Torneo';
    if (r.subtipo === 'cumpleanos') return 'Cumpleaños';
    return r.tipoEtiqueta || 'Evento';
  }
  return 'Cancha';
}

function obtenerNombresCanchas(r, todasLasCanchas) {
  if (Array.isArray(r.canchaNombres) && r.canchaNombres.length > 0) {
    return r.canchaNombres.join(' · ');
  }
  if (r.canchaNombre) {
    return r.canchaNombre;
  }
  if (Array.isArray(r.canchaIds)) {
    return r.canchaIds
      .map((id) => {
        const c = todasLasCanchas.find((x) => x.id === id);
        return c ? c.nombre : id;
      })
      .join(' · ');
  }
  if (r.canchaId) {
    const c = todasLasCanchas.find((x) => x.id === r.canchaId);
    return c ? c.nombre : r.canchaId;
  }
  return 'Cancha asignada';
}

/**
 * Diálogo modal accesible para consultar y cancelar reservas.
 * Permite buscar por código de reserva o por nombre y teléfono.
 */
function MisReservas({ abierto, onCerrar, botonDisparadorRef }) {
  const dialogRef = useRef(null);
  const primerInputRef = useRef(null);
  const { reservas, canchas, cancelar } = useReservas();

  const [pestana, setPestana] = useState('codigo'); // 'codigo' | 'datos'
  const [codigoInput, setCodigoInput] = useState('');
  const [errCodigo, setErrCodigo] = useState('');

  const [nombreInput, setNombreInput] = useState('');
  const [telefonoInput, setTelefonoInput] = useState('');
  const [errNombre, setErrNombre] = useState('');
  const [errTelefono, setErrTelefono] = useState('');

  const [resultados, setResultados] = useState(null);
  const [qrVisibleId, setQrVisibleId] = useState(null);
  const [cancelandoId, setCancelandoId] = useState(null);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [errorCancelacion, setErrorCancelacion] = useState(null);

  // Apertura y cierre del diálogo nativo
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (abierto && !dlg.open) {
      if (typeof dlg.showModal === 'function') {
        dlg.showModal();
      } else {
        dlg.setAttribute('open', '');
      }
      primerInputRef.current?.focus();
    } else if (!abierto && dlg.open) {
      if (typeof dlg.close === 'function') {
        dlg.close();
      } else {
        dlg.removeAttribute('open');
      }
    }
  }, [abierto]);

  // Bloqueo del scroll del documento mientras el modal está abierto
  useEffect(() => {
    if (!abierto) return undefined;
    const html = document.documentElement;
    const anchoBarra = window.innerWidth - html.clientWidth;
    const overflowPrevio = html.style.overflow;
    const paddingPrevio = html.style.paddingRight;
    html.style.overflow = 'hidden';
    if (anchoBarra > 0) {
      html.style.paddingRight = `${anchoBarra}px`;
    }
    return () => {
      html.style.overflow = overflowPrevio;
      html.style.paddingRight = paddingPrevio;
    };
  }, [abierto]);

  // Retorno del foco al botón del navbar al cerrar
  useEffect(() => {
    if (!abierto && botonDisparadorRef?.current) {
      botonDisparadorRef.current.focus();
    }
  }, [abierto, botonDisparadorRef]);

  // Animación de entrada GSAP respetando prefers-reduced-motion
  useEffect(() => {
    if (!abierto) return undefined;
    const prefiereReducido =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefiereReducido) return undefined;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.mis-reservas__contenido',
        { opacity: 0, y: 16, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.25, ease: 'power2.out' }
      );
    }, dialogRef);

    return () => ctx.revert();
  }, [abierto]);

  const cambiarPestana = (nuevaPestana) => {
    setPestana(nuevaPestana);
    setErrCodigo('');
    setErrNombre('');
    setErrTelefono('');
    setResultados(null);
    setQrVisibleId(null);
    setCancelandoId(null);
    setMensajeExito(null);
    setErrorCancelacion(null);
  };

  const manejarBuscarCodigo = (e) => {
    e.preventDefault();
    setMensajeExito(null);
    setErrorCancelacion(null);
    setCancelandoId(null);
    const limpio = codigoInput.trim();
    if (!limpio) {
      setErrCodigo('Por favor, escribe el código de tu reserva.');
      setResultados(null);
      return;
    }
    setErrCodigo('');
    const res = buscarReservaPorCodigo(reservas, limpio);
    setResultados(res ? [res] : []);
  };

  const manejarBuscarDatos = (e) => {
    e.preventDefault();
    setMensajeExito(null);
    setErrorCancelacion(null);
    setCancelandoId(null);
    let hayError = false;

    if (!nombreInput.trim()) {
      setErrNombre('Por favor, escribe tu nombre.');
      hayError = true;
    } else {
      setErrNombre('');
    }

    const errTel = errorTelefono(telefonoInput);
    if (!telefonoInput.trim()) {
      setErrTelefono('Por favor, escribe tu número de teléfono.');
      hayError = true;
    } else if (errTel) {
      setErrTelefono(errTel);
      hayError = true;
    } else {
      setErrTelefono('');
    }

    if (hayError) {
      setResultados(null);
      return;
    }

    const encontradas = buscarReservasDePersona({
      reservas,
      nombre: nombreInput,
      telefono: telefonoInput,
      ahora: new Date(),
    });
    setResultados(encontradas);
  };

  const ejecutarCancelacion = (reservaId) => {
    const res = cancelar(reservaId);
    if (res.ok) {
      setMensajeExito('Tu reserva ha sido cancelada exitosamente.');
      setErrorCancelacion(null);
      setCancelandoId(null);
      setResultados((prev) => (prev ? prev.filter((r) => r.id !== reservaId) : []));
    } else {
      setErrorCancelacion(res.error || 'No se pudo cancelar la reserva.');
    }
  };

  if (!abierto) return null;

  return (
    <dialog
      ref={dialogRef}
      className="mis-reservas"
      aria-labelledby="mis-reservas-titulo"
      onClose={onCerrar}
      onClick={(e) => {
        if (!e.target.closest('.mis-reservas__contenido')) {
          onCerrar();
        }
      }}
    >
      <div className="mis-reservas__contenido">
        <button
          type="button"
          className="mis-reservas__cerrar"
          aria-label="Cerrar"
          onClick={onCerrar}
        >
          <X size={20} aria-hidden="true" />
        </button>

        <div className="mis-reservas__cabecera">
          <Ticket size={24} className="mis-reservas__icono-titulo" aria-hidden="true" />
          <h2 id="mis-reservas-titulo" className="mis-reservas__titulo">
            Mis reservas
          </h2>
        </div>

        <div className="mis-reservas__pestanas" role="tablist" aria-label="Método de búsqueda">
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 'codigo'}
            className={`mis-reservas__pestana ${
              pestana === 'codigo' ? 'mis-reservas__pestana--activa' : ''
            }`}
            onClick={() => cambiarPestana('codigo')}
          >
            Por código
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={pestana === 'datos'}
            className={`mis-reservas__pestana ${
              pestana === 'datos' ? 'mis-reservas__pestana--activa' : ''
            }`}
            onClick={() => cambiarPestana('datos')}
          >
            Por nombre y teléfono
          </button>
        </div>

        {pestana === 'codigo' ? (
          <form onSubmit={manejarBuscarCodigo} className="mis-reservas__form" noValidate>
            <div className="mis-reservas__campo">
              <label htmlFor="mis-reservas-codigo" className="mis-reservas__etiqueta">
                Código de reserva
              </label>
              <div className="mis-reservas__input-con-boton">
                <input
                  ref={primerInputRef}
                  id="mis-reservas-codigo"
                  type="text"
                  className={`mis-reservas__input ${errCodigo ? 'is-invalid-input' : ''}`}
                  placeholder="SPF-XXXXXX"
                  value={codigoInput}
                  onChange={(e) => {
                    setCodigoInput(e.target.value);
                    if (errCodigo) setErrCodigo('');
                  }}
                  autoCapitalize="characters"
                />
                <button type="submit" className="button mis-reservas__btn-buscar">
                  <Search size={16} aria-hidden="true" />
                  <span>Buscar</span>
                </button>
              </div>
              {errCodigo && <span className="form-error is-visible">{errCodigo}</span>}
            </div>
          </form>
        ) : (
          <form onSubmit={manejarBuscarDatos} className="mis-reservas__form" noValidate>
            <div className="mis-reservas__campo">
              <label htmlFor="mis-reservas-nombre" className="mis-reservas__etiqueta">
                Nombre completo
              </label>
              <input
                ref={primerInputRef}
                id="mis-reservas-nombre"
                type="text"
                className={`mis-reservas__input ${errNombre ? 'is-invalid-input' : ''}`}
                placeholder="Como registraste la reserva"
                value={nombreInput}
                onChange={(e) => {
                  setNombreInput(limpiarNombre(e.target.value));
                  if (errNombre) setErrNombre('');
                }}
              />
              {errNombre && <span className="form-error is-visible">{errNombre}</span>}
            </div>

            <div className="mis-reservas__campo">
              <label htmlFor="mis-reservas-telefono" className="mis-reservas__etiqueta">
                Teléfono
              </label>
              <input
                id="mis-reservas-telefono"
                type="tel"
                className={`mis-reservas__input ${errTelefono ? 'is-invalid-input' : ''}`}
                placeholder="300 123 4567"
                value={telefonoInput}
                onChange={(e) => {
                  setTelefonoInput(limpiarTelefono(e.target.value));
                  if (errTelefono) setErrTelefono('');
                }}
              />
              {errTelefono && <span className="form-error is-visible">{errTelefono}</span>}
            </div>

            <button type="submit" className="button expanded mis-reservas__btn-buscar-datos">
              <Search size={16} aria-hidden="true" />
              <span>Buscar reservas</span>
            </button>
          </form>
        )}

        {mensajeExito && (
          <div className="callout success mis-reservas__alerta" role="status">
            <CheckCircle2 size={16} aria-hidden="true" />
            <span>{mensajeExito}</span>
          </div>
        )}

        {errorCancelacion && (
          <div className="callout alert mis-reservas__alerta" role="alert">
            <AlertCircle size={16} aria-hidden="true" />
            <span>{errorCancelacion}</span>
          </div>
        )}

        {resultados !== null && (
          <div className="mis-reservas__resultados" aria-live="polite">
            {resultados.length === 0 ? (
              !mensajeExito && (
                <p className="mis-reservas__vacio">No encontramos reservas con esos datos.</p>
              )
            ) : (
              <ul className="mis-reservas__lista">
                {resultados.map((r) => {
                  const horas = horasDeReserva(r);
                  const horario =
                    horas.length > 0
                      ? `${horas[0]} a ${finDeFranja(horas[horas.length - 1])}`
                      : 'Horario';
                  const tipo = obtenerTipoEtiqueta(r);
                  const canchasTexto = obtenerNombresCanchas(r, canchas);
                  const verif = verificarCancelable(r, new Date());
                  const qrVisible = qrVisibleId === r.id;

                  const qrData = textoQr({
                    codigo: r.codigo,
                    tipo,
                    fecha: fechaCompleta(r.fecha),
                    horario,
                    canchas: [canchasTexto],
                    nombre: r.nombre || '',
                    telefono: r.telefono || '',
                    total: r.total || 0,
                    torneo: r.torneo,
                  });

                  return (
                    <li key={r.id || r.codigo} className="mis-reservas__tarjeta">
                      <div className="mis-reservas__tarjeta-cabecera">
                        <div>
                          <span className="mis-reservas__tarjeta-tipo">{tipo}</span>
                          <strong className="mis-reservas__tarjeta-codigo">{r.codigo}</strong>
                        </div>
                        <span className="mis-reservas__tarjeta-precio">
                          {formatoPrecio.format(r.total || 0)}
                        </span>
                      </div>

                      <div className="mis-reservas__tarjeta-detalles">
                        <p className="mis-reservas__tarjeta-canchas">{canchasTexto}</p>
                        <p className="mis-reservas__tarjeta-fecha">
                          {fechaCompleta(r.fecha)} · {horario}
                        </p>
                      </div>

                      {qrVisible && (
                        <div className="mis-reservas__qr-caja">
                          <QRCodeCanvas
                            value={qrData}
                            size={160}
                            level="M"
                            marginSize={2}
                            bgColor="#ffffff"
                            fgColor="#141414"
                            title={`Código QR de la reserva ${r.codigo}`}
                          />
                          <p className="mis-reservas__qr-aviso">
                            Muestra este código al llegar a las canchas.
                          </p>
                        </div>
                      )}

                      {cancelandoId === r.id ? (
                        <div className="mis-reservas__confirmar callout warning">
                          <p className="mis-reservas__confirmar-texto">
                            ¿Seguro? Esta acción libera el horario.
                          </p>
                          <div className="mis-reservas__confirmar-acciones">
                            <button
                              type="button"
                              className="button alert small"
                              onClick={() => ejecutarCancelacion(r.id)}
                            >
                              Sí, cancelar
                            </button>
                            <button
                              type="button"
                              className="button secondary hollow small"
                              onClick={() => setCancelandoId(null)}
                            >
                              No
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mis-reservas__acciones">
                          <button
                            type="button"
                            className="button hollow small mis-reservas__btn-qr"
                            onClick={() => setQrVisibleId(qrVisible ? null : r.id)}
                          >
                            <QrCode size={15} aria-hidden="true" />
                            <span>{qrVisible ? 'Ocultar QR' : 'Ver QR'}</span>
                          </button>

                          {verif.ok ? (
                            <button
                              type="button"
                              className="button alert hollow small mis-reservas__btn-cancelar"
                              onClick={() => {
                                setCancelandoId(r.id);
                                setErrorCancelacion(null);
                              }}
                            >
                              Cancelar reserva
                            </button>
                          ) : (
                            <p className="mis-reservas__no-cancelable">{verif.error}</p>
                          )}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </dialog>
  );
}

export default MisReservas;

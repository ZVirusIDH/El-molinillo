import React, { useState } from 'react';
import {
  X,
  BellOff,
  RefreshCw,
  Check,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Building,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ContenidoEnriquecido } from './ContenidoEnriquecido';

interface ModalDesconexionDigitalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalDesconexionDigital: React.FC<ModalDesconexionDigitalProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    currentUser,
    horarioLaboralActivo,
    avisos,
    confirmacionesLectura,
    confirmarLecturaAviso,
  } = useApp();

  const [sincronizando, setSincronizando] = useState(false);
  const [sincronizadoExito, setSincronizadoExito] = useState(false);
  const [ultimaHoraSync, setUltimaHoraSync] = useState<string | null>(null);

  if (!isOpen) return null;

  const horaInicio = currentUser.horarioNotificaciones?.horaInicio || '08:30';
  const horaFin = currentUser.horarioNotificaciones?.horaFin || '15:00';

  // Avisos relevantes para este usuario (Toda la comunidad o sus cursos)
  const avisosRelevantes = avisos.filter((av) => {
    if (!av.activo) return false;
    if (av.alcance === 'TODOS') return true;
    if (currentUser.cursos && currentUser.cursos.length > 0) {
      if (av.alcances && av.alcances.length > 0) {
        return av.alcances.some((cId) => currentUser.cursos.includes(cId));
      }
      const partes = av.alcance.split(',').map((s) => s.trim());
      return partes.some((cId) => currentUser.cursos.includes(cId));
    }
    return false;
  }).sort((a, b) => (b.fechaPublicacion || 0) - (a.fechaPublicacion || 0));

  const avisosNoLeidos = avisosRelevantes.filter((av) => {
    const confs = confirmacionesLectura[av.id] || [];
    return !confs.includes(currentUser.uid);
  });

  const handleActualizarPuntual = () => {
    setSincronizando(true);
    setSincronizadoExito(false);

    setTimeout(() => {
      setSincronizando(false);
      setSincronizadoExito(true);
      const now = new Date();
      setUltimaHoraSync(
        now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100%-16px)] max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto border border-slate-200 animate-modal-popup">
        {/* Cabecera del modal */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-400/40 flex items-center justify-center text-amber-600 shrink-0">
              <BellOff className="w-5 h-5 text-amber-600 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Desconexión Digital Activa
              </h3>
              <p className="text-[11px] text-slate-500">
                Pausa de notificaciones protegida por tu horario laboral
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tarjeta de estado de desconexión */}
        <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2.5 text-xs shadow-inner">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-amber-400 font-bold uppercase tracking-wider text-[10px]">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Fuera de tu jornada lectiva</span>
            </span>
            <span className="bg-amber-400/20 text-amber-300 border border-amber-400/40 text-[10px] font-bold px-2 py-0.5 rounded-full">
              {horaInicio} - {horaFin} h
            </span>
          </div>

          <p className="text-slate-300 text-[11px] leading-relaxed">
            Las notificaciones push automáticas están temporalmente en pausa para garantizar tu derecho a la desconexión digital. Se reactivarán automáticamente a las <strong className="text-white">{horaInicio} h</strong>.
          </p>
        </div>

        {/* Zona de Actualización Puntual sin desactivar la desconexión */}
        <div className="p-4 rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/40 space-y-3">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5">
              <RefreshCw className={`w-4 h-4 text-emerald-700 ${sincronizando ? 'animate-spin' : ''}`} />
              <span>Actualización Puntual de Avisos</span>
            </h4>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Puedes sincronizar y comprobar avisos voluntariamente ahora mismo. <strong>Tu desconexión digital continuará activa</strong> sin recibir interrupciones push.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleActualizarPuntual}
              disabled={sincronizando}
              className="flex-1 py-2 px-3.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-xs cursor-pointer disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 text-emerald-200 ${sincronizando ? 'animate-spin' : ''}`} />
              <span>{sincronizando ? 'Comprobando avisos...' : 'Actualizar avisos ahora'}</span>
            </button>
          </div>

          {sincronizadoExito && (
            <div className="p-2.5 rounded-xl bg-emerald-100/90 border border-emerald-300 text-emerald-900 text-[11px] font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>
                Avisos actualizados a las {ultimaHoraSync}. Tu desconexión digital sigue activa y protegida.
              </span>
            </div>
          )}
        </div>

        {/* Resumen de Avisos Disponibles */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs px-1">
            <span className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">
              Avisos del Centro
            </span>
            <span className="text-[11px] text-slate-500 font-semibold">
              {avisosNoLeidos.length > 0 ? (
                <span className="text-rose-600 font-bold">{avisosNoLeidos.length} sin leer</span>
              ) : (
                <span className="text-emerald-700 font-semibold">Al día (0 sin leer)</span>
              )}
            </span>
          </div>

          <div className="max-h-56 overflow-y-auto space-y-2 pr-0.5">
            {avisosRelevantes.length === 0 ? (
              <div className="text-center py-6 text-xs text-slate-400">
                No hay comunicados del centro escolar publicados.
              </div>
            ) : (
              avisosRelevantes.slice(0, 4).map((av) => {
                const confs = confirmacionesLectura[av.id] || [];
                const leido = confs.includes(currentUser.uid);
                const esEmergencia = av.esEmergencia || av.prioridad === 'urgente';

                return (
                  <div
                    key={av.id}
                    className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                      esEmergencia
                        ? 'border-rose-300 bg-rose-50/40'
                        : !leido
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {!leido && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase">
                            Nuevo
                          </span>
                        )}
                        {esEmergencia && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-rose-600 text-white uppercase flex items-center gap-0.5">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Emergencia
                          </span>
                        )}
                        <span className="text-[10px] font-semibold text-slate-600">
                          {av.remitenteNombre || 'Colegio'}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(av.fechaPublicacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <h5 className="font-bold text-slate-900 text-xs">{av.titulo}</h5>
                    <div className="text-[11px] text-slate-600 line-clamp-2">
                      <ContenidoEnriquecido content={av.contenido} />
                    </div>

                    {!leido && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => confirmarLecturaAviso(av.id)}
                          className="px-2 py-0.5 rounded bg-white hover:bg-slate-100 border border-slate-300 text-[10px] font-semibold text-slate-700 flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check className="w-3 h-3 text-slate-500" />
                          <span>Marcar como leído</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Pie del modal */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Garantía de desconexión RGPD</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

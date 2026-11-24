import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { ContenidoEnriquecido } from '../common/ContenidoEnriquecido';
import { descargarIcs, MotivoAusencia, TipoAusencia } from '@molinillo/shared';
import {
  Bell,
  FileCheck2,
  MessageSquare,
  Users,
  Calendar,
  Send,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Building,
  Building2,
  Shield,
  HelpCircle,
  ExternalLink,
  Vote,
  Clock,
  Download,
  AlertCircle,
  Check,
  Plus,
  HeartHandshake,
  Utensils,
  Globe,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Smartphone,
  MapPin,
  X,
} from 'lucide-react';

export const VistaPadre: React.FC = () => {
  const {
    currentUser,
    alumnos,
    avisos,
    firmas,
    conversaciones,
    mensajes,
    encuestas,
    votosEncuestas,
    eventos,
    ausencias,
    recursos,
    confirmacionesLectura,
    alumnoActivoId,
    setAlumnoActivoId,
    firmarAutorizacion,
    enviarMensaje,
    votarEncuesta,
    enviarJustificanteAusencia,
    confirmarLecturaAviso,
    setModalDatosCentroOpen,
    cambiarRolActivo,
    mostrarExplicacionRolesAmpa,
    setMostrarExplicacionRolesAmpa,
  } = useApp();

  type TabPadre = 'avisos' | 'firmas' | 'encuestas' | 'calendario' | 'faltas' | 'recursos' | 'chat';
  const [activeTab, setActiveTab] = useState<TabPadre>('avisos');
  const [canalChatActivo, setCanalChatActivo] = useState<'tutoria' | 'ampa'>('tutoria');
  const [textoMensaje, setTextoMensaje] = useState('');
  const [modalFirmaAvisoId, setModalFirmaAvisoId] = useState<string | null>(null);
  const [dniFirma, setDniFirma] = useState('');
  const [declaracionAceptada, setDeclaracionAceptada] = useState(false);

  // Estado para formulario de Justificante de Falta
  const [formFaltaAbierto, setFormFaltaAbierto] = useState(false);
  const [faltaFecha, setFaltaFecha] = useState(new Date().toISOString().split('T')[0]);
  const [faltaTipo, setFaltaTipo] = useState<TipoAusencia>('falta_completa');
  const [faltaMotivo, setFaltaMotivo] = useState<MotivoAusencia>('enfermedad');
  const [faltaObservacion, setFaltaObservacion] = useState('');
  const [faltaEnviadaExito, setFaltaEnviadaExito] = useState(false);

  // Estado de votos seleccionados en encuestas
  const [votosSeleccionados, setVotosSeleccionados] = useState<Record<string, number[]>>({});

  // Estados y helpers para Calendario Escolar Interactivo
  const [fechaCalendario, setFechaCalendario] = useState<Date>(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [vistaCalendarioModo, setVistaCalendarioModo] = useState<'semana' | 'mes'>('semana');
  const touchStartXRef = useRef<number>(0);

  const getLunesDeSemana = (fecha: Date): Date => {
    const d = new Date(fecha);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d.getFullYear(), d.getMonth(), diff);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  };

  const [fechaSemanaActual, setFechaSemanaActual] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const lunes = new Date(d.getFullYear(), d.getMonth(), diff);
    lunes.setHours(0, 0, 0, 0);
    return lunes;
  });

  const esMismoDia = (f1: Date | number | string, f2: Date): boolean => {
    const d1 = new Date(f1);
    return (
      d1.getFullYear() === f2.getFullYear() &&
      d1.getMonth() === f2.getMonth() &&
      d1.getDate() === f2.getDate()
    );
  };

  const handleAbrirGoogleCalendar = (evt: any) => {
    const fIni = new Date(evt.fechaInicio);
    const fFin = evt.fechaFin ? new Date(evt.fechaFin) : new Date(fIni.getTime() + 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, '');
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
      evt.titulo
    )}&dates=${fmt(fIni)}/${fmt(fFin)}&details=${encodeURIComponent(
      evt.descripcion || ''
    )}&location=${encodeURIComponent(evt.ubicacion || 'CEIP El Molinillo')}`;
    window.open(url, '_blank');
  };

  // Alumnos vinculados a este progenitor
  const misAlumnos = alumnos.filter((a) =>
    a.progenitores.some((p) => p.uid === currentUser.uid)
  );

  const alumnoActivo = misAlumnos.find((a) => a.id === alumnoActivoId) || misAlumnos[0];

  // Avisos visibles para el alumno activo (soporta selección múltiple de cursos, más nuevos primero)
  const avisosVisibles = avisos
    .filter((av) => {
      if (!av.activo) return false;
      if (av.alcance === 'TODOS') return true;
      if (!alumnoActivo) return false;
      if (av.alcances && av.alcances.length > 0) {
        return av.alcances.includes(alumnoActivo.cursoId);
      }
      const partes = av.alcance.split(',').map((s) => s.trim());
      return partes.includes(alumnoActivo.cursoId);
    })
    .sort((a, b) => (b.fechaPublicacion || 0) - (a.fechaPublicacion || 0));

  // Expedientes de firma del alumno activo
  const firmasAlumno = alumnoActivo
    ? firmas.filter((f) => f.alumnoId === alumnoActivo.id)
    : [];

  const firmasPendientesContador = firmasAlumno.filter(
    (f) => !f.firmas.some((firma) => firma.progenitorUid === currentUser.uid)
  ).length;

  // Total de avisos no leídos para toda la familia (cualquiera de sus hijos o Toda la Comunidad)
  const misHijosCursosIds = misAlumnos.map((a) => a.cursoId);
  const avisosFamilia = avisos.filter((av) => {
    if (!av.activo) return false;
    if (av.alcance === 'TODOS') return true;
    if (av.alcances && av.alcances.length > 0) {
      return av.alcances.some((cId) => misHijosCursosIds.includes(cId));
    }
    const partes = av.alcance.split(',').map((s) => s.trim());
    return partes.some((cId) => misHijosCursosIds.includes(cId));
  });

  const avisosNoLeidosContador = avisosFamilia.filter((av) => {
    const confirmaciones = confirmacionesLectura[av.id] || [];
    return !confirmaciones.includes(currentUser.uid);
  }).length;

  // Encuestas visibles (soporta selección múltiple de cursos)
  const encuestasVisibles = encuestas.filter((enc) => {
    if (!enc.activa) return false;
    if (enc.alcance === 'TODOS') return true;
    if (!alumnoActivo) return false;
    if (enc.alcances && enc.alcances.length > 0) {
      return enc.alcances.includes(alumnoActivo.cursoId);
    }
    const partes = enc.alcance.split(',').map((s) => s.trim());
    return partes.includes(alumnoActivo.cursoId);
  });

  // Eventos visibles
  const eventosVisibles = eventos.filter(
    (evt) =>
      evt.activo &&
      (evt.alcance === 'TODOS' || (alumnoActivo && evt.alcance === alumnoActivo.cursoId))
  );

  // Ausencias del alumno activo
  const ausenciasAlumno = alumnoActivo
    ? ausencias.filter((a) => a.alumnoId === alumnoActivo.id)
    : [];

  // Conversaciones
  const convTutoria = alumnoActivo
    ? conversaciones.find(
        (c) =>
          c.tipoCanal === 'tutoria' &&
          c.alumnoId === alumnoActivo.id &&
          c.progenitorUid === currentUser.uid
      )
    : null;

  const convAmpa = conversaciones.find(
    (c) => c.tipoCanal === 'ampa' && c.progenitorUid === currentUser.uid
  );

  const convActiva = canalChatActivo === 'tutoria' ? convTutoria : convAmpa;

  const mensajesActivos = React.useMemo(() => {
    if (!convActiva) return [];
    const directos = mensajes.filter((m) => m.conversacionId === convActiva.id);
    if (directos.length > 0) return directos;

    if (convActiva.ultimoMensaje) {
      return [
        {
          id: `msg-inicial-${convActiva.id}`,
          conversacionId: convActiva.id,
          remitenteUid: convActiva.progenitorUid,
          remitenteNombre: convActiva.progenitorNombre,
          remitenteRol: 'padre' as const,
          texto: convActiva.ultimoMensaje,
          timestamp: convActiva.fechaUltimoMensaje || Date.now(),
          leido: true,
        },
      ];
    }
    return [];
  }, [convActiva, mensajes]);

  const handleEnviarMensaje = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convActiva || !textoMensaje.trim()) return;
    enviarMensaje(convActiva.id, textoMensaje.trim(), false);
    setTextoMensaje('');
  };

  const handleConfirmarFirma = () => {
    if (!modalFirmaAvisoId || !alumnoActivo || !dniFirma.trim() || !declaracionAceptada) return;
    firmarAutorizacion(modalFirmaAvisoId, alumnoActivo.id, dniFirma.trim(), true);
    setModalFirmaAvisoId(null);
    setDniFirma('');
    setDeclaracionAceptada(false);
  };

  const handleEnviarJustificante = (e: React.FormEvent) => {
    e.preventDefault();
    if (!alumnoActivo || !faltaObservacion.trim()) return;

    enviarJustificanteAusencia({
      alumnoId: alumnoActivo.id,
      nombreAlumno: `${alumnoActivo.nombre} ${alumnoActivo.apellidos}`,
      cursoId: alumnoActivo.cursoId,
      progenitorUid: currentUser.uid,
      nombreProgenitor: `${currentUser.nombre} ${currentUser.apellidos}`,
      fechaInicio: faltaFecha,
      tipo: faltaTipo,
      motivo: faltaMotivo,
      observacion: faltaObservacion.trim(),
    });

    setFaltaObservacion('');
    setFormFaltaAbierto(false);
    setFaltaEnviadaExito(true);
    setTimeout(() => setFaltaEnviadaExito(false), 4000);
  };

  const handleToggleOpcionEncuesta = (encuestaId: string, opcionId: number, esMultiple: boolean) => {
    setVotosSeleccionados((prev) => {
      const actuales = prev[encuestaId] || [];
      if (esMultiple) {
        const existe = actuales.includes(opcionId);
        return {
          ...prev,
          [encuestaId]: existe ? actuales.filter((id) => id !== opcionId) : [...actuales, opcionId],
        };
      } else {
        return {
          ...prev,
          [encuestaId]: [opcionId],
        };
      }
    });
  };

  const handleEmitirVoto = (encuestaId: string) => {
    const seleccionadas = votosSeleccionados[encuestaId] || [];
    if (seleccionadas.length === 0) return;
    votarEncuesta(encuestaId, seleccionadas);
  };

  const renderIconoRecurso = (icono: string) => {
    switch (icono) {
      case 'utensils':
        return <Utensils className="w-5 h-5 text-emerald-700" />;
      case 'globe':
        return <Globe className="w-5 h-5 text-blue-600" />;
      case 'file-text':
        return <FileText className="w-5 h-5 text-amber-600" />;
      case 'calendar':
        return <Calendar className="w-5 h-5 text-indigo-600" />;
      default:
        return <ExternalLink className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. BARRA DE ICONOS ANCLADA ARRIBA (Sticky top-14) */}
      <div className="sticky top-14 -mt-2 sm:-mt-4 pt-2 z-30 pb-1.5 backdrop-blur-md bg-slate-100/95 transition-all">
        <div className="grid grid-cols-7 sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('avisos')}
            title={`Avisos y Comunicaciones ${avisosNoLeidosContador > 0 ? `(${avisosNoLeidosContador} sin leer)` : ''}`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'avisos'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
              {avisosNoLeidosContador > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 rounded-full text-[9px] font-black leading-none bg-rose-600 text-white flex items-center justify-center shadow-xs animate-pulse">
                  {avisosNoLeidosContador}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Avisos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('firmas')}
            title={`Autorizaciones ${firmasPendientesContador > 0 ? `(${firmasPendientesContador} pendientes)` : ''}`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'firmas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <FileCheck2 className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
              {firmasPendientesContador > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-black leading-none bg-amber-500 text-white flex items-center justify-center shadow-xs animate-pulse">
                  {firmasPendientesContador}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Autorizaciones</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('encuestas')}
            title="Encuestas"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'encuestas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Vote className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Encuestas</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendario')}
            title="Calendario Escolar"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'calendario'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Calendar className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Calendario</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('faltas')}
            title="Justificar Falta de Asistencia"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'faltas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Clock className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Justificar Falta</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recursos')}
            title="Enlaces Externos"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'recursos'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ExternalLink className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Enlaces Externos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            title="Tutoría y Consultas AMPA"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Tutoría / AMPA</span>
          </button>
        </div>
      </div>

      {/* 2. Selector Rápido: Área de Familia vs Gestión del AMPA */}
      {currentUser.roles?.includes('ampa') && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm text-xs font-semibold">
            <button
              type="button"
              className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition bg-emerald-800 text-white shadow-xs cursor-default"
            >
              <Users className="w-4 h-4 text-emerald-200 shrink-0" />
              <span>Área de Familia</span>
            </button>

            <button
              type="button"
              onClick={() => cambiarRolActivo('ampa')}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer active:scale-95"
            >
              <HeartHandshake className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Gestión del AMPA</span>
            </button>
          </div>

          {/* Texto explicativo debajo (Cerrable con X) */}
          {mostrarExplicacionRolesAmpa && (
            <div className="bg-blue-50/90 border border-blue-200/80 rounded-xl p-2.5 sm:p-3 text-xs text-blue-900 flex items-start justify-between gap-2 shadow-xs transition-all">
              <div className="flex items-start gap-2">
                <HeartHandshake className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-900/90 leading-relaxed">
                  Estás en tu espacio privado familiar (tutorías, ausencias y notas de tus hijos). Como representante del AMPA, pulsa en <strong>Gestión del AMPA</strong> para acceder a comunicados y buzón asociativo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarExplicacionRolesAmpa(false)}
                className="text-blue-500 hover:text-blue-800 p-1 rounded-lg hover:bg-blue-100 transition shrink-0 cursor-pointer"
                title="Cerrar explicación (puedes volver a activarla desde Opciones)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* 3. Selector de Hijo: Solo los nombres en 2 columnas */}
      {misAlumnos.length > 0 && (
        <div className={`grid ${misAlumnos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-2`}>
          {misAlumnos.map((alum) => {
            const isSelected = alum.id === alumnoActivo?.id;
            return (
              <button
                key={alum.id}
                type="button"
                onClick={() => setAlumnoActivoId(alum.id)}
                className={`flex items-center gap-2 p-2 sm:p-2.5 rounded-xl text-xs font-semibold border transition cursor-pointer active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                    isSelected ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {alum.nombre.charAt(0)}
                </div>
                <div className="text-left min-w-0 flex-1 truncate">
                  <p className="font-bold text-slate-900 truncate text-xs">{alum.nombre} {alum.apellidos}</p>
                  <p className="text-[10px] text-slate-500 font-normal truncate">{alum.cursoNombre}</p>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Contenido de la pestaña seleccionada */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        {/* PESTAÑA 1: AVISOS */}
        {activeTab === 'avisos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500 flex-wrap gap-2">
              <span>Avisos para {alumnoActivo?.cursoNombre} y comunicaciones generales</span>
              <div className="flex items-center gap-2">
                {avisosNoLeidosContador > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 flex items-center gap-1 animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                    <span>{avisosNoLeidosContador} sin leer</span>
                  </span>
                )}
                <span>{avisosVisibles.length} publicaciones</span>
              </div>
            </div>

            {avisosVisibles.map((aviso) => {
              const confirmaciones = confirmacionesLectura[aviso.id] || [];
              const yoLei = confirmaciones.includes(currentUser.uid);
              const esEmergencia = aviso.esEmergencia || aviso.prioridad === 'urgente';

              return (
                <div
                  key={aviso.id}
                  className={`border rounded-xl p-4 transition space-y-3 ${
                    esEmergencia
                      ? 'border-2 border-rose-400 bg-rose-50/30 shadow-xs'
                      : !yoLei
                      ? 'border-emerald-300 bg-emerald-50/20 shadow-xs hover:border-emerald-400'
                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      {!yoLei && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white shadow-xs uppercase tracking-wider animate-pulse">
                          Nueva
                        </span>
                      )}
                      {esEmergencia && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-600 text-white shadow-xs animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                          <span>ALERTA DE EMERGENCIA</span>
                        </span>
                      )}
                      {aviso.tipoEmisor === 'ampa' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                          <Users className="w-3 h-3 text-blue-600" />
                          Comunicado del AMPA
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          <Building className="w-3 h-3 text-emerald-700" />
                          Colegio Oficial
                        </span>
                      )}

                      {!esEmergencia && aviso.prioridad === 'informativo' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          Informativo
                        </span>
                      )}

                      <span className="text-[11px] text-slate-500 font-medium">
                        {aviso.alcance === 'TODOS' ? 'Todos los cursos' : aviso.alcanceNombre || aviso.alcance}
                      </span>
                    </div>

                    <span className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(aviso.fechaPublicacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900">{aviso.titulo}</h3>
                  <ContenidoEnriquecido content={aviso.contenido} />

                  <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
                    {/* Botón de Confirmación de Lectura (1 clic) */}
                    <div>
                      {yoLei ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          He leído y enterado
                        </span>
                      ) : (
                        <button
                          onClick={() => confirmarLecturaAviso(aviso.id)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 px-3 py-1 rounded-lg transition"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                          Marcar como leído y enterado
                        </button>
                      )}
                    </div>

                    {aviso.esAutorizacion && (
                      <button
                        onClick={() => {
                          setModalFirmaAvisoId(aviso.id);
                          setActiveTab('firmas');
                        }}
                        className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition flex items-center gap-1.5"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        Ir a firmar autorización
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PESTAÑA 2: FIRMAS Y AUTORIZACIONES */}
        {activeTab === 'firmas' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Validez y Garantía de Firma Escolar</p>
                <p className="text-slate-500 mt-0.5">
                  Las autorizaciones registradas en Molinillo quedan fechadas con sello temporal y DNI del progenitor autenticado, con plena validez para salidas lectivas y actividades del centro.
                </p>
              </div>
            </div>

            {firmasAlumno.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No hay autorizaciones pendientes de firma para este alumno.
              </div>
            ) : (
              firmasAlumno.map((exp) => {
                const miFirma = exp.firmas.find((f) => f.progenitorUid === currentUser.uid);
                const firmadaPorMi = !!miFirma;

                return (
                  <div
                    key={exp.id}
                    className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {exp.cursoId}
                        </span>
                        <h4 className="text-sm font-bold text-slate-900 mt-1">{exp.avisoTitulo}</h4>
                      </div>

                      {exp.estado === 'completada' ? (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Completada
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                          <Clock className="w-3.5 h-3.5" />
                          Pendiente de firma
                        </span>
                      )}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 text-xs space-y-2 border border-slate-100">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Firmas requeridas:</span>
                        <span className="font-semibold text-slate-700">
                          {exp.tipoFirma === 'AMBOS_PROGENITORES'
                            ? 'Firma de ambos progenitores'
                            : 'Firma de un progenitor'}
                        </span>
                      </div>

                      <div className="border-t border-slate-200 pt-2 space-y-1.5">
                        <p className="font-semibold text-slate-600 text-[11px]">Firmas registradas:</p>
                        {exp.firmas.length === 0 ? (
                          <p className="text-slate-400 italic">Ningún progenitor ha firmado todavía.</p>
                        ) : (
                          exp.firmas.map((f, i) => (
                            <div key={i} className="flex items-center justify-between text-[11px] text-slate-600">
                              <span className="flex items-center gap-1">
                                <Check className="w-3 h-3 text-emerald-600" />
                                {f.progenitorNombre} {f.progenitorDni ? `(DNI: ${f.progenitorDni})` : ''}
                              </span>
                              <span className="text-slate-400">
                                {new Date(f.fechaFirma).toLocaleDateString('es-ES')}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex justify-end">
                      {firmadaPorMi ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Usted ya ha firmado esta autorización
                        </span>
                      ) : (
                        <button
                          onClick={() => setModalFirmaAvisoId(exp.avisoId)}
                          className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 shadow-sm"
                        >
                          <FileCheck2 className="w-4 h-4" />
                          Firmar Autorización
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PESTAÑA 3: ENCUESTAS Y VOTACIONES */}
        {activeTab === 'encuestas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Encuestas escolares con voto único por progenitor</span>
              <span>{encuestasVisibles.length} activas</span>
            </div>

            {encuestasVisibles.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-500">
                No hay encuestas abiertas en este momento.
              </div>
            ) : (
              encuestasVisibles.map((enc) => {
                const votos = votosEncuestas[enc.id] || [];
                const miVoto = votos.find((v) => v.uidPadre === currentUser.uid);
                const yaVoto = !!miVoto;
                const totalVotos = votos.length;
                const seleccion = votosSeleccionados[enc.id] || (miVoto ? miVoto.opcionesSeleccionadas : []);

                return (
                  <div key={enc.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {enc.esMultiple ? 'Selección Múltiple' : 'Selección Única'}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Cierre: {new Date(enc.fechaCierre).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{enc.pregunta}</h4>
                    {enc.descripcion && <p className="text-xs text-slate-500">{enc.descripcion}</p>}

                    {/* Opciones */}
                    <div className="space-y-2 pt-1">
                      {enc.opciones.map((op) => {
                        const seleccionada = seleccion.includes(op.id);
                        const votosOp = votos.filter((v) => v.opcionesSeleccionadas.includes(op.id)).length;
                        const pct = totalVotos > 0 ? Math.round((votosOp / totalVotos) * 100) : 0;

                        return (
                          <div
                            key={op.id}
                            onClick={() => !yaVoto && handleToggleOpcionEncuesta(enc.id, op.id, enc.esMultiple)}
                            className={`border rounded-lg p-3 text-xs transition cursor-pointer relative overflow-hidden ${
                              seleccionada
                                ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-medium'
                                : 'border-slate-200 hover:border-slate-300 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center justify-between relative z-10">
                              <span className="flex items-center gap-2">
                                <span
                                  className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                                    seleccionada
                                      ? 'border-emerald-600 bg-emerald-600 text-white'
                                      : 'border-slate-300'
                                  }`}
                                >
                                  {seleccionada && <Check className="w-2.5 h-2.5" />}
                                </span>
                                {op.texto}
                              </span>

                              {(yaVoto || enc.resultadosPublicos) && (
                                <span className="text-[11px] font-bold text-slate-600">{pct}%</span>
                              )}
                            </div>

                            {/* Barra de progreso de votos en tiempo real */}
                            {(yaVoto || enc.resultadosPublicos) && (
                              <div
                                className="absolute left-0 bottom-0 top-0 bg-emerald-100/60 transition-all duration-500"
                                style={{ width: `${pct}%`, zIndex: 1 }}
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex items-center justify-between flex-wrap gap-2">
                      <span className="text-[11px] text-slate-400">
                        {totalVotos} familias han participado en esta votación.
                      </span>

                      {yaVoto ? (
                        <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Voto registrado con éxito
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEmitirVoto(enc.id)}
                          disabled={seleccion.length === 0}
                          className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Emitir Voto
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* PESTAÑA 4: CALENDARIO DE EVENTOS */}
        {activeTab === 'calendario' && (() => {
          const hoy = new Date();
          const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

          // Filtrar pasados y ordenar los más cercanos hoy en adelante
          const eventosFuturos = eventosVisibles.filter((evt) => {
            const fFin = evt.fechaFin ? new Date(evt.fechaFin) : new Date(evt.fechaInicio);
            return fFin.getTime() >= hoyInicio.getTime();
          });

          const eventosOrdenadosProximos = [...eventosFuturos].sort(
            (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
          );

          // Si el usuario selecciona un día del calendario, mostramos los eventos de ese día
          const eventosAMostrar = diaSeleccionado
            ? eventosVisibles.filter((evt) => esMismoDia(evt.fechaInicio, diaSeleccionado))
            : eventosOrdenadosProximos;

          // Cálculos para la vista de mes
          const anioCal = fechaCalendario.getFullYear();
          const mesCal = fechaCalendario.getMonth();
          const diasEnMes = new Date(anioCal, mesCal + 1, 0).getDate();
          const primerDiaSemanaOffset = (new Date(anioCal, mesCal, 1).getDay() + 6) % 7; // Lunes = 0
          const celdasVacias = Array.from({ length: primerDiaSemanaOffset }, (_, i) => i);
          const diasDelMes = Array.from({ length: diasEnMes }, (_, i) => i + 1);

          const mesesNombres = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
          const diasSemanaNombres = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

          // Cálculos para la vista de semana
          const diasDeLaSemana = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(fechaSemanaActual);
            d.setDate(fechaSemanaActual.getDate() + i);
            return d;
          });

          // Navegación
          const irSemanaAnterior = () => {
            setFechaSemanaActual((prev) => {
              const d = new Date(prev);
              d.setDate(d.getDate() - 7);
              return d;
            });
          };

          const irSemanaSiguiente = () => {
            setFechaSemanaActual((prev) => {
              const d = new Date(prev);
              d.setDate(d.getDate() + 7);
              return d;
            });
          };

          const irMesAnterior = () => {
            setFechaCalendario((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
          };

          const irMesSiguiente = () => {
            setFechaCalendario((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
          };

          const irAHoy = () => {
            const h = new Date();
            setFechaSemanaActual(getLunesDeSemana(h));
            setFechaCalendario(new Date(h.getFullYear(), h.getMonth(), 1));
            setDiaSeleccionado(h);
          };

          const tituloCalendario = vistaCalendarioModo === 'semana'
            ? `${mesesNombres[fechaSemanaActual.getMonth()]} ${fechaSemanaActual.getFullYear()}`
            : `${mesesNombres[mesCal]} ${anioCal}`;

          return (
            <div className="space-y-3 sm:space-y-4">
              {/* Widget de Calendario: Semana o Mes deslizable con swipe y botones */}
              <div
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm p-3.5 space-y-3"
                onTouchStart={(e) => {
                  touchStartXRef.current = e.touches[0].clientX;
                }}
                onTouchEnd={(e) => {
                  const diff = e.changedTouches[0].clientX - touchStartXRef.current;
                  if (diff > 45) {
                    if (vistaCalendarioModo === 'semana') irSemanaAnterior();
                    else irMesAnterior();
                  } else if (diff < -45) {
                    if (vistaCalendarioModo === 'semana') irSemanaSiguiente();
                    else irMesSiguiente();
                  }
                }}
              >
                {/* Barra de cabecera con navegación y botón para expandir/colapsar mes */}
                <div className="flex items-center justify-between gap-1 sm:gap-2 pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-1 sm:gap-1.5 min-w-0">
                    <button
                      type="button"
                      onClick={vistaCalendarioModo === 'semana' ? irSemanaAnterior : irMesAnterior}
                      className="p-1 sm:p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition active:scale-90 shrink-0"
                      title={vistaCalendarioModo === 'semana' ? 'Semana anterior' : 'Mes anterior'}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm capitalize text-center truncate">
                      {tituloCalendario}
                    </h4>

                    <button
                      type="button"
                      onClick={vistaCalendarioModo === 'semana' ? irSemanaSiguiente : irMesSiguiente}
                      className="p-1 sm:p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition active:scale-90 shrink-0"
                      title={vistaCalendarioModo === 'semana' ? 'Semana siguiente' : 'Mes siguiente'}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={irAHoy}
                      className="ml-0.5 sm:ml-1 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[10px] sm:text-[11px] font-semibold text-emerald-800 hover:bg-emerald-50 rounded-md sm:rounded-lg border border-emerald-200 transition active:scale-95 shrink-0"
                      title="Ir al día de hoy"
                    >
                      Hoy
                    </button>
                  </div>

                  {/* Botón a la derecha para expandir y ver mes completo o volver a semana */}
                  <button
                    type="button"
                    onClick={() => {
                      if (vistaCalendarioModo === 'semana') {
                        setFechaCalendario(new Date(fechaSemanaActual.getFullYear(), fechaSemanaActual.getMonth(), 1));
                        setVistaCalendarioModo('mes');
                      } else {
                        setFechaSemanaActual(getLunesDeSemana(diaSeleccionado || new Date()));
                        setVistaCalendarioModo('semana');
                      }
                    }}
                    className="flex items-center gap-1 px-2 py-1 sm:px-2.5 sm:py-1.5 text-[11px] sm:text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition active:scale-95 cursor-pointer shrink-0"
                    title={vistaCalendarioModo === 'semana' ? 'Expandir y ver mes completo' : 'Ver semana actual'}
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                    <span>{vistaCalendarioModo === 'semana' ? 'Mes' : 'Semana'}</span>
                    {vistaCalendarioModo === 'semana' ? (
                      <ChevronDown className="w-3 h-3 text-emerald-600 shrink-0" />
                    ) : (
                      <ChevronUp className="w-3 h-3 text-emerald-600 shrink-0" />
                    )}
                  </button>
                </div>

                {/* VISTA SEMANA (Por defecto) */}
                {vistaCalendarioModo === 'semana' ? (
                  <div className="space-y-1">
                    <div className="grid grid-cols-7 gap-1 sm:gap-1.5 select-none">
                      {diasDeLaSemana.map((fechaDia, idx) => {
                        const esHoy = esMismoDia(fechaDia, new Date());
                        const esSeleccionado = diaSeleccionado ? esMismoDia(fechaDia, diaSeleccionado) : false;
                        const eventosEnEsteDia = eventosVisibles.filter((e) => esMismoDia(e.fechaInicio, fechaDia));
                        const tieneEventos = eventosEnEsteDia.length > 0;
                        const numDia = fechaDia.getDate();
                        const esFinDeSemana = idx >= 5;

                        return (
                          <button
                            key={`sem-${fechaDia.getTime()}`}
                            type="button"
                            onClick={() => {
                              if (esSeleccionado) {
                                setDiaSeleccionado(null);
                              } else {
                                setDiaSeleccionado(fechaDia);
                              }
                            }}
                            className={`relative flex flex-col items-center justify-between h-[66px] sm:h-[72px] rounded-2xl transition cursor-pointer active:scale-95 overflow-hidden border ${
                              esSeleccionado
                                ? 'bg-emerald-800 text-white border-emerald-900 shadow-sm'
                                : esHoy
                                ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-xs'
                                : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
                            }`}
                            title={`${numDia} de ${fechaDia.toLocaleDateString('es-ES', { month: 'short' })}${tieneEventos ? ` (${eventosEnEsteDia.length} evento/s)` : ''}`}
                          >
                            {/* 1. ARRIBA: Nombre corto del día */}
                            <span
                              className={`pt-1.5 text-[10px] font-bold uppercase tracking-wider ${
                                esSeleccionado
                                  ? 'text-emerald-100'
                                  : esFinDeSemana
                                  ? 'text-rose-500'
                                  : 'text-slate-400'
                              }`}
                            >
                              {diasSemanaNombres[idx]}
                            </span>

                            {/* 2. EN MEDIO: El número */}
                            <span
                              className={`text-sm sm:text-base font-bold leading-none my-auto ${
                                esSeleccionado ? 'text-white' : esHoy ? 'text-emerald-900' : 'text-slate-800'
                              }`}
                            >
                              {numDia}
                            </span>

                            {/* 3. ABAJO: Hueco para marcar evento o base gris muy clarito */}
                            <div
                              className={`w-full h-2.5 sm:h-3 flex items-center justify-center transition-colors ${
                                tieneEventos
                                  ? esSeleccionado
                                    ? 'bg-emerald-400'
                                    : 'bg-emerald-600'
                                  : esSeleccionado
                                  ? 'bg-emerald-900/60'
                                  : 'bg-slate-100'
                              }`}
                            >
                              {tieneEventos && (
                                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  /* VISTA MES COMPLETO */
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1 text-center select-none">
                      {diasSemanaNombres.map((diaSem, idx) => (
                        <span
                          key={diaSem}
                          className={`text-[10px] font-bold uppercase tracking-wider py-1 ${
                            idx >= 5 ? 'text-rose-500' : 'text-slate-400'
                          }`}
                        >
                          {diaSem}
                        </span>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 select-none">
                      {celdasVacias.map((emptyIdx) => (
                        <div key={`empty-${emptyIdx}`} className="h-8 sm:h-9" />
                      ))}
                      {diasDelMes.map((numDia) => {
                        const fechaCelda = new Date(anioCal, mesCal, numDia);
                        const esHoy = esMismoDia(fechaCelda, new Date());
                        const esSeleccionado = diaSeleccionado ? esMismoDia(fechaCelda, diaSeleccionado) : false;
                        const eventosEnEsteDia = eventosVisibles.filter((e) => esMismoDia(e.fechaInicio, fechaCelda));
                        const tieneEventos = eventosEnEsteDia.length > 0;

                        return (
                          <button
                            key={`dia-${numDia}`}
                            type="button"
                            onClick={() => {
                              if (esSeleccionado) {
                                setDiaSeleccionado(null);
                              } else {
                                setDiaSeleccionado(fechaCelda);
                              }
                            }}
                            className={`relative h-8 sm:h-9 rounded-lg flex flex-col items-center justify-center text-xs transition cursor-pointer active:scale-95 ${
                              esSeleccionado
                                ? 'bg-emerald-800 text-white font-bold shadow-sm'
                                : esHoy
                                ? 'border-2 border-emerald-600 text-emerald-900 font-bold bg-emerald-50/60 hover:bg-emerald-100/60'
                                : 'text-slate-700 hover:bg-slate-100'
                            }`}
                            title={
                              tieneEventos
                                ? `${eventosEnEsteDia.length} evento(s) el ${numDia} de ${mesesNombres[mesCal]}`
                                : `${numDia} de ${mesesNombres[mesCal]}`
                            }
                          >
                            <span>{numDia}</span>
                            {tieneEventos && (
                              <span
                                className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${
                                  esSeleccionado ? 'bg-white' : 'bg-emerald-600'
                                }`}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Listado de Eventos Próximos (Pasados ocultados, ordenados del más cercano en adelante) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-bold text-slate-800">
                    {diaSeleccionado
                      ? `Eventos del ${diaSeleccionado.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`
                      : 'Próximos eventos escolares'}
                  </span>
                  <div className="flex items-center gap-2">
                    {diaSeleccionado && (
                      <button
                        type="button"
                        onClick={() => setDiaSeleccionado(null)}
                        className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
                      >
                        Ver todos los próximos
                      </button>
                    )}
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      {eventosAMostrar.length}
                    </span>
                  </div>
                </div>

                {eventosAMostrar.length === 0 ? (
                  <div className="p-6 text-center bg-white rounded-xl border border-dashed border-slate-300 space-y-2">
                    <Calendar className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      {diaSeleccionado ? 'No hay eventos para esta fecha' : 'No hay próximos eventos escolares programados'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {diaSeleccionado
                        ? 'Selecciona otro día en el calendario o pulsa en ver todos los próximos.'
                        : 'Los eventos pasados están ocultos automáticamente.'}
                    </p>
                    {diaSeleccionado && (
                      <button
                        type="button"
                        onClick={() => setDiaSeleccionado(null)}
                        className="mt-2 text-xs font-semibold text-emerald-700 hover:underline inline-block cursor-pointer"
                      >
                        Ver todos los eventos próximos
                      </button>
                    )}
                  </div>
                ) : (
                  eventosAMostrar.map((evt) => (
                    <div
                      key={evt.id}
                      className="border border-slate-200/90 rounded-xl p-3.5 bg-white shadow-sm space-y-2.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 uppercase font-mono text-[10px]">
                          {evt.tipo}
                        </span>
                        <span className="text-slate-600 font-semibold text-[11px] flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          {new Date(evt.fechaInicio).toLocaleDateString('es-ES', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>

                      <div>
                        <h4 className="text-sm font-bold text-slate-900">{evt.titulo}</h4>
                        <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{evt.descripcion}</p>
                      </div>

                      {evt.ubicacion && (
                        <p className="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{evt.ubicacion}</span>
                        </p>
                      )}

                      {/* Botones de sincronización en 2 columnas */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => handleAbrirGoogleCalendar(evt)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-2 bg-emerald-50 hover:bg-emerald-100 active:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Añadir a Google Calendar"
                        >
                          <Calendar className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                          <span>Google Calendar</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => descargarIcs(evt, 'CEIP El Molinillo')}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Añadir a Calendario de iPhone / Apple"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-slate-200 shrink-0" />
                          <span>iPhone / Apple</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })()}

        {/* PESTAÑA 5: JUSTIFICAR FALTA O RETRASO */}
        {activeTab === 'faltas' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Comunicación de Ausencias y Retrasos
                </h3>
                <p className="text-xs text-slate-500">
                  Notifique faltas de {alumnoActivo?.nombre} directamente al tutor y secretaría.
                </p>
              </div>

              {!formFaltaAbierto && (
                <button
                  onClick={() => setFormFaltaAbierto(true)}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Notificar Falta
                </button>
              )}
            </div>

            {faltaEnviadaExito && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Justificante remitido correctamente al centro y al tutor del aula.</span>
              </div>
            )}

            {formFaltaAbierto && (
              <form onSubmit={handleEnviarJustificante} className="border border-slate-300 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Nuevo Justificante de Ausencia</span>
                  <button
                    type="button"
                    onClick={() => setFormFaltaAbierto(false)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Fecha de la ausencia</label>
                    <input
                      type="date"
                      value={faltaFecha}
                      onChange={(e) => setFaltaFecha(e.target.value)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Tipo</label>
                    <select
                      value={faltaTipo}
                      onChange={(e) => setFaltaTipo(e.target.value as TipoAusencia)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="falta_completa">Jornada completa</option>
                      <option value="retraso">Retraso puntual</option>
                      <option value="salida_anticipada">Salida anticipada</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">Motivo</label>
                    <select
                      value={faltaMotivo}
                      onChange={(e) => setFaltaMotivo(e.target.value as MotivoAusencia)}
                      className="w-full text-xs px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white"
                    >
                      <option value="enfermedad">Enfermedad común</option>
                      <option value="cita_medica">Cita médica</option>
                      <option value="motivo_familiar">Motivo familiar de fuerza mayor</option>
                      <option value="otro">Otro motivo justificado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    Observación / Explicación breve (máximo 500 caracteres)
                  </label>
                  <textarea
                    rows={2}
                    maxLength={500}
                    value={faltaObservacion}
                    onChange={(e) => setFaltaObservacion(e.target.value)}
                    placeholder="Detalle el motivo o indique hora estimada de incorporación..."
                    className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg bg-white resize-none"
                    required
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>Sin necesidad de adjuntar certificados médicos sensibles según RGPD.</span>
                    <span>{faltaObservacion.length}/500</span>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-sm transition"
                  >
                    Enviar Justificante
                  </button>
                </div>
              </form>
            )}

            {/* Historial de ausencias */}
            <div className="space-y-2 pt-2">
              <h4 className="text-xs font-semibold text-slate-600">Historial reciente de ausencias</h4>
              {ausenciasAlumno.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No constan ausencias notificadas para este alumno.</p>
              ) : (
                ausenciasAlumno.map((aus) => (
                  <div key={aus.id} className="border border-slate-200 rounded-lg p-3 bg-white space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-800">
                        {aus.fechaInicio} &bull; {aus.tipo.replace('_', ' ')}
                      </span>
                      {aus.estado === 'justificada' && (
                        <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Justificada
                        </span>
                      )}
                      {aus.estado === 'pendiente' && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          En revisión
                        </span>
                      )}
                      {aus.estado === 'rechazada' && (
                        <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          No justificada
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">{aus.observacion}</p>
                    {aus.comentarioCentro && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-100 italic">
                        Respuesta del centro: "{aus.comentarioCentro}"
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 6: RECURSOS Y ENLACES EXTERNOS */}
        {activeTab === 'recursos' && (
          <div className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs text-slate-600 flex items-start gap-2.5">
              <ExternalLink className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-slate-800">Documentación Oficial y Servicios</p>
                <p className="text-slate-500 mt-0.5">
                  Enlaces oficiales a calendarios escolares, inscripciones del AMPA y gestiones de secretaría virtual fuera del servidor para optimizar espacio y cuotas.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recursos.map((rec) => (
                <a
                  key={rec.id}
                  href={rec.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border border-slate-200 rounded-xl p-4 bg-white hover:border-emerald-600 hover:shadow-md transition flex items-start gap-3.5 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 group-hover:bg-emerald-50 group-hover:border-emerald-300 transition">
                    {renderIconoRecurso(rec.icono)}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900 group-hover:text-emerald-800 transition">
                        {rec.titulo}
                      </h4>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition" />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{rec.descripcion}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* PESTAÑA 7: TUTORÍA PRIVADA Y BUZÓN AMPA */}
        {activeTab === 'chat' && (
          <div className="space-y-4">
            {/* Selector de Canal: Tutoría vs AMPA */}
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button
                onClick={() => setCanalChatActivo('tutoria')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
                  canalChatActivo === 'tutoria'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Tutor del menor ({alumnoActivo?.nombre})
              </button>
              <button
                onClick={() => setCanalChatActivo('ampa')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition ${
                  canalChatActivo === 'ampa'
                    ? 'bg-white text-slate-800 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Buzón Directo AMPA
              </button>
            </div>

            {/* Aviso de Privacidad y Horario */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 flex items-center justify-between">
              <span>
                Canal con: <strong>{convActiva?.destinatarioNombre || 'Centro Escolar'}</strong>
              </span>
              <span className="text-[11px] text-slate-400">Mensajes protegidos y directos</span>
            </div>

            {/* Historial de Mensajes */}
            <div className="h-64 overflow-y-auto space-y-2.5 p-3 bg-slate-50/50 rounded-xl border border-slate-200">
              {mensajesActivos.length === 0 ? (
                <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                  No hay mensajes anteriores en este canal.
                </div>
              ) : (
                mensajesActivos.map((msg) => {
                  const esMio = msg.remitenteUid === currentUser.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${esMio ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed shadow-sm ${
                          esMio
                            ? 'bg-emerald-700 text-white rounded-br-none'
                            : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                        }`}
                      >
                        <p className="whitespace-pre-line">{msg.texto}</p>
                        <span
                          className={`block text-[10px] mt-1 text-right ${
                            esMio ? 'text-emerald-200' : 'text-slate-400'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString('es-ES', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Formulario de envío básico y ágil para familias */}
            <form onSubmit={handleEnviarMensaje} className="space-y-1.5">
              <div className="flex gap-2">
                <textarea
                  rows={2}
                  maxLength={500}
                  value={textoMensaje}
                  onChange={(e) => setTextoMensaje(e.target.value)}
                  placeholder="Escriba aquí su consulta o mensaje (máximo 500 caracteres)..."
                  className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none resize-none"
                />
                <button
                  type="submit"
                  disabled={!textoMensaje.trim()}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm self-end h-10"
                >
                  <Send className="w-3.5 h-3.5" />
                  Enviar
                </button>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400 px-1">
                <span>Editor simplificado para familias: mensajes directos y concisos.</span>
                <span className={textoMensaje.length > 450 ? 'text-amber-600 font-bold' : ''}>
                  {textoMensaje.length}/500
                </span>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Modal para Firmar Autorización */}
      {modalFirmaAvisoId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white max-w-sm w-[calc(100%-20px)] rounded-3xl p-5 shadow-2xl space-y-4 my-auto border border-slate-200 animate-modal-popup">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <FileCheck2 className="w-5 h-5 text-emerald-700" />
              <span>Firma Digital de Autorización</span>
            </div>

            <p className="text-xs text-slate-600">
              Usted está autorizando la participación del alumno{' '}
              <strong>{alumnoActivo?.nombre} {alumnoActivo?.apellidos}</strong> en la actividad escolar programada.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  DNI / NIE del Progenitor firmante
                </label>
                <input
                  type="text"
                  placeholder="ej. 12345678Z"
                  value={dniFirma}
                  onChange={(e) => setDniFirma(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={declaracionAceptada}
                  onChange={(e) => setDeclaracionAceptada(e.target.checked)}
                  className="mt-0.5 rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span>
                  Declaro bajo mi responsabilidad que ostento la patria potestad del menor y doy mi consentimiento expreso.
                </span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setModalFirmaAvisoId(null)}
                className="px-3 py-1.5 text-xs text-slate-600 font-semibold hover:text-slate-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarFirma}
                disabled={!dniFirma.trim() || !declaracionAceptada}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition"
              >
                Confirmar y Registrar Firma
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

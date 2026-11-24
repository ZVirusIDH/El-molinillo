import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { EditorTextoEnriquecido } from '../common/EditorTextoEnriquecido';
import {
  Users,
  Send,
  PlusCircle,
  MessageSquare,
  CheckCircle2,
  Clock,
  CopyCheck,
  UserCheck,
  ArrowLeft,
  X,
  ChevronRight,
  Sparkles,
  Bell,
  AlertTriangle,
  Building,
  Check,
  Search,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { TipoFirmaAutorizacion } from '@molinillo/shared';
import { ContenidoEnriquecido } from '../common/ContenidoEnriquecido';

export const VistaProfesor: React.FC = () => {
  const {
    currentUser,
    alumnos,
    conversaciones,
    mensajes,
    horarioLaboralActivo,
    setModalPerfilOpen,
    publicarAviso,
    enviarMensaje,
    cursos,
    mostrarTextosInformativos,
    setMostrarTextosInformativos,
    avisos,
    confirmacionesLectura,
    confirmarLecturaAviso,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'alumnos' | 'nuevo-aviso' | 'mensajeria' | 'circulares'>('mensajeria');

  // Búsqueda en tiempo real de alumnos
  const [busquedaAlumnos, setBusquedaAlumnos] = useState('');
  const [busquedaChatAlumnos, setBusquedaChatAlumnos] = useState('');
  const [alumnoExpandidoId, setAlumnoExpandidoId] = useState<string | null>(null);

  // Estado para nuevo aviso
  const [nuevoTitulo, setNuevoTitulo] = useState('');
  const [nuevoContenido, setNuevoContenido] = useState('');
  const [esAutorizacion, setEsAutorizacion] = useState(false);
  const [tipoFirma, setTipoFirma] = useState<TipoFirmaAutorizacion>('UN_PROGENITOR');
  const [avisoCreadoExito, setAvisoCreadoExito] = useState(false);

  // Alumnos del curso tutorizado
  const misAlumnos = useMemo(() => {
    return alumnos.filter((a) => currentUser.cursos.includes(a.cursoId));
  }, [alumnos, currentUser.cursos]);

  // Filtrado de alumnos en tiempo real por nombre o apellidos
  const alumnosFiltrados = useMemo(() => {
    if (!busquedaAlumnos.trim()) return misAlumnos;
    const q = busquedaAlumnos.toLowerCase().trim();
    return misAlumnos.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.apellidos.toLowerCase().includes(q) ||
        `${a.nombre} ${a.apellidos}`.toLowerCase().includes(q)
    );
  }, [misAlumnos, busquedaAlumnos]);

  // Avisos del centro dirigidos a este profesor o a toda la comunidad
  const avisosCentro = useMemo(() => {
    return avisos
      .filter((av) => {
        if (!av.activo) return false;
        if (av.alcance === 'TODOS') return true;
        if (av.alcances && av.alcances.length > 0) {
          return av.alcances.some((cId) => currentUser.cursos.includes(cId));
        }
        const partes = av.alcance.split(',').map((s) => s.trim());
        return partes.some((cId) => currentUser.cursos.includes(cId));
      })
      .sort((a, b) => (b.fechaPublicacion || 0) - (a.fechaPublicacion || 0));
  }, [avisos, currentUser.cursos]);

  const avisosCentroNoLeidos = avisosCentro.filter((av) => {
    const confs = confirmacionesLectura[av.id] || [];
    return !confs.includes(currentUser.uid);
  }).length;

  // Conversaciones dirigidas a este profesor
  const misConversaciones = useMemo(() => {
    return conversaciones.filter(
      (c) => c.destinatarioUid === currentUser.uid && c.tipoCanal === 'tutoria'
    );
  }, [conversaciones, currentUser.uid]);

  // Agrupación orientada al ALUMNO (con sus canales de progenitores)
  const itemsAlumnos = useMemo(() => {
    // Alumnos del curso + cualquier otro alumno que tenga conversación con este profesor
    const idsProcesados = new Set<string>();
    const lista: Array<{
      alumno: (typeof alumnos)[0];
      convs: typeof misConversaciones;
      totalNoLeidos: number;
      ultimoMensajeTexto: string;
      ultimoMensajeFecha: number;
    }> = [];

    // 1. Agregar alumnos del curso
    misAlumnos.forEach((alum) => {
      idsProcesados.add(alum.id);
      const convs = misConversaciones.filter((c) => c.alumnoId === alum.id);
      const totalNoLeidos = convs.reduce((acc, c) => acc + (c.noLeidosDestinatario || 0), 0);
      const todosMensajes = convs.flatMap((c) =>
        mensajes.filter((m) => m.conversacionId === c.id)
      ).sort((a, b) => b.timestamp - a.timestamp);

      const ultimoMsg = todosMensajes[0];
      lista.push({
        alumno: alum,
        convs,
        totalNoLeidos,
        ultimoMensajeTexto: ultimoMsg ? ultimoMsg.texto : (convs[0]?.ultimoMensaje || 'Sin mensajes aún'),
        ultimoMensajeFecha: ultimoMsg ? ultimoMsg.timestamp : 0,
      });
    });

    // 2. Agregar cualquier otro alumno de misConversaciones que no estuviera en misAlumnos
    misConversaciones.forEach((conv) => {
      if (conv.alumnoId && !idsProcesados.has(conv.alumnoId)) {
        idsProcesados.add(conv.alumnoId);
        const alum = alumnos.find((a) => a.id === conv.alumnoId);
        if (alum) {
          const convs = misConversaciones.filter((c) => c.alumnoId === alum.id);
          const totalNoLeidos = convs.reduce((acc, c) => acc + (c.noLeidosDestinatario || 0), 0);
          const todosMensajes = convs.flatMap((c) =>
            mensajes.filter((m) => m.conversacionId === c.id)
          ).sort((a, b) => b.timestamp - a.timestamp);
          const ultimoMsg = todosMensajes[0];
          lista.push({
            alumno: alum,
            convs,
            totalNoLeidos,
            ultimoMensajeTexto: ultimoMsg ? ultimoMsg.texto : (convs[0]?.ultimoMensaje || 'Sin mensajes aún'),
            ultimoMensajeFecha: ultimoMsg ? ultimoMsg.timestamp : 0,
          });
        }
      }
    });

    // Ordenar: primero los que tienen mensajes no leídos, luego los de comunicación más reciente, luego alfabético
    return lista.sort((a, b) => {
      if (a.totalNoLeidos > 0 && b.totalNoLeidos === 0) return -1;
      if (b.totalNoLeidos > 0 && a.totalNoLeidos === 0) return 1;
      if (b.ultimoMensajeFecha !== a.ultimoMensajeFecha) {
        return b.ultimoMensajeFecha - a.ultimoMensajeFecha;
      }
      return `${a.alumno.apellidos} ${a.alumno.nombre}`.localeCompare(
        `${b.alumno.apellidos} ${b.alumno.nombre}`
      );
    });
  }, [misAlumnos, misConversaciones, mensajes, alumnos]);

  // Alumnos del chat filtrados en tiempo real por búsqueda
  const itemsAlumnosFiltrados = useMemo(() => {
    if (!busquedaChatAlumnos.trim()) return itemsAlumnos;
    const q = busquedaChatAlumnos.toLowerCase().trim();
    return itemsAlumnos.filter((item) => {
      const full = `${item.alumno.nombre} ${item.alumno.apellidos}`.toLowerCase();
      const inv = `${item.alumno.apellidos} ${item.alumno.nombre}`.toLowerCase();
      return full.includes(q) || inv.includes(q);
    });
  }, [itemsAlumnos, busquedaChatAlumnos]);

  // Selección de Alumno activo
  const [selectedAlumnoId, setSelectedAlumnoId] = useState<string>(
    itemsAlumnos[0]?.alumno.id || ''
  );

  // Navegación móvil: 'lista' para ver los alumnos, 'chat' para ver el canal seleccionado sin scroll
  const [vistaMobile, setVistaMobile] = useState<'lista' | 'chat'>('lista');

  const itemAlumnoActivo = itemsAlumnos.find((i) => i.alumno.id === selectedAlumnoId) || itemsAlumnos[0];
  const alumnoActivo = itemAlumnoActivo?.alumno;
  const convsAlumnoActivo = itemAlumnoActivo?.convs || [];

  // Conversación seleccionada dentro del alumno
  const [convSeleccionadaId, setConvSeleccionadaId] = useState<string>('');

  // Sincronizar conversación activa si cambia de alumno
  const convActiva = useMemo(() => {
    if (convSeleccionadaId && convsAlumnoActivo.some((c) => c.id === convSeleccionadaId)) {
      return convsAlumnoActivo.find((c) => c.id === convSeleccionadaId);
    }
    return convsAlumnoActivo[0] || null;
  }, [convSeleccionadaId, convsAlumnoActivo]);

  const [textoRespuesta, setTextoRespuesta] = useState('');
  const [replicarAOtros, setReplicarAOtros] = useState(false);

  const mensajesActivos = convActiva
    ? mensajes.filter((m) => m.conversacionId === convActiva.id)
    : [];

  const handleCrearAviso = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) return;

    publicarAviso({
      titulo: nuevoTitulo.trim(),
      contenido: nuevoContenido.trim(),
      tipoEmisor: 'colegio',
      remitenteUid: currentUser.uid,
      remitenteNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      remitenteRol: 'profesor',
      alcance: currentUser.cursos[0] || '3P',
      alcanceNombre: cursos.find((c) => c.id === currentUser.cursos[0])?.nombre || '3º de Primaria',
      esAutorizacion,
      tipoFirma: esAutorizacion ? tipoFirma : null,
      fechaLimiteFirma: esAutorizacion ? Date.now() + 3600000 * 72 : null,
    });

    setNuevoTitulo('');
    setNuevoContenido('');
    setEsAutorizacion(false);
    setAvisoCreadoExito(true);
    setTimeout(() => setAvisoCreadoExito(false), 4000);
  };

  const handleEnviarRespuesta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convActiva || !textoRespuesta.trim()) return;

    enviarMensaje(convActiva.id, textoRespuesta.trim(), replicarAOtros);
    setTextoRespuesta('');
    setReplicarAOtros(false);
  };

  const seleccionarAlumno = (alumnoId: string) => {
    setSelectedAlumnoId(alumnoId);
    const item = itemsAlumnos.find((i) => i.alumno.id === alumnoId);
    if (item && item.convs[0]) {
      setConvSeleccionadaId(item.convs[0].id);
    }
    setVistaMobile('chat');
  };

  const totalMensajesNoLeidos = misConversaciones.reduce(
    (acc, c) => acc + (c.noLeidosDestinatario || 0),
    0
  );

  return (
    <div className="space-y-2 sm:space-y-3 pb-8">
      {/* 1. BARRA DE ICONOS ANCLADA ARRIBA (Sticky top-14) */}
      <div className="sticky top-14 -mt-2 sm:-mt-4 pt-2 z-30 pb-1.5 backdrop-blur-md bg-slate-100/95 transition-all">
        <div className="grid grid-cols-4 sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('circulares')}
            title={`Circulares Oficiales del Centro ${avisosCentroNoLeidos > 0 ? `(${avisosCentroNoLeidos} sin leer)` : ''}`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'circulares'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bell className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
              {avisosCentroNoLeidos > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-black leading-none bg-rose-600 text-white flex items-center justify-center shadow-xs animate-pulse">
                  {avisosCentroNoLeidos}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Circulares</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('mensajeria');
              setVistaMobile('lista');
            }}
            title="Mensajes con Alumnos y Familias"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'mensajeria'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
              {totalMensajesNoLeidos > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-black leading-none bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  {totalMensajesNoLeidos}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Mensajería Alumnos</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('nuevo-aviso')}
            title="Publicar Aviso o Autorización"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'nuevo-aviso'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <PlusCircle className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Publicar Aviso</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('alumnos')}
            title={`Expedientes de Alumnos (${misAlumnos.length})`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'alumnos'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Users className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Alumnos ({misAlumnos.length})</span>
          </button>
        </div>
      </div>

      {/* 2. BARRA DE ESTADO COMPACTA (1 sola fila limpia para ahorrar scroll) */}
      <div className="flex items-center justify-between gap-2 px-1 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0">
          <span className="font-bold text-slate-800 truncate">
            {cursos.find((c) => c.id === currentUser.cursos[0])?.nombre || '3º de Primaria B'}
          </span>
          <span className="text-slate-400">&bull;</span>
          <span className="text-slate-600 font-medium">
            {misAlumnos.length} alumnos
          </span>
          {totalMensajesNoLeidos > 0 && (
            <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-1">
              {totalMensajesNoLeidos} nuevo(s)
            </span>
          )}
        </div>

        {/* Chip discreto de horario de desconexión */}
        <button
          type="button"
          onClick={() => setModalPerfilOpen(true)}
          className={`px-2 py-1 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition shrink-0 ${
            horarioLaboralActivo
              ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
          title="Ajustar horario personal de notificaciones"
        >
          <Clock className="w-3 h-3 text-emerald-600" />
          <span>{horarioLaboralActivo ? 'Horario activo' : 'Desconexión'}</span>
        </button>
      </div>

      {/* 3. AVISO INFORMATIVO DE DESCONEXIÓN DIGITAL (Cerrable con X para mínimo scroll) */}
      {mostrarTextosInformativos && (
        <div
          className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition animate-fadeIn ${
            horarioLaboralActivo
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : 'bg-slate-800 border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock
              className={`w-3.5 h-3.5 shrink-0 ${
                horarioLaboralActivo ? 'text-emerald-700' : 'text-amber-400'
              }`}
            />
            <span className="truncate text-[11px]">
              {horarioLaboralActivo
                ? `Horario docente activo (${currentUser.horarioNotificaciones?.horaInicio || '08:30'} - ${currentUser.horarioNotificaciones?.horaFin || '15:00'}).`
                : `Desconexión digital programada: avisos en pausa hasta las ${currentUser.horarioNotificaciones?.horaInicio || '08:30'} h.`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setModalPerfilOpen(true)}
              className="text-[10px] underline font-semibold text-emerald-700 hover:text-emerald-900 dark:text-emerald-300"
            >
              Ajustar
            </button>
            <button
              type="button"
              onClick={() => setMostrarTextosInformativos(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md transition"
              title="Cerrar aviso informativo (reactivar en Ajustes)"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. CONTENIDO PRINCIPAL SEGÚN PESTAÑA */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {/* PESTAÑA 1: MENSAJERÍA ORIENTADA A LOS ALUMNOS */}
        {activeTab === 'mensajeria' && (
          <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
            {/* COLUMNA 1: LISTADO DE ALUMNOS (Visible siempre en escritorio, o en móvil si vistaMobile === 'lista') */}
            <div
              className={`md:col-span-5 lg:col-span-4 border-r border-slate-200 p-2.5 sm:p-3 bg-slate-50/40 space-y-2 ${
                vistaMobile === 'chat' ? 'hidden md:block' : 'block'
              }`}
            >
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Alumnos del Curso
                </span>
                <span className="text-[10px] font-semibold text-slate-400 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                  {itemsAlumnosFiltrados.length} {itemsAlumnosFiltrados.length === 1 ? 'alumno' : 'alumnos'}
                </span>
              </div>

              {/* Buscador en tiempo real con lupa */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={busquedaChatAlumnos}
                  onChange={(e) => setBusquedaChatAlumnos(e.target.value)}
                  placeholder="Buscar alumno..."
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-2xs"
                />
                {busquedaChatAlumnos && (
                  <button
                    type="button"
                    onClick={() => setBusquedaChatAlumnos('')}
                    className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Limpiar búsqueda"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="space-y-1.5 max-h-[70vh] md:max-h-[520px] overflow-y-auto pr-0.5">
                {itemsAlumnosFiltrados.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 text-xs bg-white rounded-xl border border-dashed border-slate-200">
                    <p className="font-semibold text-slate-500">Sin coincidencias</p>
                    <p className="text-[11px]">No hay alumnos con "{busquedaChatAlumnos}"</p>
                  </div>
                ) : (
                  itemsAlumnosFiltrados.map((item) => {
                  const isSelected = item.alumno.id === alumnoActivo?.id;
                  const iniciales = `${item.alumno.nombre.charAt(0)}${item.alumno.apellidos.charAt(0)}`.toUpperCase();

                  return (
                    <button
                      key={item.alumno.id}
                      type="button"
                      onClick={() => seleccionarAlumno(item.alumno.id)}
                      className={`w-full text-left p-2.5 rounded-xl border text-xs transition cursor-pointer flex items-center gap-2.5 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 shadow-xs ring-1 ring-emerald-500/20'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100/80 hover:border-slate-300'
                      }`}
                    >
                      {/* Avatar del alumno con iniciales */}
                      <div className="w-8 h-8 rounded-full bg-emerald-700 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                        {iniciales}
                      </div>

                      {/* Información principal del alumno */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-slate-900 truncate text-[13px]">
                            {item.alumno.nombre} {item.alumno.apellidos}
                          </span>
                          {item.totalNoLeidos > 0 && (
                            <span className="min-w-[17px] h-[17px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center shrink-0 shadow-xs">
                              {item.totalNoLeidos}
                            </span>
                          )}
                        </div>

                        {/* Canales y padres vinculados */}
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                          {item.alumno.padresSeparados ? (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-semibold px-1.5 py-0.2 rounded shrink-0">
                              Separados (2 canales)
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-500 shrink-0">
                              {item.convs.length > 0 ? `${item.convs.length} canal` : 'Sin canal activo'}
                            </span>
                          )}
                          <span className="truncate italic text-slate-400">
                            &bull; "{item.ultimoMensajeTexto}"
                          </span>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-slate-300 shrink-0 md:hidden" />
                    </button>
                  );
                })
              )}
            </div>
            </div>

            {/* COLUMNA 2: DETALLE DEL CHAT CON EL ALUMNO SELECCIONADO (Visible en escritorio, o en móvil si vistaMobile === 'chat') */}
            <div
              className={`md:col-span-7 lg:col-span-8 flex flex-col ${
                vistaMobile === 'lista' ? 'hidden md:flex' : 'flex'
              }`}
            >
              {alumnoActivo ? (
                <div className="flex flex-col h-full">
                  {/* CABECERA DEL CHAT CON EL ALUMNO */}
                  <div className="p-3 bg-slate-50/90 border-b border-slate-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        {/* Botón Volver a Alumnos en móvil */}
                        <button
                          type="button"
                          onClick={() => setVistaMobile('lista')}
                          className="md:hidden p-1.5 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 transition shrink-0 flex items-center gap-1 text-xs font-semibold"
                        >
                          <ArrowLeft className="w-4 h-4 text-emerald-800" />
                          <span>Alumnos</span>
                        </button>

                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-slate-900 text-sm truncate">
                              {alumnoActivo.nombre} {alumnoActivo.apellidos}
                            </h3>
                            {alumnoActivo.padresSeparados && (
                              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                                Separados
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 truncate">
                            Canal de tutoría docente &bull; {cursos.find((c) => c.id === alumnoActivo.cursoId)?.nombre || '3º Primaria B'}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-500 shrink-0 hidden sm:block">
                        {alumnoActivo.progenitores.length} progenitor(es)
                      </div>
                    </div>

                    {/* SELECTOR DE CANALES POR PROGENITOR DENTRO DEL ALUMNO */}
                    {convsAlumnoActivo.length > 1 ? (
                      <div className="pt-1 border-t border-slate-200/80">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                          Canal privado por progenitor:
                        </span>
                        <div className="grid grid-cols-2 gap-1.5">
                          {convsAlumnoActivo.map((conv) => {
                            const isSelected = conv.id === convActiva?.id;
                            return (
                              <button
                                key={conv.id}
                                type="button"
                                onClick={() => setConvSeleccionadaId(conv.id)}
                                className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition flex items-center justify-between text-left cursor-pointer ${
                                  isSelected
                                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <span className="truncate">{conv.progenitorNombre}</span>
                                {(conv.noLeidosDestinatario || 0) > 0 && (
                                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0 ml-1" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : convActiva ? (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-200">
                        <span className="font-semibold text-slate-800">Progenitor en este canal:</span>
                        <span className="text-slate-600">{convActiva.progenitorNombre}</span>
                      </div>
                    ) : null}

                    {/* AVISO EXPLICATIVO DE CANAL ESTANCO (Cerrable) */}
                    {mostrarTextosInformativos && alumnoActivo.padresSeparados && (
                      <div className="p-2 bg-amber-50/70 border border-amber-200 rounded-lg text-[11px] text-amber-900 flex items-center justify-between gap-1.5 animate-fadeIn">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <UserCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="truncate">
                            Canal estanco: cada progenitor solo tiene acceso a su propio hilo privado.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMostrarTextosInformativos(false)}
                          className="p-0.5 text-amber-600 hover:text-amber-800 rounded transition shrink-0"
                          title="Cerrar nota informativa"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* CUERPO DE MENSAJES (Altura óptima sin scroll previo) */}
                  <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-slate-50/20 max-h-[50vh] min-h-[220px]">
                    {mensajesActivos.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-xs text-slate-400 py-8">
                        <MessageSquare className="w-8 h-8 text-slate-300 mb-1.5" />
                        <span>Sin mensajes previos con este progenitor.</span>
                        <span className="text-[11px] text-slate-400">
                          Escriba una respuesta a continuación para iniciar el diálogo.
                        </span>
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
                              className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-xs ${
                                esMio
                                  ? 'bg-emerald-800 text-white rounded-br-none'
                                  : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.texto}</p>
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

                  {/* FORMULARIO DE RESPUESTA DIRECTA */}
                  <div className="p-2.5 sm:p-3 bg-white border-t border-slate-200">
                    <form onSubmit={handleEnviarRespuesta} className="space-y-1.5">
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          maxLength={500}
                          value={textoRespuesta}
                          onChange={(e) => setTextoRespuesta(e.target.value)}
                          placeholder={`Responder al progenitor de ${alumnoActivo.nombre}...`}
                          className="flex-1 text-xs px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={!textoRespuesta.trim()}
                          className="px-3.5 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer shrink-0"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Enviar</span>
                        </button>
                      </div>

                      {/* Replicar a ambos progenitores si separados */}
                      {alumnoActivo.padresSeparados && (
                        <div className="bg-amber-50/70 border border-amber-200 rounded-lg p-1.5 text-xs text-amber-900 flex items-center justify-between">
                          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-[11px]">
                            <input
                              type="checkbox"
                              checked={replicarAOtros}
                              onChange={(e) => setReplicarAOtros(e.target.checked)}
                              className="rounded text-amber-700 focus:ring-amber-600 cursor-pointer"
                            />
                            <span>Replicar respuesta en el canal del otro progenitor</span>
                          </label>
                          <CopyCheck className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        </div>
                      )}
                    </form>
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-slate-500 my-auto">
                  Seleccione un alumno en la columna izquierda para ver la conversación.
                </div>
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 2: NUEVO AVISO / AUTORIZACIÓN */}
        {activeTab === 'nuevo-aviso' && (
          <div className="p-4 sm:p-5 max-w-xl mx-auto space-y-4">
            {avisoCreadoExito && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Aviso publicado correctamente y notificaciones encoladas.</span>
              </div>
            )}

            <form onSubmit={handleCrearAviso} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Título de la comunicación
                </label>
                <input
                  type="text"
                  required
                  value={nuevoTitulo}
                  onChange={(e) => setNuevoTitulo(e.target.value)}
                  placeholder="ej. Salida al Museo de Ciencias Naturales"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-800 mb-1">
                  Contenido informativo para las familias
                </label>
                <EditorTextoEnriquecido
                  content={nuevoContenido}
                  onChange={setNuevoContenido}
                  placeholder="Escriba o pegue el contenido de la comunicación..."
                />
              </div>

              {/* Sección de Autorización */}
              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
                  <input
                    type="checkbox"
                    checked={esAutorizacion}
                    onChange={(e) => setEsAutorizacion(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
                  />
                  <span>Convertir en solicitud de Autorización / Consentimiento firmado</span>
                </label>

                {esAutorizacion && (
                  <div className="pt-2 border-t border-slate-200 space-y-2">
                    <p className="font-semibold text-slate-700">Modalidad de firma requerida:</p>
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoFirma"
                          value="UN_PROGENITOR"
                          checked={tipoFirma === 'UN_PROGENITOR'}
                          onChange={() => setTipoFirma('UN_PROGENITOR')}
                          className="text-emerald-700"
                        />
                        <span>Basta la firma de un solo progenitor (Actividad ordinaria)</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tipoFirma"
                          value="AMBOS_PROGENITORES"
                          checked={tipoFirma === 'AMBOS_PROGENITORES'}
                          onChange={() => setTipoFirma('AMBOS_PROGENITORES')}
                          className="text-emerald-700"
                        />
                        <span>
                          Firma obligatoria de AMBOS progenitores en caso de custodia compartida / separación
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white font-semibold rounded-lg shadow-xs transition cursor-pointer"
              >
                Publicar en el Muro de {cursos.find((c) => c.id === currentUser.cursos[0])?.nombre || '3ºB'}
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA 3: EXPEDIENTES DE ALUMNOS */}
        {activeTab === 'alumnos' && (
          <div className="p-4 sm:p-5 space-y-3">
            {/* Buscador en tiempo real con lupa */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={busquedaAlumnos}
                onChange={(e) => setBusquedaAlumnos(e.target.value)}
                placeholder="Buscar alumno por nombre o apellidos..."
                className="w-full pl-9 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-600 focus:bg-white focus:outline-none transition shadow-2xs"
              />
              {busquedaAlumnos && (
                <button
                  type="button"
                  onClick={() => setBusquedaAlumnos('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                  title="Borrar búsqueda"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="text-xs text-slate-500 flex items-center justify-between px-0.5">
              <span>Relación de alumnos matriculados</span>
              <span className="font-bold text-slate-700">
                {alumnosFiltrados.length === misAlumnos.length
                  ? `${misAlumnos.length} alumnos`
                  : `${alumnosFiltrados.length} de ${misAlumnos.length} alumnos`}
              </span>
            </div>

            {/* Lista contraída por defecto solo al nombre del alumno */}
            <div className="space-y-2">
              {alumnosFiltrados.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                  <Search className="w-6 h-6 mx-auto mb-2 text-slate-300" />
                  <p className="font-semibold text-slate-600">No se encontraron alumnos</p>
                  <p className="text-[11px] mt-0.5">Ningún alumno coincide con "{busquedaAlumnos}"</p>
                </div>
              ) : (
                alumnosFiltrados.map((alum) => {
                  const estaExpandido = alumnoExpandidoId === alum.id;

                  return (
                    <div
                      key={alum.id}
                      className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden transition hover:border-emerald-300"
                    >
                      {/* Fila contraída: solo nombre del alumno y flecha para desplegar */}
                      <button
                        type="button"
                        onClick={() => setAlumnoExpandidoId(estaExpandido ? null : alum.id)}
                        className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50/80 transition cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                            {alum.nombre.charAt(0)}{alum.apellidos.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900 text-sm truncate">
                            {alum.nombre} {alum.apellidos}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {alum.padresSeparados && (
                            <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                              Separados
                            </span>
                          )}
                          {estaExpandido ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>
                      </button>

                      {/* Detalles desplegados al pulsar */}
                      {estaExpandido && (
                        <div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-2 text-xs">
                          <div className="space-y-1 text-slate-600 text-[11px]">
                            <p className="font-semibold text-slate-700">Progenitores vinculados:</p>
                            {alum.progenitores.map((p, idx) => (
                              <p key={idx} className="truncate">
                                &bull; {p.nombre} {p.apellidos} ({p.parentesco})
                              </p>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('mensajeria');
                              seleccionarAlumno(alum.id);
                            }}
                            className="w-full py-2 px-3 bg-white hover:bg-emerald-50 text-emerald-800 font-semibold border border-slate-200 hover:border-emerald-300 rounded-lg text-xs flex items-center justify-center gap-1.5 transition shadow-2xs cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                            <span>Ver canal de mensajería</span>
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* PESTAÑA 4: CIRCULARES OFICIALES DEL CENTRO */}
        {activeTab === 'circulares' && (
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-100 flex-wrap gap-2">
              <span className="font-semibold text-slate-700">Circulares oficiales de Dirección y Secretaría</span>
              <div className="flex items-center gap-2">
                {avisosCentroNoLeidos > 0 && (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                    {avisosCentroNoLeidos} nueva(s) sin leer
                  </span>
                )}
                <span>{avisosCentro.length} publicaciones</span>
              </div>
            </div>

            {avisosCentro.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                No hay circulares oficiales publicadas para este curso.
              </div>
            ) : (
              avisosCentro.map((av) => {
                const confs = confirmacionesLectura[av.id] || [];
                const leido = confs.includes(currentUser.uid);
                const esEmergencia = av.esEmergencia || av.prioridad === 'urgente';

                return (
                  <div
                    key={av.id}
                    className={`border rounded-xl p-4 transition space-y-2.5 ${
                      esEmergencia
                        ? 'border-2 border-rose-400 bg-rose-50/30 shadow-xs'
                        : !leido
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!leido && (
                          <span className="bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                            Nueva
                          </span>
                        )}
                        {esEmergencia && (
                          <span className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 text-white" />
                            <span>ALERTA DE EMERGENCIA</span>
                          </span>
                        )}
                        <span className="bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded text-[11px]">
                          {av.remitenteNombre || 'Dirección / Secretaría'}
                        </span>
                        <span className="text-slate-500 font-medium text-[11px]">
                          Alcance: {av.alcance === 'TODOS' ? 'Toda la Comunidad' : av.alcance}
                        </span>
                      </div>
                      <span className="text-slate-400 text-[11px]">
                        {new Date(av.fechaPublicacion).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                        })}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{av.titulo}</h4>
                    <ContenidoEnriquecido content={av.contenido} />

                    <div className="pt-2 border-t border-slate-100 flex justify-end">
                      {leido ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Leída</span>
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => confirmarLecturaAviso(av.id)}
                          className="px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                          <span>Marcar como leída</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

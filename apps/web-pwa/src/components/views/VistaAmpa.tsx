import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { EditorTextoEnriquecido } from '../common/EditorTextoEnriquecido';
import { ContenidoEnriquecido } from '../common/ContenidoEnriquecido';
import {
  Users,
  Send,
  PlusCircle,
  MessageSquare,
  ShieldCheck,
  Calendar,
  Building,
  CheckCircle2,
  X,
  HeartHandshake,
} from 'lucide-react';

export const VistaAmpa: React.FC = () => {
  const {
    currentUser,
    avisos,
    conversaciones,
    mensajes,
    publicarAviso,
    enviarMensaje,
    cursos,
    cambiarRolActivo,
    mostrarExplicacionRolesAmpa,
    setMostrarExplicacionRolesAmpa,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'avisos-ampa' | 'publicar' | 'consultas'>('avisos-ampa');
  const [titulo, setTitulo] = useState('');
  const [contenido, setContenido] = useState('');
  const [alcance, setAlcance] = useState<'TODOS' | string>('TODOS');
  const [publicadoExito, setPublicadoExito] = useState(false);

  // Estado para cerrar/ocultar el aviso informativo de privacidad RGPD
  const [avisoPrivacidadCerrado, setAvisoPrivacidadCerrado] = useState<boolean>(() => {
    return localStorage.getItem('molinillo_ampa_aviso_privacidad_cerrado') === 'true';
  });

  const handleCerrarAvisoPrivacidad = () => {
    setAvisoPrivacidadCerrado(true);
    localStorage.setItem('molinillo_ampa_aviso_privacidad_cerrado', 'true');
  };

  const handleMostrarAvisoPrivacidad = () => {
    setAvisoPrivacidadCerrado(false);
    localStorage.removeItem('molinillo_ampa_aviso_privacidad_cerrado');
  };

  // Notificaciones y consultas recibidas que puede atender el AMPA:
  // Únicamente aquellas dirigidas directamente al AMPA por las familias o el centro escolar
  const misConsultas = conversaciones.filter(
    (c) =>
      c.tipoCanal === 'ampa' &&
      (c.destinatarioUid === currentUser.uid ||
        c.destinatarioUid === 'user-ampa-1' ||
        !c.destinatarioUid ||
        c.destinatarioRol === 'ampa' ||
        (c.destinatarioNombre && c.destinatarioNombre.toLowerCase().includes('ampa')))
  );
  const [convSeleccionadaId, setConvSeleccionadaId] = useState<string>(
    misConsultas[0]?.id || ''
  );
  const [textoRespuesta, setTextoRespuesta] = useState('');

  const convActiva = misConsultas.find((c) => c.id === convSeleccionadaId) || misConsultas[0];
  
  // Obtener mensajes de la consulta activa asegurando que el mensaje de la izquierda siempre aparezca en el chat
  const mensajesActivos = React.useMemo(() => {
    if (!convActiva) return [];
    const directos = mensajes.filter((m) => m.conversacionId === convActiva.id);
    if (directos.length > 0) return directos;

    // Respaldo garantizado: si no hay mensajes desglosados en el array pero la conversación tiene un último mensaje registrado
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

  // Avisos del AMPA existentes ordenados por más reciente primero
  const avisosAmpa = avisos
    .filter((a) => a.tipoEmisor === 'ampa')
    .sort((a, b) => (b.fechaPublicacion || 0) - (a.fechaPublicacion || 0));

  const handlePublicarAvisoAmpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !contenido.trim()) return;

    publicarAviso({
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      tipoEmisor: 'ampa',
      remitenteUid: currentUser.uid,
      remitenteNombre: `${currentUser.nombre} ${currentUser.apellidos} (AMPA)`,
      remitenteRol: 'ampa',
      alcance,
      alcanceNombre: alcance === 'TODOS' ? 'Toda la Comunidad Educativa' : alcance,
      esAutorizacion: false,
    });

    setTitulo('');
    setContenido('');
    setPublicadoExito(true);
    setTimeout(() => setPublicadoExito(false), 4000);
  };

  const handleEnviarRespuestaAmpa = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convActiva || !textoRespuesta.trim()) return;

    enviarMensaje(convActiva.id, textoRespuesta.trim(), false);
    setTextoRespuesta('');
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 1. BARRA DE ICONOS ANCLADA ARRIBA (Sticky top-14) */}
      <div className="sticky top-14 -mt-2 sm:-mt-4 pt-2 z-30 pb-1.5 backdrop-blur-md bg-slate-100/95 transition-all">
        <div className="grid grid-cols-3 sm:flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('avisos-ampa')}
            title={`Comunicados Publicados (${avisosAmpa.length})`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-2 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'avisos-ampa'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Building className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Comunicados</span>
            <span className="hidden sm:inline text-xs opacity-75 font-normal">({avisosAmpa.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('publicar')}
            title="Redactar Comunicado"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-2 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'publicar'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <PlusCircle className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Redactar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('consultas')}
            title={`Consultas Directas (${misConsultas.length})`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-2 sm:px-4 rounded-lg transition relative cursor-pointer ${
              activeTab === 'consultas'
                ? 'bg-blue-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <MessageSquare className="w-6 h-6 sm:w-5 sm:h-5 shrink-0" />
            </div>
            <span className="hidden sm:inline">Consultas</span>
            <span className="hidden sm:inline text-xs opacity-75 font-normal">({misConsultas.length})</span>
          </button>
        </div>
      </div>

      {/* 2. Selector Rápido Anclado: Área de Familia vs Gestión del AMPA */}
      {currentUser.roles?.includes('padre') && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 p-1 bg-white border border-slate-200/90 rounded-2xl shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => cambiarRolActivo('padre')}
              className="py-2.5 px-3 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition text-slate-700 hover:text-slate-900 hover:bg-slate-100 cursor-pointer active:scale-95"
            >
              <Users className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Área de Familia</span>
            </button>

            <button
              type="button"
              className="py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition bg-blue-800 text-white shadow-xs cursor-default"
            >
              <HeartHandshake className="w-4 h-4 text-blue-200 shrink-0" />
              <span>Gestión del AMPA</span>
            </button>
          </div>

          {/* Texto explicativo debajo (Cerrable con X) */}
          {mostrarExplicacionRolesAmpa && (
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5 sm:p-3 text-xs text-emerald-900 flex items-start justify-between gap-2 shadow-xs transition-all">
              <div className="flex items-start gap-2">
                <Users className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="text-[11px] text-emerald-900/90 leading-relaxed">
                  Estás gestionando el canal asociativo del AMPA (comunicados y buzón directo). Pulsa en <strong>Área de Familia</strong> para ver el seguimiento, tutorías y autorizaciones de tus hijos.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setMostrarExplicacionRolesAmpa(false)}
                className="text-emerald-600 hover:text-emerald-900 p-1 rounded-lg hover:bg-emerald-100 transition shrink-0 cursor-pointer"
                title="Cerrar explicación (puedes volver a activarla desde Opciones)"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Declaración de Privacidad RGPD del AMPA (Cerrable) */}
      {!avisoPrivacidadCerrado && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900 flex items-start justify-between gap-3 shadow-sm transition-all">
          <div className="flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Compartimentación y Privacidad RGPD (Canal AMPA)</p>
              <p className="text-blue-800/80 mt-0.5 leading-relaxed">
                Como representante de la Asociación de Madres y Padres de Alumnos, dispones de permisos para emitir comunicados oficiales y atender únicamente las consultas y notificaciones enviadas directamente al AMPA. Por estricta protección de datos de los menores (RGPD), no tienes acceso a expedientes escolares, faltas ni a las tutorías privadas con el profesorado.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCerrarAvisoPrivacidad}
            title="Cerrar aviso informativo"
            aria-label="Cerrar aviso"
            className="text-blue-600 hover:text-blue-900 hover:bg-blue-200/50 p-1 rounded-lg transition shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cabecera del Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 bg-slate-900 text-white flex items-center">
          <h2 className="text-sm sm:text-base font-bold tracking-tight">
            Asociación de familiares de alumnos
          </h2>
        </div>

        <div className="p-4 sm:p-5">
          {/* PESTAÑA 1: COMUNICADOS AMPA */}
          {activeTab === 'avisos-ampa' && (
            <div className="space-y-3">
              {avisosAmpa.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No hay comunicados del AMPA publicados actualmente.
                </div>
              ) : (
                avisosAmpa.map((av) => (
                  <div
                    key={av.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="font-semibold text-blue-800 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                        {av.alcance === 'TODOS' ? 'Toda la Comunidad Educativa' : `Curso: ${av.alcance}`}
                      </span>
                      <span>{new Date(av.fechaPublicacion).toLocaleDateString('es-ES')}</span>
                    </div>
                    <h3 className="font-bold text-slate-900 text-sm">{av.titulo}</h3>
                    <ContenidoEnriquecido content={av.contenido} />
                  </div>
                ))
              )}
            </div>
          )}

          {/* PESTAÑA 2: PUBLICAR */}
          {activeTab === 'publicar' && (
            <div className="max-w-xl mx-auto space-y-4 text-xs">
              {publicadoExito && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Comunicado del AMPA publicado con éxito en el muro general.</span>
                </div>
              )}

              <form onSubmit={handlePublicarAvisoAmpa} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Título del Comunicado del AMPA
                  </label>
                  <input
                    type="text"
                    required
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    placeholder="ej. Campaña de recogida de libros de lectura / Taller de robótica"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Destinatarios del comunicado
                  </label>
                  <select
                    value={alcance}
                    onChange={(e) => setAlcance(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                  >
                    <option value="TODOS">Toda la Comunidad Educativa (Todas las familias)</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-800 mb-1">
                    Contenido informativo (conserva formato al copiar y pegar desde Word, Docs o PDF)
                  </label>
                  <EditorTextoEnriquecido
                    content={contenido}
                    onChange={setContenido}
                    placeholder="Escriba o pegue aquí los detalles de la actividad del AMPA, fechas, cuotas..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-800 hover:bg-blue-900 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Publicar Comunicado Oficial del AMPA
                </button>
              </form>
            </div>
          )}

          {/* PESTAÑA 3: NOTIFICACIONES Y CONSULTAS DIRECTAS */}
          {activeTab === 'consultas' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                    Recibidas Directamente
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.5 rounded border border-blue-200">
                    Directo AMPA
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">
                  Solo se atienden las comunicaciones enviadas directamente al canal del AMPA.
                </p>

                {misConsultas.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 italic">
                    No hay notificaciones ni consultas enviadas directamente al AMPA.
                  </div>
                ) : (
                  misConsultas.map((conv) => (
                    <button
                      key={conv.id}
                      onClick={() => setConvSeleccionadaId(conv.id)}
                      className={`w-full text-left p-3 rounded-lg border text-xs transition ${
                        conv.id === convActiva?.id
                          ? 'bg-blue-50 border-blue-600 text-blue-950 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold">{conv.progenitorNombre}</p>
                        <span className="text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                          Directo
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 truncate italic">
                        "{conv.ultimoMensaje}"
                      </p>
                    </button>
                  ))
                )}
              </div>

              <div className="md:col-span-2 space-y-3">
                {convActiva ? (
                  <>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                      <div className="flex items-center justify-between flex-wrap gap-1">
                        <p className="font-bold text-slate-900">
                          Atendiendo Consulta de: {convActiva.progenitorNombre}
                        </p>
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">
                          Enviada directamente al AMPA
                        </span>
                      </div>
                      <p className="text-slate-500 text-[11px] mt-1">
                        Canal exclusivo para atender consultas directas de familias (extraescolares, banco de libros, uniformes). Sin acceso a tutorías ni datos privados docentes.
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl p-3.5 h-64 overflow-y-auto space-y-2.5 bg-slate-50/20">
                      {mensajesActivos.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
                          No hay mensajes anteriores en esta conversación.
                        </div>
                      ) : (
                        mensajesActivos.map((msg) => {
                          const esRespuestaAmpa = msg.remitenteRol === 'ampa';
                          return (
                            <div
                              key={msg.id}
                              className={`flex flex-col ${esRespuestaAmpa ? 'items-end' : 'items-start'}`}
                            >
                              <div
                                className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-sm ${
                                  esRespuestaAmpa
                                    ? 'bg-blue-800 text-white rounded-br-none'
                                    : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                                }`}
                              >
                                <p
                                  className={`text-[10px] font-bold mb-0.5 ${
                                    esRespuestaAmpa ? 'text-blue-200' : 'text-slate-500'
                                  }`}
                                >
                                  {msg.remitenteNombre}
                                </p>
                                <p className="whitespace-pre-line">{msg.texto}</p>
                                <span
                                  className={`block text-[10px] mt-1 text-right ${
                                    esRespuestaAmpa ? 'text-blue-200' : 'text-slate-400'
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

                    <form onSubmit={handleEnviarRespuestaAmpa} className="flex gap-2">
                      <input
                        type="text"
                        maxLength={500}
                        value={textoRespuesta}
                        onChange={(e) => setTextoRespuesta(e.target.value)}
                        placeholder="Escriba su respuesta a la familia..."
                        className="flex-1 text-xs px-3.5 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={!textoRespuesta.trim()}
                        className="px-4 py-2 bg-blue-800 hover:bg-blue-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                      >
                        <Send className="w-3.5 h-3.5" />
                        Atender Consulta
                      </button>
                    </form>
                  </>
                ) : (
                  <div className="text-center py-12 text-xs text-slate-500">
                    Seleccione una consulta para responder.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

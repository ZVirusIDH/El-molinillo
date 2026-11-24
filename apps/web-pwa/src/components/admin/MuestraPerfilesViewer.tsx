import React, { useState } from 'react';
import {
  useApp,
  AppContext,
  AppContextType,
  PERFILES_PREDEFINIDOS,
  PerfilPredefinido,
} from '../../context/AppContext';
import { VistaPadre } from '../views/VistaPadre';
import { VistaProfesor } from '../views/VistaProfesor';
import { VistaAmpa } from '../views/VistaAmpa';
import {
  Eye,
  Smartphone,
  Maximize2,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Users,
  Building,
  ArrowRight,
  ExternalLink,
  Info,
  UserCheck,
  FileText,
  Clock,
  Sparkles,
  Bell,
} from 'lucide-react';

export const MuestraPerfilesViewer: React.FC = () => {
  const parentContext = useApp();
  const { cambiarPerfil, alumnos, avisos, encuestas, cursos, confirmacionesLectura } = parentContext;

  // Filtramos los perfiles que no sean admin para la muestra
  const perfilesMuestra = PERFILES_PREDEFINIDOS.filter((p) => p.usuario.rol !== 'admin');

  const [perfilSeleccionadoId, setPerfilSeleccionadoId] = useState<string>(
    perfilesMuestra[0]?.id || 'padre-1'
  );
  const [formatoVista, setFormatoVista] = useState<'movil' | 'expandido'>('movil');

  const perfilActual = perfilesMuestra.find((p) => p.id === perfilSeleccionadoId) || perfilesMuestra[0];

  // Identificar alumnos asociados al perfil si es padre
  const susAlumnos = perfilActual.usuario.rol === 'padre'
    ? alumnos.filter((a) => a.progenitores.some((p) => p.uid === perfilActual.usuario.uid))
    : [];

  const alumnoActivoId = susAlumnos[0]?.id || null;

  // Avisos que este perfil puede ver en la muestra
  const avisosVisiblesParaPerfil = avisos.filter((av) => {
    if (!av.activo) return false;
    if (av.alcance === 'TODOS') return true;
    if (perfilActual.usuario.rol === 'padre') {
      return susAlumnos.some((al) => al.cursoId === av.alcance);
    }
    if (perfilActual.usuario.rol === 'profesor' || perfilActual.usuario.rol === 'trabajador') {
      return perfilActual.usuario.cursos.includes(av.alcance);
    }
    return true;
  });

  // Crear contexto simulado para inyectar a la vista hija
  const simulatedContextValue: AppContextType = {
    ...parentContext,
    currentUser: perfilActual.usuario,
    selectedPerfilId: perfilActual.id,
    alumnoActivoId: alumnoActivoId || parentContext.alumnoActivoId,
  };

  const handleNavegarPantallaCompleta = () => {
    cambiarPerfil(perfilActual.id);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera explicativa del módulo */}
      <div className="bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-5 shadow-sm border border-emerald-800/60">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Simulador Oficial Superusuario</span>
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                Auditoría RGPD
              </span>
            </div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-400" />
              <span>Muestra en Vivo de Perfiles de la Comunidad Escolar</span>
            </h3>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Comprueba en tiempo real y sin salir del panel de administración cómo se visualiza El Molinillo para cada tipo de usuario (familias, docentes, AMPA y servicios). Cada vista aplica de forma estricta los filtros de privacidad, cursos vinculados y permisos correspondientes.
            </p>
          </div>

          <button
            onClick={handleNavegarPantallaCompleta}
            className="self-start md:self-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow flex items-center gap-2 border border-emerald-400/40 shrink-0"
            title="Activa este perfil en toda la aplicación para una navegación interactiva completa"
          >
            <span>Navegar a pantalla completa como este usuario</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Selector de Perfiles a Inspeccionar */}
      <div>
        <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">
          Selecciona el perfil a previsualizar:
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {perfilesMuestra.map((p) => {
            const isSelected = p.id === perfilSeleccionadoId;

            // Calcular avisos no leídos para este perfil
            let noLeidos = 0;
            if (p.usuario.rol === 'padre') {
              const hijos = alumnos.filter((a) => a.progenitores.some((prog) => prog.uid === p.usuario.uid));
              const cursosIds = hijos.map((h) => h.cursoId);
              const avisosVis = avisos.filter((av) => {
                if (!av.activo) return false;
                if (av.alcance === 'TODOS') return true;
                if (av.alcances && av.alcances.length > 0) {
                  return av.alcances.some((cId) => cursosIds.includes(cId));
                }
                const partes = av.alcance.split(',').map((s) => s.trim());
                return partes.some((cId) => cursosIds.includes(cId));
              });
              noLeidos = avisosVis.filter((av) => {
                const confs = confirmacionesLectura[av.id] || [];
                return !confs.includes(p.usuario.uid);
              }).length;
            } else if (p.usuario.rol === 'profesor') {
              const avisosVis = avisos.filter((av) => {
                if (!av.activo) return false;
                if (av.alcance === 'TODOS') return true;
                if (av.alcances && av.alcances.length > 0) {
                  return av.alcances.some((cId) => p.usuario.cursos.includes(cId));
                }
                const partes = av.alcance.split(',').map((s) => s.trim());
                return partes.some((cId) => p.usuario.cursos.includes(cId));
              });
              noLeidos = avisosVis.filter((av) => {
                const confs = confirmacionesLectura[av.id] || [];
                return !confs.includes(p.usuario.uid);
              }).length;
            }

            return (
              <button
                key={p.id}
                onClick={() => setPerfilSeleccionadoId(p.id)}
                className={`p-3.5 rounded-xl border text-left transition relative flex flex-col justify-between gap-2.5 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-2 ring-emerald-600/20'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1.5">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        p.usuario.rol === 'padre'
                          ? 'bg-amber-100 text-amber-800'
                          : p.usuario.rol === 'profesor'
                          ? 'bg-blue-100 text-blue-800'
                          : p.usuario.rol === 'ampa'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {p.usuario.rol === 'padre'
                        ? 'Familia'
                        : p.usuario.rol === 'profesor'
                        ? 'Docente'
                        : p.usuario.rol === 'ampa'
                        ? 'AMPA'
                        : 'Servicios'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {noLeidos > 0 && (
                        <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5 shadow-xs animate-pulse">
                          <Bell className="w-2.5 h-2.5 text-white" />
                          <span>{noLeidos}</span>
                        </span>
                      )}
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 ring-4 ring-emerald-200" />
                      )}
                    </div>
                  </div>
                  <h4 className="font-bold text-slate-900 text-xs">
                    {p.usuario.nombre} {p.usuario.apellidos}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {p.descripcion}
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 border-t border-slate-100 pt-1.5 flex items-center justify-between">
                  <span>{p.usuario.email}</span>
                  <span className="font-semibold text-slate-600">
                    {p.usuario.rol === 'padre'
                      ? `${alumnos.filter((a) => a.progenitores.some((prog) => prog.uid === p.usuario.uid)).length} Alumnos`
                      : p.usuario.rol === 'profesor'
                      ? `Curso ${p.usuario.cursos.join(', ')}`
                      : 'General'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Ficha de Auditoría de Privacidad y Acceso del Perfil */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm text-xs">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shadow-inner shrink-0">
              {perfilActual.usuario.fotoUrl ? (
                <img
                  src={perfilActual.usuario.fotoUrl}
                  alt={perfilActual.usuario.nombre}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>
                  {perfilActual.usuario.nombre.charAt(0)}
                  {perfilActual.usuario.apellidos.charAt(0)}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-bold text-slate-900 text-sm">
                  {perfilActual.usuario.nombre} {perfilActual.usuario.apellidos}
                </h4>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  UID: {perfilActual.usuario.uid}
                </span>
              </div>
              <p className="text-slate-500 text-[11px]">
                {perfilActual.descripcion}
              </p>
            </div>
          </div>

          {/* Selector de Formato de Pantalla */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg border border-slate-200 shrink-0 self-end lg:self-auto">
            <button
              onClick={() => setFormatoVista('movil')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                formatoVista === 'movil'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Vista Móvil (400px)</span>
            </button>
            <button
              onClick={() => setFormatoVista('expandido')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition ${
                formatoVista === 'expandido'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span>Vista Expandida</span>
            </button>
          </div>
        </div>

        {/* Parámetros de Seguridad y Visibilidad */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Permisos y Funcionalidades Activas
            </span>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              {perfilActual.usuario.rol === 'padre' && (
                <>
                  <li>&bull; Firma digital de autorizaciones y salidas escolares.</li>
                  <li>&bull; Notificación de ausencias con adjunto justificativo.</li>
                  <li>&bull; Recepción de circulares y confirmación de lectura.</li>
                  <li>&bull; Mensajería directa con tutor (horario lectivo).</li>
                  <li>&bull; Participación en encuestas y votaciones oficiales.</li>
                </>
              )}
              {perfilActual.usuario.rol === 'profesor' && (
                <>
                  <li>&bull; Emisión de circulares para su curso tutorizado.</li>
                  <li>&bull; Convocatoria de autorizaciones con firma digital.</li>
                  <li>&bull; Atención a familias con horario de silencio docente.</li>
                  <li>&bull; Listado y ficha de alumnos de su grupo.</li>
                </>
              )}
              {perfilActual.usuario.rol === 'ampa' && (
                <>
                  <li>&bull; Emisión de circulares del canal AMPA.</li>
                  <li>&bull; Atención exclusiva de consultas directas enviadas al AMPA.</li>
                  <li>&bull; Información de actividades extraescolares y cuotas.</li>
                </>
              )}
              {perfilActual.usuario.rol === 'trabajador' && (
                <>
                  <li>&bull; Canal de comunicación de servicios complementarios.</li>
                  <li>&bull; Control de asistencia y partes de actividades.</li>
                </>
              )}
            </ul>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <Lock className="w-3 h-3 text-rose-600" />
              Restricciones de Privacidad y RGPD
            </span>
            <ul className="space-y-1 text-slate-700 text-[11px]">
              <li>&bull; Sin acceso a base de datos del centro ni contraseñas.</li>
              <li>&bull; No visible el listado general de familias ni teléfonos.</li>
              <li>&bull; No acceso a la pestaña de Configuración institucional.</li>
              {perfilActual.usuario.rol === 'padre' && (
                <li>&bull; Circulares de otros cursos completamente inaccesibles.</li>
              )}
              {perfilActual.usuario.rol === 'profesor' && (
                <li>&bull; Mensajería bloqueada fuera del horario laboral activo.</li>
              )}
            </ul>
          </div>

          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200/80">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1 flex items-center gap-1">
              <FileText className="w-3 h-3 text-indigo-600" />
              Contenidos Visibles en Tiempo Real
            </span>
            <div className="space-y-1 text-slate-700 text-[11px]">
              <div className="flex justify-between">
                <span>Circulares visibles:</span>
                <strong className="text-slate-900">{avisosVisiblesParaPerfil.length}</strong>
              </div>
              <div className="flex justify-between">
                <span>Alumnos vinculados:</span>
                <strong className="text-slate-900">
                  {perfilActual.usuario.rol === 'padre'
                    ? susAlumnos.length
                    : perfilActual.usuario.rol === 'profesor'
                    ? alumnos.filter((a) => perfilActual.usuario.cursos.includes(a.cursoId)).length
                    : 'Todo el centro'}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Cursos autorizados:</span>
                <strong className="text-slate-900">
                  {perfilActual.usuario.rol === 'padre'
                    ? susAlumnos.map((a) => a.cursoId).join(', ') || 'Sin curso'
                    : perfilActual.usuario.cursos.join(', ')}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MARCO DEL SIMULADOR: MUESTRA EN VIVO INTERACTIVA */}
      <div className="flex flex-col items-center justify-center">
        {formatoVista === 'movil' ? (
          <div className="w-full max-w-[420px] bg-slate-900 border-[10px] border-slate-900 rounded-[48px] shadow-2xl overflow-hidden flex flex-col min-h-[760px] max-h-[820px] my-2">
            {/* Notch superior del smartphone */}
            <div className="bg-slate-900 h-6 w-full flex items-center justify-center shrink-0">
              <div className="w-24 h-4 bg-slate-950 rounded-b-xl flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-8 h-1.5 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Barra de estado simulada del smartphone */}
            <div className="bg-emerald-900 text-emerald-200 text-[10px] px-4 py-1 flex items-center justify-between font-mono shrink-0 border-b border-emerald-800/60">
              <span>09:41</span>
              <span className="text-[9px] font-sans font-bold bg-emerald-800 px-1.5 py-0.2 rounded text-emerald-300">
                PWA EL MOLINILLO &bull; {perfilActual.usuario.nombre}
              </span>
              <span>100%</span>
            </div>

            {/* Pantalla del móvil con la vista renderizada en vivo */}
            <div className="p-3 bg-slate-50 flex-1 overflow-y-auto">
              <AppContext.Provider value={simulatedContextValue}>
                {perfilActual.usuario.rol === 'padre' && <VistaPadre />}
                {perfilActual.usuario.rol === 'profesor' && <VistaProfesor />}
                {perfilActual.usuario.rol === 'ampa' && <VistaAmpa />}
                {perfilActual.usuario.rol === 'trabajador' && <VistaProfesor />}
              </AppContext.Provider>
            </div>

            {/* Barra de inicio inferior del smartphone */}
            <div className="bg-slate-900 h-5 w-full flex items-center justify-center shrink-0">
              <div className="w-28 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="w-full bg-white rounded-2xl border border-slate-300 shadow-xl overflow-hidden">
            <div className="bg-slate-800 text-slate-200 px-4 py-2 text-xs flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span className="font-semibold text-slate-300 ml-2">
                  Vista Ampliada / Tablet &bull; Perfil: {perfilActual.usuario.nombre} ({perfilActual.label})
                </span>
              </div>
              <button
                onClick={handleNavegarPantallaCompleta}
                className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <span>Probar a pantalla completa</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>
            <div className="p-4 sm:p-6 bg-slate-50 min-h-[500px]">
              <AppContext.Provider value={simulatedContextValue}>
                {perfilActual.usuario.rol === 'padre' && <VistaPadre />}
                {perfilActual.usuario.rol === 'profesor' && <VistaProfesor />}
                {perfilActual.usuario.rol === 'ampa' && <VistaAmpa />}
                {perfilActual.usuario.rol === 'trabajador' && <VistaProfesor />}
              </AppContext.Provider>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

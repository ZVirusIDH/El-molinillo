import React, { useState } from 'react';
import { useApp, PERFILES_PREDEFINIDOS } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import {
  X,
  ShieldCheck,
  Users,
  Smartphone,
  Bell,
  Send,
  Database,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  Eye,
  Building2,
  User,
  GraduationCap,
  HeartHandshake,
  Briefcase,
  Monitor,
  CheckCircle2,
  Sliders,
  Flame,
  Clock,
} from 'lucide-react';
import { RolUsuario } from '@molinillo/shared';

interface EscritorioDevModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAbrirMuestraPerfiles?: () => void;
}

export const EscritorioDevModal: React.FC<EscritorioDevModalProps> = ({
  isOpen,
  onClose,
  onAbrirMuestraPerfiles,
}) => {
  const {
    centroInfo,
    currentUser,
    selectedPerfilId,
    cambiarPerfil,
    cambiarRolActivo,
    modoSimuladorMovil,
    toggleModoSimuladorMovil,
    setModoSimuladorMovil,
    limpiarConfiguracion,
    firebaseConectado,
    permisoNotificaciones,
    activarNotificacionesPush,
    enviarNotificacionPrueba,
    mostrarExplicacionRolesAmpa,
    setMostrarExplicacionRolesAmpa,
    mostrarTextosInformativos,
    setMostrarTextosInformativos,
    avisos,
    alumnos,
    confirmacionesLectura,
  } = useApp();

  const [copiado, setCopiado] = useState(false);
  const [activandoPush, setActivandoPush] = useState(false);
  const [pushExito, setPushExito] = useState(false);
  const [mensajePush, setMensajePush] = useState<string | null>(null);

  if (!isOpen) return null;

  const mobileUrl = 'https://el-molinillo-pruebas.web.app/';

  const handleCopiarEnlace = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const handleAbrirVentanaMovil = () => {
    window.open(
      'http://localhost:5173/?view=mobile',
      'MolinilloMovil',
      'width=412,height=850,resizable=yes,scrollbars=yes'
    );
  };

  const handleActivarPush = async () => {
    setActivandoPush(true);
    setMensajePush(null);
    try {
      const ok = await activarNotificacionesPush();
      if (ok) {
        setPushExito(true);
        setMensajePush('Permiso concedido y dispositivo registrado en Firebase.');
        setTimeout(() => setPushExito(false), 4000);
      } else {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          setPushExito(true);
          setMensajePush('Permiso del navegador concedido. Sincronización en vivo activa.');
          setTimeout(() => setPushExito(false), 4000);
        } else if (typeof window !== 'undefined' && !window.isSecureContext && window.location.hostname !== 'localhost') {
          setPushExito(false);
          setMensajePush('En móviles se requiere HTTPS para registrar Service Workers y Push.');
        } else {
          setPushExito(false);
          setMensajePush('No se otorgó permiso en el navegador o no está soportado.');
        }
      }
    } finally {
      setActivandoPush(false);
    }
  };

  const handleEnviarPrueba = async () => {
    await enviarNotificacionPrueba();
    setPushExito(true);
    setMensajePush('Notificación de prueba enviada al sistema.');
    setTimeout(() => setPushExito(false), 3000);
  };

  const getRolIcono = (rol: RolUsuario) => {
    switch (rol) {
      case 'padre':
        return <Users className="w-3.5 h-3.5" />;
      case 'ampa':
        return <HeartHandshake className="w-3.5 h-3.5" />;
      case 'profesor':
        return <GraduationCap className="w-3.5 h-3.5" />;
      case 'admin':
        return <Building2 className="w-3.5 h-3.5" />;
      case 'trabajador':
        return <Briefcase className="w-3.5 h-3.5" />;
      default:
        return <User className="w-3.5 h-3.5" />;
    }
  };

  const getRolNombre = (rol: RolUsuario) => {
    switch (rol) {
      case 'padre':
        return 'Familia';
      case 'ampa':
        return 'AMPA';
      case 'profesor':
        return 'Docente';
      case 'admin':
        return 'Secretaría / Dirección';
      case 'trabajador':
        return 'Servicios y Monitores';
      default:
        return rol;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
        {/* Encabezado del Escritorio de Opciones */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-inner">
              <Sliders className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Escritorio de Opciones y Pruebas
                </h2>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700">
                  Panel de Desarrollo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Alterna perfiles, prueba notificaciones Push y configura simulaciones sin saturar la pantalla principal
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition"
            title="Cerrar panel de pruebas"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido dividido en pestañas o secciones ordenadas */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-slate-50">
          {/* SECCIÓN 1: CONMUTADOR DE PERFILES Y VISTAS SIMULADAS */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  1. Conmutador de Perfiles y Experiencia de Usuario
                </h3>
              </div>
              {onAbrirMuestraPerfiles && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAbrirMuestraPerfiles();
                  }}
                  className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Ver Todos a la Vez (Muestra Comparativa)</span>
                </button>
              )}
            </div>

            <p className="text-xs text-slate-600">
              Selecciona cualquier perfil para comprobar cómo ve y utiliza la plataforma cada colectivo del centro escolar:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {PERFILES_PREDEFINIDOS.map((perfil) => {
                const esActivo = selectedPerfilId === perfil.id;

                // Calcular avisos no leídos para este perfil
                let avisosNoLeidos = 0;
                if (perfil.usuario.rol === 'padre') {
                  const hijos = alumnos.filter((a) =>
                    a.progenitores.some((prog) => prog.uid === perfil.usuario.uid)
                  );
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
                  avisosNoLeidos = avisosVis.filter((av) => {
                    const confirmaciones = confirmacionesLectura[av.id] || [];
                    return !confirmaciones.includes(perfil.usuario.uid);
                  }).length;
                } else if (perfil.usuario.rol === 'profesor') {
                  const avisosVis = avisos.filter((av) => {
                    if (!av.activo) return false;
                    if (av.alcance === 'TODOS') return true;
                    if (av.alcances && av.alcances.length > 0) {
                      return av.alcances.some((cId) => perfil.usuario.cursos.includes(cId));
                    }
                    const partes = av.alcance.split(',').map((s) => s.trim());
                    return partes.some((cId) => perfil.usuario.cursos.includes(cId));
                  });
                  avisosNoLeidos = avisosVis.filter((av) => {
                    const confirmaciones = confirmacionesLectura[av.id] || [];
                    return !confirmaciones.includes(perfil.usuario.uid);
                  }).length;
                }

                return (
                  <button
                    key={perfil.id}
                    type="button"
                    onClick={() => cambiarPerfil(perfil.id)}
                    className={`p-3 rounded-xl border text-left transition relative flex flex-col justify-between ${
                      esActivo
                        ? 'bg-emerald-50/80 border-emerald-500 ring-2 ring-emerald-500/30 shadow-sm'
                        : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-300 flex items-center justify-center shrink-0 bg-slate-100 shadow-inner">
                          {perfil.usuario.fotoUrl ? (
                            <img src={perfil.usuario.fotoUrl} alt={perfil.usuario.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[11px] font-bold text-slate-700">
                              {perfil.usuario.nombre.charAt(0)}{perfil.usuario.apellidos?.charAt(0) || ''}
                            </span>
                          )}
                        </div>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                            {getRolNombre(perfil.usuario.rol)}
                          </span>
                          <span className="text-xs font-bold text-slate-900 leading-tight block">
                            {perfil.usuario.nombre} {perfil.usuario.apellidos}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {avisosNoLeidos > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-white bg-rose-600 px-2 py-0.5 rounded-full shadow-xs animate-pulse">
                            <Bell className="w-3 h-3 text-white" />
                            <span>{avisosNoLeidos}</span>
                          </span>
                        )}
                        {esActivo && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-full shrink-0">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Activo
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 text-[11px] text-slate-500 line-clamp-2">
                      {perfil.label}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Selector de subrol si el usuario actual tiene varios roles */}
            {currentUser.roles && currentUser.roles.length > 1 && (
              <div className="mt-2 p-2.5 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs text-slate-700 font-semibold">
                  Espacios del usuario actual ({currentUser.nombre}):
                </span>
                <div className="flex items-center gap-1.5">
                  {currentUser.roles.map((r) => {
                    const activo = currentUser.rol === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => cambiarRolActivo(r)}
                        className={`px-2.5 py-1 rounded text-xs font-bold transition flex items-center gap-1.5 ${
                          activo
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {getRolIcono(r)}
                        <span>{getRolNombre(r)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* SECCIÓN 2: CONEXIÓN FIREBASE EN VIVO Y PRUEBAS PUSH */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-orange-600" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  2. Conexión Firebase en Vivo y Notificaciones Push
                </h3>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-orange-100 text-orange-800 border border-orange-200">
                el-molinillo-pruebas
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Estado Base de Datos:</span>
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Firestore En Vivo
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Permiso Push Navegador:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded uppercase text-[10px] ${
                      permisoNotificaciones === 'granted'
                        ? 'bg-emerald-100 text-emerald-800'
                        : permisoNotificaciones === 'denied'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {permisoNotificaciones === 'granted'
                      ? 'Concedido'
                      : permisoNotificaciones === 'denied'
                      ? 'Denegado'
                      : 'Pendiente'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Proyecto Cloud Messaging:</span>
                  <code className="text-[11px] font-mono text-slate-800 font-semibold">
                    el-molinillo-pruebas
                  </code>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-2">
                <button
                  type="button"
                  onClick={handleActivarPush}
                  disabled={activandoPush}
                  className="w-full py-2 px-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm disabled:opacity-60"
                >
                  <Bell className="w-4 h-4 text-emerald-200" />
                  <span>
                    {activandoPush
                      ? 'Solicitando permiso...'
                      : permisoNotificaciones === 'granted'
                      ? 'Reactivar / Actualizar Token Push'
                      : 'Activar Notificaciones Push en este Equipo'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleEnviarPrueba}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition shadow-sm"
                >
                  <Send className="w-4 h-4 text-slate-300" />
                  <span>Enviar Notificación de Prueba Inmediata</span>
                </button>
              </div>
            </div>

            {mensajePush && (
              <div
                className={`p-2.5 rounded-lg text-xs font-medium flex items-center gap-2 ${
                  pushExito
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                    : 'bg-amber-50 border border-amber-200 text-amber-800'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{mensajePush}</span>
              </div>
            )}
          </div>

          {/* SECCIÓN 3: SIMULADOR MÓVIL Y ACCESO EN SMARTPHONE FÍSICO */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                  3. Visualización y Acceso en Smartphone
                </h3>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="flex items-center gap-4">
                <div className="p-2.5 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
                  <QRCodeSVG value={mobileUrl} size={110} level="M" />
                </div>
                <div className="space-y-1.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-900">
                    Abre la cámara de tu móvil para probar:
                  </p>
                  <div className="flex items-center gap-1.5">
                    <code className="text-[11px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 truncate max-w-[170px]">
                      {mobileUrl}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopiarEnlace}
                      className="p-1 text-slate-500 hover:text-slate-800"
                      title="Copiar dirección"
                    >
                      {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 font-medium">
                    Dominio HTTPS seguro en Firebase Hosting (Notificaciones Push activas en Smartphone).
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    toggleModoSimuladorMovil();
                    onClose();
                  }}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition border ${
                    modoSimuladorMovil
                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100'
                      : 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                  }`}
                >
                  <Smartphone className="w-4 h-4" />
                  <span>
                    {modoSimuladorMovil
                      ? 'Desactivar Marco Simulador Smartphone'
                      : 'Activar Marco Simulador Smartphone (400px)'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={handleAbrirVentanaMovil}
                  className="w-full py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition"
                >
                  <ExternalLink className="w-4 h-4 text-slate-500" />
                  <span>Abrir en Ventana Independiente de Tamaño Móvil</span>
                </button>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Requisito de Seguridad Web Push en Smartphone</span>
              </div>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Los navegadores móviles (Chrome en Android y Safari en iPhone) exigen conexión <strong>HTTPS segura</strong> para activar el Service Worker y recibir notificaciones push en el teléfono. En una IP local HTTP (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono">http://192.168...</code>) el teléfono bloquea los permisos push por política de seguridad del navegador.
              </p>
              <p className="text-[11px] leading-relaxed text-blue-800">
                Para recibir notificaciones reales en tu móvil con <strong>HTTPS gratuito</strong>, se puede desplegar en Firebase Hosting de tu proyecto (<code className="bg-blue-100 px-1 py-0.5 rounded font-mono">https://el-molinillo-pruebas.web.app</code>) o habilitar el origen seguro en Chrome Android.
              </p>
            </div>
          </div>

          {/* SECCIÓN 3.5: AYUDAS DE INTERFAZ Y EXPLICACIONES */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <HeartHandshake className="w-4 h-4 text-blue-700" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Textos explicativos de Área (AMPA / Familia)
                </span>
                <span className="text-[11px] text-slate-500">
                  Muestra u oculta los textos de ayuda bajo los botones de cambio de espacio
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarExplicacionRolesAmpa(!mostrarExplicacionRolesAmpa)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                mostrarExplicacionRolesAmpa
                  ? 'bg-blue-100 hover:bg-blue-200 text-blue-900 border border-blue-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {mostrarExplicacionRolesAmpa ? (
                <>
                  <Check className="w-3.5 h-3.5 text-blue-700" />
                  <span>Activados (Visibles)</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ocultos (Desactivados)</span>
                </>
              )}
            </button>
          </div>

          {/* Toggle Textos Informativos Globales */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-700 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 block text-xs">Textos y Guías Informativas</span>
                <span className="text-[11px] text-slate-500">
                  Avisos de desconexión, explicaciones de canales y notas de ayuda en pantallas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setMostrarTextosInformativos(!mostrarTextosInformativos)}
              className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition shrink-0 cursor-pointer ${
                mostrarTextosInformativos
                  ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900 border border-emerald-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300'
              }`}
            >
              {mostrarTextosInformativos ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Activados (Visibles)</span>
                </>
              ) : (
                <>
                  <X className="w-3.5 h-3.5 text-slate-500" />
                  <span>Ocultos (Compacto)</span>
                </>
              )}
            </button>
          </div>

          {/* SECCIÓN 4: MANTENIMIENTO Y REINICIO */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <Database className="w-4 h-4 text-slate-500" />
              <div>
                <span className="font-bold text-slate-900 block">
                  Restablecer Datos Demo / Reconfigurar Centro
                </span>
                <span className="text-[11px] text-slate-500">
                  Limpia la memoria local si deseas reiniciar las pruebas desde cero
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (window.confirm('¿Deseas reiniciar la configuración local guardada?')) {
                  limpiarConfiguracion();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold flex items-center gap-1.5 transition shrink-0"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reiniciar Datos</span>
            </button>
          </div>
        </div>

        {/* Pie del modal */}
        <div className="bg-slate-100 px-5 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Perfil actual en pantalla: <strong>{currentUser.nombre} ({getRolNombre(currentUser.rol)})</strong></span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition"
          >
            Volver a la Pantalla Principal
          </button>
        </div>
      </div>
    </div>
  );
};

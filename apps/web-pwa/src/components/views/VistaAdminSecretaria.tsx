import React, { useState, useEffect, useRef } from 'react';
import { useApp, PERFILES_PREDEFINIDOS } from '../../context/AppContext';
import { QRCodeSVG } from 'qrcode.react';
import { EditorTextoEnriquecido } from '../common/EditorTextoEnriquecido';
import { ContenidoEnriquecido } from '../common/ContenidoEnriquecido';
import { SelectorDestinatariosMulti } from '../common/SelectorDestinatariosMulti';
import { ImportadorExcelModal } from '../admin/ImportadorExcelModal';
import { MuestraPerfilesViewer } from '../admin/MuestraPerfilesViewer';
import { ModalGestionRolesUsuario } from '../common/ModalGestionRolesUsuario';
import { ModalPlantillasCirculares, PlantillaCircular } from '../admin/ModalPlantillasCirculares';
import {
  Settings,
  Eye,
  EyeOff,
  Upload,
  Image,
  Trash2,
  Archive,
  Sparkles,
  Building2,
  QrCode,
  Users,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Bell,
  Copy,
  Printer,
  FileCheck2,
  GraduationCap,
  FileText,
  UserPlus,
  Plus,
  Search,
  X,
  Check,
  Send,
  Inbox,
  Database,
  FileSpreadsheet,
  Building,
  Mail,
  Phone,
  MapPin,
  Lock,
  ArrowRight,
  MessageSquare,
  Vote,
  Calendar,
  ExternalLink,
  Utensils,
  Globe,
  AlertTriangle,
  Download,
  BellOff,
  Shield,
  Key,
  Tag,
  SlidersHorizontal,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Smartphone,
  Zap,
  BookmarkCheck,
} from 'lucide-react';
import {
  RolUsuario,
  UsuarioPerfil,
  TipoFirmaAutorizacion,
  descargarIcs,
  TipoEventoEscolar,
  GrupoPersonalizado,
  PermisosGrupo,
  OrganoEmisor,
} from '@molinillo/shared';

// Abreviar nombre del centro para pantallas pequeñas o móviles
const obtenerNombreCortoCentro = (nombre: string): string => {
  if (!nombre) return 'CEIP El Molinillo';
  return nombre
    .replace(/Nuestra Señora/g, 'Ntra. Sra.')
    .replace(/San /g, 'S. ')
    .replace(/Santo /g, 'Sto. ')
    .replace(/Colegio de Educación Infantil y Primaria/gi, 'CEIP');
};

export const VistaAdminSecretaria: React.FC = () => {
  const {
    centroInfo,
    selectedPerfilId,
    cambiarPerfil,
    modoSimuladorMovil,
    cursos,
    alumnos,
    avisos,
    firmas,
    conversaciones,
    mensajes,
    colaNotificaciones,
    usuarios,
    solicitudesPendientes,
    encuestas,
    votosEncuestas,
    crearEncuesta,
    eventos,
    crearEvento,
    ausencias,
    resolverAusencia,
    recursos,
    agregarRecurso,
    eliminarRecurso,
    horarioSilencio,
    actualizarHorarioSilencio,
    gruposPersonalizados,
    crearGrupoPersonalizado,
    actualizarGrupoPersonalizado,
    eliminarGrupoPersonalizado,
    agregarMiembroAGrupo,
    quitarMiembroDeGrupo,
    organosEmisores,
    agregarOrganoEmisor,
    eliminarOrganoEmisor,
    actualizarOrganoEmisor,
    toggleBloqueoNotificacionesPadre,
    actualizarPermisosProgenitor,
    agregarAlumno,
    eliminarAlumno,
    agregarCurso,
    eliminarCurso,
    aprobarSolicitud,
    rechazarSolicitud,
    publicarAviso,
    importarAlumnosMasivo,
    actualizarDatosCentro,
    enviarMensaje,
    archivarConversacion,
    desarchivarConversacion,
    eliminarConversacion,
    conversacionesArchivadasIds,
    actualizarRolesUsuario,
    firebaseConectado,
    permisoNotificaciones,
    fcmToken,
    activarNotificacionesPush,
    enviarNotificacionPrueba,
  } = useApp();

  // Pestañas principales
  type TabPrincipal = 'enviadas' | 'recibidas' | 'encuestas' | 'calendario' | 'recursos' | 'configuracion';
  const [activeTab, setActiveTab] = useState<TabPrincipal>('enviadas');

  // En versión móvil la pestaña de configuración no está disponible
  useEffect(() => {
    if ((modoSimuladorMovil || (typeof window !== 'undefined' && window.innerWidth < 640)) && activeTab === 'configuracion') {
      setActiveTab('enviadas');
    }
  }, [modoSimuladorMovil, activeTab]);

  // Sub-pestañas dentro de Comunicaciones Recibidas
  type SubTabRecibidas = 'mensajes' | 'solicitudes' | 'ausencias';
  const [subTabRecibidas, setSubTabRecibidas] = useState<SubTabRecibidas>('mensajes');

  // Sub-pestañas dentro de Configuración (Solo Superuser)
  type SubTabConfig =
    | 'centro'
    | 'alumnos'
    | 'cursos'
    | 'profesores'
    | 'emisores'
    | 'silencio'
    | 'grupos'
    | 'usuarios'
    | 'qr'
    | 'muestra-perfiles';
  const [subTabConfig, setSubTabConfig] = useState<SubTabConfig>('centro');

  const [copiado, setCopiado] = useState(false);
  const [filtroAlumnos, setFiltroAlumnos] = useState('');
  const [adminAlumnoExpandidoId, setAdminAlumnoExpandidoId] = useState<string | null>(null);
  const [filtroUsuarios, setFiltroUsuarios] = useState('');
  const [filtroEncuestas, setFiltroEncuestas] = useState<'activas' | 'finalizadas' | 'todas'>('activas');
  const [usuarioRolesEditando, setUsuarioRolesEditando] = useState<UsuarioPerfil | null>(null);

  // Modales
  const [modalNuevoAviso, setModalNuevoAviso] = useState(false);
  const [modalNuevaAutorizacion, setModalNuevaAutorizacion] = useState(false);
  const [modalNuevoAlumno, setModalNuevoAlumno] = useState(false);
  const [modalNuevoCurso, setModalNuevoCurso] = useState(false);
  const [modalNuevoProfesor, setModalNuevoProfesor] = useState(false);
  const [modalImportarExcel, setModalImportarExcel] = useState(false);
  const [modalListaExcursionAvisoId, setModalListaExcursionAvisoId] = useState<string | null>(null);
  const [modalNuevaEncuesta, setModalNuevaEncuesta] = useState(false);
  const [modalNuevoEvento, setModalNuevoEvento] = useState(false);
  const [modalNuevoRecurso, setModalNuevoRecurso] = useState(false);
  const [modalNuevoEmisor, setModalNuevoEmisor] = useState(false);

  // Formulario Órganos Emisores
  const [emisorEditandoId, setEmisorEditandoId] = useState<string | null>(null);
  const [emisorNombre, setEmisorNombre] = useState('');
  const [emisorDescripcion, setEmisorDescripcion] = useState('');
  const [emisorActivo, setEmisorActivo] = useState(true);

  // Formulario Encuesta
  const [encPregunta, setEncPregunta] = useState('');
  const [encDescripcion, setEncDescripcion] = useState('');
  const [encOpciones, setEncOpciones] = useState(['', '', '']);
  const [encEsMultiple, setEncEsMultiple] = useState(false);
  const [encAlcance, setEncAlcance] = useState<'TODOS' | string>('TODOS');
  const [encAlcances, setEncAlcances] = useState<string[]>(['TODOS']);
  const [encDiasCierre, setEncDiasCierre] = useState(7);
  const [encResultadosPublicos, setEncResultadosPublicos] = useState(true);

  // Formulario Evento
  const [evtTitulo, setEvtTitulo] = useState('');
  const [evtDescripcion, setEvtDescripcion] = useState('');
  const [evtFechaInicio, setEvtFechaInicio] = useState(new Date().toISOString().slice(0, 16));
  const [evtFechaFin, setEvtFechaFin] = useState(new Date(Date.now() + 7200000).toISOString().slice(0, 16));
  const [evtUbicacion, setEvtUbicacion] = useState('');
  const [evtTipo, setEvtTipo] = useState<TipoEventoEscolar>('reunion');
  const [evtAlcance, setEvtAlcance] = useState<'TODOS' | string>('TODOS');

  // Estados y helpers para el Widget de Calendario Escolar Interactivo
  const [fechaCalendario, setFechaCalendario] = useState<Date>(new Date());
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | null>(null);
  const [vistaCalendarioModo, setVistaCalendarioModo] = useState<'semana' | 'mes'>('semana');
  const touchStartXRef = useRef<number>(0);

  const getLunesDeSemana = (fecha: Date): Date => {
    const d = new Date(fecha);
    const day = d.getDay(); // 0 domingo, 1 lunes...
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
    const dInicio = new Date(evt.fechaInicio);
    const dFin = evt.fechaFin ? new Date(evt.fechaFin) : new Date(dInicio.getTime() + 60 * 60 * 1000);
    const toGCalIso = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const centro = centroInfo?.nombreCentro || 'CEIP El Molinillo';
    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: evt.titulo,
      dates: `${toGCalIso(dInicio)}/${toGCalIso(dFin)}`,
      details: `${evt.descripcion || ''}\n\nOrganizado por: ${centro}`,
      location: evt.ubicacion || '',
    });
    window.open(`https://calendar.google.com/calendar/render?${params.toString()}`, '_blank', 'noopener,noreferrer');
  };

  const handleAbrirAppleCalendar = (evt: any) => {
    const centro = centroInfo?.nombreCentro || 'CEIP El Molinillo';
    descargarIcs(evt, centro);
  };

  const getBadgeTipoEvento = (tipo: string) => {
    switch (tipo) {
      case 'reunion':
        return { label: 'Reunión', className: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'excursion':
        return { label: 'Excursión', className: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'festivo':
        return { label: 'Festivo', className: 'bg-rose-50 text-rose-700 border-rose-200' };
      case 'evaluacion':
        return { label: 'Evaluación', className: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'claustro':
        return { label: 'Claustro', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      default:
        return { label: tipo, className: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  // Formulario Recurso
  const [recTitulo, setRecTitulo] = useState('');
  const [recUrl, setRecUrl] = useState('');
  const [recDescripcion, setRecDescripcion] = useState('');
  const [recCategoria, setRecCategoria] = useState<'comedor' | 'secretaria' | 'ampa' | 'servicios' | 'general'>('general');
  const [recIcono, setRecIcono] = useState<'utensils' | 'calendar' | 'file-text' | 'globe' | 'external-link'>('external-link');

  // Formulario Silencio Docente
  const [silencioInicio, setSilencioInicio] = useState(horarioSilencio.horaInicio);
  const [silencioFin, setSilencioFin] = useState(horarioSilencio.horaFin);
  const [silencioFinde, setSilencioFinde] = useState(horarioSilencio.finesDeSemanaSilenciados);
  const [silencioGuardado, setSilencioGuardado] = useState(false);

  // Estados de Grupos Personalizados y Permisos
  const [modalNuevoGrupo, setModalNuevoGrupo] = useState(false);
  const [grpNombre, setGrpNombre] = useState('');
  const [grpDescripcion, setGrpDescripcion] = useState('');
  const [grpColor, setGrpColor] = useState('emerald');
  const [grpPermisos, setGrpPermisos] = useState<PermisosGrupo>({
    puedePublicarAvisos: true,
    puedeCrearEventos: false,
    puedeVerAusencias: false,
    puedeRecibirMensajes: true,
    puedeGestionarAlumnos: false,
    puedePublicarEncuestas: false,
  });
  const [modalMiembrosGrupoId, setModalMiembrosGrupoId] = useState<string | null>(null);
  const [usuarioParaAgregar, setUsuarioParaAgregar] = useState('');
  const [modalPermisosProgenitorUid, setModalPermisosProgenitorUid] = useState<string | null>(null);
  const [modalPermisosProgenitorNombre, setModalPermisosProgenitorNombre] = useState<string>('');
  const [permisosProgenitorTemp, setPermisosProgenitorTemp] = useState<Partial<PermisosGrupo>>({});

  // Formulario Centro e Imagen y Visibilidad Pública
  const [centroNombre, setCentroNombre] = useState(centroInfo?.nombreCentro || 'CEIP El Molinillo');
  const [centroCodigo, setCentroCodigo] = useState(centroInfo?.codigoCentro || '00000000');
  const [centroDireccion, setCentroDireccion] = useState(centroInfo?.direccion || 'Avenida de la Educación, 1, 28001 Madrid');
  const [centroTelefono, setCentroTelefono] = useState(centroInfo?.telefono || '900 000 000');
  const [centroEmail, setCentroEmail] = useState(centroInfo?.email || 'contacto@colegiodemo.es');
  const [centroHorario, setCentroHorario] = useState(centroInfo?.horarioAtencion || 'Lunes a Viernes de 09:00 a 14:00 h');
  const [centroLogoUrl, setCentroLogoUrl] = useState(centroInfo?.logoUrl || '');
  const [visMostrarDireccion, setVisMostrarDireccion] = useState(centroInfo?.visibilidad?.mostrarDireccion ?? true);
  const [visMostrarTelefono, setVisMostrarTelefono] = useState(centroInfo?.visibilidad?.mostrarTelefono ?? true);
  const [visMostrarEmail, setVisMostrarEmail] = useState(centroInfo?.visibilidad?.mostrarEmail ?? true);
  const [visMostrarHorario, setVisMostrarHorario] = useState(centroInfo?.visibilidad?.mostrarHorarioAtencion ?? true);
  const [visMostrarClaustro, setVisMostrarClaustro] = useState(centroInfo?.visibilidad?.mostrarClaustro ?? true);
  const [visMostrarEmailsProfesores, setVisMostrarEmailsProfesores] = useState(centroInfo?.visibilidad?.mostrarEmailsProfesores ?? false);
  const [profesoresOcultos, setProfesoresOcultos] = useState<string[]>(centroInfo?.visibilidad?.profesoresOcultos || []);
  const [cargosPersonalizados, setCargosPersonalizados] = useState<Record<string, string>>(
    centroInfo?.visibilidad?.cargosPersonalizados || {
      'admin-secretaria': 'Dirección y Jefatura de Estudios',
      'prof-i3': 'Tutora Infantil 3 años',
      'prof-i4': 'Tutora Infantil 4 años / Apoyo Educativo',
      'prof-i5': 'Tutora Infantil 5 años / Audición y Lenguaje',
      'prof-1p': 'Tutor 1º Primaria / Jefatura de Estudios',
      'prof-2p': 'Tutora 2º Primaria / Coordinación TIC',
      'prof-1': 'Tutor 3º Primaria / Secretaría Académica',
      'prof-2': 'Tutora 4º Primaria / Coordinación Bilingüe (Inglés)',
      'prof-5p': 'Tutor 5º Primaria / Educación Musical',
      'prof-6p': 'Tutor 6º Primaria / Educación Física',
    }
  );
  const [filtroDocentesAdmin, setFiltroDocentesAdmin] = useState('');
  const [guardadoCentroExito, setGuardadoCentroExito] = useState(false);
  const [errorLogo, setErrorLogo] = useState<string | null>(null);
  const fileInputLogoRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    if (centroInfo) {
      if (centroInfo.nombreCentro) setCentroNombre(centroInfo.nombreCentro);
      if (centroInfo.codigoCentro) setCentroCodigo(centroInfo.codigoCentro);
      if (centroInfo.direccion) setCentroDireccion(centroInfo.direccion);
      if (centroInfo.telefono) setCentroTelefono(centroInfo.telefono);
      if (centroInfo.email) setCentroEmail(centroInfo.email);
      if (centroInfo.horarioAtencion) setCentroHorario(centroInfo.horarioAtencion);
      setCentroLogoUrl(centroInfo.logoUrl || '');
      if (centroInfo.visibilidad) {
        if (centroInfo.visibilidad.mostrarDireccion !== undefined) setVisMostrarDireccion(centroInfo.visibilidad.mostrarDireccion);
        if (centroInfo.visibilidad.mostrarTelefono !== undefined) setVisMostrarTelefono(centroInfo.visibilidad.mostrarTelefono);
        if (centroInfo.visibilidad.mostrarEmail !== undefined) setVisMostrarEmail(centroInfo.visibilidad.mostrarEmail);
        if (centroInfo.visibilidad.mostrarHorarioAtencion !== undefined) setVisMostrarHorario(centroInfo.visibilidad.mostrarHorarioAtencion);
        if (centroInfo.visibilidad.mostrarClaustro !== undefined) setVisMostrarClaustro(centroInfo.visibilidad.mostrarClaustro);
        if (centroInfo.visibilidad.mostrarEmailsProfesores !== undefined) setVisMostrarEmailsProfesores(centroInfo.visibilidad.mostrarEmailsProfesores);
        if (centroInfo.visibilidad.profesoresOcultos) setProfesoresOcultos(centroInfo.visibilidad.profesoresOcultos);
        if (centroInfo.visibilidad.cargosPersonalizados) setCargosPersonalizados(centroInfo.visibilidad.cargosPersonalizados);
      }
    }
  }, [centroInfo]);

  const handleCargarArchivoLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorLogo(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorLogo('La imagen seleccionada supera el límite máximo de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      setCentroLogoUrl(res);
    };
    reader.readAsDataURL(file);
  };

  // Formulario nuevo aviso
  const [avisoTitulo, setAvisoTitulo] = useState('');
  const [avisoContenido, setAvisoContenido] = useState('');
  const [avisoAlcance, setAvisoAlcance] = useState<'TODOS' | string>('TODOS');
  const [avisoAlcances, setAvisoAlcances] = useState<string[]>(['TODOS']);
  const [avisoEmisor, setAvisoEmisor] = useState('Dirección y Secretaría');
  const [tipoEnvioAviso, setTipoEnvioAviso] = useState<'inmediato' | 'programado'>('inmediato');
  const [fechaProgramadaAviso, setFechaProgramadaAviso] = useState(() => {
    const manana = new Date();
    manana.setDate(manana.getDate() + 1);
    return manana.toISOString().split('T')[0];
  });
  const [horaProgramadaAviso, setHoraProgramadaAviso] = useState('09:00');
  const [modalPrevisualizarAviso, setModalPrevisualizarAviso] = useState(false);
  const [avisoError, setAvisoError] = useState<string | null>(null);
  const [avisoEsEmergencia, setAvisoEsEmergencia] = useState(false);
  const [modalPlantillasOpen, setModalPlantillasOpen] = useState(false);
  const [plantillaGuardadaToast, setPlantillaGuardadaToast] = useState(false);

  // Estados de validación y previsualización de encuestas
  const [encError, setEncError] = useState<string | null>(null);
  const [modalPrevisualizarEncuesta, setModalPrevisualizarEncuesta] = useState(false);

  // Formulario nueva autorización
  const [autTitulo, setAutTitulo] = useState('');
  const [autContenido, setAutContenido] = useState('');
  const [autAlcance, setAutAlcance] = useState<'TODOS' | string>('TODOS');
  const [autTipoFirma, setAutTipoFirma] = useState<TipoFirmaAutorizacion>('UN_PROGENITOR');

  // Formulario nuevo alumno (con múltiples progenitores)
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoApellidos, setNuevoApellidos] = useState('');
  const [nuevoCursoId, setNuevoCursoId] = useState(cursos[0]?.id || 'I3');
  const [nuevoPadresSeparados, setNuevoPadresSeparados] = useState(false);
  const [listaProgenitores, setListaProgenitores] = useState<
    { nombre: string; apellidos: string; email: string; telefono: string; parentesco: 'madre' | 'padre' | 'tutor_legal' | 'otro' }[]
  >([
    { nombre: '', apellidos: '', email: '', telefono: '', parentesco: 'madre' },
    { nombre: '', apellidos: '', email: '', telefono: '', parentesco: 'padre' },
  ]);

  // Formulario nuevo curso
  const [cId, setCId] = useState('');
  const [cNombre, setCNombre] = useState('');
  const [cNivel, setCNivel] = useState<'Infantil' | 'Primaria' | 'Secundaria'>('Primaria');
  const [cTutor, setCTutor] = useState('');

  // Formulario nuevo profesor
  const [profNombre, setProfNombre] = useState('');
  const [profApellidos, setProfApellidos] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profCursos, setProfCursos] = useState<string[]>(['I3']);

  // Respuesta en bandeja de recibidas
  const [conversacionActivaId, setConversacionActivaId] = useState<string>('');
  const [textoRespuestaSecretaria, setTextoRespuestaSecretaria] = useState('');

  // Estados tipo email para la bandeja de recibidos
  const [filtroBandeja, setFiltroBandeja] = useState<'recibidos' | 'archivados'>('recibidos');
  const [busquedaHilos, setBusquedaHilos] = useState('');
  const [mostrarBuscadorHilos, setMostrarBuscadorHilos] = useState(false);
  const [convParaEliminarId, setConvParaEliminarId] = useState<string | null>(null);

  // Formato compacto estilo email: Nombre y primer apellido
  const formatearNombreAlumnoCorto = (conv: any): string => {
    if (conv.alumnoNombre) {
      const partes = conv.alumnoNombre.trim().split(/\s+/);
      if (partes.length >= 2) {
        return `${partes[0]} ${partes[1]}`;
      }
      return partes[0] || 'Alumno';
    }
    if (conv.progenitorNombre) {
      const partes = conv.progenitorNombre.trim().split(/\s+/);
      if (partes.length >= 2) {
        return `${partes[0]} ${partes[1]}`;
      }
      return partes[0];
    }
    return 'Familia';
  };

  // Cálculo de notificaciones pendientes y sin leer en Recibidos
  const totalMensajesNoLeidos = conversaciones.reduce((acc, c) => acc + (c.noLeidosDestinatario || 0), 0);
  const totalSolicitudesPendientes = solicitudesPendientes.length;
  const totalAusenciasPendientes = ausencias.filter((a) => a.estado === 'pendiente').length;
  const totalNoLeidosRecibidos = totalMensajesNoLeidos + totalSolicitudesPendientes + totalAusenciasPendientes;

  // Generación de payload QR y URL
  const payloadVinculacion = {
    codigoCentro: centroInfo?.codigoCentro || '00000000',
    nombreCentro: centroInfo?.nombreCentro || 'CEIP El Molinillo',
    firebaseConfig: {
      apiKey: 'DEMO-API-KEY-MOLINILLO',
      authDomain: 'molinillo-demo.firebaseapp.com',
      projectId: 'molinillo-demo',
      storageBucket: 'molinillo-demo.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:demo',
    },
  };
  const jsonString = JSON.stringify(payloadVinculacion);
  const base64Code = btoa(jsonString);
  const webUrl = window.location.origin + window.location.pathname + '?c=' + encodeURIComponent(base64Code);

  const handleCopiarEnlace = () => {
    navigator.clipboard.writeText(webUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 3000);
  };

  const toggleOcultarProfesor = (uid: string) => {
    setProfesoresOcultos((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  const handleCambiarCargoProfesor = (uid: string, nuevoCargo: string) => {
    setCargosPersonalizados((prev) => ({
      ...prev,
      [uid]: nuevoCargo,
    }));
  };

  const handleGuardarDatosCentro = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarDatosCentro({
      nombreCentro: centroNombre,
      codigoCentro: centroCodigo,
      direccion: centroDireccion,
      telefono: centroTelefono,
      email: centroEmail,
      horarioAtencion: centroHorario,
      logoUrl: centroLogoUrl,
      visibilidad: {
        mostrarDireccion: visMostrarDireccion,
        mostrarTelefono: visMostrarTelefono,
        mostrarEmail: visMostrarEmail,
        mostrarHorarioAtencion: visMostrarHorario,
        mostrarClaustro: visMostrarClaustro,
        mostrarEmailsProfesores: visMostrarEmailsProfesores,
        profesoresOcultos,
        cargosPersonalizados,
      },
    });
    setGuardadoCentroExito(true);
    setTimeout(() => setGuardadoCentroExito(false), 3000);
  };

  const handleAbrirCrearEmisor = () => {
    setEmisorEditandoId(null);
    setEmisorNombre('');
    setEmisorDescripcion('');
    setEmisorActivo(true);
    setModalNuevoEmisor(true);
  };

  const handleAbrirEditarEmisor = (organo: OrganoEmisor) => {
    setEmisorEditandoId(organo.id);
    setEmisorNombre(organo.nombre);
    setEmisorDescripcion(organo.descripcion || '');
    setEmisorActivo(organo.activo);
    setModalNuevoEmisor(true);
  };

  const handleGuardarEmisorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emisorNombre.trim()) return;

    if (emisorEditandoId) {
      actualizarOrganoEmisor(emisorEditandoId, {
        nombre: emisorNombre.trim(),
        descripcion: emisorDescripcion.trim(),
        activo: emisorActivo,
      });
    } else {
      agregarOrganoEmisor({
        nombre: emisorNombre.trim(),
        descripcion: emisorDescripcion.trim(),
        activo: emisorActivo,
      });
    }

    setModalNuevoEmisor(false);
    setEmisorEditandoId(null);
    setEmisorNombre('');
    setEmisorDescripcion('');
  };

  const handleCrearAvisoSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!avisoTitulo.trim()) {
      setAvisoError('Por favor, indica el título de la circular.');
      return;
    }
    if (!avisoContenido.trim()) {
      setAvisoError('Por favor, redacta el texto de la circular antes de publicar.');
      return;
    }
    setAvisoError(null);

    let fechaProgTimestamp: number | null = null;
    if (tipoEnvioAviso === 'programado' && fechaProgramadaAviso && horaProgramadaAviso) {
      fechaProgTimestamp = new Date(`${fechaProgramadaAviso}T${horaProgramadaAviso}:00`).getTime();
    }

    const alcanceStr = avisoAlcances.includes('TODOS') ? 'TODOS' : avisoAlcances.join(',');
    const alcanceNombreStr = avisoAlcances.includes('TODOS')
      ? 'Toda la Comunidad Educativa'
      : avisoAlcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ');

    publicarAviso({
      titulo: avisoTitulo.trim(),
      contenido: avisoContenido.trim(),
      tipoEmisor: 'colegio',
      remitenteUid: 'admin-secretaria',
      remitenteNombre: avisoEmisor,
      remitenteRol: 'admin',
      alcance: alcanceStr,
      alcances: avisoAlcances,
      alcanceNombre: alcanceNombreStr,
      esAutorizacion: false,
      fechaProgramada: fechaProgTimestamp,
      estadoEnvio: tipoEnvioAviso === 'programado' ? 'programado' : 'enviado',
      esEmergencia: avisoEsEmergencia,
      prioridad: avisoEsEmergencia ? 'urgente' : 'normal',
    });

    setAvisoTitulo('');
    setAvisoContenido('');
    setAvisoAlcances(['TODOS']);
    setAvisoEsEmergencia(false);
    setModalPrevisualizarAviso(false);
    setModalNuevoAviso(false);
  };

  const handleCargarPlantillaEnEditor = (plantilla: PlantillaCircular) => {
    setAvisoTitulo(plantilla.titulo);
    setAvisoContenido(plantilla.contenido);
    setAvisoAlcances(plantilla.alcances || ['TODOS']);
    setAvisoEsEmergencia(!!plantilla.esEmergencia);
    setAvisoEmisor('Dirección y Secretaría');
    setTipoEnvioAviso('inmediato');
    setModalPlantillasOpen(false);
    setModalNuevoAviso(true);
  };

  const handleEnviarPlantillaEnUnToque = (plantilla: PlantillaCircular) => {
    const alcanceStr = plantilla.alcances && !plantilla.alcances.includes('TODOS')
      ? plantilla.alcances.join(',')
      : 'TODOS';
    const alcanceNombreStr = alcanceStr === 'TODOS'
      ? 'Toda la Comunidad Educativa'
      : plantilla.alcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ');

    publicarAviso({
      titulo: plantilla.titulo.trim(),
      contenido: plantilla.contenido.trim(),
      tipoEmisor: 'colegio',
      remitenteUid: 'admin-secretaria',
      remitenteNombre: 'Dirección y Secretaría',
      remitenteRol: 'admin',
      alcance: alcanceStr,
      alcances: plantilla.alcances || ['TODOS'],
      alcanceNombre: alcanceNombreStr,
      esAutorizacion: false,
      estadoEnvio: 'enviado',
      esEmergencia: !!plantilla.esEmergencia,
      prioridad: plantilla.prioridad || (plantilla.esEmergencia ? 'urgente' : 'normal'),
    });

    setModalPlantillasOpen(false);
  };

  const handleGuardarBorradorComoPlantilla = () => {
    if (!avisoTitulo.trim()) {
      setAvisoError('Introduce al menos un título antes de guardar como plantilla.');
      return;
    }
    try {
      const guardadas = localStorage.getItem('molinillo_plantillas_circulares');
      const parsed: PlantillaCircular[] = guardadas ? JSON.parse(guardadas) : [];
      const nueva: PlantillaCircular = {
        id: 'custom-' + Date.now(),
        titulo: avisoTitulo.trim(),
        categoria: avisoEsEmergencia ? 'sanitaria' : 'general',
        categoriaEtiqueta: avisoEsEmergencia ? 'Emergencia' : 'Personalizada',
        esEmergencia: avisoEsEmergencia,
        prioridad: avisoEsEmergencia ? 'urgente' : 'normal',
        alcances: avisoAlcances,
        descripcionCorta: `Plantilla creada el ${new Date().toLocaleDateString('es-ES')}`,
        contenido: avisoContenido.trim(),
        esPersonalizada: true,
      };
      const actualizadas = [...parsed, nueva];
      localStorage.setItem('molinillo_plantillas_circulares', JSON.stringify(actualizadas));
      setPlantillaGuardadaToast(true);
      setTimeout(() => setPlantillaGuardadaToast(false), 3000);
    } catch {
      // Ignorar error de almacenamiento
    }
  };

  const handleCrearAutorizacionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!autTitulo.trim() || !autContenido.trim()) return;

    publicarAviso({
      titulo: autTitulo.trim(),
      contenido: autContenido.trim(),
      tipoEmisor: 'colegio',
      remitenteUid: 'admin-secretaria',
      remitenteNombre: 'Secretaría / Dirección',
      remitenteRol: 'admin',
      alcance: autAlcance,
      alcanceNombre: autAlcance === 'TODOS' ? 'Todos los cursos' : autAlcance,
      esAutorizacion: true,
      tipoFirma: autTipoFirma,
      fechaLimiteFirma: Date.now() + 3600000 * 24 * 7,
    });

    setAutTitulo('');
    setAutContenido('');
    setModalNuevaAutorizacion(false);
  };

  const handleCrearAlumnoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoApellidos.trim()) return;

    const progenitoresValidos = listaProgenitores
      .filter((p) => p.nombre.trim() || p.email.trim())
      .map((p, idx) => ({
        uid: 'user-prog-' + Date.now() + '-' + idx,
        nombre: p.nombre.trim(),
        apellidos: p.apellidos.trim(),
        email: p.email.trim() || 'pendiente@santamariadelbuenaire.es',
        telefono: p.telefono.trim(),
        parentesco: p.parentesco,
        custodia: true,
      }));

    if (progenitoresValidos.length === 0) return;

    agregarAlumno({
      nombre: nuevoNombre.trim(),
      apellidos: nuevoApellidos.trim(),
      cursoId: nuevoCursoId,
      cursoNombre: cursos.find((c) => c.id === nuevoCursoId)?.nombre || nuevoCursoId,
      tutorUid: cursos.find((c) => c.id === nuevoCursoId)?.tutorUid || '',
      padresSeparados: nuevoPadresSeparados,
      progenitores: progenitoresValidos,
    });

    setNuevoNombre('');
    setNuevoApellidos('');
    setListaProgenitores([
      { nombre: '', apellidos: '', email: '', telefono: '', parentesco: 'madre' },
      { nombre: '', apellidos: '', email: '', telefono: '', parentesco: 'padre' },
    ]);
    setNuevoPadresSeparados(false);
    setModalNuevoAlumno(false);
  };

  const agregarFilaProgenitor = () => {
    setListaProgenitores((prev) => [
      ...prev,
      { nombre: '', apellidos: '', email: '', telefono: '', parentesco: 'tutor_legal' },
    ]);
  };

  const eliminarFilaProgenitor = (index: number) => {
    if (listaProgenitores.length <= 1) return;
    setListaProgenitores((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCrearCursoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cId.trim() || !cNombre.trim()) return;

    agregarCurso({
      id: cId.trim().toUpperCase(),
      nombre: cNombre.trim(),
      nivel: cNivel,
      tutorNombre: cTutor.trim() || 'Por asignar',
    });

    setCId('');
    setCNombre('');
    setCTutor('');
    setModalNuevoCurso(false);
  };

  const handleCrearProfesorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profNombre.trim() || !profEmail.trim()) return;

    aprobarSolicitud('prof-' + Date.now(), 'profesor', profCursos);
    setProfNombre('');
    setProfApellidos('');
    setProfEmail('');
    setModalNuevoProfesor(false);
  };

  const handleCrearEncuestaSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!encPregunta.trim()) {
      setEncError('Por favor, indica la pregunta principal de la encuesta.');
      return;
    }
    const opcionesValidas = encOpciones
      .filter((op) => op.trim())
      .map((texto, idx) => ({ id: idx + 1, texto: texto.trim() }));
    if (opcionesValidas.length < 2) {
      setEncError('Debes incluir al menos 2 opciones de respuesta válidas.');
      return;
    }
    setEncError(null);

    const alcanceStr = encAlcances.includes('TODOS') ? 'TODOS' : encAlcances.join(',');
    const alcanceNombreStr = encAlcances.includes('TODOS')
      ? 'Toda la Comunidad Educativa'
      : encAlcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ');

    crearEncuesta({
      pregunta: encPregunta.trim(),
      descripcion: encDescripcion.trim() || undefined,
      opciones: opcionesValidas,
      esMultiple: encEsMultiple,
      alcance: alcanceStr,
      alcances: encAlcances,
      alcanceNombre: alcanceNombreStr,
      fechaCierre: Date.now() + encDiasCierre * 24 * 3600 * 1000,
      resultadosPublicos: encResultadosPublicos,
    });

    setEncPregunta('');
    setEncDescripcion('');
    setEncOpciones(['', '', '']);
    setEncAlcances(['TODOS']);
    setModalPrevisualizarEncuesta(false);
    setModalNuevaEncuesta(false);
  };

  const handleCrearEventoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evtTitulo.trim() || !evtFechaInicio) return;

    crearEvento({
      titulo: evtTitulo.trim(),
      descripcion: evtDescripcion.trim(),
      fechaInicio: new Date(evtFechaInicio).getTime(),
      fechaFin: evtFechaFin ? new Date(evtFechaFin).getTime() : new Date(evtFechaInicio).getTime() + 3600000,
      ubicacion: evtUbicacion.trim() || undefined,
      alcance: evtAlcance,
      alcanceNombre: evtAlcance === 'TODOS' ? 'Toda la Comunidad Educativa' : evtAlcance,
      tipo: evtTipo,
    });

    setEvtTitulo('');
    setEvtDescripcion('');
    setEvtUbicacion('');
    setModalNuevoEvento(false);
  };

  const handleCrearRecursoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recTitulo.trim() || !recUrl.trim()) return;

    agregarRecurso({
      titulo: recTitulo.trim(),
      descripcion: recDescripcion.trim(),
      url: recUrl.trim(),
      icono: recIcono as any,
      categoria: recCategoria,
      orden: recursos.length + 1,
      destacado: false,
    });

    setRecTitulo('');
    setRecUrl('');
    setRecDescripcion('');
    setModalNuevoRecurso(false);
  };

  const handleGuardarSilencioSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarHorarioSilencio({
      activo: true,
      horaInicio: silencioInicio,
      horaFin: silencioFin,
      finesDeSemanaSilenciados: silencioFinde,
    });
    setSilencioGuardado(true);
    setTimeout(() => setSilencioGuardado(false), 3000);
  };

  const handleCrearGrupoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grpNombre.trim()) return;

    crearGrupoPersonalizado({
      nombre: grpNombre.trim(),
      descripcion: grpDescripcion.trim(),
      color: grpColor,
      permisos: grpPermisos,
      miembrosUids: [],
    });

    setGrpNombre('');
    setGrpDescripcion('');
    setModalNuevoGrupo(false);
  };

  const handleGuardarPermisosProgenitorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalPermisosProgenitorUid) return;

    actualizarPermisosProgenitor(modalPermisosProgenitorUid, permisosProgenitorTemp);
    setModalPermisosProgenitorUid(null);
  };

  // Filtrado de alumnos en Base de Datos en tiempo real
  const alumnosFiltrados = alumnos.filter((a) => {
    if (!filtroAlumnos.trim()) return true;
    const q = filtroAlumnos.toLowerCase().trim();
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.apellidos.toLowerCase().includes(q) ||
      `${a.nombre} ${a.apellidos}`.toLowerCase().includes(q) ||
      a.cursoNombre.toLowerCase().includes(q) ||
      a.progenitores.some(
        (p) =>
          p.nombre.toLowerCase().includes(q) ||
          p.apellidos.toLowerCase().includes(q) ||
          p.email.toLowerCase().includes(q)
      )
    );
  });

  // Filtrado de conversaciones estilo email (Recibidos / Archivados / Búsqueda)
  const hilosFiltrados = conversaciones.filter((conv) => {
    const estaArchivado = conversacionesArchivadasIds.includes(conv.id);
    if (filtroBandeja === 'archivados' && !estaArchivado) return false;
    if (filtroBandeja === 'recibidos' && estaArchivado) return false;

    if (busquedaHilos.trim()) {
      const q = busquedaHilos.toLowerCase();
      const coincideAlumno = conv.alumnoNombre?.toLowerCase().includes(q);
      const coincideProgenitor = conv.progenitorNombre?.toLowerCase().includes(q);
      const coincideMensaje = conv.ultimoMensaje?.toLowerCase().includes(q);
      return coincideAlumno || coincideProgenitor || coincideMensaje;
    }

    return true;
  });

  const convActivaRecibida =
    hilosFiltrados.find((c) => c.id === conversacionActivaId) || hilosFiltrados[0];

  const mensajesConvActiva = convActivaRecibida
    ? mensajes.filter((m) => m.conversacionId === convActivaRecibida.id)
    : [];

  const handleEnviarRespuestaSecretaria = (e: React.FormEvent, convId?: string) => {
    e.preventDefault();
    const idDestino = convId || conversacionActivaId || (convActivaRecibida ? convActivaRecibida.id : '');
    if (!idDestino || !textoRespuestaSecretaria.trim()) return;
    enviarMensaje(idDestino, textoRespuestaSecretaria.trim(), false);
    setTextoRespuestaSecretaria('');
  };

  // Filtrado de encuestas (activas vs finalizadas)
  const encuestasActivas = encuestas.filter(
    (e) => (e.activa ?? true) && (e.fechaCierre ? Date.now() <= e.fechaCierre : true)
  );
  const encuestasFinalizadas = encuestas.filter(
    (e) => e.activa === false || (e.fechaCierre ? Date.now() > e.fechaCierre : false)
  );
  const encuestasFiltradas = encuestas.filter((e) => {
    const esActiva = (e.activa ?? true) && (e.fechaCierre ? Date.now() <= e.fechaCierre : true);
    if (filtroEncuestas === 'activas') return esActiva;
    if (filtroEncuestas === 'finalizadas') return !esActiva;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* =========================================================================
          CABECERA FIJA SUPERIOR UNIFICADA (PESTAÑAS + ACCIONES SECUNDARIAS)
         ========================================================================= */}
      <div className={`sticky ${modoSimuladorMovil ? 'top-0 -mt-3 pt-3 bg-slate-50/95' : 'top-14 -mt-2 sm:-mt-4 pt-2 bg-slate-100/95'} z-30 pb-2 backdrop-blur-md transition-all space-y-1.5`}>
        {/* Fila 1: Pestañas de Navegación Principales */}
        <div className={`bg-white rounded-xl shadow-md border border-slate-200/90 p-1 grid ${modoSimuladorMovil ? 'grid-cols-5' : 'grid-cols-5 sm:flex sm:items-center sm:gap-1'} text-xs font-semibold`}>
          <button
            onClick={() => setActiveTab('enviadas')}
            title="Comunicaciones Enviadas"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative ${
              activeTab === 'enviadas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Send className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
            <span className="hidden sm:inline">Enviados</span>
          </button>

          <button
            onClick={() => setActiveTab('recibidas')}
            title={`Recibidos ${totalNoLeidosRecibidos > 0 ? `(${totalNoLeidosRecibidos} sin leer)` : ''}`}
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative ${
              activeTab === 'recibidas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Inbox className="w-6 h-6 sm:w-5 sm:h-5" />
              {totalNoLeidosRecibidos > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-black leading-none bg-rose-600 text-white flex items-center justify-center shadow-xs animate-pulse">
                  {totalNoLeidosRecibidos}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Recibidos</span>
            {totalNoLeidosRecibidos > 0 && (
              <span
                className={`hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-black shadow-xs ${
                  activeTab === 'recibidas'
                    ? 'bg-amber-400 text-slate-950 ring-1 ring-amber-300'
                    : 'bg-rose-600 text-white animate-pulse'
                }`}
              >
                {totalNoLeidosRecibidos}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('encuestas')}
            title="Encuestas y Votaciones"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative ${
              activeTab === 'encuestas'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Vote className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
            <span className="hidden sm:inline">Encuestas</span>
          </button>

          <button
            onClick={() => setActiveTab('calendario')}
            title="Calendario Escolar"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative ${
              activeTab === 'calendario'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Calendar className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
            <span className="hidden sm:inline">Calendario</span>
          </button>

          <button
            onClick={() => setActiveTab('recursos')}
            title="Enlaces Externos"
            className={`h-11 sm:h-12 flex items-center justify-center sm:justify-start gap-2 py-2 px-1 sm:px-3.5 rounded-lg transition relative ${
              activeTab === 'recursos'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <ExternalLink className="w-6 h-6 sm:w-5 sm:h-5" />
            </div>
            <span className="hidden sm:inline">Enlaces Externos</span>
          </button>

          {/* Pestaña de Configuración: Oculta en versión móvil de administración */}
          <button
            onClick={() => setActiveTab('configuracion')}
            title="Configuración"
            className={`${modoSimuladorMovil ? 'hidden' : 'hidden sm:flex'} h-11 sm:h-12 items-center justify-start gap-2 py-2 px-3.5 rounded-lg transition relative ${
              activeTab === 'configuracion'
                ? 'bg-emerald-800 text-white shadow-sm'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Settings className="w-6 h-6 sm:w-5 sm:h-5" />
              {solicitudesPendientes.length > 0 && (
                <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-0.5 rounded-full text-[9px] font-black leading-none bg-amber-500 text-slate-950 flex items-center justify-center shadow-xs">
                  {solicitudesPendientes.length}
                </span>
              )}
            </div>
            <span className="hidden sm:inline">Configuración</span>
            {solicitudesPendientes.length > 0 && (
              <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 shadow-xs">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>
        </div>

        {/* Fila 2: Acciones secundarias en el mismo bloque fijo (sin movimiento ni solapes) */}
        {activeTab === 'enviadas' && (
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                setAvisoEsEmergencia(false);
                setModalNuevoAviso(true);
              }}
              className="px-2 sm:px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <FileText className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">Circular</span>
            </button>
            <button
              type="button"
              onClick={() => setModalPlantillasOpen(true)}
              className="px-2 sm:px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition active:scale-95 cursor-pointer border border-amber-500/40"
              title="Circulares de Emergencia y Plantillas 1-Toque"
            >
              <Zap className="w-4 h-4 text-amber-200 shrink-0" />
              <span className="truncate">1 Toque & SOS</span>
            </button>
            <button
              type="button"
              onClick={() => setModalNuevaAutorizacion(true)}
              className="px-2 sm:px-3 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1 sm:gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4 text-emerald-300 shrink-0" />
              <span className="truncate">Autorización</span>
            </button>
          </div>
        )}

        {activeTab === 'recibidas' && (
          <div className="grid grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold">
            <button
              type="button"
              onClick={() => setSubTabRecibidas('mensajes')}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                subTabRecibidas === 'mensajes'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Mensajes</span>
              {totalMensajesNoLeidos > 0 ? (
                <span className="w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] flex items-center justify-center font-black shadow-xs">
                  {totalMensajesNoLeidos}
                </span>
              ) : (
                <span className="opacity-75 font-normal text-[11px]">({conversaciones.length})</span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTabRecibidas('solicitudes')}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                subTabRecibidas === 'solicitudes'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5 shrink-0" />
              <span>Altas</span>
              {solicitudesPendientes.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-slate-950 text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {solicitudesPendientes.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setSubTabRecibidas('ausencias')}
              className={`py-2 px-2 rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                subTabRecibidas === 'ausencias'
                  ? 'bg-emerald-800 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5 shrink-0" />
              <span>Faltas</span>
              {ausencias.filter((a) => a.estado === 'pendiente').length > 0 && (
                <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] flex items-center justify-center font-bold shadow-xs">
                  {ausencias.filter((a) => a.estado === 'pendiente').length}
                </span>
              )}
            </button>
          </div>
        )}

        {activeTab === 'encuestas' && (
          <div className="flex items-center gap-1.5 sm:gap-2 w-full">
            {/* Filtros Activas / Finalizadas: Grid 2 columnas que jamás se solapan */}
            <div className="flex-1 grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-slate-200/90 shadow-sm text-xs font-semibold">
              <button
                type="button"
                onClick={() => setFiltroEncuestas('activas')}
                className={`py-2 px-1.5 sm:px-2 rounded-lg transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  filtroEncuestas === 'activas'
                    ? 'bg-emerald-800 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <Vote className="w-3.5 h-3.5 shrink-0" />
                <span>Activas</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    filtroEncuestas === 'activas'
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {encuestasActivas.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setFiltroEncuestas('finalizadas')}
                className={`py-2 px-1.5 sm:px-2 rounded-lg transition flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer whitespace-nowrap ${
                  filtroEncuestas === 'finalizadas'
                    ? 'bg-emerald-800 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>Finalizadas</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold shrink-0 ${
                    filtroEncuestas === 'finalizadas'
                      ? 'bg-emerald-700 text-emerald-100'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {encuestasFinalizadas.length}
                </span>
              </button>
            </div>

            {/* Botón Crear Nueva Encuesta */}
            <button
              type="button"
              onClick={() => setModalNuevaEncuesta(true)}
              className="px-3 sm:px-3.5 py-2.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl transition flex items-center justify-center gap-1 shadow-sm cursor-pointer active:scale-95 text-xs font-semibold shrink-0 whitespace-nowrap"
            >
              <Plus className="w-4 h-4 shrink-0 text-emerald-200" />
              <span className="hidden sm:inline">Crear Nueva</span>
              <span className="sm:hidden">Nueva</span>
            </button>
          </div>
        )}

        {activeTab === 'calendario' && (
          <div className="flex items-center gap-2 w-full">
            <button
              type="button"
              onClick={() => {
                if (diaSeleccionado) {
                  const pad = (n: number) => String(n).padStart(2, '0');
                  const dStr = `${diaSeleccionado.getFullYear()}-${pad(diaSeleccionado.getMonth() + 1)}-${pad(diaSeleccionado.getDate())}`;
                  setEvtFechaInicio(`${dStr}T09:00`);
                  setEvtFechaFin(`${dStr}T10:30`);
                }
                setModalNuevoEvento(true);
              }}
              className="w-full px-3 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-emerald-200" />
              <span>Añadir evento</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          PESTAÑA 1: COMUNICACIONES ENVIADAS
         ========================================================================= */}
      {activeTab === 'enviadas' && (
        <div className="space-y-2.5 sm:space-y-3">
          {/* Listado con scroll y las más nuevas primero */}
          <div className="space-y-2.5 sm:space-y-3">
            {[...avisos]
              .sort((a, b) => (b.fechaPublicacion || 0) - (a.fechaPublicacion || 0))
              .map((av) => {
              const expedientesDeEsteAviso = firmas.filter((f) => f.avisoId === av.id);
              const totalAlumnos = expedientesDeEsteAviso.length;
              const completadas = expedientesDeEsteAviso.filter((f) => f.estado === 'completada').length;
              const porcentaje = totalAlumnos > 0 ? Math.round((completadas / totalAlumnos) * 100) : 0;

              return (
                <div
                  key={av.id}
                  className={`rounded-xl p-3 sm:p-4 transition space-y-2 sm:space-y-3 ${
                    av.esEmergencia || av.prioridad === 'urgente'
                      ? 'bg-rose-50/30 border-2 border-rose-400 shadow-sm'
                      : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      {(av.esEmergencia || av.prioridad === 'urgente') && (
                        <span className="bg-rose-600 text-white font-bold px-2.5 py-0.5 rounded text-[10px] flex items-center gap-1 shadow-xs animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 text-white" />
                          <span>ALERTA DE EMERGENCIA</span>
                        </span>
                      )}
                      <span
                        className={`font-semibold px-2.5 py-0.5 rounded text-[11px] ${
                          av.tipoEmisor === 'ampa'
                            ? 'bg-blue-100 text-blue-800 border border-blue-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {av.tipoEmisor === 'ampa' ? 'AMPA' : 'Colegio Oficial'}
                      </span>
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        Alcance: {av.alcance === 'TODOS' ? 'Toda la Comunidad' : av.alcance}
                      </span>
                      {av.esAutorizacion && (
                        <span className="bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          Requiere Autorización
                        </span>
                      )}
                      {av.estadoEnvio === 'programado' && (
                        <span className="bg-indigo-100 text-indigo-800 border border-indigo-200 font-bold px-2 py-0.5 rounded text-[10px] flex items-center gap-1">
                          <Clock className="w-3 h-3 text-indigo-600" />
                          <span>
                            Envío programado:{' '}
                            {av.fechaProgramada
                              ? new Date(av.fechaProgramada).toLocaleString('es-ES', {
                                  day: '2-digit',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : 'Fecha futura'}
                          </span>
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(av.fechaPublicacion).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>

                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">{av.titulo}</h4>
                    <div className="mt-1">
                      <ContenidoEnriquecido content={av.contenido} />
                    </div>
                  </div>

                  {/* Si es una autorización, mostrar seguimiento de firmas */}
                  {av.esAutorizacion && (
                    <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600 font-semibold">
                          Progreso de firmas: {completadas} de {totalAlumnos} familias autorizadas ({porcentaje}%)
                        </span>
                        <button
                          onClick={() => setModalListaExcursionAvisoId(av.id)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Lista Pasajeros Autocar</span>
                        </button>
                      </div>
                      <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-600 h-full rounded-full transition-all"
                          style={{ width: `${porcentaje}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA 2: COMUNICACIONES RECIBIDAS (BANDEJA DE ENTRADA)
         ========================================================================= */}
      {activeTab === 'recibidas' && (
        <div className="space-y-2.5 sm:space-y-3">
          {subTabRecibidas === 'mensajes' && (
            <div className="space-y-2">
              {/* Barra de herramientas compacta: Filtro Bandeja / Archivados y Buscar */}
              <div className="flex items-center justify-between px-1 py-0.5">
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setFiltroBandeja('recibidos')}
                    title="Bandeja de mensajes activos"
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      filtroBandeja === 'recibidos'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Inbox className="w-3.5 h-3.5" />
                    <span>Recibidos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFiltroBandeja('archivados')}
                    title="Mensajes archivados"
                    className={`px-2.5 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      filtroBandeja === 'archivados'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Archive className="w-3.5 h-3.5" />
                    <span>Archivados</span>
                    {conversacionesArchivadasIds.length > 0 && (
                      <span className="w-3.5 h-3.5 bg-slate-700 text-white rounded-full text-[8px] flex items-center justify-center font-bold">
                        {conversacionesArchivadasIds.length}
                      </span>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setMostrarBuscadorHilos((prev) => !prev)}
                  title="Buscar mensajes"
                  className={`p-1.5 rounded-lg border transition cursor-pointer ${
                    mostrarBuscadorHilos || busquedaHilos
                      ? 'bg-slate-200 border-slate-300 text-slate-800'
                      : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-100'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Input de búsqueda si está activo */}
              {(mostrarBuscadorHilos || busquedaHilos) && (
                <div className="relative">
                  <input
                    type="text"
                    value={busquedaHilos}
                    onChange={(e) => setBusquedaHilos(e.target.value)}
                    placeholder="Buscar alumno, familia o texto..."
                    className="w-full text-xs pl-7 pr-6 py-1.5 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none shadow-xs"
                    autoFocus
                  />
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2" />
                  {busquedaHilos && (
                    <button
                      type="button"
                      onClick={() => setBusquedaHilos('')}
                      className="absolute right-2 top-1.5 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}

              {/* Listado de mensajes en acordeón (sin contenido previo; clic abre/cierra in situ; se puede archivar) */}
              <div className="space-y-1.5">
                {hilosFiltrados.length === 0 ? (
                  <div className="text-center py-12 text-xs text-slate-400 italic bg-white rounded-xl border border-slate-200">
                    {filtroBandeja === 'archivados'
                      ? 'No hay conversaciones archivadas.'
                      : busquedaHilos
                      ? 'No se encontraron conversaciones con ese filtro.'
                      : 'No hay mensajes en la bandeja de recibidos.'}
                  </div>
                ) : (
                  hilosFiltrados.map((conv) => {
                    const estaAbierto = conversacionActivaId === conv.id;
                    const nombreAlumnoCorto = formatearNombreAlumnoCorto(conv);
                    const mensajesDeEsteHilo = mensajes.filter((m) => m.conversacionId === conv.id);
                    const estaArchivado = conversacionesArchivadasIds.includes(conv.id);

                    return (
                      <div
                        key={conv.id}
                        className={`rounded-xl border transition shadow-xs overflow-hidden ${
                          estaAbierto
                            ? 'bg-white border-emerald-600 ring-1 ring-emerald-500/30'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {/* Fila del mensaje SIN CONTENIDO (pulsar para abrir / cerrar) */}
                        <div
                          onClick={() => setConversacionActivaId(estaAbierto ? '' : conv.id)}
                          className={`p-3 flex items-center justify-between gap-2.5 cursor-pointer select-none transition ${
                            estaAbierto ? 'bg-emerald-50/70 border-b border-emerald-100' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Avatar / icono */}
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                                conv.tipoCanal === 'tutoria'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {conv.tipoCanal === 'tutoria' ? (
                                <GraduationCap className="w-4 h-4" />
                              ) : (
                                <Users className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900 truncate">
                                  {conv.progenitorNombre || nombreAlumnoCorto}
                                </span>
                                <span
                                  className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded shrink-0 ${
                                    conv.tipoCanal === 'tutoria'
                                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                                  }`}
                                >
                                  {conv.tipoCanal === 'tutoria' ? 'Tutoría' : 'AMPA'}
                                </span>
                              </div>
                              {conv.alumnoNombre && conv.progenitorNombre && (
                                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                                  Alumno: {conv.alumnoNombre}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* A la derecha: Hora + Botón Archivar + Indicador chevron */}
                          <div className="flex items-center gap-2 shrink-0">
                            {conv.fechaUltimoMensaje && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                {new Date(conv.fechaUltimoMensaje).toLocaleTimeString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            )}

                            {/* Botón Archivar / Desarchivar directo */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (estaArchivado) {
                                  desarchivarConversacion(conv.id);
                                } else {
                                  archivarConversacion(conv.id);
                                }
                              }}
                              title={estaArchivado ? 'Desarchivar mensaje' : 'Archivar mensaje'}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-slate-200/60 transition cursor-pointer"
                            >
                              {estaArchivado ? (
                                <Inbox className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <Archive className="w-4 h-4" />
                              )}
                            </button>

                            {/* Indicador de apertura / cierre */}
                            <div className="text-slate-400 pl-0.5">
                              {estaAbierto ? (
                                <ChevronUp className="w-4 h-4 text-emerald-700" />
                              ) : (
                                <ChevronDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Contenido desplegado in-situ cuando se pulsa */}
                        {estaAbierto && (
                          <div className="p-3 bg-slate-50/40 space-y-3 animate-in fade-in duration-150">
                            {/* Cabecera del hilo abierto */}
                            <div className="flex items-center justify-between text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                              <div>
                                <span className="font-semibold text-slate-900">
                                  {conv.alumnoNombre || 'Consulta General'}
                                </span>
                                {cursos.find((c) => c.id === conv.cursoId) && (
                                  <span className="ml-1.5 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-medium">
                                    {cursos.find((c) => c.id === conv.cursoId)?.nombre}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                {estaArchivado ? (
                                  <button
                                    type="button"
                                    onClick={() => desarchivarConversacion(conv.id)}
                                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition"
                                  >
                                    <Inbox className="w-3 h-3" />
                                    <span>Desarchivar</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => archivarConversacion(conv.id)}
                                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded flex items-center gap-1 transition"
                                  >
                                    <Archive className="w-3 h-3" />
                                    <span>Archivar</span>
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => setConvParaEliminarId(conv.id)}
                                  className="p-1 text-rose-600 hover:bg-rose-50 rounded transition"
                                  title="Eliminar conversación"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Historial de Mensajes del Hilo */}
                            <div className="border border-slate-200 rounded-lg p-2.5 max-h-60 overflow-y-auto space-y-2 bg-white">
                              {mensajesDeEsteHilo.length === 0 ? (
                                <div className="text-center py-6 text-xs text-slate-400 italic">
                                  No hay mensajes registrados en este hilo.
                                </div>
                              ) : (
                                mensajesDeEsteHilo.map((msg) => {
                                  const esAdmin = msg.remitenteRol === 'admin';
                                  return (
                                    <div
                                      key={msg.id}
                                      className={`flex flex-col ${esAdmin ? 'items-end' : 'items-start'}`}
                                    >
                                      <div
                                        className={`max-w-[85%] rounded-xl px-3 py-1.5 text-xs leading-relaxed shadow-xs ${
                                          esAdmin
                                            ? 'bg-emerald-800 text-white rounded-br-none'
                                            : 'bg-slate-100 text-slate-800 border border-slate-200 rounded-bl-none'
                                        }`}
                                      >
                                        <p className="whitespace-pre-line">{msg.texto}</p>
                                        <span
                                          className={`block text-[10px] mt-0.5 text-right ${
                                            esAdmin ? 'text-emerald-200' : 'text-slate-400'
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

                            {/* Formulario de Respuesta */}
                            <form
                              onSubmit={(e) => handleEnviarRespuestaSecretaria(e, conv.id)}
                              className="flex gap-1.5"
                            >
                              <input
                                type="text"
                                maxLength={500}
                                value={textoRespuestaSecretaria}
                                onChange={(e) => setTextoRespuestaSecretaria(e.target.value)}
                                placeholder="Escribe tu respuesta..."
                                className="flex-1 text-xs px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-600 focus:outline-none"
                              />
                              <button
                                type="submit"
                                disabled={!textoRespuestaSecretaria.trim()}
                                className="px-3 py-2 bg-emerald-800 hover:bg-emerald-900 disabled:bg-slate-300 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-xs cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Responder</span>
                              </button>
                            </form>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Modal de confirmación para eliminar conversación */}
          {convParaEliminarId && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl p-5 max-w-sm w-full shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
                <div className="flex items-center gap-3 text-rose-600">
                  <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">¿Eliminar conversación?</h3>
                    <p className="text-xs text-slate-500">Esta acción no se puede deshacer.</p>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Se borrarán definitivamente todos los mensajes de este hilo de comunicación.
                </p>
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setConvParaEliminarId(null)}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      eliminarConversacion(convParaEliminarId);
                      setConvParaEliminarId(null);
                    }}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-sm cursor-pointer"
                  >
                    Sí, eliminar
                  </button>
                </div>
              </div>
            </div>
          )}

          {subTabRecibidas === 'solicitudes' && (
            <div className="space-y-3">
              {solicitudesPendientes.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 italic">
                  No hay solicitudes pendientes de validación en este momento.
                </div>
              ) : (
                solicitudesPendientes.map((solic) => (
                  <div key={solic.uid} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-sm text-slate-900">{solic.nombre} {solic.apellidos}</p>
                      <p className="text-xs text-slate-500">{solic.email} &bull; Tel: {solic.telefono || 'No especificado'}</p>
                      <p className="text-xs text-slate-600 mt-1">Cursos solicitados: {solic.cursos.join(', ')}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => rechazarSolicitud(solic.uid)}
                        className="px-3 py-1.5 border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold rounded-lg"
                      >
                        Rechazar
                      </button>
                      <button
                        onClick={() => aprobarSolicitud(solic.uid, 'padre', solic.cursos)}
                        className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprobar y Asignar Rol Padre
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {subTabRecibidas === 'ausencias' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Justificantes de ausencias y retrasos notificados por familias</span>
                <span className="font-semibold text-slate-700">{ausencias.length} registros</span>
              </div>

              {ausencias.length === 0 ? (
                <div className="text-center py-12 text-xs text-slate-400 italic">
                  No hay justificantes de faltas registrados.
                </div>
              ) : (
                ausencias.map((aus) => (
                  <div key={aus.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div>
                        <span className="font-bold text-slate-900 text-sm">{aus.nombreAlumno}</span>
                        <span className="text-slate-500 ml-2">({aus.cursoId}) &bull; Notificado por: {aus.nombreProgenitor}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-semibold">{aus.fechaInicio}</span>
                        {aus.estado === 'justificada' && (
                          <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            Justificada
                          </span>
                        )}
                        {aus.estado === 'pendiente' && (
                          <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200">
                            Pendiente
                          </span>
                        )}
                        {aus.estado === 'rechazada' && (
                          <span className="text-[11px] font-bold text-rose-800 bg-rose-50 px-2.5 py-0.5 rounded border border-rose-200">
                            Rechazada
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <strong>Motivo ({aus.motivo.replace('_', ' ')}):</strong> {aus.observacion}
                    </p>

                    {aus.comentarioCentro && (
                      <p className="text-[11px] text-slate-500 italic">
                        Resolución: "{aus.comentarioCentro}" por {aus.revisadoPor}
                      </p>
                    )}

                    {aus.estado === 'pendiente' && (
                      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => resolverAusencia(aus.id, 'rechazada', 'Causa no computable o sin justificativo')}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-rose-700 text-xs font-semibold rounded"
                        >
                          No Justificar
                        </button>
                        <button
                          onClick={() => resolverAusencia(aus.id, 'justificada', 'Revisado y conforme por Secretaría')}
                          className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold rounded flex items-center gap-1 shadow-sm"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Aprobar y Justificar
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          PESTAÑA: ENCUESTAS Y VOTACIONES (SUPERUSER)
         ========================================================================= */}
      {activeTab === 'encuestas' && (
        <div className="space-y-2.5 sm:space-y-3">
          {/* Listado de encuestas filtradas */}

          <div className="space-y-3">
            {encuestasFiltradas.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400 bg-white rounded-xl border border-slate-200 italic">
                {filtroEncuestas === 'activas'
                  ? 'No hay encuestas activas en este momento.'
                  : filtroEncuestas === 'finalizadas'
                  ? 'No hay encuestas finalizadas.'
                  : 'No hay encuestas creadas en este momento.'}
              </div>
            ) : (
              encuestasFiltradas.map((enc) => {
                const votos = votosEncuestas[enc.id] || [];
                const totalVotos = votos.length;
                const esActiva = (enc.activa ?? true) && (enc.fechaCierre ? Date.now() <= enc.fechaCierre : true);

                return (
                  <div key={enc.id} className="border border-slate-200 rounded-xl p-3.5 sm:p-4 bg-white shadow-sm space-y-3">
                    <div className="flex items-center justify-between text-xs flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold px-2 py-0.5 rounded text-[10px] border ${
                          esActiva
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {esActiva ? 'Activa' : 'Finalizada'}
                        </span>
                        <span className="font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 text-[10px]">
                          {enc.esMultiple ? 'Selección Múltiple' : 'Opción Única'}
                        </span>
                        <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-[10px]">
                          Alcance: {enc.alcance}
                        </span>
                      </div>
                      <span className="text-slate-400 flex items-center gap-1 text-[11px]">
                        <Clock className="w-3 h-3" />
                        Cierre: {new Date(enc.fechaCierre).toLocaleDateString('es-ES')}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{enc.pregunta}</h4>
                    {enc.descripcion && <p className="text-xs text-slate-500">{enc.descripcion}</p>}

                    <div className="space-y-2 pt-1">
                      {enc.opciones.map((op) => {
                        const votosOp = votos.filter((v) => v.opcionesSeleccionadas.includes(op.id)).length;
                        const pct = totalVotos > 0 ? Math.round((votosOp / totalVotos) * 100) : 0;

                        return (
                          <div key={op.id} className="border border-slate-200 rounded-lg p-3 text-xs bg-slate-50/50 relative overflow-hidden">
                            <div className="flex items-center justify-between relative z-10">
                              <span className="font-medium text-slate-800">{op.texto}</span>
                              <span className="font-bold text-slate-700">{votosOp} votos ({pct}%)</span>
                            </div>
                            <div
                              className="absolute left-0 bottom-0 top-0 bg-emerald-100/70 transition-all duration-500"
                              style={{ width: `${pct}%`, zIndex: 1 }}
                            />
                          </div>
                        );
                      })}
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total de votos emitidos: <strong>{totalVotos}</strong></span>
                      <button
                        onClick={() => {
                          const csv = `Opcion,Votos\n${enc.opciones.map(o => `"${o.texto}",${votos.filter(v => v.opcionesSeleccionadas.includes(o.id)).length}`).join('\n')}`;
                          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `recuento_encuesta_${enc.id}.csv`;
                          a.click();
                        }}
                        className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5 text-slate-600" />
                        Exportar CSV
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA: CALENDARIO ESCOLAR (SUPERUSER)
         ========================================================================= */}
      {activeTab === 'calendario' && (() => {
        const hoy = new Date();
        const hoyInicio = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

        // Filtrar pasados y ordenar los más cercanos hoy en adelante
        const eventosFuturos = eventos.filter((evt) => {
          const fFin = evt.fechaFin ? new Date(evt.fechaFin) : new Date(evt.fechaInicio);
          return fFin.getTime() >= hoyInicio.getTime();
        });

        const eventosOrdenadosProximos = [...eventosFuturos].sort(
          (a, b) => new Date(a.fechaInicio).getTime() - new Date(b.fechaInicio).getTime()
        );

        // Si el usuario selecciona un día del calendario, mostramos los eventos de ese día
        const eventosAMostrar = diaSeleccionado
          ? eventos.filter((evt) => esMismoDia(evt.fechaInicio, diaSeleccionado))
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

        // Rótulo del encabezado del calendario
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
                  // Deslizar a la derecha -> semana/mes anterior
                  if (vistaCalendarioModo === 'semana') irSemanaAnterior();
                  else irMesAnterior();
                } else if (diff < -45) {
                  // Deslizar a la izquierda -> semana/mes siguiente
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
                      const eventosEnEsteDia = eventos.filter((e) => esMismoDia(e.fechaInicio, fechaDia));
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
                      const eventosEnEsteDia = eventos.filter((e) => esMismoDia(e.fechaInicio, fechaCelda));
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
                eventosAMostrar.map((evt) => {
                  const badge = getBadgeTipoEvento(evt.tipo);
                  return (
                    <div
                      key={evt.id}
                      className="border border-slate-200/90 rounded-xl p-3.5 bg-white shadow-sm space-y-2.5 hover:border-slate-300 transition"
                    >
                      <div className="flex items-center justify-between text-xs gap-2">
                        <span
                          className={`font-bold uppercase px-2 py-0.5 rounded border text-[10px] ${badge.className}`}
                        >
                          {badge.label}
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

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                        <span>Alcance: {evt.alcanceNombre || evt.alcance}</span>
                      </div>

                      {/* Botones de sincronización en 2 columnas */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
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
                          onClick={() => handleAbrirAppleCalendar(evt)}
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-2 bg-slate-900 hover:bg-slate-800 active:bg-black text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                          title="Añadir a Calendario de iPhone / Apple"
                        >
                          <Smartphone className="w-3.5 h-3.5 text-slate-200 shrink-0" />
                          <span>iPhone / Apple</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}

      {/* =========================================================================
          PESTAÑA: RECURSOS Y ENLACES EXTERNOS (SUPERUSER)
         ========================================================================= */}
      {activeTab === 'recursos' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Enlaces Externos Oficiales</h3>
              <p className="text-xs text-slate-500">
                Documentos y enlaces web de consulta frecuente (Google Drive, Web AMPA, Secretaría Virtual, etc.).
              </p>
            </div>
            <button
              onClick={() => setModalNuevoRecurso(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir Enlace Oficial</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recursos.map((rec) => (
              <div key={rec.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5 text-emerald-700" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{rec.titulo}</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">{rec.descripcion}</p>
                    <a
                      href={rec.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-emerald-700 hover:underline mt-1 inline-flex items-center gap-1 font-mono truncate max-w-xs"
                    >
                      {rec.url}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => eliminarRecurso(rec.id)}
                  className="text-slate-400 hover:text-rose-600 p-1"
                  title="Eliminar recurso"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          PESTAÑA: CONFIGURACIÓN (TODAS LAS OPCIONES DEL SUPERUSUARIO - SOLO ESCRITORIO)
         ========================================================================= */}
      {activeTab === 'configuracion' && !modoSimuladorMovil && (
        <div className="hidden sm:block space-y-4">
          {/* Sub-navegación dentro de Configuración */}
          <div className="flex border-b border-slate-200 bg-white rounded-xl px-3 pt-3 gap-2 text-xs font-semibold overflow-x-auto">
            <button
              onClick={() => setSubTabConfig('centro')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'centro'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>Datos del Centro e Imagen</span>
            </button>

            <button
              onClick={() => setSubTabConfig('alumnos')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'alumnos'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              <span>Alumnos y Familias ({alumnos.length})</span>
            </button>

            <button
              onClick={() => setSubTabConfig('cursos')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'cursos'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Building className="w-4 h-4" />
              <span>Cursos ({cursos.length})</span>
            </button>

            <button
              onClick={() => setSubTabConfig('profesores')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'profesores'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Profesores ({usuarios.filter((u) => u.rol === 'profesor').length})</span>
            </button>

            <button
              onClick={() => setSubTabConfig('emisores')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'emisores'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileSignature className="w-4 h-4" />
              <span>Órganos Emisores ({organosEmisores.length})</span>
            </button>

            <button
              onClick={() => setSubTabConfig('silencio')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'silencio'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Horario Silencio Docente</span>
            </button>

            <button
              onClick={() => setSubTabConfig('grupos')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'grupos'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Shield className="w-4 h-4" />
              <span>Grupos y Permisos ({gruposPersonalizados.length})</span>
            </button>

            <button
              onClick={() => setSubTabConfig('usuarios')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'usuarios'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Usuarios y Roles ({usuarios.length})</span>
            </button>

            <button
              onClick={() => setSubTabConfig('qr')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'qr'
                  ? 'border-emerald-700 text-emerald-900 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <QrCode className="w-4 h-4" />
              <span>Circular QR Familias</span>
            </button>

            <button
              onClick={() => setSubTabConfig('muestra-perfiles')}
              className={`flex items-center gap-1.5 px-4 py-2.5 border-b-2 transition shrink-0 ${
                subTabConfig === 'muestra-perfiles'
                  ? 'border-indigo-600 text-indigo-900 font-bold bg-indigo-50/50'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Eye className="w-4 h-4 text-indigo-600" />
              <span>Muestra de Perfiles</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                Simulador
              </span>
            </button>
          </div>

          {/* SUB-PESTAÑA 1: DATOS DEL CENTRO E IMAGEN (CON SELECTOR DE LOGO/ESCUDO) */}
          {subTabConfig === 'centro' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-6 text-xs max-w-2xl mx-auto">
              <div className="border-b border-slate-200 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Ficha Oficial del Centro e Imagen Institucional</h3>
                  <p className="text-slate-500">
                    Personaliza el escudo o logotipo del colegio, datos oficiales y canales de atención a familias.
                  </p>
                </div>
                <span className="self-start sm:self-auto px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300">
                  Configuración Superuser
                </span>
              </div>

              {guardadoCentroExito && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-2.5 shadow-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
                  <div>
                    <p className="font-bold">Datos e imagen del centro actualizados y guardados correctamente.</p>
                    <p className="text-[11px] text-emerald-700">Se han aplicado de inmediato en la cabecera superior, circulares y carátula del colegio.</p>
                  </div>
                </div>
              )}

              {errorLogo && (
                <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{errorLogo}</span>
                </div>
              )}

              {/* SECCIÓN IMAGEN / ESCUDO DEL COLEGIO */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                    <Image className="w-4 h-4 text-emerald-700" />
                    <span>Escudo o Logotipo del Colegio</span>
                  </label>
                  <span className="text-[11px] text-slate-500">Visible en toda la comunidad educativa</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-5">
                  {/* Vista previa actual */}
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-white border-2 border-emerald-600/40 shadow-sm flex items-center justify-center overflow-hidden p-1.5">
                      {centroLogoUrl ? (
                        <img
                          src={centroLogoUrl}
                          alt="Escudo del Centro"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 gap-1 text-[10px]">
                          <Building2 className="w-8 h-8 text-slate-300" />
                          <span>Por defecto</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones de carga de imagen */}
                  <div className="space-y-2 flex-1 w-full text-center sm:text-left">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      <input
                        type="file"
                        ref={fileInputLogoRef}
                        accept="image/png,image/jpeg,image/webp,image/svg+xml"
                        className="hidden"
                        onChange={handleCargarArchivoLogo}
                      />
                      <button
                        type="button"
                        onClick={() => fileInputLogoRef.current?.click()}
                        className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 shadow-sm transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Imagen del Colegio</span>
                      </button>

                      {centroLogoUrl && (
                        <button
                          type="button"
                          onClick={() => setCentroLogoUrl('')}
                          className="px-3 py-2 bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 rounded-lg font-semibold flex items-center gap-1.5 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Quitar Imagen</span>
                        </button>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Admite archivos PNG, JPG, WebP o SVG (máx. 2 MB). Se guarda localmente y se refleja en tiempo real.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECCIÓN FORMULARIO DATOS OFICIALES */}
              <form onSubmit={handleGuardarDatosCentro} className="space-y-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre Oficial del Colegio</label>
                  <input
                    type="text"
                    required
                    value={centroNombre}
                    onChange={(e) => setCentroNombre(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="ej. CEIP El Molinillo"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Oficial de Centro</label>
                  <input
                    type="text"
                    required
                    value={centroCodigo}
                    onChange={(e) => setCentroCodigo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                    placeholder="ej. 00000000"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Dirección Postal Oficial</label>
                  <input
                    type="text"
                    value={centroDireccion}
                    onChange={(e) => setCentroDireccion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="ej. Avenida de la Educación, 1, 28001 Madrid"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Teléfono Secretaría</label>
                    <input
                      type="tel"
                      value={centroTelefono}
                      onChange={(e) => setCentroTelefono(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      placeholder="ej. 900 000 000"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico Oficial</label>
                    <input
                      type="email"
                      value={centroEmail}
                      onChange={(e) => setCentroEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                      placeholder="ej. contacto@colegiodemo.es"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horario de Atención de Secretaría / Público</label>
                  <input
                    type="text"
                    value={centroHorario}
                    onChange={(e) => setCentroHorario(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    placeholder="ej. Lunes a Viernes de 09:00 a 14:00 h"
                  />
                </div>

                {/* PANEL DE VISIBILIDAD DE DATOS DEL CENTRO (CONFIGURACIÓN SUPERUSER) */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                      <Eye className="w-4 h-4 text-emerald-700" />
                      <span>Visibilidad de Datos en la Ficha Pública para Familias</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">Control de Privacidad Escolar</span>
                  </div>
                  <p className="text-[11px] text-slate-600">
                    Marca o desmarca si algún dato del centro no hace falta que salga publicado para las familias y alumnos.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visMostrarDireccion}
                        onChange={(e) => setVisMostrarDireccion(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-slate-800 text-[11px]">Mostrar Dirección Postal</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visMostrarTelefono}
                        onChange={(e) => setVisMostrarTelefono(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-slate-800 text-[11px]">Mostrar Teléfono de Secretaría</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visMostrarEmail}
                        onChange={(e) => setVisMostrarEmail(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-slate-800 text-[11px]">Mostrar Correo Oficial</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visMostrarHorario}
                        onChange={(e) => setVisMostrarHorario(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-slate-800 text-[11px]">Mostrar Horario de Atención</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visMostrarClaustro}
                        onChange={(e) => setVisMostrarClaustro(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-slate-800 text-[11px]">Mostrar Listado de Profesores y Cargos</span>
                    </label>

                    <label className="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 cursor-pointer hover:bg-slate-50">
                      <input
                        type="checkbox"
                        checked={visMostrarEmailsProfesores}
                        onChange={(e) => setVisMostrarEmailsProfesores(e.target.checked)}
                        className="rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <span className="font-semibold text-slate-800 text-[11px]">Mostrar Emails de Profesores a Familias</span>
                    </label>
                  </div>
                </div>

                {/* GESTOR INDIVIDUAL DE PROFESORES Y CARGOS VISIBLES */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                        <Users className="w-4 h-4 text-emerald-700" />
                        <span>Claustro de Profesores y Cargos Oficiales del Centro</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Define los cargos y marca si algún profesor o directivo NO hace falta que salga en la ficha pública.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {usuarios.filter((u) => (u.rol === 'profesor' || u.rol === 'admin') && !profesoresOcultos.includes(u.uid)).length} visibles
                      </span>
                      {profesoresOcultos.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                          {profesoresOcultos.length} ocultos
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filtrar por nombre o cargo..."
                      value={filtroDocentesAdmin}
                      onChange={(e) => setFiltroDocentesAdmin(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {usuarios
                      .filter((u) => u.rol === 'profesor' || u.rol === 'admin')
                      .filter((u) => {
                        if (!filtroDocentesAdmin.trim()) return true;
                        const q = filtroDocentesAdmin.toLowerCase();
                        const nombre = `${u.nombre} ${u.apellidos}`.toLowerCase();
                        const cargo = (cargosPersonalizados[u.uid] || '').toLowerCase();
                        return nombre.includes(q) || cargo.includes(q);
                      })
                      .map((doc) => {
                        const estaOculto = profesoresOcultos.includes(doc.uid);
                        const cargoActual =
                          cargosPersonalizados[doc.uid] ||
                          (doc.rol === 'admin'
                            ? 'Dirección y Jefatura de Estudios'
                            : doc.cursos && doc.cursos.length > 0
                            ? `Tutor/a de ${doc.cursos.map((cId) => cursos.find((c) => c.id === cId)?.nombre || cId).join(', ')}`
                            : 'Profesor/a Especialista');

                        return (
                          <div
                            key={doc.uid}
                            className={`p-2.5 rounded-lg border transition flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                              estaOculto
                                ? 'bg-amber-50/60 border-amber-300/80'
                                : 'bg-white border-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0 flex-1">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-300">
                                {doc.nombre.charAt(0)}{doc.apellidos.charAt(0)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-slate-900 text-xs">
                                    {doc.nombre} {doc.apellidos}
                                  </span>
                                  {doc.rol === 'admin' && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                                      Dirección
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  {doc.email}
                                </div>
                              </div>
                            </div>

                            {/* Cargo editable e interruptor de visibilidad */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <input
                                type="text"
                                value={cargoActual}
                                onChange={(e) => handleCambiarCargoProfesor(doc.uid, e.target.value)}
                                placeholder="Cargo o especialidad..."
                                title="Editar cargo oficial para la ficha del colegio"
                                className="px-2 py-1 text-xs border border-slate-300 rounded-md text-slate-800 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 flex-1 sm:w-56"
                              />

                              <button
                                type="button"
                                onClick={() => toggleOcultarProfesor(doc.uid)}
                                title={estaOculto ? 'Marcar como visible para las familias' : 'Ocultar de la ficha pública de familias'}
                                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold flex items-center gap-1 shrink-0 transition ${
                                  estaOculto
                                    ? 'bg-amber-200 hover:bg-amber-300 text-amber-900 border border-amber-400'
                                    : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300'
                                }`}
                              >
                                {estaOculto ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-amber-800" />
                                    <span>Oculto</span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                                    <span>Visible</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Guardar Datos del Centro, Visibilidad y Claustro</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUB-PESTAÑA 2: ALUMNOS Y PROGENITORES (CON IMPORTADOR EXCEL) */}
          {subTabConfig === 'alumnos' && (

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={filtroAlumnos}
                    onChange={(e) => setFiltroAlumnos(e.target.value)}
                    placeholder="Buscar alumno, curso o progenitor..."
                    className="w-full pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                  {filtroAlumnos && (
                    <button
                      type="button"
                      onClick={() => setFiltroAlumnos('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      title="Limpiar búsqueda"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => setModalImportarExcel(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    <span>Importar Excel / CSV</span>
                  </button>

                  <button
                    onClick={() => setModalNuevoAlumno(true)}
                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Matricular Alumno</span>
                  </button>
                </div>
              </div>

              {/* Vista Móvil: Lista contraída solo al nombre del alumno */}
              <div className="block md:hidden space-y-2">
                <div className="text-[11px] text-slate-500 font-semibold px-0.5">
                  {alumnosFiltrados.length} {alumnosFiltrados.length === 1 ? 'alumno' : 'alumnos'}
                </div>
                {alumnosFiltrados.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
                    <p className="font-semibold text-slate-600">No se encontraron alumnos</p>
                    <p className="text-[11px]">Ningún alumno coincide con "{filtroAlumnos}"</p>
                  </div>
                ) : (
                  alumnosFiltrados.map((alum) => {
                    const estaExpandido = adminAlumnoExpandidoId === alum.id;

                    return (
                      <div
                        key={alum.id}
                        className="border border-slate-200 rounded-xl bg-white shadow-2xs overflow-hidden transition hover:border-emerald-300"
                      >
                        {/* Fila contraída: Nombre del alumno y flecha */}
                        <button
                          type="button"
                          onClick={() => setAdminAlumnoExpandidoId(estaExpandido ? null : alum.id)}
                          className="w-full p-3 flex items-center justify-between text-left hover:bg-slate-50/80 transition cursor-pointer"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0">
                              {alum.nombre.charAt(0)}{alum.apellidos.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <span className="font-bold text-slate-900 text-sm truncate block">
                                {alum.nombre} {alum.apellidos}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {alum.cursoNombre}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
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

                        {/* Detalles desplegados */}
                        {estaExpandido && (
                          <div className="px-3 pb-3 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                            <div className="space-y-1.5">
                              <p className="font-semibold text-slate-700 text-[11px]">
                                Progenitores ({alum.progenitores.length}):
                              </p>
                              {alum.progenitores.map((p, idx) => {
                                const usuarioProg = usuarios.find((u) => u.uid === p.uid);
                                const notifBloqueadas = usuarioProg?.notificacionesBloqueadas;
                                const tienePermisosEspeciales =
                                  !!usuarioProg?.permisosEspeciales &&
                                  Object.values(usuarioProg.permisosEspeciales).some(Boolean);

                                return (
                                  <div
                                    key={idx}
                                    className="p-2 bg-white rounded-lg border border-slate-200 space-y-1.5 text-[11px]"
                                  >
                                    <div>
                                      <span className="font-semibold text-slate-800">
                                        {p.nombre} {p.apellidos}
                                      </span>
                                      <span className="text-slate-400 ml-1">({p.parentesco})</span>
                                      <p className="text-slate-500 font-mono text-[10px]">{p.email}</p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100">
                                      <button
                                        type="button"
                                        onClick={() => toggleBloqueoNotificacionesPadre(p.uid)}
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                                          notifBloqueadas
                                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                        }`}
                                      >
                                        {notifBloqueadas ? (
                                          <BellOff className="w-3 h-3 text-rose-600" />
                                        ) : (
                                          <Bell className="w-3 h-3 text-emerald-600" />
                                        )}
                                        <span>{notifBloqueadas ? 'Push Silenciado' : 'Push Activo'}</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setModalPermisosProgenitorUid(p.uid);
                                          setModalPermisosProgenitorNombre(`${p.nombre} ${p.apellidos}`);
                                          setPermisosProgenitorTemp(usuarioProg?.permisosEspeciales || {});
                                        }}
                                        className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border transition ${
                                          tienePermisosEspeciales
                                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                        }`}
                                      >
                                        <Key className="w-3 h-3 text-slate-500" />
                                        <span>Permisos</span>
                                      </button>

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setUsuarioRolesEditando(
                                            usuarioProg || {
                                              uid: p.uid,
                                              nombre: p.nombre,
                                              apellidos: p.apellidos,
                                              email: p.email,
                                              rol: 'padre',
                                              roles: ['padre'],
                                              cursos: [alum.cursoId],
                                              fcmTokens: [],
                                              activo: true,
                                              emailVerified: true,
                                              fechaRegistro: Date.now(),
                                            }
                                          );
                                        }}
                                        className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 transition"
                                      >
                                        <Shield className="w-3 h-3 text-blue-700" />
                                        <span>Roles ({(usuarioProg?.roles?.length || 1)})</span>
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="pt-2 border-t border-slate-200 flex justify-end">
                              <button
                                type="button"
                                onClick={() => eliminarAlumno(alum.id)}
                                className="px-2.5 py-1 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Eliminar Alumno</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Tabla de Alumnos en Escritorio */}
              <div className="hidden md:block border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
                      <th className="p-3">Alumno</th>
                      <th className="p-3">Curso</th>
                      <th className="p-3">Régimen</th>
                      <th className="p-3">Progenitores y Tutores ({alumnos.reduce((acc, a) => acc + a.progenitores.length, 0)} contactos)</th>
                      <th className="p-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alumnosFiltrados.map((alum) => (
                      <tr key={alum.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-900">
                          {alum.nombre} {alum.apellidos}
                        </td>
                        <td className="p-3">
                          <span className="bg-slate-100 text-slate-700 font-semibold px-2 py-0.5 rounded text-[11px]">
                            {alum.cursoNombre}
                          </span>
                        </td>
                        <td className="p-3">
                          {alum.padresSeparados ? (
                            <span className="bg-amber-100 text-amber-800 font-semibold px-2 py-0.5 rounded text-[10px]">
                              Custodia compartida / Separados
                            </span>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Ordinario</span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          <div className="space-y-1.5">
                            {alum.progenitores.map((p, idx) => {
                              const usuarioProg = usuarios.find((u) => u.uid === p.uid);
                              const notifBloqueadas = usuarioProg?.notificacionesBloqueadas;
                              const tienePermisosEspeciales =
                                !!usuarioProg?.permisosEspeciales &&
                                Object.values(usuarioProg.permisosEspeciales).some(Boolean);

                              return (
                                <div
                                  key={idx}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-1.5 bg-slate-50 rounded-lg border border-slate-200 text-[11px]"
                                >
                                  <div>
                                    <span className="font-semibold text-slate-800">
                                      {p.nombre} {p.apellidos}
                                    </span>
                                    <span className="text-slate-400 ml-1">({p.parentesco})</span>
                                    <span className="text-slate-500 font-mono text-[10px] ml-1.5">
                                      &bull; {p.email}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-1.5 shrink-0">
                                    {/* Control individual de notificaciones push */}
                                    <button
                                      type="button"
                                      onClick={() => toggleBloqueoNotificacionesPadre(p.uid)}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 transition ${
                                        notifBloqueadas
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                                      }`}
                                      title={
                                        notifBloqueadas
                                          ? 'Notificaciones push desactivadas para este progenitor'
                                          : 'Notificaciones push activas'
                                      }
                                    >
                                      {notifBloqueadas ? (
                                        <BellOff className="w-3 h-3 text-rose-600" />
                                      ) : (
                                        <Bell className="w-3 h-3 text-emerald-600" />
                                      )}
                                      <span>{notifBloqueadas ? 'Push Silenciado' : 'Push Activo'}</span>
                                    </button>

                                    {/* Permisos específicos de progenitor */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setModalPermisosProgenitorUid(p.uid);
                                        setModalPermisosProgenitorNombre(`${p.nombre} ${p.apellidos}`);
                                        setPermisosProgenitorTemp(usuarioProg?.permisosEspeciales || {});
                                      }}
                                      className={`px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border transition ${
                                        tienePermisosEspeciales
                                          ? 'bg-purple-100 text-purple-900 border-purple-300'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                      }`}
                                      title="Conceder permisos granulares individuales"
                                    >
                                      <Key className="w-3 h-3 text-slate-500" />
                                      <span>Permisos</span>
                                    </button>

                                    {/* Configuración de roles asignados (ej. AMPA / Familia) */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setUsuarioRolesEditando(
                                          usuarioProg || {
                                            uid: p.uid,
                                            nombre: p.nombre,
                                            apellidos: p.apellidos,
                                            email: p.email,
                                            rol: 'padre',
                                            roles: ['padre'],
                                            cursos: [alum.cursoId],
                                            fcmTokens: [],
                                            activo: true,
                                            emailVerified: true,
                                            fechaRegistro: Date.now(),
                                          }
                                        );
                                      }}
                                      className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 transition"
                                      title="Configurar roles asignados (ej. si es representante del AMPA)"
                                    >
                                      <Shield className="w-3 h-3 text-blue-700" />
                                      <span>Roles ({(usuarioProg?.roles?.length || 1)})</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => eliminarAlumno(alum.id)}
                            title="Eliminar alumno"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA 2: CURSOS */}
          {subTabConfig === 'cursos' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Cursos y Grupos del Colegio</h3>
                  <p className="text-slate-500">Aulas activas y asignación del maestro tutor.</p>
                </div>
                <button
                  onClick={() => setModalNuevoCurso(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Añadir Curso</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {cursos.map((c) => {
                  const numAlumnos = alumnos.filter((a) => a.cursoId === c.id).length;
                  return (
                    <div
                      key={c.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 bg-emerald-100 px-2.5 py-0.5 rounded text-[11px]">
                          {c.id}
                        </span>
                        <button
                          onClick={() => eliminarCurso(c.id)}
                          className="text-slate-400 hover:text-red-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <h4 className="font-bold text-slate-900 text-sm">{c.nombre}</h4>
                      <p className="text-slate-500">Nivel: {c.nivel}</p>
                      <p className="text-slate-700">Tutor/a: <strong>{c.tutorNombre || 'Sin asignar'}</strong></p>
                      <div className="pt-2 border-t border-slate-200 flex justify-between font-semibold text-slate-600">
                        <span>Alumnos matriculados:</span>
                        <span>{numAlumnos}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA 3: PROFESORES */}
          {subTabConfig === 'profesores' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Claustro Docente y Profesores</h3>
                  <p className="text-slate-500">Cuentas con permisos de tutoría y publicación en cursos.</p>
                </div>
                <button
                  onClick={() => setModalNuevoProfesor(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold flex items-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Alta de Profesor</span>
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                      <th className="p-3">Docente</th>
                      <th className="p-3">Correo Oficial</th>
                      <th className="p-3">Cursos Asignados</th>
                      <th className="p-3">Roles y Accesos</th>
                      <th className="p-3 text-right">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usuarios
                      .filter((u) => u.rol === 'profesor')
                      .map((prof) => (
                        <tr key={prof.uid} className="hover:bg-slate-50">
                          <td className="p-3 font-bold text-slate-900">
                            {prof.nombre} {prof.apellidos}
                          </td>
                          <td className="p-3 text-slate-600">{prof.email}</td>
                          <td className="p-3 text-slate-600">
                            {prof.cursos.length > 0 ? prof.cursos.join(', ') : 'Sin tutoría asignada'}
                          </td>
                          <td className="p-3">
                            <button
                              type="button"
                              onClick={() => setUsuarioRolesEditando(prof)}
                              className="px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1 border border-purple-200 bg-purple-50 text-purple-900 hover:bg-purple-100 transition"
                              title="Configurar roles asignados (ej. si también es madre/padre en el centro)"
                            >
                              <Shield className="w-3 h-3 text-purple-700" />
                              <span>Roles ({(prof.roles?.length || 1)})</span>
                            </button>
                          </td>
                          <td className="p-3 text-right">
                            <span className="text-emerald-700 font-semibold text-[11px] flex items-center justify-end gap-1">
                              <Check className="w-3.5 h-3.5" /> Activo
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA 4: DATOS DEL CENTRO */}
          {subTabConfig === 'silencio' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5 text-xs max-w-xl mx-auto">
              <div className="border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-emerald-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Horario de Silencio y Desconexión Laboral Docente</h3>
                </div>
                <p className="text-slate-500 mt-1">
                  Durante esta franja horaria los mensajes enviados por las familias quedan en estado programado y las notificaciones no interrumpen al profesorado hasta el inicio de la jornada escolar.
                </p>
              </div>

              {silencioGuardado && (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-2.5 rounded-lg flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>Ajustes de horario de silencio docente actualizados con éxito.</span>
                </div>
              )}

              <form onSubmit={handleGuardarSilencioSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Inicio del Silencio (Tarde)
                    </label>
                    <input
                      type="time"
                      required
                      value={silencioInicio}
                      onChange={(e) => setSilencioInicio(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Fin de jornada lectiva (ej. 17:00)</span>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Fin del Silencio (Mañana)
                    </label>
                    <input
                      type="time"
                      required
                      value={silencioFin}
                      onChange={(e) => setSilencioFin(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-0.5 block">Inicio de jornada lectiva (ej. 08:30)</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-2.5 cursor-pointer font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={silencioFinde}
                      onChange={(e) => setSilencioFinde(e.target.checked)}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>Silenciar completamente durante fines de semana (Sábados y Domingos)</span>
                  </label>
                  <p className="text-[11px] text-slate-500 mt-1 pl-6">
                    Los mensajes urgentes marcados como prioritarios por Dirección continuarán entregándose de inmediato.
                  </p>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition"
                  >
                    Guardar Configuración de Silencio
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* SUB-PESTAÑA 6: GRUPOS PERSONALIZADOS Y GESTIÓN DE PERMISOS */}
          {subTabConfig === 'grupos' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Grupos Personalizados y Gestión de Permisos</h3>
                  <p className="text-xs text-slate-500">
                    Crea colectivos (comedor, transporte, delegados de curso, monitores) y asígnales permisos específicos de publicación o consulta.
                  </p>
                </div>
                <button
                  onClick={() => setModalNuevoGrupo(true)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Crear Nuevo Grupo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gruposPersonalizados.map((grp) => {
                  const miembros = usuarios.filter((u) => grp.miembrosUids.includes(u.uid));

                  return (
                    <div key={grp.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{grp.nombre}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                              {grp.miembrosUids.length} integrantes
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{grp.descripcion}</p>
                        </div>
                        <button
                          onClick={() => eliminarGrupoPersonalizado(grp.id)}
                          className="text-slate-400 hover:text-rose-600 p-1"
                          title="Eliminar grupo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Permisos asignados al grupo */}
                      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-1.5 text-[11px]">
                        <span className="font-bold text-slate-700 block text-[10px] uppercase tracking-wider">
                          Permisos del Grupo:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {grp.permisos.puedePublicarAvisos && (
                            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-emerald-600" /> Publicar Avisos
                            </span>
                          )}
                          {grp.permisos.puedeVerAusencias && (
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-blue-600" /> Consultar Faltas
                            </span>
                          )}
                          {grp.permisos.puedeCrearEventos && (
                            <span className="bg-purple-50 text-purple-800 border border-purple-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-purple-600" /> Crear Eventos
                            </span>
                          )}
                          {grp.permisos.puedePublicarEncuestas && (
                            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-amber-600" /> Publicar Encuestas
                            </span>
                          )}
                          {grp.permisos.puedeRecibirMensajes && (
                            <span className="bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                              <Check className="w-3 h-3 text-slate-600" /> Recibir Consultas
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Miembros del grupo */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-700">Integrantes ({miembros.length}):</span>
                          <button
                            onClick={() => {
                              setModalMiembrosGrupoId(grp.id);
                              setUsuarioParaAgregar('');
                            }}
                            className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px] flex items-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Añadir Integrante</span>
                          </button>
                        </div>

                        {miembros.length === 0 ? (
                          <p className="text-xs text-slate-400 italic">No hay miembros en este grupo.</p>
                        ) : (
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {miembros.map((m) => (
                              <div
                                key={m.uid}
                                className="flex items-center justify-between text-xs p-1.5 bg-slate-50 rounded border border-slate-100"
                              >
                                <div>
                                  <span className="font-semibold text-slate-800">{m.nombre} {m.apellidos}</span>
                                  <span className="text-slate-400 text-[10px] ml-1.5">({m.email}) &bull; Rol: {m.rol}</span>
                                </div>
                                <button
                                  onClick={() => quitarMiembroDeGrupo(grp.id, m.uid)}
                                  className="text-slate-400 hover:text-rose-600 p-0.5"
                                  title="Quitar del grupo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA: USUARIOS Y GESTIÓN MULTIRROL */}
          {subTabConfig === 'usuarios' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-700" />
                    <span>Censo de Usuarios y Asignación de Roles</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure qué roles y accesos ostenta cada persona (padres que son del AMPA, profesores con hijos en el centro, etc.).
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {usuarios.length} usuarios registrados
                  </span>
                </div>
              </div>

              {/* Buscador de usuarios */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre, apellidos o email..."
                  value={filtroUsuarios}
                  onChange={(e) => setFiltroUsuarios(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              {/* Listado de usuarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {usuarios
                  .filter((u) => {
                    if (!filtroUsuarios.trim()) return true;
                    const q = filtroUsuarios.toLowerCase();
                    const nombreCompleto = (u.nombre + ' ' + u.apellidos).toLowerCase();
                    return nombreCompleto.includes(q) || u.email.toLowerCase().includes(q);
                  })
                  .map((u) => {
                    const rolesUsuario = u.roles && u.roles.length > 0 ? u.roles : [u.rol];
                    const esMultirrol = rolesUsuario.length > 1;

                    return (
                      <div
                        key={u.uid}
                        className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-3 ${
                          esMultirrol
                            ? 'bg-blue-50/40 border-blue-200 ring-1 ring-blue-300/40'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center shrink-0 border border-emerald-300">
                              {u.nombre.charAt(0)}{u.apellidos.charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <p className="font-bold text-slate-900 text-xs truncate">
                                {u.nombre} {u.apellidos}
                              </p>
                              <p className="text-[11px] text-slate-500 font-mono truncate">{u.email}</p>
                            </div>
                          </div>

                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0">
                            Activo: {u.rol}
                          </span>
                        </div>

                        {/* Roles asignados */}
                        <div className="space-y-1.5 pt-2 border-t border-slate-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Roles habilitados ({rolesUsuario.length}):
                            </span>
                            {esMultirrol && (
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                Multirrol
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap">
                            {rolesUsuario.map((r) => (
                              <span
                                key={r}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  r === 'ampa'
                                    ? 'bg-blue-100 text-blue-800 border-blue-200'
                                    : r === 'padre'
                                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                    : r === 'profesor'
                                    ? 'bg-purple-100 text-purple-800 border-purple-200'
                                    : r === 'admin'
                                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                                    : 'bg-slate-100 text-slate-800 border-slate-200'
                                }`}
                              >
                                {r === 'padre' && 'Familia'}
                                {r === 'ampa' && 'AMPA'}
                                {r === 'profesor' && 'Docente'}
                                {r === 'admin' && 'Dirección'}
                                {r === 'trabajador' && 'Personal'}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex justify-end">
                          <button
                            type="button"
                            onClick={() => setUsuarioRolesEditando(u)}
                            className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            <span>Configurar Roles</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA 7: ÓRGANOS EMISORES DE CIRCULARES */}
          {subTabConfig === 'emisores' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">Órganos Emisores Oficiales del Centro</h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {organosEmisores.filter((o) => o.activo).length} Activos
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Departamentos, cargos y estamentos colegiados autorizados para emitir circulares oficiales (Dirección, Secretaría, Jefatura de Estudios, etc.). En el formulario de publicación solo aparecerán los órganos marcados como activos.
                  </p>
                </div>
                <button
                  onClick={handleAbrirCrearEmisor}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nuevo Órgano Emisor</span>
                </button>
              </div>

              {/* Listado de Órganos Emisores */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {organosEmisores.map((org) => (
                  <div
                    key={org.id}
                    className={`border rounded-xl p-4 transition bg-white shadow-sm flex flex-col justify-between gap-3 ${
                      org.activo ? 'border-slate-200' : 'border-slate-200/60 bg-slate-50/70 opacity-75'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{org.nombre}</span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                              org.activo
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-500 border-slate-200'
                            }`}
                          >
                            {org.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-1.5">
                        {org.descripcion || 'Sin descripción adicional especificada.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <button
                        onClick={() => actualizarOrganoEmisor(org.id, { activo: !org.activo })}
                        className={`text-[11px] font-semibold flex items-center gap-1 transition ${
                          org.activo ? 'text-slate-500 hover:text-slate-700' : 'text-emerald-700 hover:text-emerald-800'
                        }`}
                      >
                        {org.activo ? 'Desactivar emisor' : 'Activar emisor'}
                      </button>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAbrirEditarEmisor(org)}
                          className="px-2.5 py-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded text-[11px] font-medium transition"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => eliminarOrganoEmisor(org.id)}
                          className="px-2.5 py-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded text-[11px] font-medium transition"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUB-PESTAÑA 8: CIRCULAR QR FAMILIAS */}
          {subTabConfig === 'qr' && (

        <div className="bg-white rounded-2xl shadow-sm border border-slate-300 p-6 sm:p-8 space-y-6 max-w-2xl mx-auto print:border-none print:shadow-none">
          <div className="text-center space-y-2 border-b border-slate-200 pb-5">
            <div className="inline-flex p-2.5 bg-emerald-800 text-white rounded-xl mb-1">
              <Building2 className="w-7 h-7 text-emerald-200" />
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              {centroInfo?.nombreCentro || 'CEIP El Molinillo'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Circular Oficial de Comunicación Escolar &bull; Curso Lectivo Actual
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
            <div className="p-3 bg-white border border-slate-300 rounded-2xl shadow-md">
              <QRCodeSVG value={webUrl} size={180} level="M" includeMargin={true} />
            </div>

            <div className="space-y-3 text-xs text-slate-700 text-left flex-1">
              <p className="font-bold text-slate-900 text-sm">
                Instrucciones de Instalación para Familias:
              </p>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 leading-relaxed">
                <li>Abre la cámara de tu móvil y escanea el código QR de la izquierda.</li>
                <li>
                  En <strong>Android (Chrome)</strong>, pulsa el botón directo <em>"Instalar App"</em>.
                </li>
                <li>
                  En <strong>iPhone (Safari)</strong>, pulsa <em>Compartir</em> y selecciona <em>"Añadir a pantalla de inicio"</em>.
                </li>
                <li>Activa las notificaciones oficiales para recibir avisos y autorizaciones.</li>
              </ol>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
            <span className="font-semibold text-slate-700 block">Enlace de acceso directo:</span>
            <div className="flex items-center justify-between gap-2">
              <code className="text-emerald-800 font-mono text-[11px] truncate">{webUrl}</code>
              <button
                onClick={handleCopiarEnlace}
                className="px-2.5 py-1 bg-white border border-slate-300 rounded text-slate-700 hover:bg-slate-100 font-semibold flex items-center gap-1 shrink-0"
              >
                {copiado ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiado ? 'Copiado' : 'Copiar'}</span>
              </button>
            </div>
          </div>

          <div className="flex justify-center pt-2">
            <button
              onClick={() => window.print()}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm transition"
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Circular Oficial para Familias</span>
            </button>
          </div>
        </div>

          )}

          {/* SUB-PESTAÑA 9: MUESTRA DE PERFILES EN VIVO (SIMULADOR SUPERUSUARIO) */}
          {subTabConfig === 'muestra-perfiles' && (
            <MuestraPerfilesViewer />
          )}
        </div>
      )}

      {/* =========================================================================
          MODAL: PUBLICAR CIRCULAR OFICIAL (CON EDITOR RICO TIPTAP)
         ========================================================================= */}
      {modalNuevoAviso && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-2xl rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[88vh] overflow-y-auto border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileText className="w-5 h-5 text-emerald-700" />
                <span>Publicar Circular Oficial del Centro</span>
              </div>
              <button onClick={() => setModalNuevoAviso(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Acceso a Plantillas Rápidas y Notificaciones de Emergencia */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-amber-50/80 border border-amber-200 rounded-2xl flex-wrap">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs text-slate-700 font-semibold">Plantillas y Alertas Rápidas (Piojos, Clima...)</span>
              </div>
              <button
                type="button"
                onClick={() => setModalPlantillasOpen(true)}
                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-xs transition active:scale-95 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 text-amber-200" />
                <span>Explorar Plantillas</span>
              </button>
            </div>

            <form onSubmit={handleCrearAvisoSubmit} noValidate className="space-y-3.5 text-xs">
              {avisoError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{avisoError}</span>
                </div>
              )}

              {/* Opción Circular de Emergencia / SOS */}
              <div className={`p-3 rounded-2xl border transition ${avisoEsEmergencia ? 'bg-rose-50/80 border-rose-300 shadow-xs' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${avisoEsEmergencia ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-600'}`}>
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 block text-xs">
                        Circular de Emergencia / Alerta Sanitaria
                      </span>
                      <p className="text-[11px] text-slate-500">
                        {avisoEsEmergencia
                          ? 'Prioridad urgente activada: distintivo rojo prominente y aviso prioritario a familias'
                          : 'Activar para casos de piojos, alertas meteorológicas o incidencias urgentes'}
                      </p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={avisoEsEmergencia}
                      onChange={(e) => setAvisoEsEmergencia(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título de la Circular</label>
                <input
                  type="text"
                  placeholder="ej. Organización de la jornada escolar y actividades lectivas"
                  value={avisoTitulo}
                  onChange={(e) => {
                    setAvisoTitulo(e.target.value);
                    if (avisoError) setAvisoError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-semibold text-slate-700">Órgano Emisor Autorizado</label>
                  <button
                    type="button"
                    onClick={() => {
                      setModalNuevoAviso(false);
                      setActiveTab('configuracion');
                      setSubTabConfig('emisores');
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-900 font-medium hover:underline flex items-center gap-1"
                    title="Administrar órganos emisores en la Base de Datos"
                  >
                    <SlidersHorizontal className="w-3 h-3" />
                    <span>Gestionar</span>
                  </button>
                </div>
                <select
                  value={avisoEmisor}
                  onChange={(e) => setAvisoEmisor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none text-slate-900 bg-white"
                >
                  {organosEmisores.filter((o) => o.activo).map((o) => (
                    <option key={o.id} value={o.nombre}>
                      {o.nombre}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector Múltiple de Destinatarios con Buscador y Checks */}
              <SelectorDestinatariosMulti
                cursos={cursos}
                destinatariosSeleccionados={avisoAlcances}
                onChange={setAvisoAlcances}
                label="Destinatarios de la Circular (Selección por cursos o etapas)"
              />

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Texto de la Circular (puedes pegar directamente desde Word, Google Docs o PDFs)
                </label>
                <EditorTextoEnriquecido
                  content={avisoContenido}
                  onChange={(c) => {
                    setAvisoContenido(c);
                    if (avisoError) setAvisoError(null);
                  }}
                  placeholder="Pegue aquí el texto oficial de la circular..."
                />
              </div>

              {/* Opciones de Envío y Programación temporal */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <span>Momento del Envío de la Notificación</span>
                  </span>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="tipoEnvioAviso"
                        checked={tipoEnvioAviso === 'inmediato'}
                        onChange={() => setTipoEnvioAviso('inmediato')}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <span>Enviar ahora</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="radio"
                        name="tipoEnvioAviso"
                        checked={tipoEnvioAviso === 'programado'}
                        onChange={() => setTipoEnvioAviso('programado')}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <span>Programar día y hora exacta</span>
                    </label>
                  </div>
                </div>

                {tipoEnvioAviso === 'programado' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Día de envío programado</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={fechaProgramadaAviso}
                        onChange={(e) => setFechaProgramadaAviso(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Hora exacta (HH:MM)</label>
                      <input
                        type="time"
                        value={horaProgramadaAviso}
                        onChange={(e) => setHoraProgramadaAviso(e.target.value)}
                        className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalNuevoAviso(false)}
                  className="px-3.5 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition"
                >
                  Cancelar
                </button>
                <div className="flex items-center gap-2 flex-wrap">
                  {plantillaGuardadaToast ? (
                    <span className="text-emerald-700 text-xs font-bold flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 rounded-lg animate-fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>¡Plantilla guardada!</span>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGuardarBorradorComoPlantilla}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg font-bold flex items-center gap-1.5 transition text-xs cursor-pointer"
                      title="Guardar borrador como plantilla reutilizable"
                    >
                      <BookmarkCheck className="w-4 h-4 text-amber-600" />
                      <span className="hidden sm:inline">Guardar como plantilla</span>
                      <span className="sm:hidden">Plantilla</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      if (!avisoTitulo.trim()) {
                        setAvisoError('Por favor, introduce al menos un título para previsualizar.');
                        return;
                      }
                      setAvisoError(null);
                      setModalPrevisualizarAviso(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-bold flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Previsualizar</span>
                  </button>
                  <button
                    type="submit"
                    className={`px-4 py-2 text-white font-semibold rounded-lg shadow-sm transition cursor-pointer ${
                      avisoEsEmergencia
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-emerald-700 hover:bg-emerald-800'
                    }`}
                  >
                    {avisoEsEmergencia
                      ? 'Publicar Circular de Emergencia'
                      : tipoEnvioAviso === 'programado'
                      ? 'Programar Circular'
                      : 'Publicar Circular Oficial'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PLANTILLAS PREDEFINIDAS Y CIRCULARES DE EMERGENCIA EN 1 TOQUE */}
      <ModalPlantillasCirculares
        isOpen={modalPlantillasOpen}
        onClose={() => setModalPlantillasOpen(false)}
        cursos={cursos}
        onCargarEnEditor={handleCargarPlantillaEnEditor}
        onEnviarEnUnToque={handleEnviarPlantillaEnUnToque}
      />

      {/* MODAL: PREVISUALIZACIÓN DE CIRCULAR Y NOTIFICACIÓN PUSH */}
      {modalPrevisualizarAviso && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span>Previsualización: Cómo verán las familias esta notificación</span>
              </div>
              <button onClick={() => setModalPrevisualizarAviso(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Simulación de Notificación Push en Teléfono Móvil */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                1. Notificación Push en Pantalla Bloqueada (Móvil de las Familias)
              </span>
              <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-lg border border-slate-800 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-800 flex items-center justify-center text-white shrink-0 overflow-hidden border border-emerald-600">
                  {centroInfo?.logoUrl ? (
                    <img src={centroInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-4 h-4 text-emerald-300" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-bold text-emerald-300 truncate">
                      Molinillo &bull; {avisoEmisor}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {tipoEnvioAviso === 'programado'
                        ? `${fechaProgramadaAviso} ${horaProgramadaAviso}`
                        : 'Ahora'}
                    </span>
                  </div>
                  <h5 className="font-bold text-xs text-white truncate mt-0.5">
                    {avisoTitulo || '(Sin título)'}
                  </h5>
                  <p className="text-[11px] text-slate-300 line-clamp-2 mt-0.5">
                    {avisoContenido.replace(/<[^>]*>?/gm, '') || 'Toque para abrir y leer el comunicado oficial del centro escolar.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Simulación del Documento Oficial dentro de la App */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                2. Circular Abierta dentro de Molinillo
              </span>
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between gap-2 border-b border-slate-200/80 pb-2 flex-wrap">
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-900 font-bold text-[10px]">
                    {avisoEmisor}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">
                    {avisoAlcances.includes('TODOS')
                      ? 'Toda la Comunidad Educativa'
                      : `Cursos: ${avisoAlcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ')}`}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {avisoTitulo || '(Sin título)'}
                </h4>
                <div className="text-xs text-slate-700 bg-white p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto">
                  {avisoContenido ? (
                    <ContenidoEnriquecido content={avisoContenido} />
                  ) : (
                    <p className="italic text-slate-400">Sin contenido redactado.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de Revisión Detallada de Datos */}
            <div className="space-y-1.5 pt-2">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                3. Resumen y Revisión de Datos Antes del Envío
              </span>
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Órgano Emisor:</span>
                  <span className="font-bold text-slate-800">{avisoEmisor}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200/60 items-start">
                  <span className="text-slate-500 font-medium shrink-0">Destinatarios Seleccionados:</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block">
                      {avisoAlcances.includes('TODOS')
                        ? 'Toda la Comunidad Educativa'
                        : avisoAlcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ')}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {avisoAlcances.includes('TODOS')
                        ? '9 cursos escolares &bull; ~90 familias receptoras'
                        : `${avisoAlcances.length} curso(s) seleccionado(s) &bull; ~${avisoAlcances.length * 10} familias`}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">Momento de Publicación:</span>
                  <span className="font-bold text-emerald-800">
                    {tipoEnvioAviso === 'programado'
                      ? `Programado para el ${fechaProgramadaAviso} a las ${horaProgramadaAviso}`
                      : 'Envío Inmediato a Dispositivos'}
                  </span>
                </div>
              </div>
            </div>

            {/* Acciones de Previsualización */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalPrevisualizarAviso(false)}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg text-xs transition"
              >
                Volver a editar
              </button>
              <button
                type="button"
                onClick={() => handleCrearAvisoSubmit()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-sm transition"
              >
                {tipoEnvioAviso === 'programado'
                  ? `Confirmar y Programar para ${fechaProgramadaAviso} a las ${horaProgramadaAviso}`
                  : 'Confirmar y Publicar Notificación Ahora'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: CREAR AUTORIZACIÓN / SALIDA
         ========================================================================= */}
      {modalNuevaAutorizacion && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-2xl rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[88vh] overflow-y-auto border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <FileCheck2 className="w-5 h-5 text-emerald-700" />
                <span>Nueva Autorización / Salida Escolar</span>
              </div>
              <button onClick={() => setModalNuevaAutorizacion(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearAutorizacionSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título de la Actividad</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Salida didáctica al Teatro Romano"
                  value={autTitulo}
                  onChange={(e) => setAutTitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cursos Convocados</label>
                <select
                  value={autAlcance}
                  onChange={(e) => setAutAlcance(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="TODOS">Todos los alumnos del colegio</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Detalles de la salida / Normativa (admite copiar/pegar desde Word, Docs o PDF)
                </label>
                <EditorTextoEnriquecido
                  content={autContenido}
                  onChange={setAutContenido}
                  placeholder="Escriba o pegue la información completa de la autorización..."
                />
              </div>

              <div className="border border-slate-200 rounded-xl p-3 bg-slate-50 space-y-2">
                <p className="font-semibold text-slate-800">Requisito legal de firmas:</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidadFirma"
                    checked={autTipoFirma === 'UN_PROGENITOR'}
                    onChange={() => setAutTipoFirma('UN_PROGENITOR')}
                    className="text-emerald-700"
                  />
                  <span>Firma ordinaria (Basta la firma de 1 progenitor)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="modalidadFirma"
                    checked={autTipoFirma === 'AMBOS_PROGENITORES'}
                    onChange={() => setAutTipoFirma('AMBOS_PROGENITORES')}
                    className="text-emerald-700"
                  />
                  <span>
                    Firma dual obligatoria (Requiere la firma de AMBOS progenitores en casos de padres separados)
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevaAutorizacion(false)}
                  className="px-3.5 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Publicar y Solicitar Firmas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: MATRICULAR NUEVO ALUMNO (CON MÁS DE 2 PROGENITORES DINÁMICOS)
         ========================================================================= */}
      {modalNuevoAlumno && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[88vh] overflow-y-auto border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <UserPlus className="w-5 h-5 text-emerald-700" />
                <span>Matricular Alumno en CEIP El Molinillo</span>
              </div>
              <button onClick={() => setModalNuevoAlumno(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearAlumnoSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nombre del Alumno/a</label>
                  <input
                    type="text"
                    required
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    placeholder="ej. Daniel"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Apellidos</label>
                  <input
                    type="text"
                    required
                    value={nuevoApellidos}
                    onChange={(e) => setNuevoApellidos(e.target.value)}
                    placeholder="ej. Navarro López"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Asignado</label>
                <select
                  value={nuevoCursoId}
                  onChange={(e) => setNuevoCursoId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                >
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} (Tutor: {c.tutorNombre || 'Sin asignar'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Régimen Familiar */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-amber-950">
                  <input
                    type="checkbox"
                    checked={nuevoPadresSeparados}
                    onChange={(e) => setNuevoPadresSeparados(e.target.checked)}
                    className="rounded text-amber-700 focus:ring-amber-600"
                  />
                  <span>Progenitores separados / Custodia compartida</span>
                </label>
                <p className="text-[11px] text-amber-800">
                  Activa canales de tutoría independientes para cada progenitor y permite exigir doble firma.
                </p>
              </div>

              {/* Lista dinámica de progenitores (soporta más de 2) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-xs">
                    Progenitores y Tutores Legales ({listaProgenitores.length})
                  </span>
                  <button
                    type="button"
                    onClick={agregarFilaProgenitor}
                    className="text-emerald-700 hover:text-emerald-800 font-semibold text-xs flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir otro progenitor</span>
                  </button>
                </div>

                {listaProgenitores.map((prog, index) => (
                  <div
                    key={index}
                    className="border border-slate-200 rounded-xl p-3.5 space-y-2 bg-slate-50 relative"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-700 text-[11px]">
                        Progenitor / Tutor {index + 1}
                      </span>
                      {listaProgenitores.length > 1 && (
                        <button
                          type="button"
                          onClick={() => eliminarFilaProgenitor(index)}
                          className="text-slate-400 hover:text-red-600 text-xs"
                        >
                          Eliminar
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        required={index === 0}
                        placeholder="Nombre"
                        value={prog.nombre}
                        onChange={(e) => {
                          const val = e.target.value;
                          setListaProgenitores((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, nombre: val } : item))
                          );
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Apellidos"
                        value={prog.apellidos}
                        onChange={(e) => {
                          const val = e.target.value;
                          setListaProgenitores((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, apellidos: val } : item))
                          );
                        }}
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <input
                        type="email"
                        required={index === 0}
                        placeholder="Correo electrónico"
                        value={prog.email}
                        onChange={(e) => {
                          const val = e.target.value;
                          setListaProgenitores((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, email: val } : item))
                          );
                        }}
                        className="col-span-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                      />
                      <select
                        value={prog.parentesco}
                        onChange={(e: any) => {
                          const val = e.target.value;
                          setListaProgenitores((prev) =>
                            prev.map((item, i) => (i === index ? { ...item, parentesco: val } : item))
                          );
                        }}
                        className="px-2 py-1.5 border border-slate-300 rounded-lg text-xs"
                      >
                        <option value="madre">Madre</option>
                        <option value="padre">Padre</option>
                        <option value="tutor_legal">Tutor Legal</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>

                    <input
                      type="tel"
                      placeholder="Teléfono móvil de contacto"
                      value={prog.telefono}
                      onChange={(e) => {
                        const val = e.target.value;
                        setListaProgenitores((prev) =>
                          prev.map((item, i) => (i === index ? { ...item, telefono: val } : item))
                        );
                      }}
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoAlumno(false)}
                  className="px-3.5 py-2 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg shadow-sm transition"
                >
                  Confirmar Matrícula
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: AÑADIR CURSO
         ========================================================================= */}
      {modalNuevoCurso && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-sm rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Crear Curso Escolar</h3>
              <button onClick={() => setModalNuevoCurso(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearCursoSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código Identificador</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 4A o INF-5"
                  value={cId}
                  onChange={(e) => setCId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. 4º Educación Primaria A"
                  value={cNombre}
                  onChange={(e) => setCNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nivel Educativo</label>
                <select
                  value={cNivel}
                  onChange={(e: any) => setCNivel(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  <option value="Infantil">Educación Infantil</option>
                  <option value="Primaria">Educación Primaria</option>
                  <option value="Secundaria">Educación Secundaria</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Docente Tutor</label>
                <input
                  type="text"
                  placeholder="ej. Dña. Tutora 1"
                  value={cTutor}
                  onChange={(e) => setCTutor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoCurso(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition"
                >
                  Guardar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: ALTA DE PROFESOR
         ========================================================================= */}
      {modalNuevoProfesor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-sm rounded-3xl shadow-2xl p-5 sm:p-6 space-y-4 my-auto border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">Alta de Docente en el Claustro</h3>
              <button onClick={() => setModalNuevoProfesor(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearProfesorSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Alejandro"
                  value={profNombre}
                  onChange={(e) => setProfNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Apellidos</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Benítez Sanz"
                  value={profApellidos}
                  onChange={(e) => setProfApellidos(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Oficial del Docente</label>
                <input
                  type="email"
                  required
                  placeholder="ej. alejandro.benitez@santamariadelbuenaire.es"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Curso Asignado</label>
                <select
                  value={profCursos[0]}
                  onChange={(e) => setProfCursos([e.target.value])}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                >
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoProfesor(false)}
                  className="px-3 py-1.5 text-slate-600 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold rounded-lg transition"
                >
                  Confirmar Alta Docente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL: IMPORTADOR EXCEL / CSV
         ========================================================================= */}
      {modalImportarExcel && (
        <ImportadorExcelModal
          onImportar={importarAlumnosMasivo}
          onClose={() => setModalImportarExcel(false)}
        />
      )}

      {/* =========================================================================
          MODAL: LISTA OFICIAL DE PASAJEROS AUTOCAR
         ========================================================================= */}
      {modalListaExcursionAvisoId && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-2xl rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[88vh] overflow-y-auto print:border-none print:shadow-none border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Lista Oficial de Alumnos Autorizados para el Autocar
                </h3>
                <p className="text-xs text-slate-500">
                  {centroInfo?.nombreCentro || 'CEIP El Molinillo'} &bull; Expediente validado
                </p>
              </div>
              <button
                onClick={() => setModalListaExcursionAvisoId(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="p-3">#</th>
                    <th className="p-3">Alumno</th>
                    <th className="p-3">Curso</th>
                    <th className="p-3">Estado Legal</th>
                    <th className="p-3">DNI de Progenitores Firmantes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {firmas
                    .filter((f) => f.avisoId === modalListaExcursionAvisoId)
                    .map((exp, idx) => (
                      <tr key={exp.id} className="hover:bg-slate-50">
                        <td className="p-3 text-slate-400">{idx + 1}</td>
                        <td className="p-3 font-bold text-slate-900">{exp.alumnoNombre}</td>
                        <td className="p-3">{exp.cursoId}</td>
                        <td className="p-3">
                          {exp.estado === 'completada' ? (
                            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded text-[11px]">
                              Apto / Autorizado
                            </span>
                          ) : (
                            <span className="text-red-700 font-bold bg-red-50 px-2 py-0.5 rounded text-[11px]">
                              No Autorizado
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-slate-600">
                          {exp.firmas.map((f) => `${f.progenitorNombre} (${f.progenitorDni})`).join(', ') || 'Pendiente'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-[11px] text-slate-400">
                Documento de control para el profesorado responsable de la actividad.
              </span>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir Listado</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVA ENCUESTA */}
      {modalNuevaEncuesta && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-[calc(100%-20px)] max-w-lg rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[88vh] overflow-y-auto text-xs border border-slate-200 animate-modal-popup">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Vote className="w-5 h-5 text-emerald-700" />
                <span>Crear Nueva Encuesta Escolar</span>
              </div>
              <button onClick={() => setModalNuevaEncuesta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearEncuestaSubmit} noValidate className="space-y-3.5">
              {encError && (
                <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{encError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Pregunta Principal</label>
                <input
                  type="text"
                  placeholder="ej. ¿Prefieren festival en horario de mañana o de tarde?"
                  value={encPregunta}
                  onChange={(e) => {
                    setEncPregunta(e.target.value);
                    if (encError) setEncError(null);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Contexto (Opcional)</label>
                <input
                  type="text"
                  placeholder="ej. Para conciliar con los horarios laborales de las familias..."
                  value={encDescripcion}
                  onChange={(e) => setEncDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none text-slate-900 bg-white"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1.5">Opciones de Respuesta</label>
                <div className="space-y-2">
                  {encOpciones.map((op, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Opción ${idx + 1}`}
                        value={op}
                        onChange={(e) => {
                          const nuevas = [...encOpciones];
                          nuevas[idx] = e.target.value;
                          setEncOpciones(nuevas);
                          if (encError) setEncError(null);
                        }}
                        className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                      />
                      {encOpciones.length > 2 && (
                        <button
                          type="button"
                          onClick={() => setEncOpciones(encOpciones.filter((_, i) => i !== idx))}
                          className="px-2 text-slate-400 hover:text-rose-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setEncOpciones([...encOpciones, ''])}
                    className="text-emerald-700 hover:text-emerald-900 font-semibold text-[11px] flex items-center gap-1 mt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Añadir otra opción</span>
                  </button>
                </div>
              </div>

              {/* Selector Múltiple de Cursos para la Encuesta */}
              <SelectorDestinatariosMulti
                cursos={cursos}
                destinatariosSeleccionados={encAlcances}
                onChange={setEncAlcances}
                label="Destinatarios de la Encuesta (Cursos con derecho a voto)"
              />

              <div className="pt-1">
                <label className="block font-semibold text-slate-700 mb-1">Duración (Días abierta)</label>
                <input
                  type="number"
                  min={1}
                  max={60}
                  value={encDiasCierre}
                  onChange={(e) => setEncDiasCierre(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                />
              </div>

              <div className="space-y-2 pt-1 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={encEsMultiple}
                    onChange={(e) => setEncEsMultiple(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Permitir seleccionar varias opciones (Respuesta Múltiple)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={encResultadosPublicos}
                    onChange={(e) => setEncResultadosPublicos(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Resultados visibles para las familias tras emitir su voto</span>
                </label>
              </div>

              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 flex-wrap">
                <button
                  type="button"
                  onClick={() => setModalNuevaEncuesta(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (!encPregunta.trim()) {
                        setEncError('Por favor, indica al menos la pregunta principal para previsualizar.');
                        return;
                      }
                      setEncError(null);
                      setModalPrevisualizarEncuesta(true);
                    }}
                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 rounded-lg font-bold flex items-center gap-1.5 transition"
                  >
                    <Eye className="w-4 h-4 text-indigo-600" />
                    <span>Previsualizar</span>
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition"
                  >
                    Publicar Encuesta
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PREVISUALIZAR ENCUESTA */}
      {modalPrevisualizarEncuesta && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 my-8 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Eye className="w-5 h-5 text-indigo-600" />
                <span>Previsualización: Cómo responderán las familias</span>
              </div>
              <button onClick={() => setModalPrevisualizarEncuesta(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between text-[11px] flex-wrap gap-2">
                <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                  {encAlcances.includes('TODOS')
                    ? 'Toda la Comunidad Educativa'
                    : `Cursos: ${encAlcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ')}`}
                </span>
                <span className="text-slate-500 font-medium">
                  {encEsMultiple ? 'Respuesta Múltiple' : 'Opción Única'} &bull; Abierta {encDiasCierre} días
                </span>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  {encPregunta || '(Sin pregunta)'}
                </h4>
                {encDescripcion && (
                  <p className="text-slate-600 text-xs mt-1">
                    {encDescripcion}
                  </p>
                )}
              </div>

              <div className="space-y-2 pt-1">
                {encOpciones.filter((o) => o.trim()).map((op, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-slate-200 bg-white flex items-center gap-2.5 font-medium text-slate-800"
                  >
                    <div className="w-4 h-4 rounded-full border-2 border-slate-400 flex items-center justify-center" />
                    <span>{op}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Resumen de Revisión Final para la Encuesta */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-200/60 items-start">
                <span className="text-slate-500 font-medium shrink-0">Cursos con Voto Autorizado:</span>
                <div className="text-right">
                  <span className="font-bold text-slate-800 block">
                    {encAlcances.includes('TODOS')
                      ? 'Toda la Comunidad Educativa'
                      : encAlcances.map((id) => cursos.find((c) => c.id === id)?.nombre || id).join(', ')}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {encAlcances.includes('TODOS')
                      ? '9 cursos escolares &bull; ~90 familias votantes'
                      : `${encAlcances.length} curso(s) seleccionado(s) &bull; ~${encAlcances.length * 10} familias`}
                  </span>
                </div>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Modalidad de Voto:</span>
                <span className="font-semibold text-slate-800">
                  {encEsMultiple ? 'Múltiples opciones por familia' : 'Una sola opción por familia'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Visibilidad de Resultados:</span>
                <span className="font-semibold text-slate-800">
                  {encResultadosPublicos ? 'Públicos para las familias tras votar' : 'Privados (solo dirección)'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalPrevisualizarEncuesta(false)}
                className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-lg transition"
              >
                Volver a editar
              </button>
              <button
                type="button"
                onClick={() => handleCrearEncuestaSubmit()}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm transition"
              >
                Confirmar y Publicar Encuesta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO EVENTO ESCOLAR */}
      {modalNuevoEvento && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>Publicar Evento en Calendario Escolar</span>
              </div>
              <button onClick={() => setModalNuevoEvento(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearEventoSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Evento</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Reunión de Familias 1º Trimestre o Excursión al Parque"
                  value={evtTitulo}
                  onChange={(e) => setEvtTitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Detalles sobre el horario, materiales necesarios o agenda..."
                  value={evtDescripcion}
                  onChange={(e) => setEvtDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha y Hora de Inicio</label>
                  <input
                    type="datetime-local"
                    required
                    value={evtFechaInicio}
                    onChange={(e) => setEvtFechaInicio(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Fecha y Hora de Fin</label>
                  <input
                    type="datetime-local"
                    value={evtFechaFin}
                    onChange={(e) => setEvtFechaFin(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Evento</label>
                  <select
                    value={evtTipo}
                    onChange={(e) => setEvtTipo(e.target.value as TipoEventoEscolar)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="reunion">Reunión con Familias</option>
                    <option value="excursion">Excursión / Salida</option>
                    <option value="festival">Festival / Celebración</option>
                    <option value="festivo">Día No Lectivo / Festivo</option>
                    <option value="taller">Taller formativo</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Ubicación</label>
                  <input
                    type="text"
                    placeholder="ej. Salón de actos o Aula de Infantil"
                    value={evtUbicacion}
                    onChange={(e) => setEvtUbicacion(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Alcance</label>
                <select
                  value={evtAlcance}
                  onChange={(e) => setEvtAlcance(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  <option value="TODOS">Toda la Comunidad Educativa</option>
                  {cursos.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoEvento(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Guardar y Publicar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO RECURSO O ENLACE EXTERNO */}
      {modalNuevoRecurso && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <ExternalLink className="w-5 h-5 text-emerald-700" />
                <span>Añadir Enlace Oficial Externo</span>
              </div>
              <button onClick={() => setModalNuevoRecurso(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearRecursoSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Título del Enlace</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Calendario Escolar Oficial o Web AMPA"
                  value={recTitulo}
                  onChange={(e) => setRecTitulo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">URL / Enlace Web</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... o https://..."
                  value={recUrl}
                  onChange={(e) => setRecUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción Breve</label>
                <input
                  type="text"
                  placeholder="ej. Consulta festivos y jornadas lectivas del curso..."
                  value={recDescripcion}
                  onChange={(e) => setRecDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={recCategoria}
                    onChange={(e) => setRecCategoria(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="secretaria">Secretaría Virtual</option>
                    <option value="ampa">AMPA / Familias</option>
                    <option value="servicios">Servicios y Actividades</option>
                    <option value="general">Información General</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Icono</label>
                  <select
                    value={recIcono}
                    onChange={(e) => setRecIcono(e.target.value as any)}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg"
                  >
                    <option value="utensils">Cubiertos / Menú</option>
                    <option value="globe">Globo / Web</option>
                    <option value="file-text">Documento / Trámite</option>
                    <option value="calendar">Calendario</option>
                    <option value="external-link">Enlace estándar</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoRecurso(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Guardar Enlace
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: NUEVO GRUPO PERSONALIZADO */}
      {modalNuevoGrupo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Shield className="w-5 h-5 text-emerald-700" />
                <span>Crear Nuevo Colectivo o Grupo Personalizado</span>
              </div>
              <button onClick={() => setModalNuevoGrupo(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCrearGrupoSubmit} className="space-y-3.5">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Grupo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Monitores de Aula Matinal, Delegados de Aula o Comisión de Biblioteca"
                  value={grpNombre}
                  onChange={(e) => setGrpNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Función del Colectivo</label>
                <input
                  type="text"
                  placeholder="ej. Personal no docente encargado del aula matinal y talleres de tarde..."
                  value={grpDescripcion}
                  onChange={(e) => setGrpDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                />
              </div>

              {/* Matriz de Permisos del Grupo */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="font-bold text-slate-800 block text-xs">
                  Permisos Necesarios Concedidos a los Integrantes:
                </span>

                <div className="space-y-1.5 pt-1">
                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={grpPermisos.puedePublicarAvisos}
                      onChange={(e) => setGrpPermisos({ ...grpPermisos, puedePublicarAvisos: e.target.checked })}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>Puede emitir comunicados oficiales y avisos al muro del colegio</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={grpPermisos.puedeVerAusencias}
                      onChange={(e) => setGrpPermisos({ ...grpPermisos, puedeVerAusencias: e.target.checked })}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>Puede consultar ausencias, retrasos y dietas de alumnos</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={grpPermisos.puedeCrearEventos}
                      onChange={(e) => setGrpPermisos({ ...grpPermisos, puedeCrearEventos: e.target.checked })}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>Puede publicar eventos escolares en el calendario sincronizable (.ics)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={grpPermisos.puedePublicarEncuestas}
                      onChange={(e) => setGrpPermisos({ ...grpPermisos, puedePublicarEncuestas: e.target.checked })}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>Puede crear encuestas y votaciones dirigidas a familias</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-slate-700">
                    <input
                      type="checkbox"
                      checked={grpPermisos.puedeRecibirMensajes}
                      onChange={(e) => setGrpPermisos({ ...grpPermisos, puedeRecibirMensajes: e.target.checked })}
                      className="rounded text-emerald-700 focus:ring-emerald-600"
                    />
                    <span>Dispone de buzón oficial para recibir mensajes directos de familias</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoGrupo(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Guardar y Crear Grupo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AÑADIR INTEGRANTE AL GRUPO */}
      {modalMiembrosGrupoId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="font-bold text-slate-900 text-sm">Añadir Integrante al Grupo</span>
              <button onClick={() => setModalMiembrosGrupoId(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-500">
              Seleccione cualquier usuario registrado para asignarle este colectivo y sus permisos asociados:
            </p>

            <select
              value={usuarioParaAgregar}
              onChange={(e) => setUsuarioParaAgregar(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs"
            >
              <option value="">-- Seleccionar usuario --</option>
              {usuarios.map((u) => (
                <option key={u.uid} value={u.uid}>
                  {u.nombre} {u.apellidos} ({u.email}) - Rol: {u.rol}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setModalMiembrosGrupoId(null)}
                className="px-3 py-1.5 text-slate-600 hover:text-slate-800 font-semibold"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!usuarioParaAgregar}
                onClick={() => {
                  if (usuarioParaAgregar && modalMiembrosGrupoId) {
                    agregarMiembroAGrupo(modalMiembrosGrupoId, usuarioParaAgregar);
                    setModalMiembrosGrupoId(null);
                  }
                }}
                className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white rounded-lg font-semibold transition"
              >
                Añadir Integrante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PERMISOS ESPECÍFICOS POR PROGENITOR */}
      {modalPermisosProgenitorUid && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <Key className="w-4 h-4 text-emerald-700" />
                <span>Permisos Específicos: {modalPermisosProgenitorNombre}</span>
              </div>
              <button onClick={() => setModalPermisosProgenitorUid(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-slate-600">
              Asigne permisos adicionales a este padre o madre (ej. si ostenta cargo de <strong>Delegado/a de Aula</strong> o miembro de una comisión) sin necesidad de cambiar su rol familiar:
            </p>

            <form onSubmit={handleGuardarPermisosProgenitorSubmit} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!permisosProgenitorTemp.puedePublicarAvisos}
                    onChange={(e) =>
                      setPermisosProgenitorTemp({ ...permisosProgenitorTemp, puedePublicarAvisos: e.target.checked })
                    }
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Permitir publicar avisos en el muro de su clase/curso</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!permisosProgenitorTemp.puedeCrearEventos}
                    onChange={(e) =>
                      setPermisosProgenitorTemp({ ...permisosProgenitorTemp, puedeCrearEventos: e.target.checked })
                    }
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Permitir crear eventos escolares en el calendario</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-800">
                  <input
                    type="checkbox"
                    checked={!!permisosProgenitorTemp.puedePublicarEncuestas}
                    onChange={(e) =>
                      setPermisosProgenitorTemp({ ...permisosProgenitorTemp, puedePublicarEncuestas: e.target.checked })
                    }
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Permitir lanzar encuestas y votaciones al aula</span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalPermisosProgenitorUid(null)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  Guardar Permisos del Progenitor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREAR / EDITAR ÓRGANO EMISOR */}
      {modalNuevoEmisor && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                <FileSignature className="w-5 h-5 text-emerald-700" />
                <span>{emisorEditandoId ? 'Editar Órgano Emisor' : 'Nuevo Órgano Emisor'}</span>
              </div>
              <button onClick={() => setModalNuevoEmisor(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGuardarEmisorSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Órgano o Cargo</label>
                <input
                  type="text"
                  required
                  placeholder="ej. Jefatura de Estudios, Gabinete de Orientación..."
                  value={emisorNombre}
                  onChange={(e) => setEmisorNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Cometido Oficial</label>
                <textarea
                  rows={2}
                  placeholder="ej. Comunicaciones relativas a normas de convivencia, apoyo escolar o salidas..."
                  value={emisorDescripcion}
                  onChange={(e) => setEmisorDescripcion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none resize-none"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
                  <input
                    type="checkbox"
                    checked={emisorActivo}
                    onChange={(e) => setEmisorActivo(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-700 focus:ring-emerald-600 w-4 h-4"
                  />
                  <span>Habilitado como órgano emisor activo en circulares</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalNuevoEmisor(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg font-semibold hover:bg-slate-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-semibold shadow-sm transition"
                >
                  {emisorEditandoId ? 'Guardar Cambios' : 'Añadir Órgano'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GESTIÓN DE ROLES DEL USUARIO */}
      <ModalGestionRolesUsuario
        isOpen={!!usuarioRolesEditando}
        onClose={() => setUsuarioRolesEditando(null)}
        usuario={usuarioRolesEditando}
        onGuardarRoles={(uid, roles) => {
          actualizarRolesUsuario(uid, roles);
          setUsuarioRolesEditando(null);
        }}
      />
    </div>
  );
};

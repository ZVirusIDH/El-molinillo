import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Building2,
  Phone,
  Mail,
  MapPin,
  Clock,
  ShieldCheck,
  X,
  Users,
  Search,
  ExternalLink,
  SlidersHorizontal,
  GraduationCap,
  Award,
} from 'lucide-react';

export const ModalDatosCentro: React.FC = () => {
  const {
    centroInfo,
    modalDatosCentroOpen,
    setModalDatosCentroOpen,
    usuarios,
    cursos,
    currentUser,
  } = useApp();

  const [filtroTexto, setFiltroTexto] = useState('');
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState<'todos' | 'directivo' | 'infantil' | 'primaria' | 'especialistas'>('todos');

  if (!modalDatosCentroOpen) return null;

  const vis = centroInfo?.visibilidad || {
    mostrarDireccion: true,
    mostrarTelefono: true,
    mostrarEmail: true,
    mostrarHorarioAtencion: true,
    mostrarClaustro: true,
    mostrarEmailsProfesores: false,
    profesoresOcultos: [],
    cargosPersonalizados: {},
  };

  const profesoresOcultosSet = new Set(vis.profesoresOcultos || []);

  // Lista de docentes activos
  const docentes = usuarios.filter((u) => (u.rol === 'profesor' || u.rol === 'admin') && u.activo);

  // Mapear cada docente con su cargo oficial y cursos
  const plantilla = docentes.map((doc) => {
    const cargoAsignado = vis.cargosPersonalizados?.[doc.uid] || (
      doc.rol === 'admin'
        ? 'Dirección y Jefatura de Estudios'
        : doc.cursos && doc.cursos.length > 0
        ? `Tutor/a de ${doc.cursos.map((cId) => cursos.find((c) => c.id === cId)?.nombre || cId).join(', ')}`
        : 'Profesor/a Especialista'
    );

    // Cursos con nombres amigables
    const cursosNombres = (doc.cursos || []).map((cId) => {
      const c = cursos.find((item) => item.id === cId);
      return c ? c.nombre : cId;
    });

    const esDirectivo =
      doc.rol === 'admin' ||
      cargoAsignado.toLowerCase().includes('director') ||
      cargoAsignado.toLowerCase().includes('estudios') ||
      cargoAsignado.toLowerCase().includes('secretar');

    const esInfantil =
      doc.cursos?.some((c) => c.startsWith('I')) ||
      cargoAsignado.toLowerCase().includes('infantil');

    const esPrimaria =
      doc.cursos?.some((c) => c.includes('P')) ||
      cargoAsignado.toLowerCase().includes('primaria');

    const esEspecialista =
      !esInfantil && !esPrimaria ||
      cargoAsignado.toLowerCase().includes('música') ||
      cargoAsignado.toLowerCase().includes('física') ||
      cargoAsignado.toLowerCase().includes('inglés') ||
      cargoAsignado.toLowerCase().includes('terapéutica') ||
      cargoAsignado.toLowerCase().includes('lenguaje') ||
      cargoAsignado.toLowerCase().includes('apoyo');

    return {
      uid: doc.uid,
      nombre: doc.nombre,
      apellidos: doc.apellidos,
      email: doc.email,
      fotoUrl: doc.fotoUrl,
      cargo: cargoAsignado,
      cursosNombres,
      esDirectivo,
      esInfantil,
      esPrimaria,
      esEspecialista,
      estaOculto: profesoresOcultosSet.has(doc.uid),
    };
  });

  // Filtrar según visibilidad pública y buscador
  const docentesVisibles = plantilla.filter((d) => {
    // Si la administración lo marcó como oculto, no sale en la ficha pública
    if (d.estaOculto) return false;

    // Filtro por categoría
    if (categoriaSeleccionada === 'directivo' && !d.esDirectivo) return false;
    if (categoriaSeleccionada === 'infantil' && !d.esInfantil) return false;
    if (categoriaSeleccionada === 'primaria' && !d.esPrimaria) return false;
    if (categoriaSeleccionada === 'especialistas' && !d.esEspecialista) return false;

    // Filtro por texto
    if (filtroTexto.trim()) {
      const q = filtroTexto.toLowerCase();
      const matchNombre = `${d.nombre} ${d.apellidos}`.toLowerCase().includes(q);
      const matchCargo = d.cargo.toLowerCase().includes(q);
      const matchCurso = d.cursosNombres.some((cn) => cn.toLowerCase().includes(q));
      return matchNombre || matchCargo || matchCurso;
    }

    return true;
  });

  const tieneCanalesVisibles =
    (vis.mostrarDireccion !== false && centroInfo?.direccion) ||
    (vis.mostrarTelefono !== false && centroInfo?.telefono) ||
    (vis.mostrarEmail !== false && centroInfo?.email) ||
    (vis.mostrarHorarioAtencion !== false && centroInfo?.horarioAtencion);

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100%-20px)] max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] border border-slate-200 animate-modal-popup my-auto">
        
        {/* CABECERA INSTITUCIONAL */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-5 sm:p-6 relative shrink-0">
          <button
            onClick={() => setModalDatosCentroOpen(false)}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-emerald-950/50 hover:bg-emerald-950 text-emerald-200 hover:text-white transition"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-1.5 shadow-md border-2 border-emerald-400/40 flex items-center justify-center shrink-0 overflow-hidden">
              {centroInfo?.logoUrl ? (
                <img
                  src={centroInfo.logoUrl}
                  alt="Escudo Oficial del Colegio"
                  className="w-full h-full object-contain"
                />
              ) : (
                <Building2 className="w-10 h-10 text-emerald-700" />
              )}
            </div>

            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-200 border border-emerald-600/70">
                  Ficha Oficial del Centro
                </span>
                <span className="text-[11px] font-medium text-emerald-200 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  RGPD Verificado
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-white truncate">
                {centroInfo?.nombreCentro || 'CEIP El Molinillo'}
              </h2>
              <p className="text-xs text-emerald-100 font-mono">
                Código Oficial de Centro: <strong className="text-white">{centroInfo?.codigoCentro || '00000000'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="p-5 sm:p-6 space-y-6 overflow-y-auto text-xs text-slate-700">

          {/* SECCIÓN 1: CANALES OFICIALES DE ATENCIÓN Y CONTACTO */}
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-700" />
              <span>Canales de Atención al Ciudadano y Familias</span>
            </h3>

            {tieneCanalesVisibles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Dirección física */}
                {vis.mostrarDireccion !== false && centroInfo?.direccion && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px]">Dirección Postal</span>
                      <p className="text-slate-600 leading-snug">{centroInfo.direccion}</p>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          (centroInfo.nombreCentro || 'Colegio') + ' ' + centroInfo.direccion
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium mt-1 hover:underline"
                      >
                        <span>Ver en Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                )}

                {/* Teléfono */}
                {vis.mostrarTelefono !== false && centroInfo?.telefono && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px]">Teléfono de Secretaría</span>
                      <a
                        href={`tel:${centroInfo.telefono.replace(/\s+/g, '')}`}
                        className="text-emerald-800 font-bold hover:underline block text-xs mt-0.5"
                      >
                        {centroInfo.telefono}
                      </a>
                      <span className="text-[10px] text-slate-500">Atención telefónica directa</span>
                    </div>
                  </div>
                )}

                {/* Email institucional */}
                {vis.mostrarEmail !== false && centroInfo?.email && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px]">Correo Electrónico Oficial</span>
                      <a
                        href={`mailto:${centroInfo.email}`}
                        className="text-emerald-800 font-semibold hover:underline block text-xs truncate mt-0.5"
                      >
                        {centroInfo.email}
                      </a>
                      <span className="text-[10px] text-slate-500">Buzón de Secretaría y Trámites</span>
                    </div>
                  </div>
                )}

                {/* Horario de secretaría */}
                {vis.mostrarHorarioAtencion !== false && centroInfo?.horarioAtencion && (
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block text-[11px]">Horario de Atención Presencial</span>
                      <p className="text-slate-600 leading-snug">{centroInfo.horarioAtencion}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-center text-xs">
                La dirección del centro mantiene los canales externos reservados. Para cualquier consulta, utilice las comunicaciones y circulares internas de la plataforma.
              </div>
            )}
          </div>

          {/* SECCIÓN 2: LISTADO DE PROFESORES Y CARGOS DEL COLEGIO */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-700" />
                  <span>Claustro de Profesores y Cargos del Colegio</span>
                </h3>
                <p className="text-slate-500 text-[11px]">
                  Equipo directivo, coordinadores y tutores docentes del centro educativo.
                </p>
              </div>

              {vis.mostrarClaustro !== false && (
                <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 self-start sm:self-auto">
                  {docentesVisibles.length} docentes visibles
                </span>
              )}
            </div>

            {vis.mostrarClaustro === false ? (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                <strong>Claustro reservado por la administración:</strong> La consulta del claustro y cargos docentes está configurada para atención presencial en secretaría escolar.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Buscador y Filtros por Etapa/Cargo */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Buscar por nombre, apellidos, cargo o curso..."
                      value={filtroTexto}
                      onChange={(e) => setFiltroTexto(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {(
                      [
                        { id: 'todos', label: 'Todos' },
                        { id: 'directivo', label: 'Equipo Directivo' },
                        { id: 'infantil', label: 'Infantil' },
                        { id: 'primaria', label: 'Primaria' },
                        { id: 'especialistas', label: 'Especialistas' },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategoriaSeleccionada(cat.id)}
                        className={`px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition ${
                          categoriaSeleccionada === cat.id
                            ? 'bg-emerald-800 text-white shadow-sm'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Lista de Profesores y Cargos */}
                {docentesVisibles.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {docentesVisibles.map((doc) => (
                      <div
                        key={doc.uid}
                        className="p-3 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 bg-white transition shadow-xs flex items-start gap-3"
                      >
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-emerald-100 border border-emerald-300 flex items-center justify-center shrink-0">
                          {doc.fotoUrl ? (
                            <img src={doc.fotoUrl} alt={doc.nombre} className="w-full h-full object-cover" />
                          ) : (
                            <span className="font-bold text-xs text-emerald-900">
                              {doc.nombre.charAt(0)}{doc.apellidos.charAt(0)}
                            </span>
                          )}
                        </div>

                        {/* Datos del docente */}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-bold text-slate-900 text-xs truncate">
                              {doc.nombre} {doc.apellidos}
                            </span>
                            {doc.esDirectivo && (
                              <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800 border border-indigo-200 flex items-center gap-0.5">
                                <Award className="w-2.5 h-2.5 text-indigo-700" />
                                Cargo
                              </span>
                            )}
                          </div>

                          <div className="text-[11px] font-semibold text-emerald-800 leading-tight">
                            {doc.cargo}
                          </div>

                          {doc.cursosNombres.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] text-slate-500 pt-0.5">
                              <GraduationCap className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{doc.cursosNombres.join(', ')}</span>
                            </div>
                          )}

                          {vis.mostrarEmailsProfesores && doc.email && (
                            <div className="pt-1">
                              <a
                                href={`mailto:${doc.email}`}
                                className="text-[10px] text-emerald-700 hover:underline inline-flex items-center gap-1 font-medium"
                              >
                                <Mail className="w-3 h-3" />
                                <span className="truncate">{doc.email}</span>
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
                    No se han encontrado docentes ni cargos con ese criterio de búsqueda.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PIE DEL MODAL */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>Datos protegidos y validados según la normativa RGPD escolar</span>
          </div>

          <div className="flex items-center gap-2">
            {currentUser.rol === 'admin' && (
              <span className="text-[11px] text-indigo-700 font-semibold flex items-center gap-1 mr-2">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Configurable en Pestaña Configuración</span>
              </span>
            )}

            <button
              type="button"
              onClick={() => setModalDatosCentroOpen(false)}
              className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              Cerrar Ficha
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

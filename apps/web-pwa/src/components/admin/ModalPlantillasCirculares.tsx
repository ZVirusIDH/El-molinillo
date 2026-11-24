import React, { useState, useEffect } from 'react';
import {
  X,
  Zap,
  AlertTriangle,
  FileText,
  Search,
  Check,
  Trash2,
  Send,
  Plus,
  Sparkles,
  CloudRain,
  ShieldAlert,
  Clock,
  Utensils,
  FolderOpen,
  ArrowRight,
  BookmarkCheck,
} from 'lucide-react';
import { Curso, PrioridadAviso } from '@molinillo/shared';

export interface PlantillaCircular {
  id: string;
  titulo: string;
  categoria: 'sanitaria' | 'clima' | 'organizativa' | 'convivencia' | 'general';
  categoriaEtiqueta: string;
  esEmergencia: boolean;
  prioridad: PrioridadAviso;
  alcances: string[];
  contenido: string;
  descripcionCorta: string;
  esPersonalizada?: boolean;
}

export const PLANTILLAS_PREDEFINIDAS_BASE: PlantillaCircular[] = [
  {
    id: 'plantilla-piojos',
    titulo: 'Alerta Sanitaria: Detección de piojos (Pediculosis) en el colegio',
    categoria: 'sanitaria',
    categoriaEtiqueta: 'Alerta Sanitaria',
    esEmergencia: true,
    prioridad: 'urgente',
    alcances: ['TODOS'],
    descripcionCorta: 'Protocolo urgente de revisión capilar y tratamiento para frenar contagios en el centro escolar.',
    contenido: `<p>Estimadas familias:</p><p>Les comunicamos que se han detectado varios casos de <strong>pediculosis (piojos)</strong> en las aulas. Les rogamos encarecidamente que procedan a <strong>revisar minuciosamente la cabeza de sus hijos/as</strong> en sus domicilios hoy mismo.</p><ul><li>Si detectan liendres o piojos, apliquen de inmediato un tratamiento pediculicida específico de farmacia.</li><li>El alumnado afectado no deberá acudir al colegio hasta haber completado el tratamiento y comprobado la desaparición total de parásitos.</li><li>Revisen periódicamente a toda la unidad familiar y recojan el cabello largo para evitar contagios.</li></ul><p>Agradecemos su máxima colaboración para frenar la propagación en el centro escolar.</p><p><em>El Equipo Directivo y Coordinación de Salud Escolar</em></p>`,
  },
  {
    id: 'plantilla-clima',
    titulo: 'Aviso Urgente: Alerta Meteorológica y Protocolo Escolar',
    categoria: 'clima',
    categoriaEtiqueta: 'Emergencia Clima',
    esEmergencia: true,
    prioridad: 'urgente',
    alcances: ['TODOS'],
    descripcionCorta: 'Protocolo de prevención por fuertes precipitaciones e inclemencias meteorológicas.',
    contenido: `<p>Aviso urgente a toda la comunidad educativa:</p><p>Siguiendo las indicaciones de la <strong>Dirección General de Emergencias y Protección Civil</strong> ante el aviso por <strong>fuertes precipitaciones e inclemencias meteorológicas</strong>, les trasladamos las pautas preventivas adoptadas por el centro:</p><ul><li>Se ruega máxima precaución en los desplazamientos y accesos al colegio.</li><li>Las actividades al aire libre y recreos exteriores quedan suspendidos y se habilitan los porches y gimnasio.</li><li>Permanezcan atentos a esta aplicación ante cualquier actualización de las autoridades educativas.</li></ul><p><em>Dirección del CEIP El Molinillo</em></p>`,
  },
  {
    id: 'plantilla-objetos',
    titulo: 'Objetos Perdidos: Campaña de identificación trimestral',
    categoria: 'convivencia',
    categoriaEtiqueta: 'Convivencia',
    esEmergencia: false,
    prioridad: 'normal',
    alcances: ['TODOS'],
    descripcionCorta: 'Exposición de ropa, abrigos y botellas olvidados en el vestíbulo principal del centro.',
    contenido: `<p>Estimadas familias:</p><p>Les informamos de que en el hall del colegio se han expuesto todas las prendas de ropa (abrigos, sudaderas, chaquetas) y enseres que han quedado olvidados durante las últimas semanas.</p><p>Les rogamos que pasen a revisarlos y recuperarlos antes del próximo viernes a las 14:00h. Recordamos la conveniencia de <strong>marcar con nombre y apellidos</strong> todas las prendas y botellas de sus hijos/as.</p><p><em>Secretaría y Conserjería del Centro</em></p>`,
  },
  {
    id: 'plantilla-horario',
    titulo: 'Recordatorio: Horario especial y adecuación de jornada escolar',
    categoria: 'organizativa',
    categoriaEtiqueta: 'Organización',
    esEmergencia: false,
    prioridad: 'normal',
    alcances: ['TODOS'],
    descripcionCorta: 'Aviso de adecuación horaria lectiva conforme al calendario oficial escolar.',
    contenido: `<p>Estimadas familias:</p><p>Les recordamos que, de acuerdo con el calendario escolar oficial, durante las próximas jornadas lectivas habrá adecuación horaria.</p><p>El servicio de comedor escolar y transporte continuará con su funcionamiento habitual adaptado. Pueden consultar cualquier detalle en la secretaría del centro.</p><p><em>Equipo Directivo</em></p>`,
  },
  {
    id: 'plantilla-comedor',
    titulo: 'Comedor Escolar: Protocolo de Alergias e Intolerancias Alimentarias',
    categoria: 'sanitaria',
    categoriaEtiqueta: 'Comedor & Salud',
    esEmergencia: false,
    prioridad: 'normal',
    alcances: ['TODOS'],
    descripcionCorta: 'Requisito preceptivo de entrega de informe médico pediátrico en vigor para dietas adaptadas.',
    contenido: `<p>Estimadas familias de alumnos usuarios de comedor:</p><p>Les recordamos la obligación de presentar en secretaría los <strong>informes médicos actualizados</strong> para cualquier alergia alimentaria o intolerancia diagnosticada recientemente.</p><p>Por seguridad de los menores, no se administrará ningún menú especial sin el correspondiente justificante médico oficial.</p><p><em>Comisión de Comedor y Dirección</em></p>`,
  },
];

const LOCAL_STORAGE_KEY = 'molinillo_plantillas_circulares';

interface ModalPlantillasCircularesProps {
  isOpen: boolean;
  onClose: () => void;
  cursos: Curso[];
  onCargarEnEditor: (plantilla: PlantillaCircular) => void;
  onEnviarEnUnToque: (plantilla: PlantillaCircular) => void;
}

export const ModalPlantillasCirculares: React.FC<ModalPlantillasCircularesProps> = ({
  isOpen,
  onClose,
  cursos,
  onCargarEnEditor,
  onEnviarEnUnToque,
}) => {
  const [plantillas, setPlantillas] = useState<PlantillaCircular[]>(PLANTILLAS_PREDEFINIDAS_BASE);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
  const [busqueda, setBusqueda] = useState('');
  const [confirmandoUnToque, setConfirmandoUnToque] = useState<PlantillaCircular | null>(null);
  const [mostrarFormNueva, setMostrarFormNueva] = useState(false);

  // Formulario de nueva plantilla personalizada
  const [nuevaTitulo, setNuevaTitulo] = useState('');
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaContenido, setNuevaContenido] = useState('');
  const [nuevaEmergencia, setNuevaEmergencia] = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState<'sanitaria' | 'clima' | 'organizativa' | 'convivencia' | 'general'>('general');
  const [formError, setFormError] = useState<string | null>(null);

  // Cargar plantillas desde localStorage combinándolas con las base
  useEffect(() => {
    try {
      const guardadas = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (guardadas) {
        const parsed: PlantillaCircular[] = JSON.parse(guardadas);
        // Filtrar las base por si ya están y concatenar las personalizadas
        const baseIds = new Set(PLANTILLAS_PREDEFINIDAS_BASE.map((p) => p.id));
        const custom = parsed.filter((p) => !baseIds.has(p.id));
        setPlantillas([...PLANTILLAS_PREDEFINIDAS_BASE, ...custom]);
      } else {
        setPlantillas(PLANTILLAS_PREDEFINIDAS_BASE);
      }
    } catch {
      setPlantillas(PLANTILLAS_PREDEFINIDAS_BASE);
    }
  }, [isOpen]);

  const guardarPlantillasEnStorage = (lista: PlantillaCircular[]) => {
    try {
      const customOnly = lista.filter((p) => p.esPersonalizada);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
    } catch {
      // Ignorar error de cuota si ocurre
    }
  };

  const handleEliminarPlantilla = (id: string) => {
    const actualizadas = plantillas.filter((p) => p.id !== id);
    setPlantillas(actualizadas);
    guardarPlantillasEnStorage(actualizadas);
  };

  const handleCrearNuevaPlantilla = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevaTitulo.trim() || !nuevaContenido.trim()) {
      setFormError('Por favor, indica al menos el título y el contenido de la plantilla.');
      return;
    }

    const nuevaPlantilla: PlantillaCircular = {
      id: 'custom-' + Date.now(),
      titulo: nuevaTitulo.trim(),
      categoria: nuevaCategoria,
      categoriaEtiqueta: nuevaCategoria.charAt(0).toUpperCase() + nuevaCategoria.slice(1),
      esEmergencia: nuevaEmergencia,
      prioridad: nuevaEmergencia ? 'urgente' : 'normal',
      alcances: ['TODOS'],
      descripcionCorta: nuevaDesc.trim() || 'Plantilla personalizada del centro',
      contenido: nuevaContenido.trim(),
      esPersonalizada: true,
    };

    const actualizadas = [...plantillas, nuevaPlantilla];
    setPlantillas(actualizadas);
    guardarPlantillasEnStorage(actualizadas);

    // Reset form
    setNuevaTitulo('');
    setNuevaDesc('');
    setNuevaContenido('');
    setNuevaEmergencia(false);
    setNuevaCategoria('general');
    setFormError(null);
    setMostrarFormNueva(false);
  };

  if (!isOpen) return null;

  // Filtrado
  const plantillasFiltradas = plantillas.filter((p) => {
    if (filtroCategoria === 'emergencias' && !p.esEmergencia) return false;
    if (filtroCategoria === 'sanitaria' && p.categoria !== 'sanitaria') return false;
    if (filtroCategoria === 'clima' && p.categoria !== 'clima') return false;
    if (filtroCategoria === 'organizativa' && p.categoria !== 'organizativa') return false;
    if (filtroCategoria === 'personalizadas' && !p.esPersonalizada) return false;

    if (busqueda.trim()) {
      const q = busqueda.toLowerCase();
      const matchTitulo = p.titulo.toLowerCase().includes(q);
      const matchDesc = p.descripcionCorta.toLowerCase().includes(q);
      if (!matchTitulo && !matchDesc) return false;
    }

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100%-16px)] max-w-2xl rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[90vh] overflow-y-auto border border-slate-200 animate-modal-popup">
        {/* Cabecera */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-700">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Plantillas Predefinidas & Circulares de Emergencia
              </h3>
              <p className="text-[11px] text-slate-500">
                Envía comunicados oficiales o alertas sanitarias en 1 toque
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Barra de Filtros y Búsqueda */}
        <div className="space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar plantilla (ej. piojos, temporal, objetos...)"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none bg-slate-50 focus:bg-white transition"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold no-scrollbar">
            <button
              type="button"
              onClick={() => setFiltroCategoria('todas')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer ${
                filtroCategoria === 'todas'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas ({plantillas.length})
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('emergencias')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1 cursor-pointer ${
                filtroCategoria === 'emergencias'
                  ? 'bg-rose-600 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Emergencias SOS</span>
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('sanitaria')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer ${
                filtroCategoria === 'sanitaria'
                  ? 'bg-emerald-800 text-white'
                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
              }`}
            >
              Sanitarias
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('clima')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer ${
                filtroCategoria === 'clima'
                  ? 'bg-sky-800 text-white'
                  : 'bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100'
              }`}
            >
              Clima
            </button>
            <button
              type="button"
              onClick={() => setFiltroCategoria('personalizadas')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer ${
                filtroCategoria === 'personalizadas'
                  ? 'bg-purple-800 text-white'
                  : 'bg-purple-50 text-purple-800 border border-purple-200 hover:bg-purple-100'
              }`}
            >
              Mis Plantillas
            </button>
          </div>
        </div>

        {/* Modal / Diálogo de Confirmación Inmediata de "1 Toque" */}
        {confirmandoUnToque && (
          <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 space-y-3 animate-fade-in shadow-md">
            <div className="flex items-start gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                  ¿Confirmar y enviar circular en 1 toque?
                </h4>
                <p className="text-[11px] text-slate-600">
                  Se publicará de forma inmediata para{' '}
                  <span className="font-semibold text-slate-900">
                    {confirmandoUnToque.alcances.includes('TODOS')
                      ? 'Toda la Comunidad Educativa'
                      : confirmandoUnToque.alcances.join(', ')}
                  </span>{' '}
                  notificando a todas las familias al instante.
                </p>
                <div className="bg-white/80 border border-amber-200 rounded-lg p-2 text-xs font-semibold text-slate-800">
                  {confirmandoUnToque.titulo}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-amber-200/80">
              <button
                type="button"
                onClick={() => setConfirmandoUnToque(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-amber-100/60 rounded-lg font-medium transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = confirmandoUnToque;
                  setConfirmandoUnToque(null);
                  onEnviarEnUnToque(p);
                }}
                className="px-4 py-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold flex items-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Enviar Ahora Inmediatamente</span>
              </button>
            </div>
          </div>
        )}

        {/* Botón para crear nueva plantilla o desplegar formulario */}
        {!mostrarFormNueva ? (
          <button
            type="button"
            onClick={() => setMostrarFormNueva(true)}
            className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-amber-400 hover:bg-amber-50/30 rounded-xl text-slate-600 hover:text-amber-800 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear nueva plantilla predefinida personalizada</span>
          </button>
        ) : (
          <form
            onSubmit={handleCrearNuevaPlantilla}
            className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 text-xs"
          >
            <div className="flex items-center justify-between font-bold text-slate-800">
              <span className="flex items-center gap-1.5">
                <BookmarkCheck className="w-4 h-4 text-amber-600" />
                <span>Nueva Plantilla Personalizada</span>
              </span>
              <button
                type="button"
                onClick={() => setMostrarFormNueva(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <p className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-semibold">
                {formError}
              </p>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Título de la circular
              </label>
              <input
                type="text"
                placeholder="ej. Recordatorio de excursión / Aviso de enfermería"
                value={nuevaTitulo}
                onChange={(e) => setNuevaTitulo(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Categoría
                </label>
                <select
                  value={nuevaCategoria}
                  onChange={(e) =>
                    setNuevaCategoria(
                      e.target.value as 'sanitaria' | 'clima' | 'organizativa' | 'convivencia' | 'general'
                    )
                  }
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                >
                  <option value="general">General</option>
                  <option value="sanitaria">Sanitaria / Médica</option>
                  <option value="clima">Meteorológica / Clima</option>
                  <option value="organizativa">Organizativa / Horarios</option>
                  <option value="convivencia">Convivencia / Familias</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Descripción breve (resumen)
                </label>
                <input
                  type="text"
                  placeholder="ej. Instrucciones para la salida"
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={nuevaEmergencia}
                  onChange={(e) => setNuevaEmergencia(e.target.checked)}
                  className="rounded text-rose-600 focus:ring-rose-500"
                />
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                  <span>Marcar como circular de Emergencia / SOS</span>
                </span>
              </label>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Texto de la circular
              </label>
              <textarea
                rows={3}
                placeholder="Escribe el texto de la circular predefinida..."
                value={nuevaContenido}
                onChange={(e) => setNuevaContenido(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-slate-900 bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-sans"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setMostrarFormNueva(false)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-semibold transition cursor-pointer"
              >
                Guardar Plantilla
              </button>
            </div>
          </form>
        )}

        {/* Listado de Plantillas */}
        <div className="space-y-3">
          {plantillasFiltradas.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              No se han encontrado plantillas con los filtros seleccionados.
            </div>
          ) : (
            plantillasFiltradas.map((plantilla) => (
              <div
                key={plantilla.id}
                className={`border rounded-2xl p-3.5 transition space-y-2.5 relative ${
                  plantilla.esEmergencia
                    ? 'border-rose-300 bg-rose-50/30 hover:border-rose-400'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Cabecera de la plantilla */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {plantilla.esEmergencia && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          <span>EMERGENCIA</span>
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                        {plantilla.categoriaEtiqueta}
                      </span>
                      {plantilla.esPersonalizada && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                          Personalizada
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {plantilla.titulo}
                    </h4>
                  </div>

                  {plantilla.esPersonalizada && (
                    <button
                      type="button"
                      onClick={() => handleEliminarPlantilla(plantilla.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Eliminar plantilla personalizada"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {plantilla.descripcionCorta}
                </p>

                {/* Botonera de acciones: 1 toque vs editar */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  <button
                    type="button"
                    onClick={() => onCargarEnEditor(plantilla)}
                    className="px-3 py-1.5 text-xs text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg font-semibold flex items-center gap-1.5 transition cursor-pointer border border-slate-200"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Cargar en el editor</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmandoUnToque(plantilla)}
                    className={`px-3.5 py-1.5 text-xs text-white rounded-lg font-bold flex items-center gap-1.5 shadow-xs transition active:scale-95 cursor-pointer ${
                      plantilla.esEmergencia
                        ? 'bg-rose-600 hover:bg-rose-700'
                        : 'bg-amber-600 hover:bg-amber-700'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    <span>Mandar en 1 toque</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie */}
        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

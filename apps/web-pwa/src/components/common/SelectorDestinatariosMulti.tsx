import React, { useState, useMemo } from 'react';
import { Curso } from '@molinillo/shared';
import { Search, X, Users, School, ChevronDown, ChevronUp, Check } from 'lucide-react';

interface Props {
  cursos: Curso[];
  destinatariosSeleccionados: string[]; // ['TODOS'] o array de IDs de curso ['I3', '1P']
  onChange: (destinatarios: string[]) => void;
  label?: string;
  defaultExpandido?: boolean;
}

export const SelectorDestinatariosMulti: React.FC<Props> = ({
  cursos,
  destinatariosSeleccionados,
  onChange,
  label = 'Destinatarios de la Comunicación',
  defaultExpandido = false,
}) => {
  const [busqueda, setBusqueda] = useState('');
  const [expandido, setExpandido] = useState(defaultExpandido);

  const esTodos = destinatariosSeleccionados.includes('TODOS');

  // Cursos filtrados por el buscador
  const cursosFiltrados = useMemo(() => {
    if (!busqueda.trim()) return cursos;
    const q = busqueda.toLowerCase().trim();
    return cursos.filter(
      (c) =>
        c.nombre.toLowerCase().includes(q) ||
        (c.nivel && c.nivel.toLowerCase().includes(q)) ||
        c.id.toLowerCase().includes(q)
    );
  }, [cursos, busqueda]);

  // Grupos predefinidos por nivel educativo
  const idsInfantil = cursos.filter((c) => c.nivel === 'Infantil').map((c) => c.id);
  const idsPrimaria = cursos.filter((c) => c.nivel === 'Primaria').map((c) => c.id);

  const handleToggleCurso = (cursoId: string) => {
    if (esTodos) {
      // Si estaba en TODOS, cambiar a solo este curso
      onChange([cursoId]);
      return;
    }

    if (destinatariosSeleccionados.includes(cursoId)) {
      const restantes = destinatariosSeleccionados.filter((id) => id !== cursoId);
      onChange(restantes.length > 0 ? restantes : ['TODOS']);
    } else {
      const nuevos = [...destinatariosSeleccionados, cursoId];
      // Si seleccionó todos los cursos individualmente, marcar TODOS
      if (nuevos.length === cursos.length) {
        onChange(['TODOS']);
      } else {
        onChange(nuevos);
      }
    }
  };

  const handleSeleccionarTodos = () => {
    onChange(['TODOS']);
  };

  const handleSeleccionarInfantil = () => {
    onChange(idsInfantil);
  };

  const handleSeleccionarPrimaria = () => {
    onChange(idsPrimaria);
  };

  const handleQuitarItem = (cursoId: string) => {
    if (cursoId === 'TODOS') {
      onChange([cursos[0]?.id || 'I3']);
      return;
    }
    const restantes = destinatariosSeleccionados.filter((id) => id !== cursoId);
    onChange(restantes.length > 0 ? restantes : ['TODOS']);
  };

  return (
    <div className="border border-slate-200 rounded-2xl bg-white shadow-xs overflow-hidden transition-all text-xs">
      {/* CABECERA CONTRAÍBLE (Siempre visible) */}
      <div
        onClick={() => setExpandido(!expandido)}
        className="p-3 bg-slate-50/80 hover:bg-slate-100/80 cursor-pointer flex items-center justify-between gap-2 border-b border-slate-100 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Users className="w-4 h-4 text-emerald-700 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold text-slate-800 block text-xs truncate">
              {label}
            </span>
            <span className="text-[11px] text-slate-500 font-medium block truncate">
              {esTodos
                ? 'Toda la Comunidad (Todos los cursos &bull; ~90 alumnos)'
                : `${destinatariosSeleccionados.length} curso(s) seleccionado(s)`}
            </span>
          </div>
        </div>

        {/* Botón interactivo para desplegar / contraer */}
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg flex items-center gap-1">
            <span>{expandido ? 'Ocultar' : 'Modificar'}</span>
            {expandido ? (
              <ChevronUp className="w-3.5 h-3.5 text-emerald-700" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5 text-emerald-700" />
            )}
          </span>
        </div>
      </div>

      {/* VISTA RESUMEN COMPACTA (Visible siempre cuando está contraído) */}
      {!expandido && (
        <div
          onClick={() => setExpandido(true)}
          className="p-2.5 bg-white flex items-center gap-1.5 flex-wrap cursor-pointer hover:bg-slate-50/50 transition"
        >
          {esTodos ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-bold text-[11px] border border-emerald-200">
              <School className="w-3.5 h-3.5 text-emerald-700" />
              <span>Toda la Comunidad Educativa (9 cursos)</span>
            </span>
          ) : (
            destinatariosSeleccionados.map((cId) => {
              const curso = cursos.find((c) => c.id === cId);
              return (
                <span
                  key={cId}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-900 font-medium text-[11px] border border-emerald-200"
                >
                  <span>{curso?.nombre || cId}</span>
                </span>
              );
            })
          )}
          <span className="text-[10px] text-slate-400 italic ml-1">
            (Pulsa para cambiar destinatarios)
          </span>
        </div>
      )}

      {/* CUERPO EXPANDIDO (Oculto por defecto en móvil para no hacer scroll) */}
      {expandido && (
        <div className="p-3 bg-white space-y-3 animate-fadeIn border-t border-slate-100">
          {/* Botones de selección rápida por etapas */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              Selección rápida por etapas:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handleSeleccionarTodos}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                  esTodos
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Toda la Comunidad
              </button>
              <button
                type="button"
                onClick={handleSeleccionarInfantil}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                  !esTodos &&
                  idsInfantil.every((id) => destinatariosSeleccionados.includes(id)) &&
                  destinatariosSeleccionados.length === idsInfantil.length
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Infantil (3, 4 y 5 años)
              </button>
              <button
                type="button"
                onClick={handleSeleccionarPrimaria}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border cursor-pointer ${
                  !esTodos &&
                  idsPrimaria.every((id) => destinatariosSeleccionados.includes(id)) &&
                  destinatariosSeleccionados.length === idsPrimaria.length
                    ? 'bg-emerald-800 text-white border-emerald-900 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                Primaria (1º a 6º)
              </button>
            </div>
          </div>

          {/* Píldoras de los cursos actualmente seleccionados con botón de quitar */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
              Cursos incluidos:
            </span>
            <div className="flex items-center gap-1.5 flex-wrap min-h-[32px] p-2 bg-slate-50/70 border border-slate-200 rounded-xl">
              {esTodos ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 font-bold text-[11px] border border-emerald-300">
                  <School className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Toda la Comunidad Educativa (9 cursos &bull; ~90 alumnos)</span>
                </span>
              ) : (
                destinatariosSeleccionados.map((cId) => {
                  const curso = cursos.find((c) => c.id === cId);
                  return (
                    <span
                      key={cId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 font-semibold text-[11px] border border-emerald-200 shadow-2xs"
                    >
                      <span>{curso?.nombre || cId}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuitarItem(cId);
                        }}
                        className="w-3.5 h-3.5 rounded-full hover:bg-emerald-200 flex items-center justify-center text-emerald-800 transition"
                        title="Quitar este curso"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })
              )}
            </div>
          </div>

          {/* Buscador de cursos con autocompletado y listado desplegable con checkboxes */}
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
            <div className="p-2 border-b border-slate-200 bg-slate-50 flex items-center gap-2">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Escribe para buscar o autocompletar cursos..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full bg-transparent border-none text-xs focus:outline-none text-slate-900 placeholder:text-slate-400"
              />
              {busqueda && (
                <button
                  type="button"
                  onClick={() => setBusqueda('')}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Lista de cursos con checkboxes */}
            <div className="max-h-44 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-slate-100">
              {/* Opción de Toda la Comunidad */}
              <label
                className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                  esTodos
                    ? 'bg-emerald-50 text-emerald-900 font-bold'
                    : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={esTodos}
                    onChange={handleSeleccionarTodos}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <div>
                    <span className="text-xs">Toda la Comunidad Educativa</span>
                    <span className="text-[10px] text-slate-500 block font-normal">
                      Todas las familias y cursos del colegio
                    </span>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                  9 Cursos
                </span>
              </label>

              {/* Listado de cursos individuales con checks */}
              {cursosFiltrados.map((curso) => {
                const isChecked = esTodos || destinatariosSeleccionados.includes(curso.id);
                return (
                  <label
                    key={curso.id}
                    className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition ${
                      isChecked && !esTodos
                        ? 'bg-emerald-50/80 text-emerald-900 font-bold'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleCurso(curso.id)}
                        className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                      />
                      <div>
                        <span className="text-xs">{curso.nombre}</span>
                        <span className="text-[10px] text-slate-400 block font-normal">
                          Nivel {curso.nivel} &bull; Tutoría oficial
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-500 font-semibold">
                      ~10 alumnos
                    </span>
                  </label>
                );
              })}

              {cursosFiltrados.length === 0 && (
                <p className="p-3 text-center text-slate-400 text-xs italic">
                  No se encontraron cursos que coincidan con &quot;{busqueda}&quot;.
                </p>
              )}
            </div>
          </div>

          {/* Botón inferior para cerrar y contraer */}
          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white rounded-lg font-semibold text-xs flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar destinatarios y contraer</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

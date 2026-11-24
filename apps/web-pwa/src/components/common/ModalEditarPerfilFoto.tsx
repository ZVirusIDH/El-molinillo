import React, { useState, useRef, useEffect } from 'react';
import { useApp, calcularEstaEnHorarioNotificaciones } from '../../context/AppContext';
import {
  X,
  Upload,
  Trash2,
  Camera,
  Check,
  AlertTriangle,
  Clock,
  Shield,
  Users,
  HeartHandshake,
  GraduationCap,
  Building2,
  Briefcase,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const ModalEditarPerfilFoto: React.FC<Props> = ({ isOpen, onClose }) => {
  const {
    currentUser,
    actualizarFotoPerfil,
    actualizarHorarioNotificacionesUsuario,
    cambiarRolActivo,
    mostrarExplicacionRolesAmpa,
    setMostrarExplicacionRolesAmpa,
    mostrarTextosInformativos,
    setMostrarTextosInformativos,
  } = useApp();
  const [fotoTemp, setFotoTemp] = useState<string>(currentUser.fotoUrl || '');
  const [errorArchivo, setErrorArchivo] = useState<string | null>(null);
  const [guardadoExito, setGuardadoExito] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [horarioActivo, setHorarioActivo] = useState(
    currentUser.horarioNotificaciones?.activo ?? true
  );
  const [horaInicio, setHoraInicio] = useState(
    currentUser.horarioNotificaciones?.horaInicio || '08:30'
  );
  const [horaFin, setHoraFin] = useState(
    currentUser.horarioNotificaciones?.horaFin || '15:00'
  );
  const [diasLectivos, setDiasLectivos] = useState<number[]>(
    currentUser.horarioNotificaciones?.diasLectivos || [1, 2, 3, 4, 5]
  );
  const [silenciarFinesDeSemana, setSilenciarFinesDeSemana] = useState(
    currentUser.horarioNotificaciones?.silenciarFinesDeSemana ?? true
  );

  useEffect(() => {
    setFotoTemp(currentUser.fotoUrl || '');
    if (currentUser.horarioNotificaciones) {
      setHorarioActivo(currentUser.horarioNotificaciones.activo);
      setHoraInicio(currentUser.horarioNotificaciones.horaInicio || '08:30');
      setHoraFin(currentUser.horarioNotificaciones.horaFin || '15:00');
      setDiasLectivos(currentUser.horarioNotificaciones.diasLectivos || [1, 2, 3, 4, 5]);
      setSilenciarFinesDeSemana(currentUser.horarioNotificaciones.silenciarFinesDeSemana ?? true);
    }
  }, [currentUser]);

  if (!isOpen) return null;

  const iniciales = `${currentUser.nombre?.charAt(0) || ''}${currentUser.apellidos?.charAt(0) || ''}`.toUpperCase() || 'U';

  const toggleDiaLectivo = (dia: number) => {
    setDiasLectivos((prev) =>
      prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()
    );
  };

  const estaEnHorarioAhora = calcularEstaEnHorarioNotificaciones({
    activo: horarioActivo,
    horaInicio,
    horaFin,
    diasLectivos,
    silenciarFinesDeSemana,
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorArchivo(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setErrorArchivo('La imagen supera el límite de 2 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (evt) => {
      const res = evt.target?.result as string;
      setFotoTemp(res);
    };
    reader.readAsDataURL(file);
  };

  const handleGuardar = (e: React.FormEvent) => {
    e.preventDefault();
    actualizarFotoPerfil(currentUser.uid, fotoTemp);
    if (currentUser.rol === 'profesor' || currentUser.rol === 'admin') {
      actualizarHorarioNotificacionesUsuario(currentUser.uid, {
        activo: horarioActivo,
        horaInicio,
        horaFin,
        diasLectivos,
        silenciarFinesDeSemana,
      });
    }
    setGuardadoExito(true);
    setTimeout(() => {
      setGuardadoExito(false);
      onClose();
    }, 700);
  };

  const getRolLabel = (rol: string) => {
    switch (rol) {
      case 'admin':
        return 'Dirección y Secretaría';
      case 'padre':
        return 'Familia / Tutor';
      case 'profesor':
        return 'Docente / Tutor';
      case 'ampa':
        return 'AMPA Directiva';
      case 'trabajador':
        return 'Personal del Centro';
      default:
        return 'Usuario';
    }
  };

  const getRolIcon = (r: string) => {
    switch (r) {
      case 'admin':
        return <Building2 className="w-4 h-4 text-emerald-700 shrink-0" />;
      case 'profesor':
        return <GraduationCap className="w-4 h-4 text-purple-700 shrink-0" />;
      case 'ampa':
        return <HeartHandshake className="w-4 h-4 text-blue-700 shrink-0" />;
      case 'padre':
        return <Users className="w-4 h-4 text-emerald-700 shrink-0" />;
      case 'trabajador':
        return <Briefcase className="w-4 h-4 text-slate-700 shrink-0" />;
      default:
        return <Shield className="w-4 h-4 text-slate-600 shrink-0" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3.5 sm:p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100%-20px)] max-w-sm sm:max-w-md rounded-3xl shadow-2xl p-4 sm:p-5 space-y-3.5 max-h-[86vh] overflow-y-auto border border-slate-200 animate-modal-popup my-auto">
        {/* Cabecera del Modal */}
        <div className="flex items-start justify-between pb-2.5 border-b border-slate-100">
          <div>
            <h2 className="font-bold text-slate-900 text-base leading-tight">Configuración de Perfil</h2>
            <p className="text-xs font-semibold text-emerald-700 mt-0.5">
              {currentUser.rol === 'admin' ? 'Dirección y Secretaría' : getRolLabel(currentUser.rol)}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {guardadoExito && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-3 py-2 rounded-xl flex items-center gap-2 text-xs">
            <Check className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">Perfil guardado correctamente.</span>
          </div>
        )}

        {errorArchivo && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3 py-2 rounded-xl flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorArchivo}</span>
          </div>
        )}

        {/* SECCIÓN: MIS ROLES Y BOTONES PARA CAMBIAR */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <Shield className="w-3.5 h-3.5 text-emerald-700" />
              <span>Mis roles</span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium bg-white px-1.5 py-0.5 rounded border border-slate-200">
              {(currentUser.roles?.length || 1)} asignado(s)
            </span>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {(currentUser.roles || [currentUser.rol]).map((r) => {
              const esActivo = currentUser.rol === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => cambiarRolActivo(r)}
                  className={`px-2.5 py-2 rounded-xl border text-left transition flex items-center justify-between text-xs ${
                    esActivo
                      ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-400 text-emerald-950 font-bold shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 font-medium'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    {getRolIcon(r)}
                    <span className="truncate">{getRolLabel(r)}</span>
                  </div>
                  {esActivo && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 ml-1" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN: AVATAR MODIFICABLE */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
          {/* Círculo de Avatar en Vivo */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-emerald-600 shadow-sm bg-white flex items-center justify-center">
              {fotoTemp ? (
                <img src={fotoTemp} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-emerald-700 flex items-center justify-center text-white font-bold text-xl tracking-wider shadow-inner">
                  {iniciales}
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción del Avatar */}
          <div className="flex-1 min-w-0 space-y-1.5">
            <span className="text-[11px] font-bold text-slate-700 block truncate">
              {currentUser.nombre} {currentUser.apellidos}
            </span>
            <div className="flex items-center gap-1.5 flex-wrap">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                className="hidden"
                onChange={handleFileChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-xs transition"
              >
                <Camera className="w-3 h-3" />
                <span>{fotoTemp ? 'Cambiar foto' : 'Subir foto'}</span>
              </button>

              {fotoTemp && (
                <button
                  type="button"
                  onClick={() => setFotoTemp('')}
                  className="px-2 py-1 bg-white hover:bg-rose-50 text-slate-600 hover:text-rose-600 border border-slate-200 rounded-lg text-[11px] font-medium flex items-center gap-1 transition"
                  title="Eliminar foto"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Quitar</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              JPG, PNG o cámara (máx. 2 MB)
            </p>
          </div>
        </div>

        {/* SECCIÓN HORARIO PERSONAL DE NOTIFICACIONES (DESCONEXIÓN DIGITAL) */}
        {(currentUser.rol === 'profesor' || currentUser.rol === 'admin') && (
          <div className="p-3 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                <Clock className="w-3.5 h-3.5 text-emerald-700" />
                <span>Desconexión Digital</span>
              </div>
              <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={horarioActivo}
                  onChange={(e) => setHorarioActivo(e.target.checked)}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span>Activar</span>
              </label>
            </div>

            {horarioActivo && (
              <div className="space-y-2 pt-0.5">
                {/* Franja horaria compacta en una sola fila */}
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 text-xs">
                  <span className="text-[11px] text-slate-500 font-medium">De</span>
                  <input
                    type="time"
                    value={horaInicio}
                    onChange={(e) => setHoraInicio(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">a</span>
                  <input
                    type="time"
                    value={horaFin}
                    onChange={(e) => setHoraFin(e.target.value)}
                    className="px-2 py-1 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:ring-1 focus:ring-emerald-600 bg-white"
                  />
                </div>

                {/* Días lectivos compactos */}
                <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-semibold text-slate-600">Días:</span>
                  <div className="flex items-center gap-1">
                    {[
                      { num: 1, label: 'L' },
                      { num: 2, label: 'M' },
                      { num: 3, label: 'X' },
                      { num: 4, label: 'J' },
                      { num: 5, label: 'V' },
                    ].map((d) => {
                      const sel = diasLectivos.includes(d.num);
                      return (
                        <button
                          key={d.num}
                          type="button"
                          onClick={() => toggleDiaLectivo(d.num)}
                          className={`w-6 h-6 rounded-lg text-[10px] font-bold transition flex items-center justify-center ${
                            sel
                              ? 'bg-emerald-700 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Silenciar fines de semana */}
                <label className="flex items-center gap-1.5 cursor-pointer text-slate-700 text-[11px]">
                  <input
                    type="checkbox"
                    checked={silenciarFinesDeSemana}
                    onChange={(e) => setSilenciarFinesDeSemana(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>Silenciar automáticamente fines de semana</span>
                </label>
              </div>
            )}
          </div>
        )}

        {/* Opción para Representantes del AMPA con Hijos: Mostrar textos explicativos */}
        {currentUser.roles?.includes('ampa') && currentUser.roles?.includes('padre') && (
          <div className="p-3 bg-blue-50/60 rounded-2xl border border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <HeartHandshake className="w-4 h-4 text-blue-700 shrink-0" />
              <div>
                <p className="font-bold text-blue-950 text-xs">Explicaciones de Área (AMPA / Familia)</p>
                <p className="text-[11px] text-blue-800/80">Textos de ayuda bajo los botones de cambio</p>
              </div>
            </div>
            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 shrink-0">
              <input
                type="checkbox"
                checked={mostrarExplicacionRolesAmpa}
                onChange={(e) => setMostrarExplicacionRolesAmpa(e.target.checked)}
                className="rounded text-blue-700 focus:ring-blue-600 cursor-pointer"
              />
              <span>{mostrarExplicacionRolesAmpa ? 'Activados' : 'Ocultos'}</span>
            </label>
          </div>
        )}

        {/* Opción global: Textos informativos y notas de ayuda */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600 shrink-0" />
            <div>
              <p className="font-bold text-slate-900 text-xs">Textos informativos y avisos</p>
              <p className="text-[11px] text-slate-500">Mostrar guías y notas explicativas en las vistas</p>
            </div>
          </div>
          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 shrink-0">
            <input
              type="checkbox"
              checked={mostrarTextosInformativos}
              onChange={(e) => setMostrarTextosInformativos(e.target.checked)}
              className="rounded text-emerald-700 focus:ring-emerald-600 cursor-pointer"
            />
            <span>{mostrarTextosInformativos ? 'Visibles' : 'Ocultos'}</span>
          </label>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleGuardar}
            className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Guardar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

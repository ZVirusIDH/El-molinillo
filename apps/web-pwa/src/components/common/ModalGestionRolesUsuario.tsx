import React, { useState, useEffect } from 'react';
import { RolUsuario, UsuarioPerfil } from '@molinillo/shared';
import {
  X,
  Shield,
  Check,
  Users,
  GraduationCap,
  Building2,
  HeartHandshake,
  Briefcase,
  AlertTriangle,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  usuario: UsuarioPerfil | null;
  onGuardarRoles: (uid: string, roles: RolUsuario[]) => void;
}

interface OpcionRol {
  id: RolUsuario;
  titulo: string;
  subtitulo: string;
  icono: React.ReactNode;
  colorBg: string;
  colorBorder: string;
  colorText: string;
}

export const ModalGestionRolesUsuario: React.FC<Props> = ({
  isOpen,
  onClose,
  usuario,
  onGuardarRoles,
}) => {
  const [rolesSeleccionados, setRolesSeleccionados] = useState<RolUsuario[]>([]);
  const [errorValidacion, setErrorValidacion] = useState<string | null>(null);

  useEffect(() => {
    if (usuario) {
      const rolesIniciales =
        usuario.roles && usuario.roles.length > 0 ? usuario.roles : [usuario.rol];
      setRolesSeleccionados(rolesIniciales);
      setErrorValidacion(null);
    }
  }, [usuario]);

  if (!isOpen || !usuario) return null;

  const opcionesRoles: OpcionRol[] = [
    {
      id: 'padre',
      titulo: 'Familia / Tutor Legal',
      subtitulo:
        'Acceso al seguimiento escolar de sus hijos, firmas de autorizaciones, faltas y tutorías privadas.',
      icono: <Users className="w-4 h-4 text-emerald-700" />,
      colorBg: 'bg-emerald-50',
      colorBorder: 'border-emerald-200',
      colorText: 'text-emerald-900',
    },
    {
      id: 'ampa',
      titulo: 'Representante del AMPA',
      subtitulo:
        'Emisión de comunicados oficiales de la asociación y atención del buzón directo (estricta compartimentación RGPD).',
      icono: <HeartHandshake className="w-4 h-4 text-blue-700" />,
      colorBg: 'bg-blue-50',
      colorBorder: 'border-blue-200',
      colorText: 'text-blue-900',
    },
    {
      id: 'profesor',
      titulo: 'Profesor / Equipo Docente',
      subtitulo:
        'Tutoría de aula, circulares educativas, pase de lista de faltas y horario programado de desconexión.',
      icono: <GraduationCap className="w-4 h-4 text-purple-700" />,
      colorBg: 'bg-purple-50',
      colorBorder: 'border-purple-200',
      colorText: 'text-purple-900',
    },
    {
      id: 'admin',
      titulo: 'Dirección y Secretaría (Superusuario)',
      subtitulo:
        'Control integral de la plataforma, censo general, claustro, encuestas del centro y parámetros institucionales.',
      icono: <Building2 className="w-4 h-4 text-indigo-700" />,
      colorBg: 'bg-indigo-50',
      colorBorder: 'border-indigo-200',
      colorText: 'text-indigo-900',
    },
    {
      id: 'trabajador',
      titulo: 'Personal No Docente / Colectivos',
      subtitulo:
        'Monitores de aula matinal, comedor, transporte escolar y personal de actividades extraescolares.',
      icono: <Briefcase className="w-4 h-4 text-slate-700" />,
      colorBg: 'bg-slate-50',
      colorBorder: 'border-slate-200',
      colorText: 'text-slate-900',
    },
  ];

  const handleToggleRol = (rolId: RolUsuario) => {
    setErrorValidacion(null);
    if (rolesSeleccionados.includes(rolId)) {
      if (rolesSeleccionados.length === 1) {
        setErrorValidacion('El usuario debe conservar al menos un rol asignado.');
        return;
      }
      setRolesSeleccionados(rolesSeleccionados.filter((r) => r !== rolId));
    } else {
      setRolesSeleccionados([...rolesSeleccionados, rolId]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rolesSeleccionados.length === 0) {
      setErrorValidacion('Debe seleccionar al menos un rol.');
      return;
    }
    onGuardarRoles(usuario.uid, rolesSeleccionados);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100%-20px)] max-w-lg rounded-3xl shadow-2xl p-5 space-y-4 my-auto max-h-[88vh] overflow-y-auto border border-slate-200 animate-modal-popup">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Shield className="w-5 h-5 text-emerald-700" />
            <span>Configuración de Roles y Áreas de Acceso</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
            aria-label="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Ficha del Usuario */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center border border-emerald-300 shrink-0">
              {usuario.nombre.charAt(0)}
              {usuario.apellidos.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">
                {usuario.nombre} {usuario.apellidos}
              </p>
              <p className="text-[11px] text-slate-500 font-mono">{usuario.email}</p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-slate-400 block uppercase font-bold tracking-wider">
              Roles Actuales:
            </span>
            <span className="font-semibold text-emerald-800 text-[11px]">
              {rolesSeleccionados.length} rol(es) marcados
            </span>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Marque los roles que ostenta esta persona en el centro. Si un usuario tiene más de un rol
          (por ejemplo, <strong>es madre/padre y representante del AMPA</strong>), podrá alternar
          fácilmente entre ambos espacios de trabajo desde la cabecera manteniendo sus datos y
          permisos completamente separados y protegidos por el RGPD.
        </p>

        {errorValidacion && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 px-3.5 py-2.5 rounded-lg flex items-center gap-2 text-xs">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorValidacion}</span>
          </div>
        )}

        {/* Listado de Roles Configurables con Checks */}
        <form onSubmit={handleSubmit} className="space-y-2.5">
          <div className="space-y-2">
            {opcionesRoles.map((opc) => {
              const estaMarcado = rolesSeleccionados.includes(opc.id);
              const esRolActivo = usuario.rol === opc.id;

              return (
                <div
                  key={opc.id}
                  onClick={() => handleToggleRol(opc.id)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex items-start gap-3 ${
                    estaMarcado
                      ? 'bg-white border-emerald-500 shadow-sm ring-1 ring-emerald-400/40'
                      : 'bg-slate-50/60 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      id={`chk-rol-${opc.id}`}
                      checked={estaMarcado}
                      onChange={() => handleToggleRol(opc.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 text-emerald-700 rounded focus:ring-emerald-600 border-slate-300 cursor-pointer"
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        {opc.icono}
                        <label
                          htmlFor={`chk-rol-${opc.id}`}
                          className="font-bold text-slate-900 text-xs cursor-pointer"
                        >
                          {opc.titulo}
                        </label>
                      </div>

                      <div className="flex items-center gap-1">
                        {esRolActivo && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                            Rol Activo
                          </span>
                        )}
                        {estaMarcado && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Habilitado
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      {opc.subtitulo}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <span className="text-[11px] text-slate-500">
              {rolesSeleccionados.length > 1
                ? 'El usuario dispondrá de selector para cambiar de rol.'
                : 'Usuario con rol único.'}
            </span>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Guardar Roles
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

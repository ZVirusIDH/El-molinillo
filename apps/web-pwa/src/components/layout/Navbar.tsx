import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { ModalEditarPerfilFoto } from '../common/ModalEditarPerfilFoto';
import { ModalDatosCentro } from '../common/ModalDatosCentro';
import { ModalDesconexionDigital } from '../common/ModalDesconexionDigital';
import { Building2, BellOff } from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    centroInfo,
    currentUser,
    setModalDatosCentroOpen,
    modalPerfilOpen,
    setModalPerfilOpen,
    avisos,
    alumnos,
    confirmacionesLectura,
    horarioLaboralActivo,
  } = useApp();

  const [modalDesconexionOpen, setModalDesconexionOpen] = useState(false);

  let totalAvisosNoLeidos = 0;
  if (currentUser.rol === 'padre') {
    const hijos = alumnos.filter((a) => a.progenitores.some((prog) => prog.uid === currentUser.uid));
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
    totalAvisosNoLeidos = avisosVis.filter((av) => {
      const confs = confirmacionesLectura[av.id] || [];
      return !confs.includes(currentUser.uid);
    }).length;
  }

  const getNombrePanelActual = () => {
    switch (currentUser.rol) {
      case 'admin':
        return 'Secretaría y Dirección';
      case 'profesor':
        return 'Espacio Docente';
      case 'padre':
        return 'Espacio Familias';
      case 'ampa':
        return 'Espacio AMPA';
      case 'trabajador':
        return 'Servicios y Monitores';
      default:
        return 'Secretaría y Dirección';
    }
  };

  return (
    <>
      <header className="bg-emerald-800 text-white shadow-md border-b border-emerald-900 sticky top-0 z-40 h-14 flex items-center">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 w-full">
          <div className="flex items-center justify-between gap-3">
            {/* A la izquierda: Botón circular de modificación de usuario + Al lado "El Molinillo" y debajo "Secretaría y Dirección" */}
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setModalPerfilOpen(true)}
                title="Pulsar para modificar tu perfil y foto de usuario"
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden bg-emerald-900 border-2 border-emerald-400 hover:border-white flex items-center justify-center shrink-0 shadow-md group cursor-pointer transition active:scale-95 relative"
              >
                {currentUser.fotoUrl ? (
                  <img src={currentUser.fotoUrl} alt={currentUser.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-xs sm:text-sm font-bold text-emerald-200 group-hover:text-white">
                    {currentUser.nombre.charAt(0)}{currentUser.apellidos?.charAt(0) || ''}
                  </span>
                )}
                {totalAvisosNoLeidos > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-rose-600 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-emerald-900 shadow-xs animate-pulse">
                    {totalAvisosNoLeidos}
                  </span>
                )}
              </button>

              <div className="flex flex-col min-w-0">
                <h1 className="font-bold text-sm sm:text-base tracking-tight text-white leading-tight">
                  El Molinillo
                </h1>
                <span className="text-[11px] sm:text-xs text-emerald-200 font-medium leading-tight truncate">
                  {getNombrePanelActual()}
                </span>
              </div>
            </div>

            {/* A la derecha: Botón de Desconexión Digital (a la izquierda del cole) + Botón del Centro Escolar */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Icono parpadeante de desconexión en horario de desconexión */}
              {!horarioLaboralActivo && (
                <button
                  type="button"
                  onClick={() => setModalDesconexionOpen(true)}
                  title="Horario de desconexión digital activo. Pulsa para actualizar avisos puntualmente sin desactivar la desconexión."
                  className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/35 border border-amber-400/60 text-amber-300 hover:text-white transition cursor-pointer shadow-xs active:scale-95 animate-pulse"
                >
                  <BellOff className="w-4 h-4 text-amber-300 shrink-0" />
                  <span className="hidden md:inline text-[11px] font-bold text-amber-200">
                    Desconectado
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setModalDatosCentroOpen(true)}
                title="Pulsar para abrir los datos oficiales del centro escolar"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-900/70 hover:bg-emerald-900 border border-emerald-600/60 hover:border-emerald-300 text-emerald-100 hover:text-white transition cursor-pointer"
              >
                <div className="w-6 h-6 rounded-lg overflow-hidden flex items-center justify-center shrink-0">
                  {centroInfo?.logoUrl ? (
                    <img src={centroInfo.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="w-4 h-4 text-emerald-300" />
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-semibold truncate max-w-[190px]">
                  {centroInfo?.nombreCentro || 'CEIP El Molinillo'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Modal de edición de perfil y foto */}
      <ModalEditarPerfilFoto
        isOpen={modalPerfilOpen}
        onClose={() => setModalPerfilOpen(false)}
      />

      {/* Modal de desconexión digital y actualización puntual de avisos */}
      <ModalDesconexionDigital
        isOpen={modalDesconexionOpen}
        onClose={() => setModalDesconexionOpen(false)}
      />

      {/* Modal oficial de datos del centro y claustro de profesores */}
      <ModalDatosCentro />
    </>
  );
};

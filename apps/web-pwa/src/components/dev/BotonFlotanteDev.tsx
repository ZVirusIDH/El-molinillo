import React, { useState, useRef } from 'react';
import { Sliders, Monitor, Smartphone } from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface BotonFlotanteDevProps {
  onClick: () => void;
}

export const BotonFlotanteDev: React.FC<BotonFlotanteDevProps> = ({ onClick }) => {
  const {
    currentUser,
    firebaseConectado,
    modoSimuladorMovil,
    toggleModoSimuladorMovil,
    avisos,
    alumnos,
    confirmacionesLectura,
  } = useApp();

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

  // Posición inicial por defecto: Arriba a la derecha (top: 80px, right: 20px)
  const [posicion, setPosicion] = useState<{ x: number; y: number }>(() => {
    try {
      const guardada = localStorage.getItem('molinillo_dev_boton_pos');
      if (guardada) {
        const parsed = JSON.parse(guardada);
        if (typeof parsed.x === 'number' && typeof parsed.y === 'number') {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    const anchoPantalla = typeof window !== 'undefined' ? window.innerWidth : 1024;
    return { x: Math.max(20, anchoPantalla - 290), y: 75 };
  });

  const [arrastrando, setArrastrando] = useState(false);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    elemStartX: number;
    elemStartY: number;
    hasMoved: boolean;
  }>({
    startX: 0,
    startY: 0,
    elemStartX: 0,
    elemStartY: 0,
    hasMoved: false,
  });

  const botonRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Solo permitir botón izquierdo
    if (e.button !== 0) return;

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      elemStartX: posicion.x,
      elemStartY: posicion.y,
      hasMoved: false,
    };

    setArrastrando(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando) return;

    const deltaX = e.clientX - dragRef.current.startX;
    const deltaY = e.clientY - dragRef.current.startY;

    if (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4) {
      dragRef.current.hasMoved = true;
    }

    const nuevaX = Math.max(10, Math.min(window.innerWidth - 270, dragRef.current.elemStartX + deltaX));
    const nuevaY = Math.max(10, Math.min(window.innerHeight - 60, dragRef.current.elemStartY + deltaY));

    setPosicion({ x: nuevaX, y: nuevaY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!arrastrando) return;
    setArrastrando(false);

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    if (!dragRef.current.hasMoved) {
      onClick();
    } else {
      try {
        localStorage.setItem('molinillo_dev_boton_pos', JSON.stringify(posicion));
      } catch {
        // ignore
      }
    }
  };

  const getRolCorto = () => {
    switch (currentUser.rol) {
      case 'admin':
        return 'Secretaría';
      case 'profesor':
        return 'Docente';
      case 'padre':
        return 'Familia';
      case 'ampa':
        return 'AMPA';
      default:
        return currentUser.rol;
    }
  };

  return (
    <>
      {/* Versión Móvil (<640px): Botón flotante circular compacto en la esquina inferior derecha para no tapar el centro */}
      <div className="sm:hidden fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={onClick}
          className="w-11 h-11 rounded-full bg-slate-900/95 text-white border-2 border-emerald-500 shadow-xl flex items-center justify-center active:scale-95 transition-transform relative"
          title="Opciones y Pruebas"
          aria-label="Abrir panel de opciones y pruebas"
        >
          <Sliders className="w-5 h-5 text-emerald-400" />
          {totalAvisosNoLeidos > 0 ? (
            <span
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-600 text-white text-[10px] font-black flex items-center justify-center border-2 border-slate-900 shadow-md animate-pulse"
              title={`${totalAvisosNoLeidos} circular(es) nueva(s)`}
            >
              {totalAvisosNoLeidos}
            </span>
          ) : firebaseConectado ? (
            <span
              className="absolute top-0 right-0 w-3 h-3 rounded-full bg-emerald-400 ring-2 ring-slate-900 animate-pulse"
              title="Firebase en vivo conectado"
            />
          ) : null}
        </button>
      </div>

      {/* Versión Escritorio (>=640px): Píldora flotante arrastrable con selector de vista */}
      <div
        ref={botonRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        style={{
          position: 'fixed',
          left: `${posicion.x}px`,
          top: `${posicion.y}px`,
          touchAction: 'none',
        }}
        className={`hidden sm:block z-50 select-none cursor-grab active:cursor-grabbing transition-shadow ${
          arrastrando ? 'opacity-90 scale-105 shadow-2xl' : 'shadow-lg hover:shadow-xl'
        }`}
        title="Arrastra para mover • Clic en el panel para abrir Opciones"
      >
        <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-900/95 hover:bg-slate-900 text-white border-2 border-emerald-500/80 shadow-emerald-950/40 backdrop-blur-md group">
          {/* A la izquierda: Opciones de cambio entre móvil y escritorio (solo iconos) */}
          <div
            className="flex items-center bg-slate-950 p-0.5 rounded-full border border-slate-700/80 shrink-0"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (modoSimuladorMovil) toggleModoSimuladorMovil();
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                !modoSimuladorMovil
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Vista de Escritorio"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (!modoSimuladorMovil) toggleModoSimuladorMovil();
              }}
              className={`w-7 h-7 rounded-full flex items-center justify-center transition cursor-pointer ${
                modoSimuladorMovil
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
              title="Vista Móvil (Simulador de Smartphone)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Separador vertical sutil */}
          <div className="w-px h-5 bg-slate-700/80 shrink-0" />

          {/* Botón de apertura del Escritorio de Opciones y Pruebas */}
          <div className="flex items-center gap-2 pl-0.5 pr-2 cursor-pointer">
            <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-inner group-hover:scale-105 transition">
              <Sliders className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col text-left">
              <span className="text-[11px] font-bold text-white tracking-tight leading-tight flex items-center gap-1.5">
                <span>Opciones & Pruebas</span>
                {totalAvisosNoLeidos > 0 ? (
                  <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                    {totalAvisosNoLeidos} nueva{totalAvisosNoLeidos > 1 ? 's' : ''}
                  </span>
                ) : firebaseConectado ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" title="Firebase activo" />
                ) : null}
              </span>
              <span className="text-[9px] text-emerald-300 font-semibold leading-tight">
                Vista: {getRolCorto()}
              </span>
            </div>

            <span className="text-[10px] text-slate-500 hover:text-slate-300 pl-0.5">
              ⋮⋮
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { InstallPrompt } from './components/pwa/InstallPrompt';
import { OnboardingConfigModal } from './components/onboarding/OnboardingConfigModal';
import { VistaPadre } from './components/views/VistaPadre';
import { VistaProfesor } from './components/views/VistaProfesor';
import { VistaAmpa } from './components/views/VistaAmpa';
import { VistaAdminSecretaria } from './components/views/VistaAdminSecretaria';
import { BotonFlotanteDev } from './components/dev/BotonFlotanteDev';
import { EscritorioDevModal } from './components/dev/EscritorioDevModal';
import { ShieldCheck, Smartphone, X, Bell } from 'lucide-react';

const MainContent: React.FC = () => {
  const {
    centroInfo,
    currentUser,
    recargarConfiguracion,
    modoSimuladorMovil,
    toggleModoSimuladorMovil,
    toastNotificacion,
    cerrarToastNotificacion,
  } = useApp();

  const [devModalOpen, setDevModalOpen] = useState(false);

  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
  const modoSinExtras = params?.get('clean') === 'true' || params?.get('clean') === '1' || params?.get('sinextras') === 'true' || params?.get('pure') === 'true';

  const renderCurrentView = () => {
    switch (currentUser.rol) {
      case 'padre':
        return <VistaPadre />;
      case 'profesor':
        return <VistaProfesor />;
      case 'ampa':
        return <VistaAmpa />;
      case 'admin':
        return <VistaAdminSecretaria />;
      case 'trabajador':
        return <VistaProfesor />;
      default:
        return <VistaPadre />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-slate-900">
      {/* Banner de instalación PWA (Android / iOS) */}
      <InstallPrompt />

      {/* Toast Flotante de Notificación Push */}
      {toastNotificacion && (
        <div className="fixed top-4 right-4 z-50 max-w-sm w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-emerald-500/50 p-4 transition-all duration-300 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shrink-0">
              <Bell className="w-5 h-5 text-emerald-400 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  Notificación Push
                </span>
                <span className="text-[10px] text-slate-400">Ahora</span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1 leading-snug">
                {toastNotificacion.titulo}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {toastNotificacion.cuerpo}
              </p>
            </div>
            <button
              type="button"
              onClick={cerrarToastNotificacion}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition"
              title="Cerrar notificación"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Barra de navegación superior y conmutador de pruebas */}
      <Navbar />

      {/* Modal de vinculación si aún no tiene configuración guardada */}
      {!centroInfo && (
        <OnboardingConfigModal onConfigSaved={recargarConfiguracion} />
      )}

      {/* Banner superior si el simulador de móvil está activo */}
      {modoSimuladorMovil && (
        <div className="bg-slate-900 text-white text-xs px-4 py-2 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-emerald-400" />
            <span>Simulador de pantalla móvil en pantalla (Ancho 400px)</span>
          </div>
          <button
            onClick={toggleModoSimuladorMovil}
            className="flex items-center gap-1 text-slate-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
            <span>Salir del simulador</span>
          </button>
        </div>
      )}

      {/* Contenedor Principal */}
      <main className="flex-1 w-full mx-auto p-2 sm:p-6 flex flex-col items-center">
        {modoSimuladorMovil ? (
          <div className="w-full max-w-[410px] bg-white border-[10px] border-slate-900 rounded-[44px] shadow-2xl overflow-hidden my-2 flex flex-col min-h-[780px]">
            {/* Notch superior del smartphone */}
            <div className="bg-slate-900 h-6 w-full flex items-center justify-center">
              <div className="w-24 h-4 bg-slate-950 rounded-b-xl flex items-center justify-center gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-800" />
                <div className="w-8 h-1.5 rounded-full bg-slate-800" />
              </div>
            </div>

            {/* Pantalla del móvil */}
            <div className="p-3 bg-slate-50 flex-1 overflow-y-auto">
              {renderCurrentView()}
            </div>

            {/* Barra de inicio inferior */}
            <div className="bg-slate-900 h-5 w-full flex items-center justify-center">
              <div className="w-28 h-1 bg-slate-700 rounded-full" />
            </div>
          </div>
        ) : (
          <div className="max-w-6xl w-full">
            {renderCurrentView()}
          </div>
        )}
      </main>

      {/* Botón Flotante Arrastrable para abrir el Escritorio de Opciones y Pruebas (Oculto en modo sin extras) */}
      {!modoSinExtras && (
        <>
          <BotonFlotanteDev onClick={() => setDevModalOpen(true)} />
          <EscritorioDevModal
            isOpen={devModalOpen}
            onClose={() => setDevModalOpen(false)}
          />
        </>
      )}

      {/* Pie institucional */}
      <footer className="bg-white border-t border-slate-200 py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 font-medium text-slate-600">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>El Molinillo &bull; Canal Escolar Seguro y Privado</span>
          </div>
          <p className="text-[11px] text-slate-400">
            Cumplimiento normativo RGPD y LOPDGDD.
          </p>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
};

export default App;

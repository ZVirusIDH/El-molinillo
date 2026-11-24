import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X, Smartphone, Bell, CheckCircle } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export const InstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [pushPermissionStatus, setPushPermissionStatus] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Detectar si ya está ejecutándose en modo standalone (instalada)
    const isInStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://');

    setIsStandalone(isInStandaloneMode);

    // Detectar iOS Safari
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = isAppleDevice && !userAgent.includes('crios') && !userAgent.includes('fxios');
    setIsIOS(isSafari && !isInStandaloneMode);

    // Capturar evento de instalación en Android / Chrome / Edge
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Comprobar estado de permisos de notificación
    if ('Notification' in window) {
      setPushPermissionStatus(Notification.permission);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleRequestPushPermission = async () => {
    if (!('Notification' in window)) return;
    const permission = await Notification.requestPermission();
    setPushPermissionStatus(permission);
  };

  if (dismissed) return null;

  // Caso 1: App ya instalada en standalone pero sin permiso push activado
  if (isStandalone && pushPermissionStatus !== 'granted') {
    return (
      <div className="bg-emerald-900 text-white px-4 py-3 shadow-md border-b border-emerald-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-800 rounded-lg">
            <Bell className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <p className="text-sm font-semibold">Activa las notificaciones oficiales</p>
            <p className="text-xs text-emerald-200">Para recibir avisos urgentes y autorizaciones escolares al instante</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRequestPushPermission}
            className="px-3 py-1.5 bg-white text-emerald-900 rounded text-xs font-semibold hover:bg-emerald-50 transition shadow-sm"
          >
            Activar avisos
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 text-emerald-300 hover:text-white"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Si ya está instalada y con permisos, no mostrar nada
  if (isStandalone) return null;

  return (
    <>
      {/* Banner de instalación en Android / Desktop Chrome */}
      {deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4 transition-all">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Instalar aplicación móvil</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Accede más rápido y recibe avisos del colegio directamente en tu pantalla de inicio.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Ahora no
            </button>
            <button
              onClick={handleInstallClick}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <Download className="w-3.5 h-3.5" />
              Instalar App
            </button>
          </div>
        </div>
      )}

      {/* Banner para iPhone / Safari */}
      {isIOS && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-white border border-slate-200 rounded-xl shadow-xl p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-lg">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">Instalar en tu iPhone</h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  Añade El Molinillo a tu pantalla de inicio para recibir avisos y autorizaciones.
                </p>
              </div>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-slate-400 hover:text-slate-600"
              aria-label="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              onClick={() => setDismissed(true)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Cerrar
            </button>
            <button
              onClick={() => setShowIOSGuide(true)}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
            >
              <PlusSquare className="w-3.5 h-3.5" />
              Ver cómo instalar
            </button>
          </div>
        </div>
      )}

      {/* Modal Guía paso a paso para iOS */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-700" />
                Instalación en Apple iOS
              </h3>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Pulsa el botón Compartir</p>
                  <p className="text-slate-500 mt-0.5">
                    En la barra inferior de Safari, pulsa el icono cuadrado con la flecha hacia arriba.
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">
                    <Share2 className="w-3.5 h-3.5 text-blue-600" />
                    Compartir
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Selecciona 'Añadir a pantalla de inicio'</p>
                  <p className="text-slate-500 mt-0.5">
                    Desplaza el menú hacia abajo y pulsa sobre la opción con el símbolo más.
                  </p>
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-slate-700 font-mono text-[11px]">
                    <PlusSquare className="w-3.5 h-3.5 text-slate-700" />
                    Añadir a pantalla de inicio
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-900">Abre El Molinillo desde tu inicio</p>
                  <p className="text-slate-500 mt-0.5">
                    Una vez abierta desde el icono de tu pantalla, activa los avisos oficiales cuando el sistema te lo solicite.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full mt-2 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};

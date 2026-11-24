import React, { useState } from 'react';
import { QrCode, KeyRound, Building, Check, AlertCircle, ShieldCheck } from 'lucide-react';
import { guardarConfiguracionCentro, CentroInfo } from '../../config/dynamic-firebase';
import { FirebaseClientConfig } from '@molinillo/shared';

interface Props {
  onConfigSaved: () => void;
}

export const OnboardingConfigModal: React.FC<Props> = ({ onConfigSaved }) => {
  const [activeTab, setActiveTab] = useState<'codigo' | 'demo'>('demo');
  const [inputCode, setInputCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleApplyBase64Code = async (rawCode: string) => {
    setError(null);
    setLoading(true);
    try {
      let jsonString = rawCode.trim();
      // Si está codificado en Base64, decodificarlo
      if (!jsonString.startsWith('{')) {
        jsonString = atob(jsonString);
      }
      const parsed = JSON.parse(jsonString);

      if (!parsed.firebaseConfig || !parsed.codigoCentro) {
        throw new Error('El código no contiene la información válida del centro.');
      }

      const centro: CentroInfo = {
        nombreCentro: parsed.nombreCentro || 'Centro Escolar',
        codigoCentro: parsed.codigoCentro,
      };

      await guardarConfiguracionCentro(parsed.firebaseConfig, centro);
      onConfigSaved();
    } catch (err: any) {
      setError(err.message || 'Código de centro o configuración inválida.');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyDemoEnvironment = async () => {
    setLoading(true);
    const demoConfig: FirebaseClientConfig = {
      apiKey: 'DEMO-API-KEY-MOLINILLO',
      authDomain: 'molinillo-demo.firebaseapp.com',
      projectId: 'molinillo-demo',
      storageBucket: 'molinillo-demo.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:web:demo',
    };

    const demoCentro: CentroInfo = {
      nombreCentro: 'CEIP El Molinillo',
      codigoCentro: '00000000',
      direccion: 'Avenida de la Educación, 1, 28001 Madrid',
      telefono: '900 000 000',
      email: 'contacto@colegiodemo.es',
      horarioAtencion: 'Lunes a Viernes de 09:00 a 14:00 h',
    };

    await guardarConfiguracionCentro(demoConfig, demoCentro);
    onConfigSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Encabezado */}
        <div className="bg-emerald-800 text-white p-6">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-900 rounded-lg">
              <Building className="w-6 h-6 text-emerald-200" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bienvenido a El Molinillo</h2>
              <p className="text-xs text-emerald-200">Plataforma oficial de comunicación escolar</p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-emerald-100 bg-emerald-900/50 px-2.5 py-1.5 rounded-md">
            <ShieldCheck className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Sistema seguro, privado y sin intermediarios comerciales</span>
          </div>
        </div>

        {/* Pestañas de vinculación */}
        <div className="border-b border-slate-200 flex text-xs font-semibold">
          <button
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${
              activeTab === 'demo'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Modo Pruebas / Demostración
          </button>
          <button
            onClick={() => setActiveTab('codigo')}
            className={`flex-1 py-3 px-4 text-center border-b-2 transition ${
              activeTab === 'codigo'
                ? 'border-emerald-700 text-emerald-800 bg-emerald-50/50'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Vincular con Código
          </button>
        </div>

        {/* Contenido */}
        <div className="p-6">
          {activeTab === 'demo' ? (
            <div className="space-y-4 text-xs text-slate-600">
              <p>
                Inicia en el <strong>entorno de pruebas interactivo</strong> para explorar todas las vistas:
                familias (padres con múltiples hijos y situaciones de custodia), profesores/tutores,
                comunicados del AMPA y el panel de secretaría.
              </p>

              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Centro simulado: CEIP El Molinillo</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Datos de muestra con cursos, avisos y autorizaciones</span>
                </div>
                <div className="flex items-center gap-2 text-slate-800 font-semibold">
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Conmutador instantáneo de perfiles en cabecera</span>
                </div>
              </div>

              <button
                onClick={handleApplyDemoEnvironment}
                disabled={loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold rounded-lg shadow-sm transition"
              >
                {loading ? 'Cargando entorno...' : 'Entrar en Modo Pruebas'}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-slate-600">
                Pega el código de vinculación facilitado por la secretaría de tu colegio o decodificado de la circular escolar:
              </p>

              <textarea
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                rows={4}
                placeholder="Pega aquí el código alfanumérico o JSON de configuración..."
                className="w-full text-xs font-mono p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />

              {error && (
                <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                onClick={() => handleApplyBase64Code(inputCode)}
                disabled={!inputCode.trim() || loading}
                className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center justify-center gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Vinculando...' : 'Vincular Centro'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

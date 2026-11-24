export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
  vapidKey?: string; // Para FCM Web Push
}

export interface VisibilidadDatosCentro {
  mostrarDireccion?: boolean;
  mostrarTelefono?: boolean;
  mostrarEmail?: boolean;
  mostrarHorarioAtencion?: boolean;
  mostrarClaustro?: boolean;
  mostrarEmailsProfesores?: boolean;
  profesoresOcultos?: string[]; // UIDs de profesores/cargos a ocultar de la ficha pública
  cargosPersonalizados?: Record<string, string>; // uid -> cargo asignado (ej. 'Directora', 'Jefe de Estudios')
}

export interface CentroInfo {
  nombreCentro: string;
  codigoCentro: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  horarioAtencion?: string;
  logoUrl?: string;
  configurado?: boolean;
  fechaConfiguracion?: number;
  visibilidad?: VisibilidadDatosCentro;
}

export interface ConfiguracionCentro {
  id: string; // 'general'
  nombreCentro: string;
  codigoCentro: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  logoUrl?: string;
  webClientUrl?: string;
  fechaInicializacion: number;
  firebaseConfig: FirebaseClientConfig;
  modoPush247: boolean;
  cloudflareWorkerUrl?: string;
}

export interface CodigoOnboardingPayload {
  codigoCentro: string;
  nombreCentro: string;
  firebaseConfig: FirebaseClientConfig;
}

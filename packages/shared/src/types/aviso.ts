export type TipoEmisorAviso = 'colegio' | 'ampa';
export type TipoFirmaAutorizacion = 'UN_PROGENITOR' | 'AMBOS_PROGENITORES';
export type EstadoFirma = 'pendiente' | 'completada' | 'rechazada';
export type PrioridadAviso = 'urgente' | 'normal' | 'informativo';

export interface OrganoEmisor {
  id: string;
  nombre: string;
  descripcion?: string;
  activo: boolean;
  orden?: number;
}

export interface Aviso {
  id: string;
  titulo: string;
  contenido: string;
  tipoEmisor: TipoEmisorAviso;
  prioridad?: PrioridadAviso;
  esEmergencia?: boolean;
  remitenteUid: string;
  remitenteNombre: string;
  remitenteRol: string;
  alcance: 'TODOS' | string; // 'TODOS' o el ID del curso (ej. '3A') o grupo o lista separada por comas
  alcances?: string[]; // Lista explícita de cursos seleccionados (ej: ['I3', '1P'])
  alcanceNombre?: string;
  fechaPublicacion: number; // Unix timestamp
  fechaProgramada?: number | null; // Unix timestamp programado (si aplica)
  estadoEnvio?: 'enviado' | 'programado'; // Estado del envío de la notificación
  esAutorizacion: boolean;
  requiereConfirmacionLectura?: boolean;
  tipoFirma?: TipoFirmaAutorizacion | null;
  fechaLimiteFirma?: number | null;
  enlacesAdjuntos?: { titulo: string; url: string }[];
  activo: boolean;
}

export interface ConfirmacionLectura {
  uidPadre: string;
  nombrePadre: string;
  timestamp: number;
}

export interface RegistroFirma {
  progenitorUid: string;
  progenitorNombre: string;
  progenitorDni?: string;
  fechaFirma: number;
  aceptado: boolean;
  observaciones?: string;
}

export interface ExpedienteFirmaAutorizacion {
  id: string; // `${avisoId}_${alumnoId}`
  avisoId: string;
  avisoTitulo: string;
  alumnoId: string;
  alumnoNombre: string;
  cursoId: string;
  tipoFirma: TipoFirmaAutorizacion;
  firmas: RegistroFirma[];
  estado: EstadoFirma;
  requiereAmbos: boolean;
}

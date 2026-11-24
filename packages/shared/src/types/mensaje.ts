import { RolUsuario } from './auth.js';

export type TipoCanalMensajeria = 'tutoria' | 'ampa';

export interface Conversacion {
  id: string; // ej: `${alumnoId}_${progenitorUid}` o `ampa_${progenitorUid}`
  tipoCanal: TipoCanalMensajeria;
  alumnoId?: string;
  alumnoNombre?: string;
  cursoId?: string;
  progenitorUid: string;
  progenitorNombre: string;
  destinatarioUid: string; // tutorUid, secretariaUid o 'AMPA'
  destinatarioNombre: string;
  destinatarioRol?: RolUsuario;
  ultimoMensaje: string;
  fechaUltimoMensaje: number;
  noLeidosDestinatario: number;
  noLeidosProgenitor: number;
  respuestasDesactivadas?: boolean; // Para avisos unidireccionales de clase
}

export type EstadoEntregaMensaje = 'entregado' | 'programado';

export interface Mensaje {
  id: string;
  conversacionId: string;
  remitenteUid: string;
  remitenteNombre: string;
  remitenteRol: RolUsuario;
  texto: string; // Máximo 500 caracteres
  timestamp: number;
  leido: boolean;
  estadoEntrega?: EstadoEntregaMensaje; // Si se envía durante horario de silencio
  entregarA?: number; // Timestamp programado de entrega
}

export interface HorarioSilencioConfig {
  activo: boolean;
  horaInicio: string; // "17:00"
  horaFin: string;    // "08:30"
  finesDeSemanaSilenciados: boolean;
}

export interface NotificacionPushCola {
  id: string;
  tokens: string[];
  titulo: string;
  cuerpo: string;
  datos?: Record<string, string>;
  estado: 'pendiente' | 'enviado' | 'error';
  intentos: number;
  fechaCreacion: number;
  fechaEnvio?: number;
  error?: string;
}

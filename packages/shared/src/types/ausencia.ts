export type MotivoAusencia = 'enfermedad' | 'cita_medica' | 'motivo_familiar' | 'retraso' | 'otro';
export type TipoAusencia = 'falta_completa' | 'retraso' | 'salida_anticipada';
export type EstadoAusencia = 'pendiente' | 'justificada' | 'rechazada';

export interface JustificanteAusencia {
  id: string;
  alumnoId: string;
  nombreAlumno: string;
  cursoId: string;
  progenitorUid: string;
  nombreProgenitor: string;
  fechaInicio: string; // Formato YYYY-MM-DD
  fechaFin?: string;   // Formato YYYY-MM-DD
  tipo: TipoAusencia;
  motivo: MotivoAusencia;
  observacion: string; // Máximo 500 caracteres
  estado: EstadoAusencia;
  fechaEnvio: number;
  revisadoPor?: string;
  comentarioCentro?: string;
}

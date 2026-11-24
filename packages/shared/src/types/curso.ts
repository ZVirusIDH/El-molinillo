export type NivelEducativo = 'Infantil' | 'Primaria' | 'Secundaria' | 'Bachillerato' | 'Otro';

export interface Curso {
  id: string; // ej. '1A', '3B', 'infantil-4'
  nombre: string; // ej. '1º Primaria A'
  nivel: NivelEducativo;
  tutorUid?: string;
  tutorNombre?: string;
  cotutoresUid?: string[];
  activo: boolean;
}

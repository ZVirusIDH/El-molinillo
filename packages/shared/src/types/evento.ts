export type TipoEventoEscolar = 'reunion' | 'festival' | 'excursion' | 'festivo' | 'taller' | 'otro';

export interface EventoEscolar {
  id: string;
  titulo: string;
  descripcion: string;
  fechaInicio: number; // Unix timestamp
  fechaFin: number;    // Unix timestamp
  ubicacion?: string;
  alcance: 'TODOS' | string;
  alcanceNombre?: string;
  tipo: TipoEventoEscolar;
  creadorUid: string;
  creadorNombre: string;
  activo: boolean;
}

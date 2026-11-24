export type CategoriaRecurso = 'comedor' | 'secretaria' | 'ampa' | 'servicios' | 'general';
export type TipoIconoRecurso = 'utensils' | 'calendar' | 'file-text' | 'external-link' | 'globe' | 'book-open';

export interface RecursoExterno {
  id: string;
  titulo: string;
  descripcion: string;
  url: string;
  icono: TipoIconoRecurso;
  categoria: CategoriaRecurso;
  orden: number;
  destacado: boolean;
}

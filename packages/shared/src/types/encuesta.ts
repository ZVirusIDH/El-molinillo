export interface EncuestaOpcion {
  id: number;
  texto: string;
  votosCount?: number;
}

export interface Encuesta {
  id: string;
  pregunta: string;
  descripcion?: string;
  opciones: EncuestaOpcion[];
  esMultiple: boolean;
  alcance: 'TODOS' | string; // 'TODOS', ID de curso, grupo o lista separada por comas
  alcances?: string[]; // Lista explícita de cursos seleccionados (ej: ['I3', '1P'])
  alcanceNombre?: string;
  fechaCierre: number; // Unix timestamp en milisegundos o segundos
  resultadosPublicos: boolean; // Si los padres pueden ver el porcentaje tras votar
  creadorUid: string;
  creadorNombre: string;
  creadoEn: number;
  activa: boolean;
}

export interface VotoEncuesta {
  uidPadre: string;
  nombrePadre?: string;
  opcionesSeleccionadas: number[]; // Array con los IDs de las opciones votadas
  timestamp: number;
}

export interface PermisosGrupo {
  puedePublicarAvisos: boolean;
  puedeCrearEventos: boolean;
  puedeVerAusencias: boolean;
  puedeRecibirMensajes: boolean;
  puedeGestionarAlumnos: boolean;
  puedePublicarEncuestas: boolean;
  alcanceCursos?: string[]; // Si está restringido a cursos específicos o 'TODOS'
}

export interface GrupoPersonalizado {
  id: string; // ej: 'grupo-comedor', 'transporte-ruta-1', 'delegados-padres'
  nombre: string;
  descripcion: string;
  color?: string; // Etiqueta visual
  permisos: PermisosGrupo;
  miembrosUids: string[]; // UIDs de usuarios que pertenecen a este grupo
  fechaCreacion: number;
  activo: boolean;
}

export type TipoParentesco = 'madre' | 'padre' | 'tutor_legal' | 'otro';

export interface ProgenitorVinculado {
  uid: string;
  nombre: string;
  apellidos: string;
  email: string;
  telefono?: string;
  parentesco: TipoParentesco;
  custodia: boolean;
}

export interface Alumno {
  id: string;
  nombre: string;
  apellidos: string;
  cursoId: string;
  cursoNombre: string;
  tutorUid: string;
  padresSeparados: boolean;
  progenitores: ProgenitorVinculado[];
  observaciones?: string;
  activo: boolean;
}

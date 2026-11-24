import { PermisosGrupo } from './grupo.js';

export type RolUsuario = 'admin' | 'profesor' | 'trabajador' | 'ampa' | 'padre' | 'pendiente';

export interface CustomClaims {
  rol: RolUsuario;
  cursos?: string[]; // IDs de los cursos donde participa o tiene hijos (ej. '3A')
  grupos?: string[]; // Grupos opcionales o personalizados (ej. 'comedor', 'transporte', 'delegados')
  tutorId?: string;  // UID del tutor asignado para padres
  permisos?: Partial<PermisosGrupo>; // Permisos granulares asignados
  notificacionesDesactivadas?: boolean; // Si la secretaría le ha silenciado notificaciones en general
  activo?: boolean;
}

export interface HorarioNotificacionesProfesor {
  activo: boolean; // Si la recepción programada está habilitada
  horaInicio: string; // Formato "HH:MM" (ej. "08:30")
  horaFin: string; // Formato "HH:MM" (ej. "15:00")
  diasLectivos: number[]; // [1, 2, 3, 4, 5] (1=Lunes .. 5=Viernes)
  silenciarFinesDeSemana: boolean;
}

export interface UsuarioPerfil {
  uid: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono?: string;
  fotoUrl?: string; // URL o Data URL base64 de la foto de perfil (o vacío para avatar genérico)
  rol: RolUsuario; // Rol actualmente activo para la sesión / interfaz
  roles?: RolUsuario[]; // Lista de todos los roles asignados al usuario (ej. ['padre', 'ampa'])
  cursos: string[];
  grupos?: string[];
  tutorId?: string;
  fcmTokens: string[];
  activo: boolean;
  emailVerified: boolean;
  fechaRegistro: number; // Unix timestamp
  // Control de notificaciones y permisos individuales por progenitor/usuario
  notificacionesBloqueadas?: boolean; // Desactiva el envío push a este padre/madre en general
  permisosEspeciales?: Partial<PermisosGrupo>; // Permisos específicos concedidos al usuario
  preferenciasNotificaciones?: {
    soloHorarioEscolar: boolean;
    silenciado: boolean;
  };
  horarioNotificaciones?: HorarioNotificacionesProfesor; // Horario personal automático para docentes
}

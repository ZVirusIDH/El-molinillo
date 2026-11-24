import { UsuarioPerfil, PermisosGrupo } from '@molinillo/shared';
export interface SolicitudAltaFamilia {
    uid: string;
    email: string;
    nombre: string;
    apellidos: string;
    nombreAlumno: string;
    cursoId: string;
    gruposSolicitados?: string[];
}
export declare class RolesManagerService {
    private auth;
    private db;
    constructor();
    /**
     * Obtiene la lista de usuarios en estado pendiente de aprobación
     */
    listarSolicitudesPendientes(): Promise<UsuarioPerfil[]>;
    /**
     * Aprueba una solicitud de un padre/madre y le asigna los Custom Claims correspondientes
     */
    aprobarPadre(uid: string, cursoId: string, grupos?: string[], tutorId?: string): Promise<void>;
    /**
     * Asigna rol de profesor a un docente con sus cursos asignados
     */
    asignarProfesor(uid: string, cursos: string[]): Promise<void>;
    /**
     * Asigna rol de AMPA
     */
    asignarAmpa(uid: string): Promise<void>;
    /**
     * Revoca el acceso de un usuario
     */
    desactivarUsuario(uid: string): Promise<void>;
    /**
     * Asigna grupos personalizados a cualquier usuario (personal comedor, transporte, etc.)
     */
    asignarGruposUsuario(uid: string, grupos: string[]): Promise<void>;
    /**
     * Concede permisos granulares específicos por usuario / progenitor
     */
    actualizarPermisosUsuario(uid: string, permisos: Partial<PermisosGrupo>): Promise<void>;
    /**
     * Desactiva / Activa las notificaciones push de un padre o madre en general
     */
    toggleBloqueoNotificacionesPadre(uid: string, bloqueadas: boolean): Promise<void>;
}

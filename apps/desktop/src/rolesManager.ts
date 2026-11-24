import * as admin from 'firebase-admin';
import { RolUsuario, UsuarioPerfil, PermisosGrupo } from '@molinillo/shared';

export interface SolicitudAltaFamilia {
  uid: string;
  email: string;
  nombre: string;
  apellidos: string;
  nombreAlumno: string;
  cursoId: string;
  gruposSolicitados?: string[];
}

export class RolesManagerService {
  private auth: admin.auth.Auth;
  private db: admin.firestore.Firestore;

  constructor() {
    this.auth = admin.auth();
    this.db = admin.firestore();
  }

  /**
   * Obtiene la lista de usuarios en estado pendiente de aprobación
   */
  public async listarSolicitudesPendientes(): Promise<UsuarioPerfil[]> {
    const snap = await this.db
      .collection('usuarios')
      .where('rol', '==', 'pendiente')
      .limit(50)
      .get();

    return snap.docs.map((doc) => doc.data() as UsuarioPerfil);
  }

  /**
   * Aprueba una solicitud de un padre/madre y le asigna los Custom Claims correspondientes
   */
  public async aprobarPadre(
    uid: string,
    cursoId: string,
    grupos: string[] = [],
    tutorId?: string
  ): Promise<void> {
    // 1. Asignar Custom Claims mediante Firebase Auth
    await this.auth.setCustomUserClaims(uid, {
      rol: 'padre' as RolUsuario,
      cursos: [cursoId],
      grupos,
      tutorId,
      activo: true,
    });

    // 2. Actualizar el documento en Firestore
    await this.db.collection('usuarios').doc(uid).update({
      rol: 'padre',
      cursos: [cursoId],
      grupos,
      tutorId,
      activo: true,
      fechaAprobacion: Date.now(),
    });

    console.log(`Usuario ${uid} aprobado con rol padre para curso ${cursoId}.`);
  }

  /**
   * Asigna rol de profesor a un docente con sus cursos asignados
   */
  public async asignarProfesor(uid: string, cursos: string[]): Promise<void> {
    await this.auth.setCustomUserClaims(uid, {
      rol: 'profesor' as RolUsuario,
      cursos,
      activo: true,
    });

    await this.db.collection('usuarios').doc(uid).update({
      rol: 'profesor',
      cursos,
      activo: true,
    });
  }

  /**
   * Asigna rol de AMPA
   */
  public async asignarAmpa(uid: string): Promise<void> {
    await this.auth.setCustomUserClaims(uid, {
      rol: 'ampa' as RolUsuario,
      cursos: [],
      activo: true,
    });

    await this.db.collection('usuarios').doc(uid).update({
      rol: 'ampa',
      activo: true,
    });
  }

  /**
   * Revoca el acceso de un usuario
   */
  public async desactivarUsuario(uid: string): Promise<void> {
    await this.auth.setCustomUserClaims(uid, {
      rol: 'pendiente' as RolUsuario,
      activo: false,
    });

    await this.db.collection('usuarios').doc(uid).update({
      activo: false,
    });
  }

  /**
   * Asigna grupos personalizados a cualquier usuario (personal comedor, transporte, etc.)
   */
  public async asignarGruposUsuario(uid: string, grupos: string[]): Promise<void> {
    const user = await this.auth.getUser(uid);
    const claims = user.customClaims || {};

    await this.auth.setCustomUserClaims(uid, {
      ...claims,
      grupos,
    });

    await this.db.collection('usuarios').doc(uid).update({
      grupos,
    });
  }

  /**
   * Concede permisos granulares específicos por usuario / progenitor
   */
  public async actualizarPermisosUsuario(
    uid: string,
    permisos: Partial<PermisosGrupo>
  ): Promise<void> {
    const user = await this.auth.getUser(uid);
    const claims = user.customClaims || {};

    await this.auth.setCustomUserClaims(uid, {
      ...claims,
      permisos,
    });

    await this.db.collection('usuarios').doc(uid).update({
      permisosEspeciales: permisos,
    });
  }

  /**
   * Desactiva / Activa las notificaciones push de un padre o madre en general
   */
  public async toggleBloqueoNotificacionesPadre(
    uid: string,
    bloqueadas: boolean
  ): Promise<void> {
    const user = await this.auth.getUser(uid);
    const claims = user.customClaims || {};

    await this.auth.setCustomUserClaims(uid, {
      ...claims,
      notificacionesDesactivadas: bloqueadas,
    });

    await this.db.collection('usuarios').doc(uid).update({
      notificacionesBloqueadas: bloqueadas,
    });
  }
}

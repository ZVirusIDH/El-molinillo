import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';
import { CentroInfo, HorarioSilencioConfig, RecursoExterno } from '@molinillo/shared';

export interface SetupWizardConfig {
  serviceAccountPath: string;
  firebaseWebConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket?: string;
    messagingSenderId: string;
    appId: string;
  };
  centroInfo: {
    nombreCentro: string;
    codigoCentro: string;
    direccion?: string;
    telefono?: string;
    emailOficial?: string;
  };
  adminSuperUser: {
    email: string;
    nombre: string;
    apellidos: string;
    passwordTemporal?: string;
  };
}

export class SetupWizardService {
  private db: admin.firestore.Firestore | null = null;
  private auth: admin.auth.Auth | null = null;

  /**
   * Inicializa Firebase Admin SDK leyendo el serviceAccountKey.json
   */
  public async inicializarAdminSdk(serviceAccountPath: string): Promise<boolean> {
    try {
      const resolvedPath = path.resolve(serviceAccountPath);
      if (!fs.existsSync(resolvedPath)) {
        throw new Error(`No se encontró el archivo de credenciales en: ${resolvedPath}`);
      }

      const serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));

      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }

      this.db = admin.firestore();
      this.auth = admin.auth();

      // Configurar emulador o ajustes de timestamps
      this.db.settings({ ignoreUndefinedProperties: true });

      return true;
    } catch (error) {
      console.error('Error inicializando Firebase Admin SDK:', error);
      throw error;
    }
  }

  /**
   * Ejecuta el asistente de inicialización completa:
   * 1. Despliega la configuración del centro.
   * 2. Inicializa cursos base.
   * 3. Configura el Horario de Silencio escolar.
   * 4. Siembra los recursos y enlaces externos iniciales.
   * 5. Crea el usuario Superadmin inicial y asigna Custom Claims.
   * 6. Genera el payload de enlace para el código QR de las familias.
   */
  public async ejecutarAsistente(config: SetupWizardConfig): Promise<{
    exito: boolean;
    superadminUid: string;
    qrPayloadUrl: string;
  }> {
    await this.inicializarAdminSdk(config.serviceAccountPath);
    if (!this.db || !this.auth) {
      throw new Error('Firebase Admin no está inicializado.');
    }

    // 1. Guardar Configuración del Centro
    const centroDocRef = this.db.collection('configuracion_centro').doc('info');
    const centroData: CentroInfo = {
      nombreCentro: config.centroInfo.nombreCentro,
      codigoCentro: config.centroInfo.codigoCentro,
      configurado: true,
      fechaConfiguracion: Date.now(),
    };
    await centroDocRef.set(centroData, { merge: true });

    // 2. Configurar Horario de Silencio por defecto (17:00 a 8:30 y fines de semana)
    const silencioDocRef = this.db.collection('configuracion_centro').doc('horario_silencio');
    const silencioData: HorarioSilencioConfig = {
      activo: true,
      horaInicio: '17:00',
      horaFin: '08:30',
      finesDeSemanaSilenciados: true,
    };
    await silencioDocRef.set(silencioData, { merge: true });

    // 3. Crear Cursos Base Iniciales
    const cursosBase = [
      { id: 'I3', nombre: 'Infantil 3 años', etapa: 'infantil' },
      { id: 'I4', nombre: 'Infantil 4 años', etapa: 'infantil' },
      { id: 'I5', nombre: 'Infantil 5 años', etapa: 'infantil' },
      { id: '1P', nombre: '1º de Primaria', etapa: 'primaria' },
      { id: '2P', nombre: '2º de Primaria', etapa: 'primaria' },
      { id: '3P', nombre: '3º de Primaria', etapa: 'primaria' },
      { id: '4P', nombre: '4º de Primaria', etapa: 'primaria' },
      { id: '5P', nombre: '5º de Primaria', etapa: 'primaria' },
      { id: '6P', nombre: '6º de Primaria', etapa: 'primaria' },
    ];

    const cursosBatch = this.db.batch();
    for (const c of cursosBase) {
      const ref = this.db.collection('cursos').doc(c.id);
      cursosBatch.set(ref, { ...c, activo: true }, { merge: true });
    }
    await cursosBatch.commit();

    // 4. Recursos y Enlaces Externos Iniciales (Web AMPA, Calendario Oficial CARM, etc.)
    const recursosBase: RecursoExterno[] = [
      {
        id: 'rec-calendario',
        titulo: 'Calendario Escolar Oficial y Festivos',
        descripcion: 'Consulta las jornadas lectivas y festividades oficiales aprobadas por la Consejería de Educación',
        url: 'https://educacion.gob.es',
        icono: 'calendar',
        categoria: 'secretaria',
        orden: 1,
        destacado: true,
      },
      {
        id: 'rec-ampa',
        titulo: 'Espacio de Familias y Actividades AMPA',
        descripcion: 'Inscripciones a talleres, banco de libros y actividades asociativas',
        url: 'https://ampa-colegio.local',
        icono: 'globe',
        categoria: 'ampa',
        orden: 2,
        destacado: true,
      },
      {
        id: 'rec-secretaria',
        titulo: 'Portal de Trámites y Gestión Educativa',
        descripcion: 'Acceso a expedientes escolares, matriculaciones y trámites oficiales del centro',
        url: 'https://portal.educacion.es',
        icono: 'file-text',
        categoria: 'secretaria',
        orden: 3,
        destacado: false,
      },
    ];

    const recBatch = this.db.batch();
    for (const r of recursosBase) {
      const ref = this.db.collection('recursos').doc(r.id);
      recBatch.set(ref, r, { merge: true });
    }
    await recBatch.commit();

    // 5. Crear o Actualizar Superadmin Inicial con Custom Claims
    let superadminUser: admin.auth.UserRecord;
    try {
      superadminUser = await this.auth.getUserByEmail(config.adminSuperUser.email);
    } catch {
      superadminUser = await this.auth.createUser({
        email: config.adminSuperUser.email,
        password: config.adminSuperUser.passwordTemporal || 'Molinillo2026!Admin',
        displayName: `${config.adminSuperUser.nombre} ${config.adminSuperUser.apellidos}`,
        emailVerified: true,
      });
    }

    // Asignar Custom Claim: { rol: 'admin' }
    await this.auth.setCustomUserClaims(superadminUser.uid, {
      rol: 'admin',
      activo: true,
    });

    // Guardar en la colección usuarios
    await this.db.collection('usuarios').doc(superadminUser.uid).set(
      {
        uid: superadminUser.uid,
        email: config.adminSuperUser.email,
        nombre: config.adminSuperUser.nombre,
        apellidos: config.adminSuperUser.apellidos,
        rol: 'admin',
        activo: true,
        emailVerified: true,
        fechaRegistro: Date.now(),
      },
      { merge: true }
    );

    // 6. Generar URL codificada para el código QR de las familias
    // Contiene la configuración web en base64 para que la PWA se autoconfigure en el primer escaneo
    const encodedConfig = Buffer.from(JSON.stringify(config.firebaseWebConfig)).toString('base64');
    const qrPayloadUrl = `https://molinillo-app.web.app/?c=${encodedConfig}&centro=${encodeURIComponent(
      config.centroInfo.codigoCentro
    )}`;

    return {
      exito: true,
      superadminUid: superadminUser.uid,
      qrPayloadUrl,
    };
  }
}

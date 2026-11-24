"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SetupWizardService = void 0;
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class SetupWizardService {
    db = null;
    auth = null;
    /**
     * Inicializa Firebase Admin SDK leyendo el serviceAccountKey.json
     */
    async inicializarAdminSdk(serviceAccountPath) {
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
        }
        catch (error) {
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
    async ejecutarAsistente(config) {
        await this.inicializarAdminSdk(config.serviceAccountPath);
        if (!this.db || !this.auth) {
            throw new Error('Firebase Admin no está inicializado.');
        }
        // 1. Guardar Configuración del Centro
        const centroDocRef = this.db.collection('configuracion_centro').doc('info');
        const centroData = {
            nombreCentro: config.centroInfo.nombreCentro,
            codigoCentro: config.centroInfo.codigoCentro,
            configurado: true,
            fechaConfiguracion: Date.now(),
        };
        await centroDocRef.set(centroData, { merge: true });
        // 2. Configurar Horario de Silencio por defecto (17:00 a 8:30 y fines de semana)
        const silencioDocRef = this.db.collection('configuracion_centro').doc('horario_silencio');
        const silencioData = {
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
        // 4. Recursos y Enlaces Externos Iniciales (Web AMPA, Calendario Oficial, etc.)
        const recursosBase = [
            {
                id: 'rec-calendario',
                titulo: 'Calendario Escolar Oficial y Festivos',
                descripcion: 'Consulta las jornadas lectivas y festividades oficiales aprobadas por la Delegación',
                url: 'https://juntadeandalucia.es/educacion',
                icono: 'calendar',
                categoria: 'secretaria',
                orden: 1,
                destacado: true,
            },
            {
                id: 'rec-ampa',
                titulo: 'Espacio de Familias y Actividades AMPA',
                descripcion: 'Inscripciones a talleres, banco de libros y venta de material',
                url: 'https://ampa-colegio.local',
                icono: 'globe',
                categoria: 'ampa',
                orden: 2,
                destacado: true,
            },
            {
                id: 'rec-secretaria',
                titulo: 'Secretaría Virtual y Trámites Oficiales',
                descripcion: 'Solicitud de certificados escolares, matriculaciones y trámites oficiales',
                url: 'https://juntadeandalucia.es/educacion/secretariavirtual/',
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
        let superadminUser;
        try {
            superadminUser = await this.auth.getUserByEmail(config.adminSuperUser.email);
        }
        catch {
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
        await this.db.collection('usuarios').doc(superadminUser.uid).set({
            uid: superadminUser.uid,
            email: config.adminSuperUser.email,
            nombre: config.adminSuperUser.nombre,
            apellidos: config.adminSuperUser.apellidos,
            rol: 'admin',
            activo: true,
            emailVerified: true,
            fechaRegistro: Date.now(),
        }, { merge: true });
        // 6. Generar URL codificada para el código QR de las familias
        // Contiene la configuración web en base64 para que la PWA se autoconfigure en el primer escaneo
        const encodedConfig = Buffer.from(JSON.stringify(config.firebaseWebConfig)).toString('base64');
        const qrPayloadUrl = `https://molinillo-app.web.app/?c=${encodedConfig}&centro=${encodeURIComponent(config.centroInfo.codigoCentro)}`;
        return {
            exito: true,
            superadminUid: superadminUser.uid,
            qrPayloadUrl,
        };
    }
}
exports.SetupWizardService = SetupWizardService;

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
exports.RolesManagerService = void 0;
const admin = __importStar(require("firebase-admin"));
class RolesManagerService {
    auth;
    db;
    constructor() {
        this.auth = admin.auth();
        this.db = admin.firestore();
    }
    /**
     * Obtiene la lista de usuarios en estado pendiente de aprobación
     */
    async listarSolicitudesPendientes() {
        const snap = await this.db
            .collection('usuarios')
            .where('rol', '==', 'pendiente')
            .limit(50)
            .get();
        return snap.docs.map((doc) => doc.data());
    }
    /**
     * Aprueba una solicitud de un padre/madre y le asigna los Custom Claims correspondientes
     */
    async aprobarPadre(uid, cursoId, grupos = [], tutorId) {
        // 1. Asignar Custom Claims mediante Firebase Auth
        await this.auth.setCustomUserClaims(uid, {
            rol: 'padre',
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
    async asignarProfesor(uid, cursos) {
        await this.auth.setCustomUserClaims(uid, {
            rol: 'profesor',
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
    async asignarAmpa(uid) {
        await this.auth.setCustomUserClaims(uid, {
            rol: 'ampa',
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
    async desactivarUsuario(uid) {
        await this.auth.setCustomUserClaims(uid, {
            rol: 'pendiente',
            activo: false,
        });
        await this.db.collection('usuarios').doc(uid).update({
            activo: false,
        });
    }
    /**
     * Asigna grupos personalizados a cualquier usuario (personal comedor, transporte, etc.)
     */
    async asignarGruposUsuario(uid, grupos) {
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
    async actualizarPermisosUsuario(uid, permisos) {
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
    async toggleBloqueoNotificacionesPadre(uid, bloqueadas) {
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
exports.RolesManagerService = RolesManagerService;

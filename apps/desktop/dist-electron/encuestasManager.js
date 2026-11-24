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
exports.EncuestasManagerService = void 0;
const admin = __importStar(require("firebase-admin"));
class EncuestasManagerService {
    db;
    constructor() {
        this.db = admin.firestore();
    }
    /**
     * Obtiene el recuento en tiempo real de una encuesta agregando los votos de la subcolección
     */
    async obtenerRecuentoEncuesta(encuestaId) {
        const encDoc = await this.db.collection('encuestas').doc(encuestaId).get();
        if (!encDoc.exists) {
            throw new Error(`La encuesta ${encuestaId} no existe.`);
        }
        const encuesta = { id: encDoc.id, ...encDoc.data() };
        const votosSnap = await this.db
            .collection('encuestas')
            .doc(encuestaId)
            .collection('votos')
            .get();
        const totalVotos = votosSnap.size;
        const contadorPorOpcion = {};
        encuesta.opciones.forEach((op) => {
            contadorPorOpcion[op.id] = 0;
        });
        votosSnap.docs.forEach((doc) => {
            const voto = doc.data();
            voto.opcionesSeleccionadas.forEach((opId) => {
                contadorPorOpcion[opId] = (contadorPorOpcion[opId] || 0) + 1;
            });
        });
        const recuentoPorOpcion = encuesta.opciones.map((op) => {
            const votos = contadorPorOpcion[op.id] || 0;
            const porcentaje = totalVotos > 0 ? Math.round((votos / totalVotos) * 100) : 0;
            return {
                opcionId: op.id,
                texto: op.texto,
                votos,
                porcentaje,
            };
        });
        const ahora = Date.now();
        const cerrada = ahora >= encuesta.fechaCierre || !encuesta.activa;
        return {
            encuesta,
            totalVotos,
            recuentoPorOpcion,
            cerrada,
        };
    }
    /**
     * Exporta los resultados de la encuesta a formato CSV
     */
    exportarEncuestaCsv(resumen) {
        const lineas = [
            `Encuesta: "${resumen.encuesta.pregunta}"`,
            `Alcance: ${resumen.encuesta.alcanceNombre || resumen.encuesta.alcance}`,
            `Total Votantes: ${resumen.totalVotos}`,
            `Estado: ${resumen.cerrada ? 'Cerrada' : 'Abierta'}`,
            '',
            'Opcion ID,Texto de la Opcion,Total Votos,Porcentaje (%)',
        ];
        resumen.recuentoPorOpcion.forEach((item) => {
            lineas.push(`${item.opcionId},"${item.texto.replace(/"/g, '""')}",${item.votos},${item.porcentaje}%`);
        });
        return lineas.join('\n');
    }
}
exports.EncuestasManagerService = EncuestasManagerService;

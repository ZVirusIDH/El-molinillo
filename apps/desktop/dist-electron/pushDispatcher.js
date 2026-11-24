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
exports.PushDispatcherService = void 0;
const admin = __importStar(require("firebase-admin"));
class PushDispatcherService {
    db;
    messaging;
    unsubscribeListener = null;
    horarioSilencio = {
        activo: true,
        horaInicio: '17:00',
        horaFin: '08:30',
        finesDeSemanaSilenciados: true,
    };
    constructor() {
        this.db = admin.firestore();
        this.messaging = admin.messaging();
    }
    /**
     * Carga y sincroniza la configuración de horario de silencio
     */
    async iniciarSincronizacionHorario() {
        this.db.collection('configuracion_centro').doc('horario_silencio').onSnapshot((snap) => {
            if (snap.exists) {
                this.horarioSilencio = snap.data();
            }
        });
    }
    /**
     * Evalúa si el instante actual se encuentra dentro del horario de silencio docente
     */
    estaEnHorarioSilencio(ahora = new Date()) {
        if (!this.horarioSilencio.activo)
            return false;
        // Fines de semana (0 = domingo, 6 = sábado)
        const dia = ahora.getDay();
        if (this.horarioSilencio.finesDeSemanaSilenciados && (dia === 0 || dia === 6)) {
            return true;
        }
        const pad = (n) => n.toString().padStart(2, '0');
        const horaActualStr = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;
        const { horaInicio, horaFin } = this.horarioSilencio;
        // Franja nocturna cruzando medianoche (ej: de 17:00 a 08:30)
        if (horaInicio > horaFin) {
            return horaActualStr >= horaInicio || horaActualStr < horaFin;
        }
        else {
            return horaActualStr >= horaInicio && horaActualStr < horaFin;
        }
    }
    /**
     * Inicia el trabajador en segundo plano que escucha la cola de notificaciones
     * en Firestore (Plan Spark 0 €: el PC de secretaría actúa como servidor local)
     */
    iniciarDespachador() {
        if (this.unsubscribeListener) {
            console.log('El despachador push ya está en ejecución.');
            return;
        }
        console.log('Iniciando despachador local de notificaciones push de Molinillo...');
        this.iniciarSincronizacionHorario();
        this.unsubscribeListener = this.db
            .collection('cola_notificaciones')
            .where('estado', '==', 'pendiente')
            .limit(20)
            .onSnapshot(async (snapshot) => {
            for (const doc of snapshot.docs) {
                const notif = { id: doc.id, ...doc.data() };
                await this.procesarNotificacion(notif);
            }
        }, (error) => {
            console.error('Error escuchando la cola de notificaciones push:', error);
        });
    }
    /**
     * Procesa un ítem de la cola de notificaciones
     */
    async procesarNotificacion(notif) {
        const docRef = this.db.collection('cola_notificaciones').doc(notif.id);
        // Filtrar tokens de padres con notificaciones desactivadas en general
        let tokensEfectivos = notif.tokens;
        if (notif.datos?.destinatariosUids) {
            try {
                const uids = JSON.parse(notif.datos.destinatariosUids);
                if (uids.length > 0) {
                    const usuariosBloqueadosSnap = await this.db
                        .collection('usuarios')
                        .where(admin.firestore.FieldPath.documentId(), 'in', uids.slice(0, 30))
                        .where('notificacionesBloqueadas', '==', true)
                        .get();
                    const uidsBloqueados = new Set(usuariosBloqueadosSnap.docs.map((d) => d.id));
                    const tokensBloqueados = new Set();
                    usuariosBloqueadosSnap.docs.forEach((d) => {
                        const data = d.data();
                        (data.fcmTokens || []).forEach((t) => tokensBloqueados.add(t));
                    });
                    tokensEfectivos = notif.tokens.filter((t) => !tokensBloqueados.has(t));
                }
            }
            catch (e) {
                // Fallback a tokens directos
            }
        }
        // Si todos los tokens están bloqueados o vacíos
        if (!tokensEfectivos || tokensEfectivos.length === 0) {
            await docRef.update({
                estado: 'enviado',
                fechaEnvio: Date.now(),
                exitosCount: 0,
                fallosCount: 0,
                motivo: 'Destinatarios silenciados o sin tokens',
            });
            return;
        }
        // Verificar si es urgente o si estamos en horario de silencio
        const esUrgente = notif.datos?.prioridad === 'urgente';
        if (!esUrgente && this.estaEnHorarioSilencio()) {
            console.log(`Notificación ${notif.id} pospuesta por Horario de Silencio docente.`);
            return; // Se mantiene en pendiente para el siguiente ciclo diurno
        }
        try {
            // Enviar en paquetes multicast (hasta 500 tokens por llamada)
            const response = await this.messaging.sendEachForMulticast({
                tokens: tokensEfectivos,
                notification: {
                    title: notif.titulo,
                    body: notif.cuerpo,
                },
                data: notif.datos || {},
                webpush: {
                    headers: {
                        Urgency: esUrgente ? 'high' : 'normal',
                    },
                    fcmOptions: {
                        link: 'https://molinillo-app.web.app/',
                    },
                },
            });
            console.log(`Push enviado para ${notif.id}: ${response.successCount} éxitos, ${response.failureCount} fallos.`);
            await docRef.update({
                estado: 'enviado',
                fechaEnvio: Date.now(),
                exitosCount: response.successCount,
                fallosCount: response.failureCount,
            });
        }
        catch (err) {
            console.error(`Error enviando notificación ${notif.id}:`, err);
            await docRef.update({
                intentos: (notif.intentos || 0) + 1,
                error: err.message || 'Error desconocido al invocar FCM',
            });
        }
    }
    /**
     * Detiene el despachador
     */
    detenerDespachador() {
        if (this.unsubscribeListener) {
            this.unsubscribeListener();
            this.unsubscribeListener = null;
            console.log('Despachador push detenido.');
        }
    }
}
exports.PushDispatcherService = PushDispatcherService;

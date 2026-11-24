import * as admin from 'firebase-admin';
import { HorarioSilencioConfig, NotificacionPushCola } from '@molinillo/shared';

export class PushDispatcherService {
  private db: admin.firestore.Firestore;
  private messaging: admin.messaging.Messaging;
  private unsubscribeListener: (() => void) | null = null;
  private horarioSilencio: HorarioSilencioConfig = {
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
  public async iniciarSincronizacionHorario(): Promise<void> {
    this.db.collection('configuracion_centro').doc('horario_silencio').onSnapshot((snap) => {
      if (snap.exists) {
        this.horarioSilencio = snap.data() as HorarioSilencioConfig;
      }
    });
  }

  /**
   * Evalúa si el instante actual se encuentra dentro del horario de silencio docente
   */
  public estaEnHorarioSilencio(ahora: Date = new Date()): boolean {
    if (!this.horarioSilencio.activo) return false;

    // Fines de semana (0 = domingo, 6 = sábado)
    const dia = ahora.getDay();
    if (this.horarioSilencio.finesDeSemanaSilenciados && (dia === 0 || dia === 6)) {
      return true;
    }

    const pad = (n: number) => n.toString().padStart(2, '0');
    const horaActualStr = `${pad(ahora.getHours())}:${pad(ahora.getMinutes())}`;

    const { horaInicio, horaFin } = this.horarioSilencio;
    // Franja nocturna cruzando medianoche (ej: de 17:00 a 08:30)
    if (horaInicio > horaFin) {
      return horaActualStr >= horaInicio || horaActualStr < horaFin;
    } else {
      return horaActualStr >= horaInicio && horaActualStr < horaFin;
    }
  }

  /**
   * Inicia el trabajador en segundo plano que escucha la cola de notificaciones
   * en Firestore (Plan Spark 0 €: el PC de secretaría actúa como servidor local)
   */
  public iniciarDespachador(): void {
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
      .onSnapshot(
        async (snapshot) => {
          for (const doc of snapshot.docs) {
            const notif = { id: doc.id, ...doc.data() } as NotificacionPushCola;
            await this.procesarNotificacion(notif);
          }
        },
        (error) => {
          console.error('Error escuchando la cola de notificaciones push:', error);
        }
      );
  }

  /**
   * Procesa un ítem de la cola de notificaciones
   */
  private async procesarNotificacion(notif: NotificacionPushCola): Promise<void> {
    const docRef = this.db.collection('cola_notificaciones').doc(notif.id);

    // Filtrar tokens de padres con notificaciones desactivadas en general
    let tokensEfectivos = notif.tokens;
    if (notif.datos?.destinatariosUids) {
      try {
        const uids: string[] = JSON.parse(notif.datos.destinatariosUids);
        if (uids.length > 0) {
          const usuariosBloqueadosSnap = await this.db
            .collection('usuarios')
            .where(admin.firestore.FieldPath.documentId(), 'in', uids.slice(0, 30))
            .where('notificacionesBloqueadas', '==', true)
            .get();

          const uidsBloqueados = new Set(usuariosBloqueadosSnap.docs.map((d) => d.id));
          const tokensBloqueados = new Set<string>();
          usuariosBloqueadosSnap.docs.forEach((d) => {
            const data = d.data();
            (data.fcmTokens || []).forEach((t: string) => tokensBloqueados.add(t));
          });

          tokensEfectivos = notif.tokens.filter((t) => !tokensBloqueados.has(t));
        }
      } catch (e) {
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

      console.log(
        `Push enviado para ${notif.id}: ${response.successCount} éxitos, ${response.failureCount} fallos.`
      );

      await docRef.update({
        estado: 'enviado',
        fechaEnvio: Date.now(),
        exitosCount: response.successCount,
        fallosCount: response.failureCount,
      });
    } catch (err: any) {
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
  public detenerDespachador(): void {
    if (this.unsubscribeListener) {
      this.unsubscribeListener();
      this.unsubscribeListener = null;
      console.log('Despachador push detenido.');
    }
  }
}

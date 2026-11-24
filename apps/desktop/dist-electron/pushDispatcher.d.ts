export declare class PushDispatcherService {
    private db;
    private messaging;
    private unsubscribeListener;
    private horarioSilencio;
    constructor();
    /**
     * Carga y sincroniza la configuración de horario de silencio
     */
    iniciarSincronizacionHorario(): Promise<void>;
    /**
     * Evalúa si el instante actual se encuentra dentro del horario de silencio docente
     */
    estaEnHorarioSilencio(ahora?: Date): boolean;
    /**
     * Inicia el trabajador en segundo plano que escucha la cola de notificaciones
     * en Firestore (Plan Spark 0 €: el PC de secretaría actúa como servidor local)
     */
    iniciarDespachador(): void;
    /**
     * Procesa un ítem de la cola de notificaciones
     */
    private procesarNotificacion;
    /**
     * Detiene el despachador
     */
    detenerDespachador(): void;
}

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
export declare class SetupWizardService {
    private db;
    private auth;
    /**
     * Inicializa Firebase Admin SDK leyendo el serviceAccountKey.json
     */
    inicializarAdminSdk(serviceAccountPath: string): Promise<boolean>;
    /**
     * Ejecuta el asistente de inicialización completa:
     * 1. Despliega la configuración del centro.
     * 2. Inicializa cursos base.
     * 3. Configura el Horario de Silencio escolar.
     * 4. Siembra los recursos y enlaces externos iniciales.
     * 5. Crea el usuario Superadmin inicial y asigna Custom Claims.
     * 6. Genera el payload de enlace para el código QR de las familias.
     */
    ejecutarAsistente(config: SetupWizardConfig): Promise<{
        exito: boolean;
        superadminUid: string;
        qrPayloadUrl: string;
    }>;
}

import { Encuesta } from '@molinillo/shared';
export interface ResumenEncuesta {
    encuesta: Encuesta;
    totalVotos: number;
    recuentoPorOpcion: {
        opcionId: number;
        texto: string;
        votos: number;
        porcentaje: number;
    }[];
    cerrada: boolean;
}
export declare class EncuestasManagerService {
    private db;
    constructor();
    /**
     * Obtiene el recuento en tiempo real de una encuesta agregando los votos de la subcolección
     */
    obtenerRecuentoEncuesta(encuestaId: string): Promise<ResumenEncuesta>;
    /**
     * Exporta los resultados de la encuesta a formato CSV
     */
    exportarEncuestaCsv(resumen: ResumenEncuesta): string;
}

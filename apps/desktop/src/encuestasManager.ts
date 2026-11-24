import * as admin from 'firebase-admin';
import { Encuesta, VotoEncuesta } from '@molinillo/shared';

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

export class EncuestasManagerService {
  private db: admin.firestore.Firestore;

  constructor() {
    this.db = admin.firestore();
  }

  /**
   * Obtiene el recuento en tiempo real de una encuesta agregando los votos de la subcolección
   */
  public async obtenerRecuentoEncuesta(encuestaId: string): Promise<ResumenEncuesta> {
    const encDoc = await this.db.collection('encuestas').doc(encuestaId).get();
    if (!encDoc.exists) {
      throw new Error(`La encuesta ${encuestaId} no existe.`);
    }

    const encuesta = { id: encDoc.id, ...encDoc.data() } as Encuesta;
    const votosSnap = await this.db
      .collection('encuestas')
      .doc(encuestaId)
      .collection('votos')
      .get();

    const totalVotos = votosSnap.size;
    const contadorPorOpcion: Record<number, number> = {};

    encuesta.opciones.forEach((op) => {
      contadorPorOpcion[op.id] = 0;
    });

    votosSnap.docs.forEach((doc) => {
      const voto = doc.data() as VotoEncuesta;
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
  public exportarEncuestaCsv(resumen: ResumenEncuesta): string {
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

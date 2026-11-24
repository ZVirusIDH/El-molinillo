import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
  Download,
  Users,
  Check,
} from 'lucide-react';
import { Alumno, ProgenitorVinculado } from '@molinillo/shared';

interface Props {
  onImportar: (alumnosNuevos: Omit<Alumno, 'id' | 'activo'>[]) => void;
  onClose: () => void;
}

export const ImportadorExcelModal: React.FC<Props> = ({ onImportar, onClose }) => {
  const [datosPrevisualizacion, setDatosPrevisualizacion] = useState<Omit<Alumno, 'id' | 'activo'>[]>([]);
  const [nombreArchivo, setNombreArchivo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Genera y descarga una plantilla CSV lista para rellenar
  const handleDescargarPlantilla = () => {
    const csvContent =
      'Nombre Alumno;Apellidos Alumno;Curso;Padres Separados (SI/NO);Prog 1 Nombre;Prog 1 Apellidos;Prog 1 Email;Prog 1 Telefono;Prog 1 Parentesco;Prog 2 Nombre;Prog 2 Apellidos;Prog 2 Email;Prog 2 Telefono;Prog 2 Parentesco;Prog 3 Nombre;Prog 3 Apellidos;Prog 3 Email;Prog 3 Telefono;Prog 3 Parentesco\n' +
      'Niño;1;1P;NO;Madre;1;madre1@ejemplo.es;600111222;madre;Padre;1;padre1@ejemplo.es;600333444;padre;;;;;\n' +
      'Niña;2;3P;SI;Madre;2;madre2@ejemplo.es;611555666;madre;Padre;2;padre2@ejemplo.es;622777888;padre;Tutor;Legal;tutorlegal@ejemplo.es;633999000;tutor_legal';

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Plantilla_Alumnos_Familias_Molinillo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setNombreArchivo(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (rows.length === 0) {
          throw new Error('El archivo no contiene filas con datos.');
        }

        const parseados: Omit<Alumno, 'id' | 'activo'>[] = rows.map((row) => {
          // Extraer campos del alumno
          const nombre =
            row['Nombre Alumno'] || row['Nombre'] || row['nombre'] || row['alumno'] || 'Sin Nombre';
          const apellidos =
            row['Apellidos Alumno'] || row['Apellidos'] || row['apellidos'] || '';
          const cursoId = (row['Curso'] || row['curso'] || '1P').toString().trim().toUpperCase();
          const separadosRaw = (
            row['Padres Separados (SI/NO)'] ||
            row['Separados'] ||
            row['separados'] ||
            ''
          )
            .toString()
            .toUpperCase();
          const padresSeparados = separadosRaw === 'SI' || separadosRaw === 'S' || separadosRaw === 'TRUE';

          // Progenitores dinámicos (hasta 3 o más si vienen en columnas)
          const progenitores: ProgenitorVinculado[] = [];

          // Progenitor 1
          const p1Nombre = row['Prog 1 Nombre'] || row['Padre 1 Nombre'] || row['Madre'] || '';
          const p1Apellidos = row['Prog 1 Apellidos'] || '';
          const p1Email = row['Prog 1 Email'] || row['Email 1'] || '';
          const p1Tel = row['Prog 1 Telefono'] || row['Telefono 1'] || '';
          const p1Parentesco = (row['Prog 1 Parentesco'] || 'madre').toLowerCase();

          if (p1Nombre.trim() || p1Email.trim()) {
            progenitores.push({
              uid: 'user-import-' + Math.random().toString(36).substring(2, 9),
              nombre: p1Nombre.trim() || 'Familiar 1',
              apellidos: p1Apellidos.trim(),
              email: p1Email.trim() || 'pendiente@colegio.es',
              telefono: p1Tel.toString(),
              parentesco: p1Parentesco as any,
              custodia: true,
            });
          }

          // Progenitor 2
          const p2Nombre = row['Prog 2 Nombre'] || row['Padre 2 Nombre'] || row['Padre'] || '';
          const p2Apellidos = row['Prog 2 Apellidos'] || '';
          const p2Email = row['Prog 2 Email'] || row['Email 2'] || '';
          const p2Tel = row['Prog 2 Telefono'] || row['Telefono 2'] || '';
          const p2Parentesco = (row['Prog 2 Parentesco'] || 'padre').toLowerCase();

          if (p2Nombre.trim() || p2Email.trim()) {
            progenitores.push({
              uid: 'user-import-' + Math.random().toString(36).substring(2, 9),
              nombre: p2Nombre.trim() || 'Familiar 2',
              apellidos: p2Apellidos.trim(),
              email: p2Email.trim() || 'pendiente2@colegio.es',
              telefono: p2Tel.toString(),
              parentesco: p2Parentesco as any,
              custodia: true,
            });
          }

          // Progenitor 3 (si existe)
          const p3Nombre = row['Prog 3 Nombre'] || row['Tutor 3 Nombre'] || '';
          const p3Apellidos = row['Prog 3 Apellidos'] || '';
          const p3Email = row['Prog 3 Email'] || '';
          const p3Tel = row['Prog 3 Telefono'] || '';
          const p3Parentesco = (row['Prog 3 Parentesco'] || 'tutor_legal').toLowerCase();

          if (p3Nombre.trim() || p3Email.trim()) {
            progenitores.push({
              uid: 'user-import-' + Math.random().toString(36).substring(2, 9),
              nombre: p3Nombre.trim() || 'Familiar 3',
              apellidos: p3Apellidos.trim(),
              email: p3Email.trim() || 'pendiente3@colegio.es',
              telefono: p3Tel.toString(),
              parentesco: p3Parentesco as any,
              custodia: true,
            });
          }

          return {
            nombre: nombre.toString().trim(),
            apellidos: apellidos.toString().trim(),
            cursoId,
            cursoNombre: `${cursoId} - CEIP El Molinillo`,
            tutorUid: '',
            padresSeparados,
            progenitores,
          };
        });

        setDatosPrevisualizacion(parseados);
      } catch (err: any) {
        setError(err.message || 'Error al procesar el archivo Excel o CSV.');
        setDatosPrevisualizacion([]);
      }
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmarImportacion = () => {
    if (datosPrevisualizacion.length === 0) return;
    onImportar(datosPrevisualizacion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white w-[calc(100%-20px)] max-w-3xl rounded-3xl shadow-2xl p-4 sm:p-6 space-y-4 my-auto max-h-[88vh] overflow-y-auto border border-slate-200 animate-modal-popup">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
            <span>Importación Masiva de Alumnos y Familias (Excel / CSV)</span>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Explicación y Descarga de Plantilla */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="font-bold text-slate-900">Minimización de Datos RGPD</p>
            <p className="text-slate-500">
              Solo se importan los datos mínimos indispensables para la comunicación escolar: nombres de los alumnos, curso y los datos de contacto de sus progenitores (admite más de 2).
            </p>
          </div>
          <button
            onClick={handleDescargarPlantilla}
            className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 rounded-lg font-semibold flex items-center gap-1.5 shrink-0 transition shadow-sm"
          >
            <Download className="w-4 h-4 text-emerald-700" />
            <span>Descargar Plantilla CSV</span>
          </button>
        </div>

        {/* Zona de Carga */}
        <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-6 text-center space-y-2 transition bg-slate-50/50">
          <input
            type="file"
            id="file-upload"
            accept=".xlsx, .xls, .csv"
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer flex flex-col items-center justify-center space-y-2"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-slate-900 text-xs">
                {nombreArchivo ? nombreArchivo : 'Haz clic aquí para seleccionar tu archivo Excel (.xlsx) o CSV'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Compatible con exportaciones de Plumier XXI, Mirador, Educarm, Additio o Excel personalizado
              </p>
            </div>
          </label>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded-xl text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Previsualización de los datos parseados */}
        {datosPrevisualizacion.length > 0 && (
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-600">
              <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                {datosPrevisualizacion.length} alumnos detectados y listos para importar:
              </span>
              <span className="text-slate-400">Verifique los datos antes de confirmar</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto bg-white">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-700 uppercase">
                    <th className="p-2.5">Alumno</th>
                    <th className="p-2.5">Curso</th>
                    <th className="p-2.5">Régimen</th>
                    <th className="p-2.5">Progenitores Detectados</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {datosPrevisualizacion.map((alum, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">
                        {alum.nombre} {alum.apellidos}
                      </td>
                      <td className="p-2.5">{alum.cursoId}</td>
                      <td className="p-2.5">
                        {alum.padresSeparados ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                            Separados
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[11px]">Ordinario</span>
                        )}
                      </td>
                      <td className="p-2.5 text-slate-600">
                        {alum.progenitores.map((p, i) => (
                          <span key={i} className="inline-block mr-2 text-[11px]">
                            &bull; {p.nombre} ({p.parentesco})
                          </span>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-slate-600 font-semibold text-xs"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={datosPrevisualizacion.length === 0}
            onClick={handleConfirmarImportacion}
            className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 text-white font-semibold rounded-lg text-xs shadow-sm transition flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirmar e Importar {datosPrevisualizacion.length} Alumnos</span>
          </button>
        </div>
      </div>
    </div>
  );
};

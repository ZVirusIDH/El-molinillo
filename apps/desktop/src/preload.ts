import { contextBridge, ipcRenderer } from 'electron';
import { SetupWizardConfig } from './setupWizard.js';

contextBridge.exposeInMainWorld('electronAPI', {
  ejecutarWizard: (config: SetupWizardConfig) => ipcRenderer.invoke('wizard:ejecutar', config),
  listarSolicitudesPendientes: () => ipcRenderer.invoke('roles:listar-pendientes'),
  aprobarPadre: (uid: string, cursoId: string, grupos: string[], tutorId?: string) =>
    ipcRenderer.invoke('roles:aprobar-padre', uid, cursoId, grupos, tutorId),
  obtenerRecuentoEncuesta: (encuestaId: string) =>
    ipcRenderer.invoke('encuestas:obtener-recuento', encuestaId),
  toggleDespachadorPush: (activo: boolean) =>
    ipcRenderer.invoke('push:toggle-despachador', activo),
});

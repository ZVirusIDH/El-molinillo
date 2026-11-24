"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    ejecutarWizard: (config) => electron_1.ipcRenderer.invoke('wizard:ejecutar', config),
    listarSolicitudesPendientes: () => electron_1.ipcRenderer.invoke('roles:listar-pendientes'),
    aprobarPadre: (uid, cursoId, grupos, tutorId) => electron_1.ipcRenderer.invoke('roles:aprobar-padre', uid, cursoId, grupos, tutorId),
    obtenerRecuentoEncuesta: (encuestaId) => electron_1.ipcRenderer.invoke('encuestas:obtener-recuento', encuestaId),
    toggleDespachadorPush: (activo) => electron_1.ipcRenderer.invoke('push:toggle-despachador', activo),
});

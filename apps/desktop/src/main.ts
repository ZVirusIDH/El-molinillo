import { app, BrowserWindow, ipcMain } from 'electron';
import * as path from 'path';
import { SetupWizardService, SetupWizardConfig } from './setupWizard.js';
import { PushDispatcherService } from './pushDispatcher.js';
import { RolesManagerService } from './rolesManager.js';
import { EncuestasManagerService } from './encuestasManager.js';

let mainWindow: BrowserWindow | null = null;
let pushDispatcher: PushDispatcherService | null = null;
let rolesManager: RolesManagerService | null = null;
let encuestasManager: EncuestasManagerService | null = null;
const setupWizard = new SetupWizardService();

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'Molinillo - Panel de Dirección y Secretaría (CEIP El Molinillo)',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // En desarrollo carga la URL local de Vite; en producción el dist empaquetado
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173/?view=desktop');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../web-pwa/dist/index.html'), {
      query: { view: 'desktop' },
    });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Registrar IPC Handlers para la comunicación segura con el Renderer
  ipcMain.handle('wizard:ejecutar', async (_event, config: SetupWizardConfig) => {
    const res = await setupWizard.ejecutarAsistente(config);
    // Tras inicializar con éxito, arrancar el despachador push y los servicios
    pushDispatcher = new PushDispatcherService();
    pushDispatcher.iniciarDespachador();
    rolesManager = new RolesManagerService();
    encuestasManager = new EncuestasManagerService();
    return res;
  });

  ipcMain.handle('roles:listar-pendientes', async () => {
    if (!rolesManager) return [];
    return await rolesManager.listarSolicitudesPendientes();
  });

  ipcMain.handle('roles:aprobar-padre', async (_event, uid: string, cursoId: string, grupos: string[], tutorId?: string) => {
    if (!rolesManager) throw new Error('Servicio de roles no inicializado.');
    await rolesManager.aprobarPadre(uid, cursoId, grupos, tutorId);
    return { ok: true };
  });

  ipcMain.handle('encuestas:obtener-recuento', async (_event, encuestaId: string) => {
    if (!encuestasManager) throw new Error('Servicio de encuestas no inicializado.');
    return await encuestasManager.obtenerRecuentoEncuesta(encuestaId);
  });

  ipcMain.handle('push:toggle-despachador', async (_event, activo: boolean) => {
    if (!pushDispatcher) pushDispatcher = new PushDispatcherService();
    if (activo) {
      pushDispatcher.iniciarDespachador();
    } else {
      pushDispatcher.detenerDespachador();
    }
    return { activo };
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (pushDispatcher) {
    pushDispatcher.detenerDespachador();
  }
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

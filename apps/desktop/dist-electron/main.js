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
const electron_1 = require("electron");
const path = __importStar(require("path"));
const setupWizard_js_1 = require("./setupWizard.js");
const pushDispatcher_js_1 = require("./pushDispatcher.js");
const rolesManager_js_1 = require("./rolesManager.js");
const encuestasManager_js_1 = require("./encuestasManager.js");
let mainWindow = null;
let pushDispatcher = null;
let rolesManager = null;
let encuestasManager = null;
const setupWizard = new setupWizard_js_1.SetupWizardService();
function createWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 850,
        minWidth: 1024,
        minHeight: 700,
        title: 'Molinillo - Panel de Dirección y Secretaría (CEIP Santa María del Buen Aire)',
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
    }
    else {
        mainWindow.loadFile(path.join(__dirname, '../../web-pwa/dist/index.html'), {
            query: { view: 'desktop' },
        });
    }
    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}
electron_1.app.whenReady().then(() => {
    createWindow();
    // Registrar IPC Handlers para la comunicación segura con el Renderer
    electron_1.ipcMain.handle('wizard:ejecutar', async (_event, config) => {
        const res = await setupWizard.ejecutarAsistente(config);
        // Tras inicializar con éxito, arrancar el despachador push y los servicios
        pushDispatcher = new pushDispatcher_js_1.PushDispatcherService();
        pushDispatcher.iniciarDespachador();
        rolesManager = new rolesManager_js_1.RolesManagerService();
        encuestasManager = new encuestasManager_js_1.EncuestasManagerService();
        return res;
    });
    electron_1.ipcMain.handle('roles:listar-pendientes', async () => {
        if (!rolesManager)
            return [];
        return await rolesManager.listarSolicitudesPendientes();
    });
    electron_1.ipcMain.handle('roles:aprobar-padre', async (_event, uid, cursoId, grupos, tutorId) => {
        if (!rolesManager)
            throw new Error('Servicio de roles no inicializado.');
        await rolesManager.aprobarPadre(uid, cursoId, grupos, tutorId);
        return { ok: true };
    });
    electron_1.ipcMain.handle('encuestas:obtener-recuento', async (_event, encuestaId) => {
        if (!encuestasManager)
            throw new Error('Servicio de encuestas no inicializado.');
        return await encuestasManager.obtenerRecuentoEncuesta(encuestaId);
    });
    electron_1.ipcMain.handle('push:toggle-despachador', async (_event, activo) => {
        if (!pushDispatcher)
            pushDispatcher = new pushDispatcher_js_1.PushDispatcherService();
        if (activo) {
            pushDispatcher.iniciarDespachador();
        }
        else {
            pushDispatcher.detenerDespachador();
        }
        return { activo };
    });
    electron_1.app.on('activate', () => {
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on('window-all-closed', () => {
    if (pushDispatcher) {
        pushDispatcher.detenerDespachador();
    }
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});

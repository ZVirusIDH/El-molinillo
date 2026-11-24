import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, doc, setDoc, addDoc, onSnapshot } from 'firebase/firestore';
import { getMessaging, Messaging, isSupported, getToken } from 'firebase/messaging';
import { FirebaseClientConfig, CentroInfo } from '@molinillo/shared';

const STORAGE_KEY_CONFIG = 'molinillo_firebase_config';
const STORAGE_KEY_CENTRO = 'molinillo_centro_info';

export type { CentroInfo };

export const PROYECTO_PRUEBAS_FIREBASE_CONFIG: FirebaseClientConfig = {
  apiKey: "TU_FIREBASE_API_KEY",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:0000000000000000000000",
  measurementId: "G-XXXXXXXXXX",
  vapidKey: "TU_VAPID_KEY",
};

export const DEFAULT_CENTRO_CONFIG: CentroInfo = {
  nombreCentro: 'CEIP El Molinillo',
  codigoCentro: '00000000',
  direccion: 'Avenida de la Educación, 1, 28001 Madrid',
  telefono: '900 000 000',
  email: 'contacto@colegiodemo.es',
  horarioAtencion: 'Lunes a Viernes de 09:00 a 14:00 h',
};

// Guarda la configuración tanto en localStorage como en IndexedDB para el Service Worker
export async function guardarConfiguracionCentro(
  config: FirebaseClientConfig,
  centro: CentroInfo
): Promise<void> {
  localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(config));
  localStorage.setItem(STORAGE_KEY_CENTRO, JSON.stringify(centro));

  // Guardar en IndexedDB para el Service Worker (firebase-messaging-sw.js)
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('MolinilloDB', 1);

    request.onerror = () => reject(request.error);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('configuracion')) {
        db.createObjectStore('configuracion');
      }
    };

    request.onsuccess = () => {
      const db = request.result;
      const transaction = db.transaction(['configuracion'], 'readwrite');
      const store = transaction.objectStore('configuracion');
      store.put(config, 'firebaseConfig');
      store.put(centro, 'centroInfo');

      transaction.oncomplete = () => {
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };
  });
}

// Obtiene la configuración desde localStorage o el proyecto de pruebas por defecto
export function obtenerConfiguracionGuardada(): { config: FirebaseClientConfig | null; centro: CentroInfo | null } {
  try {
    const rawConfig = localStorage.getItem(STORAGE_KEY_CONFIG);
    const rawCentro = localStorage.getItem(STORAGE_KEY_CENTRO);

    const config = rawConfig ? JSON.parse(rawConfig) : PROYECTO_PRUEBAS_FIREBASE_CONFIG;
    const centro = rawCentro ? JSON.parse(rawCentro) : DEFAULT_CENTRO_CONFIG;

    return { config, centro };
  } catch (error) {
    console.error('Error al leer configuración almacenada:', error);
    return { config: PROYECTO_PRUEBAS_FIREBASE_CONFIG, centro: DEFAULT_CENTRO_CONFIG };
  }
}

// Parsea y auto-configura si la URL contiene un token base64 (?c=...)
export function detectarConfiguracionEnUrl(): { config: FirebaseClientConfig; centro: CentroInfo } | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('c');
    if (!encoded) return null;

    const decoded = atob(decodeURIComponent(encoded));
    const data = JSON.parse(decoded);

    if (data.firebaseConfig && data.codigoCentro) {
      // Limpiar el parámetro de la URL sin recargar la página para una URL limpia
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);

      const centro: CentroInfo = {
        nombreCentro: data.nombreCentro || 'Centro Escolar',
        codigoCentro: data.codigoCentro,
      };

      guardarConfiguracionCentro(data.firebaseConfig, centro);
      return { config: data.firebaseConfig, centro };
    }
  } catch (error) {
    console.warn('Parámetro de configuración en URL inválido o corrupto:', error);
  }
  return null;
}

// Inicializa Firebase SDK dinámicamente
export function inicializarFirebase(config: FirebaseClientConfig = PROYECTO_PRUEBAS_FIREBASE_CONFIG): {
  app: FirebaseApp;
  auth: Auth;
  db: Firestore;
  messagingPromise: Promise<Messaging | null>;
} {
  const app = getApps().length > 0 ? getApp() : initializeApp(config);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const messagingPromise = isSupported().then((supported) => {
    if (supported && typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      return getMessaging(app);
    }
    return null;
  });

  return { app, auth, db, messagingPromise };
}

// Registro del Service Worker asegurando estado ready
export async function registrarServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      const reg = await navigator.serviceWorker.ready;
      return reg;
    } catch (error) {
      console.warn('No se pudo registrar el Service Worker:', error);
    }
  }
  return null;
}

// Solicita permiso al usuario y obtiene el token FCM del dispositivo
export async function solicitarPermisoNotificaciones(
  config: FirebaseClientConfig = PROYECTO_PRUEBAS_FIREBASE_CONFIG
): Promise<string | null> {
  if (typeof window === 'undefined') {
    return null;
  }

  // Verificación de contexto seguro (HTTPS o localhost)
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    console.warn(
      'Web Push requiere conexión HTTPS o localhost. En redes locales HTTP (192.168.x.x) los móviles desactivan el Service Worker.'
    );
  }

  if (!('Notification' in window)) {
    console.warn('Este dispositivo o navegador no soporta Notificaciones Push.');
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Permiso de notificaciones denegado por el usuario.');
      return null;
    }

    const swReg = await registrarServiceWorker();
    await guardarConfiguracionCentro(config, DEFAULT_CENTRO_CONFIG);

    const { messagingPromise } = inicializarFirebase(config);
    const messaging = await messagingPromise;

    if (messaging && swReg && config.vapidKey) {
      try {
        const token = await getToken(messaging, {
          vapidKey: config.vapidKey,
          serviceWorkerRegistration: swReg,
        });
        if (token) {
          console.log('Token FCM obtenido:', token);
          return token;
        }
      } catch (tokenError) {
        console.warn('Aviso al obtener token FCM de Google:', tokenError);
      }
    }

    // Si el permiso del navegador fue concedido, generar identificador local para Firestore
    const localDeviceId = 'disp-' + Math.random().toString(36).substring(2, 10);
    return localDeviceId;
  } catch (error) {
    console.warn('Error al solicitar permiso de notificaciones:', error);
  }
  return null;
}

// Muestra una notificación visual en el sistema operativo del usuario (compatible con Android y PC)
export function dispararNotificacionSistema(
  titulo: string,
  cuerpo: string,
  urlDestino: string = '/'
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    const options: any = {
      body: cuerpo,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: urlDestino },
      vibrate: [200, 100, 200],
      tag: 'molinillo-' + Date.now(),
      requireInteraction: false,
    };

    // 1. En entornos de escritorio (Windows, Mac, Linux), new Notification es inmediato
    try {
      const notif = new Notification(titulo, options);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch {
      // 2. Fallback para Android Chrome donde new Notification() está restringido
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready
          .then((reg) => {
            reg.showNotification(titulo, options).catch((err) => {
              console.warn('Error en reg.showNotification:', err);
            });
          })
          .catch(() => {});
      }
    }

    // 3. Para dispositivos con Service Worker listo, asegurar también recepción por SW
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(titulo, options).catch(() => {});
        })
        .catch(() => {});
    }
  }
}

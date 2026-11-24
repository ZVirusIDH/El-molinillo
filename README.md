# El Molinillo

Plataforma integral de comunicación y gestión escolar diseñada para centros educativos, profesorado, familias y asociaciones de familias (AMPA). Funciona como Progressive Web App (PWA) de alto rendimiento, compatible con ordenadores y dispositivos móviles.

Comprehensive school management and communication platform designed for schools, teachers, families, and parent-teacher associations (PTA/AMPA). Built as a high-performance Progressive Web App (PWA) supporting desktops and mobile devices.

---

## Índice / Table of Contents
1. [Características Principales / Main Features](#características-principales--main-features)
2. [Estructura del Proyecto / Project Structure](#estructura-del-proyecto--project-structure)
3. [Requisitos Previos / Prerequisites](#requisitos-previos--prerequisites)
4. [Instalación Local / Local Setup](#instalación-local--local-setup)
5. [Guía de Configuración de Firebase / Firebase Setup Guide](#guía-de-configuración-de-firebase--firebase-setup-guide)
   - [Español](#español---configuración-de-firebase)
   - [English](#english---firebase-setup)
6. [Licencia / License](#licencia--license)

---

## Características Principales / Main Features

### En Español
- **Perfiles y Roles Integrados**: Soporte nativo para Dirección y Secretaría, Docentes/Tutores, Familias y AMPA con vistas y permisos dedicados.
- **Circulares Oficiales**: Creación y distribución segmentada por curso, etapa o comunidad completa, con soporte de plantillas de emergencia y confirmación de lectura.
- **Autorizaciones y Firmas Digitales**: Gestión de excursiones y actividades con firmas de uno o ambos progenitores según régimen de custodia.
- **Desconexión Digital Docente**: Pausa programada de avisos fuera del horario escolar para respetar el descanso del profesorado, con bypass de urgencia y actualización manual.
- **Expedientes de Alumnos Optimizados**: Búsqueda en tiempo real por nombre y apellidos, vista contraída por defecto y acceso rápido a canales de mensajería tutorizada.
- **Calendario Escolar y Eventos**: Sincronización con Google Calendar y calendarios Apple (formato .ics).
- **Notificaciones Push**: Compatibilidad con Web Push y Firebase Cloud Messaging (FCM).

### In English
- **Multi-Role Support**: Dedicated dashboards for Administration, Teachers, Families, and Parent Associations (PTA/AMPA).
- **Official Notices & Newsletters**: Audience filtering (class, stage, or entire school), emergency templates, and read receipts.
- **Digital Authorizations**: Permission slips requiring single or dual parent signatures depending on custody arrangements.
- **Teacher Digital Disconnection**: Scheduled notification silence outside work hours with emergency overrides.
- **Streamlined Student Records**: Real-time student search, compact collapsible cards, and direct communication channels.
- **School Calendar**: Event scheduling with Google Calendar and Apple Calendar (.ics) export.
- **Web Push Notifications**: Firebase Cloud Messaging (FCM) integration.

---

## Estructura del Proyecto / Project Structure

```text
Molinillo/
├── apps/
│   ├── web-pwa/            # Aplicación web PWA (React + TypeScript + Vite + Tailwind)
│   └── desktop/            # Aplicación de escritorio complementaria (Electron)
├── packages/
│   └── shared/             # Modelos, contratos de datos y utilidades compartidas
├── firebase.json           # Configuración de Firebase Hosting y Firestore
├── firestore.rules         # Reglas de seguridad declarativas de Firestore
└── package.json            # Configuración del monorepositorio npm workspaces
```

---

## Requisitos Previos / Prerequisites
- Node.js (versión 18 o superior / version 18+)
- npm (versión 9 o superior / version 9+)

---

## Instalación Local / Local Setup

```bash
# 1. Instalar dependencias del proyecto / Install dependencies
npm install

# 2. Iniciar servidor de desarrollo / Start development server
npm --workspace=apps/web-pwa run dev
```

El servidor local se iniciará por defecto en `http://localhost:5173`.
The local dev server starts at `http://localhost:5173`.

---

## Guía de Configuración de Firebase / Firebase Setup Guide

### Español - Configuración de Firebase

1. **Crear Proyecto en Firebase**:
   - Entra en [Firebase Console](https://console.firebase.google.com/) y crea un proyecto nuevo.
   - Añade una aplicación Web para obtener las credenciales (`apiKey`, `projectId`, etc.).

2. **Habilitar Servicios**:
   - **Cloud Firestore**: Crea una base de datos en modo producción y aplica el archivo `firestore.rules` del proyecto.
   - **Firebase Hosting**: Habilita Hosting para el despliegue del frontend compilado.
   - **Cloud Messaging (FCM)**: En la pestaña de mensajería de tu proyecto web, genera un par de claves Web Push (VAPID key).

3. **Configurar Credenciales en la Aplicación**:
   - Puedes ingresar las credenciales desde la propia interfaz de la PWA (modal de ajustes de centro) o actualizar `apps/web-pwa/src/config/dynamic-firebase.ts`.

4. **Compilar y Desplegar**:
   ```bash
   # Compilar la aplicación web
   npm --workspace=apps/web-pwa run build

   # Desplegar en Firebase Hosting
   npx firebase-tools deploy --only hosting
   ```

---

### English - Firebase Setup

1. **Create Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/) and create a new project.
   - Register a Web Application to obtain your configuration keys (`apiKey`, `projectId`, etc.).

2. **Enable Services**:
   - **Cloud Firestore**: Create a database and apply the provided `firestore.rules`.
   - **Firebase Hosting**: Enable Hosting for serving production builds.
   - **Cloud Messaging (FCM)**: Generate Web Push certificates (VAPID key) in your project settings.

3. **Configure Application Credentials**:
   - Enter your credentials through the in-app administration modal or adjust `apps/web-pwa/src/config/dynamic-firebase.ts`.

4. **Build and Deploy**:
   ```bash
   # Build the web application
   npm --workspace=apps/web-pwa run build

   # Deploy to Firebase Hosting
   npx firebase-tools deploy --only hosting
   ```

---

## Licencia / License

Este proyecto se distribuye bajo la licencia de código abierto MIT. Consulta el archivo `LICENSE` para más información.
This project is open-source and available under the MIT License. See the `LICENSE` file for details.

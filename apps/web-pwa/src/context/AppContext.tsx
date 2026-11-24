import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  UsuarioPerfil,
  Curso,
  Alumno,
  Aviso,
  ExpedienteFirmaAutorizacion,
  Conversacion,
  Mensaje,
  NotificacionPushCola,
  RolUsuario,
  Encuesta,
  VotoEncuesta,
  EventoEscolar,
  JustificanteAusencia,
  RecursoExterno,
  HorarioSilencioConfig,
  GrupoPersonalizado,
  PermisosGrupo,
  OrganoEmisor,
  VisibilidadDatosCentro,
  HorarioNotificacionesProfesor,
} from '@molinillo/shared';
import {
  obtenerConfiguracionGuardada,
  guardarConfiguracionCentro,
  PROYECTO_PRUEBAS_FIREBASE_CONFIG,
  inicializarFirebase,
  solicitarPermisoNotificaciones,
  dispararNotificacionSistema,
  CentroInfo,
} from '../config/dynamic-firebase';
import { collection, addDoc, onSnapshot, query, orderBy, limit, doc, setDoc } from 'firebase/firestore';

// Horario docente por defecto (Desconexión Digital Automática)
export const DEFAULT_HORARIO_DOCENTE: HorarioNotificacionesProfesor = {
  activo: true,
  horaInicio: '08:30',
  horaFin: '15:00',
  diasLectivos: [1, 2, 3, 4, 5],
  silenciarFinesDeSemana: true,
};

export const calcularEstaEnHorarioNotificaciones = (
  horario?: HorarioNotificacionesProfesor
): boolean => {
  if (!horario || !horario.activo) return true;
  const ahora = new Date();
  const dia = ahora.getDay(); // 0=Dom, 1=Lun ... 6=Sab
  if (horario.silenciarFinesDeSemana && (dia === 0 || dia === 6)) {
    return false;
  }
  if (horario.diasLectivos && !horario.diasLectivos.includes(dia)) {
    return false;
  }
  const [hIni, mIni] = (horario.horaInicio || '08:30').split(':').map(Number);
  const [hFin, mFin] = (horario.horaFin || '15:00').split(':').map(Number);
  const minActual = ahora.getHours() * 60 + ahora.getMinutes();
  const minIni = (isNaN(hIni) ? 8 : hIni) * 60 + (isNaN(mIni) ? 30 : mIni);
  const minFin = (isNaN(hFin) ? 15 : hFin) * 60 + (isNaN(mFin) ? 0 : mFin);
  return minActual >= minIni && minActual <= minFin;
};

// Datos de demostración enriquecidos para pruebas realistas
const DEMO_CURSOS: Curso[] = [
  { id: 'I3', nombre: 'Infantil 3 años', nivel: 'Infantil', tutorUid: 'prof-i3', tutorNombre: 'Tutor 1', activo: true },
  { id: 'I4', nombre: 'Infantil 4 años', nivel: 'Infantil', tutorUid: 'prof-i4', tutorNombre: 'Tutor 2', activo: true },
  { id: 'I5', nombre: 'Infantil 5 años', nivel: 'Infantil', tutorUid: 'prof-i5', tutorNombre: 'Tutor 3', activo: true },
  { id: '1P', nombre: '1º de Primaria', nivel: 'Primaria', tutorUid: 'prof-1p', tutorNombre: 'Tutor 4', activo: true },
  { id: '2P', nombre: '2º de Primaria', nivel: 'Primaria', tutorUid: 'prof-2p', tutorNombre: 'Tutor 5', activo: true },
  { id: '3P', nombre: '3º de Primaria', nivel: 'Primaria', tutorUid: 'prof-1', tutorNombre: 'Tutor 1', activo: true },
  { id: '4P', nombre: '4º de Primaria', nivel: 'Primaria', tutorUid: 'prof-2', tutorNombre: 'Tutor 7', activo: true },
  { id: '5P', nombre: '5º de Primaria', nivel: 'Primaria', tutorUid: 'prof-5p', tutorNombre: 'Tutor 8', activo: true },
  { id: '6P', nombre: '6º de Primaria', nivel: 'Primaria', tutorUid: 'prof-6p', tutorNombre: 'Tutor 9', activo: true },
];

const DEMO_PROFESORES: UsuarioPerfil[] = [
  {
    uid: 'prof-i3',
    email: 'tutor1@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '1',
    rol: 'profesor',
    cursos: ['I3'],
    fcmTokens: ['token-prof-i3'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 180,
  },
  {
    uid: 'prof-i4',
    email: 'tutor2@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '2',
    rol: 'profesor',
    cursos: ['I4'],
    fcmTokens: ['token-prof-i4'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 170,
  },
  {
    uid: 'prof-i5',
    email: 'tutor3@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '3',
    rol: 'profesor',
    cursos: ['I5'],
    fcmTokens: ['token-prof-i5'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 160,
  },
  {
    uid: 'prof-1p',
    email: 'tutor4@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '4',
    rol: 'profesor',
    cursos: ['1P'],
    fcmTokens: ['token-prof-1p'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 150,
  },
  {
    uid: 'prof-2p',
    email: 'tutor5@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '5',
    rol: 'profesor',
    cursos: ['2P'],
    fcmTokens: ['token-prof-2p'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 140,
  },
  {
    uid: 'prof-1',
    email: 'tutor1@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '1',
    rol: 'profesor',
    cursos: ['3P'],
    fcmTokens: ['token-prof-1'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 120,
  },
  {
    uid: 'prof-2',
    email: 'tutor7@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '7',
    rol: 'profesor',
    cursos: ['4P'],
    fcmTokens: ['token-prof-2'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 110,
  },
  {
    uid: 'prof-5p',
    email: 'tutor8@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '8',
    rol: 'profesor',
    cursos: ['5P'],
    fcmTokens: ['token-prof-5p'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 100,
  },
  {
    uid: 'prof-6p',
    email: 'tutor9@colegiodemo.es',
    nombre: 'Tutor',
    apellidos: '9',
    rol: 'profesor',
    cursos: ['6P'],
    fcmTokens: ['token-prof-6p'],
    activo: true,
    emailVerified: true,
    fechaRegistro: Date.now() - 3600000 * 24 * 90,
  },
];

const DEMO_ALUMNOS: Alumno[] = [
  {
    "id": "alum-i3-1",
    "nombre": "Niño",
    "apellidos": "1",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-1a",
        "nombre": "Padre",
        "apellidos": "1",
        "email": "padre1@colegiodemo.es",
        "telefono": "600000001",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-1b",
        "nombre": "Madre",
        "apellidos": "1",
        "email": "madre1@colegiodemo.es",
        "telefono": "600000001",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-2",
    "nombre": "Niña",
    "apellidos": "2",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-2a",
        "nombre": "Padre",
        "apellidos": "2",
        "email": "padre2@colegiodemo.es",
        "telefono": "600000002",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-2b",
        "nombre": "Madre",
        "apellidos": "2",
        "email": "madre2@colegiodemo.es",
        "telefono": "600000002",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-3",
    "nombre": "Niño",
    "apellidos": "3",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-i3-3a",
        "nombre": "Padre",
        "apellidos": "3",
        "email": "padre3@colegiodemo.es",
        "telefono": "600000003",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-3b",
        "nombre": "Madre",
        "apellidos": "3",
        "email": "madre3@colegiodemo.es",
        "telefono": "600000003",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-4",
    "nombre": "Niña",
    "apellidos": "4",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-4a",
        "nombre": "Padre",
        "apellidos": "4",
        "email": "padre4@colegiodemo.es",
        "telefono": "600000004",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-4b",
        "nombre": "Madre",
        "apellidos": "4",
        "email": "madre4@colegiodemo.es",
        "telefono": "600000004",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-5",
    "nombre": "Niño",
    "apellidos": "5",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-5a",
        "nombre": "Padre",
        "apellidos": "5",
        "email": "padre5@colegiodemo.es",
        "telefono": "600000005",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-5b",
        "nombre": "Madre",
        "apellidos": "5",
        "email": "madre5@colegiodemo.es",
        "telefono": "600000005",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-6",
    "nombre": "Niña",
    "apellidos": "6",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-6a",
        "nombre": "Padre",
        "apellidos": "6",
        "email": "padre6@colegiodemo.es",
        "telefono": "600000006",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-6b",
        "nombre": "Madre",
        "apellidos": "6",
        "email": "madre6@colegiodemo.es",
        "telefono": "600000006",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-7",
    "nombre": "Niño",
    "apellidos": "7",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-7a",
        "nombre": "Padre",
        "apellidos": "7",
        "email": "padre7@colegiodemo.es",
        "telefono": "600000007",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-7b",
        "nombre": "Madre",
        "apellidos": "7",
        "email": "madre7@colegiodemo.es",
        "telefono": "600000007",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-8",
    "nombre": "Niña",
    "apellidos": "8",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-i3-8a",
        "nombre": "Padre",
        "apellidos": "8",
        "email": "padre8@colegiodemo.es",
        "telefono": "600000008",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-8b",
        "nombre": "Madre",
        "apellidos": "8",
        "email": "madre8@colegiodemo.es",
        "telefono": "600000008",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-9",
    "nombre": "Niño",
    "apellidos": "9",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-9a",
        "nombre": "Padre",
        "apellidos": "9",
        "email": "padre9@colegiodemo.es",
        "telefono": "600000009",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-9b",
        "nombre": "Madre",
        "apellidos": "9",
        "email": "madre9@colegiodemo.es",
        "telefono": "600000009",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i3-10",
    "nombre": "Niña",
    "apellidos": "10",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i3-10a",
        "nombre": "Padre",
        "apellidos": "10",
        "email": "padre10@colegiodemo.es",
        "telefono": "600000010",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i3-10b",
        "nombre": "Madre",
        "apellidos": "10",
        "email": "madre10@colegiodemo.es",
        "telefono": "600000010",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I3",
    "cursoNombre": "Infantil 3 años",
    "tutorUid": "prof-i3",
    "activo": true
  },
  {
    "id": "alum-i4-1",
    "nombre": "Niño",
    "apellidos": "11",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-1a",
        "nombre": "Padre",
        "apellidos": "11",
        "email": "padre11@colegiodemo.es",
        "telefono": "600000011",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-1b",
        "nombre": "Madre",
        "apellidos": "11",
        "email": "madre11@colegiodemo.es",
        "telefono": "600000011",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-2",
    "nombre": "Niña",
    "apellidos": "12",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-2a",
        "nombre": "Padre",
        "apellidos": "12",
        "email": "padre12@colegiodemo.es",
        "telefono": "600000012",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-2b",
        "nombre": "Madre",
        "apellidos": "12",
        "email": "madre12@colegiodemo.es",
        "telefono": "600000012",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-3",
    "nombre": "Niño",
    "apellidos": "13",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-3a",
        "nombre": "Padre",
        "apellidos": "13",
        "email": "padre13@colegiodemo.es",
        "telefono": "600000013",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-3b",
        "nombre": "Madre",
        "apellidos": "13",
        "email": "madre13@colegiodemo.es",
        "telefono": "600000013",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-4",
    "nombre": "Niña",
    "apellidos": "14",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-i4-4a",
        "nombre": "Padre",
        "apellidos": "14",
        "email": "padre14@colegiodemo.es",
        "telefono": "600000014",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-4b",
        "nombre": "Madre",
        "apellidos": "14",
        "email": "madre14@colegiodemo.es",
        "telefono": "600000014",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-5",
    "nombre": "Niño",
    "apellidos": "15",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-5a",
        "nombre": "Padre",
        "apellidos": "15",
        "email": "padre15@colegiodemo.es",
        "telefono": "600000015",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-5b",
        "nombre": "Madre",
        "apellidos": "15",
        "email": "madre15@colegiodemo.es",
        "telefono": "600000015",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-6",
    "nombre": "Niña",
    "apellidos": "16",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-6a",
        "nombre": "Padre",
        "apellidos": "16",
        "email": "padre16@colegiodemo.es",
        "telefono": "600000016",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-6b",
        "nombre": "Madre",
        "apellidos": "16",
        "email": "madre16@colegiodemo.es",
        "telefono": "600000016",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-7",
    "nombre": "Niño",
    "apellidos": "17",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-7a",
        "nombre": "Padre",
        "apellidos": "17",
        "email": "padre17@colegiodemo.es",
        "telefono": "600000017",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-7b",
        "nombre": "Madre",
        "apellidos": "17",
        "email": "madre17@colegiodemo.es",
        "telefono": "600000017",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-8",
    "nombre": "Niña",
    "apellidos": "18",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-8a",
        "nombre": "Padre",
        "apellidos": "18",
        "email": "padre18@colegiodemo.es",
        "telefono": "600000018",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-8b",
        "nombre": "Madre",
        "apellidos": "18",
        "email": "madre18@colegiodemo.es",
        "telefono": "600000018",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-9",
    "nombre": "Niño",
    "apellidos": "19",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-9a",
        "nombre": "Padre",
        "apellidos": "19",
        "email": "padre19@colegiodemo.es",
        "telefono": "600000019",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-9b",
        "nombre": "Madre",
        "apellidos": "19",
        "email": "madre19@colegiodemo.es",
        "telefono": "600000019",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i4-10",
    "nombre": "Niña",
    "apellidos": "20",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i4-10a",
        "nombre": "Padre",
        "apellidos": "20",
        "email": "padre20@colegiodemo.es",
        "telefono": "600000020",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i4-10b",
        "nombre": "Madre",
        "apellidos": "20",
        "email": "madre20@colegiodemo.es",
        "telefono": "600000020",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I4",
    "cursoNombre": "Infantil 4 años",
    "tutorUid": "prof-i4",
    "activo": true
  },
  {
    "id": "alum-i5-1",
    "nombre": "Niño",
    "apellidos": "21",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-1a",
        "nombre": "Padre",
        "apellidos": "21",
        "email": "padre21@colegiodemo.es",
        "telefono": "600000021",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-1b",
        "nombre": "Madre",
        "apellidos": "21",
        "email": "madre21@colegiodemo.es",
        "telefono": "600000021",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-2",
    "nombre": "Niña",
    "apellidos": "22",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-2a",
        "nombre": "Padre",
        "apellidos": "22",
        "email": "padre22@colegiodemo.es",
        "telefono": "600000022",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-2b",
        "nombre": "Madre",
        "apellidos": "22",
        "email": "madre22@colegiodemo.es",
        "telefono": "600000022",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-3",
    "nombre": "Niño",
    "apellidos": "23",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-3a",
        "nombre": "Padre",
        "apellidos": "23",
        "email": "padre23@colegiodemo.es",
        "telefono": "600000023",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-3b",
        "nombre": "Madre",
        "apellidos": "23",
        "email": "madre23@colegiodemo.es",
        "telefono": "600000023",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-4",
    "nombre": "Niña",
    "apellidos": "24",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-4a",
        "nombre": "Padre",
        "apellidos": "24",
        "email": "padre24@colegiodemo.es",
        "telefono": "600000024",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-4b",
        "nombre": "Madre",
        "apellidos": "24",
        "email": "madre24@colegiodemo.es",
        "telefono": "600000024",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-5",
    "nombre": "Niño",
    "apellidos": "25",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-i5-5a",
        "nombre": "Padre",
        "apellidos": "25",
        "email": "padre25@colegiodemo.es",
        "telefono": "600000025",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-5b",
        "nombre": "Madre",
        "apellidos": "25",
        "email": "madre25@colegiodemo.es",
        "telefono": "600000025",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-6",
    "nombre": "Niña",
    "apellidos": "26",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-6a",
        "nombre": "Padre",
        "apellidos": "26",
        "email": "padre26@colegiodemo.es",
        "telefono": "600000026",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-6b",
        "nombre": "Madre",
        "apellidos": "26",
        "email": "madre26@colegiodemo.es",
        "telefono": "600000026",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-7",
    "nombre": "Niño",
    "apellidos": "27",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-7a",
        "nombre": "Padre",
        "apellidos": "27",
        "email": "padre27@colegiodemo.es",
        "telefono": "600000027",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-7b",
        "nombre": "Madre",
        "apellidos": "27",
        "email": "madre27@colegiodemo.es",
        "telefono": "600000027",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-8",
    "nombre": "Niña",
    "apellidos": "28",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-8a",
        "nombre": "Padre",
        "apellidos": "28",
        "email": "padre28@colegiodemo.es",
        "telefono": "600000028",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-8b",
        "nombre": "Madre",
        "apellidos": "28",
        "email": "madre28@colegiodemo.es",
        "telefono": "600000028",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-9",
    "nombre": "Niño",
    "apellidos": "29",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-9a",
        "nombre": "Padre",
        "apellidos": "29",
        "email": "padre29@colegiodemo.es",
        "telefono": "600000029",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-9b",
        "nombre": "Madre",
        "apellidos": "29",
        "email": "madre29@colegiodemo.es",
        "telefono": "600000029",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-i5-10",
    "nombre": "Niña",
    "apellidos": "30",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-i5-10a",
        "nombre": "Padre",
        "apellidos": "30",
        "email": "padre30@colegiodemo.es",
        "telefono": "600000030",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-i5-10b",
        "nombre": "Madre",
        "apellidos": "30",
        "email": "madre30@colegiodemo.es",
        "telefono": "600000030",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "I5",
    "cursoNombre": "Infantil 5 años",
    "tutorUid": "prof-i5",
    "activo": true
  },
  {
    "id": "alum-1",
    "nombre": "Niño",
    "apellidos": "31",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "user-padre-1",
        "nombre": "Padre",
        "apellidos": "31",
        "email": "padre31@colegiodemo.es",
        "telefono": "600000031",
        "parentesco": "padre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-ampa-1",
    "nombre": "Niña",
    "apellidos": "32",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "user-ampa-1",
        "nombre": "Madre",
        "apellidos": "32",
        "email": "madre32@colegiodemo.es",
        "telefono": "600000032",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-2",
    "nombre": "Niño",
    "apellidos": "33",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-2a",
        "nombre": "Padre",
        "apellidos": "33",
        "email": "padre33@colegiodemo.es",
        "telefono": "600000033",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-2b",
        "nombre": "Madre",
        "apellidos": "33",
        "email": "madre33@colegiodemo.es",
        "telefono": "600000033",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-3",
    "nombre": "Niña",
    "apellidos": "34",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-3a",
        "nombre": "Padre",
        "apellidos": "34",
        "email": "padre34@colegiodemo.es",
        "telefono": "600000034",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-3b",
        "nombre": "Madre",
        "apellidos": "34",
        "email": "madre34@colegiodemo.es",
        "telefono": "600000034",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-4",
    "nombre": "Niño",
    "apellidos": "35",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-4a",
        "nombre": "Padre",
        "apellidos": "35",
        "email": "padre35@colegiodemo.es",
        "telefono": "600000035",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-4b",
        "nombre": "Madre",
        "apellidos": "35",
        "email": "madre35@colegiodemo.es",
        "telefono": "600000035",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-5",
    "nombre": "Niña",
    "apellidos": "36",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-1p-5a",
        "nombre": "Padre",
        "apellidos": "36",
        "email": "padre36@colegiodemo.es",
        "telefono": "600000036",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-5b",
        "nombre": "Madre",
        "apellidos": "36",
        "email": "madre36@colegiodemo.es",
        "telefono": "600000036",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-6",
    "nombre": "Niño",
    "apellidos": "37",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-6a",
        "nombre": "Padre",
        "apellidos": "37",
        "email": "padre37@colegiodemo.es",
        "telefono": "600000037",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-6b",
        "nombre": "Madre",
        "apellidos": "37",
        "email": "madre37@colegiodemo.es",
        "telefono": "600000037",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-7",
    "nombre": "Niña",
    "apellidos": "38",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-7a",
        "nombre": "Padre",
        "apellidos": "38",
        "email": "padre38@colegiodemo.es",
        "telefono": "600000038",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-7b",
        "nombre": "Madre",
        "apellidos": "38",
        "email": "madre38@colegiodemo.es",
        "telefono": "600000038",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-8",
    "nombre": "Niño",
    "apellidos": "39",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-8a",
        "nombre": "Padre",
        "apellidos": "39",
        "email": "padre39@colegiodemo.es",
        "telefono": "600000039",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-8b",
        "nombre": "Madre",
        "apellidos": "39",
        "email": "madre39@colegiodemo.es",
        "telefono": "600000039",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-9",
    "nombre": "Niña",
    "apellidos": "40",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-9a",
        "nombre": "Padre",
        "apellidos": "40",
        "email": "padre40@colegiodemo.es",
        "telefono": "600000040",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-9b",
        "nombre": "Madre",
        "apellidos": "40",
        "email": "madre40@colegiodemo.es",
        "telefono": "600000040",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-1p-10",
    "nombre": "Niño",
    "apellidos": "41",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-1p-10a",
        "nombre": "Padre",
        "apellidos": "41",
        "email": "padre41@colegiodemo.es",
        "telefono": "600000041",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-1p-10b",
        "nombre": "Madre",
        "apellidos": "41",
        "email": "madre41@colegiodemo.es",
        "telefono": "600000041",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "1P",
    "cursoNombre": "1º de Primaria",
    "tutorUid": "prof-1p",
    "activo": true
  },
  {
    "id": "alum-2p-1",
    "nombre": "Niña",
    "apellidos": "42",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-1a",
        "nombre": "Padre",
        "apellidos": "42",
        "email": "padre42@colegiodemo.es",
        "telefono": "600000042",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-1b",
        "nombre": "Madre",
        "apellidos": "42",
        "email": "madre42@colegiodemo.es",
        "telefono": "600000042",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-2",
    "nombre": "Niño",
    "apellidos": "43",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-2a",
        "nombre": "Padre",
        "apellidos": "43",
        "email": "padre43@colegiodemo.es",
        "telefono": "600000043",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-2b",
        "nombre": "Madre",
        "apellidos": "43",
        "email": "madre43@colegiodemo.es",
        "telefono": "600000043",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-3",
    "nombre": "Niña",
    "apellidos": "44",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-3a",
        "nombre": "Padre",
        "apellidos": "44",
        "email": "padre44@colegiodemo.es",
        "telefono": "600000044",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-3b",
        "nombre": "Madre",
        "apellidos": "44",
        "email": "madre44@colegiodemo.es",
        "telefono": "600000044",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-4",
    "nombre": "Niño",
    "apellidos": "45",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-2p-4a",
        "nombre": "Padre",
        "apellidos": "45",
        "email": "padre45@colegiodemo.es",
        "telefono": "600000045",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-4b",
        "nombre": "Madre",
        "apellidos": "45",
        "email": "madre45@colegiodemo.es",
        "telefono": "600000045",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-5",
    "nombre": "Niña",
    "apellidos": "46",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-5a",
        "nombre": "Padre",
        "apellidos": "46",
        "email": "padre46@colegiodemo.es",
        "telefono": "600000046",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-5b",
        "nombre": "Madre",
        "apellidos": "46",
        "email": "madre46@colegiodemo.es",
        "telefono": "600000046",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-6",
    "nombre": "Niño",
    "apellidos": "47",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-6a",
        "nombre": "Padre",
        "apellidos": "47",
        "email": "padre47@colegiodemo.es",
        "telefono": "600000047",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-6b",
        "nombre": "Madre",
        "apellidos": "47",
        "email": "madre47@colegiodemo.es",
        "telefono": "600000047",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-7",
    "nombre": "Niña",
    "apellidos": "48",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-7a",
        "nombre": "Padre",
        "apellidos": "48",
        "email": "padre48@colegiodemo.es",
        "telefono": "600000048",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-7b",
        "nombre": "Madre",
        "apellidos": "48",
        "email": "madre48@colegiodemo.es",
        "telefono": "600000048",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-8",
    "nombre": "Niño",
    "apellidos": "49",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-8a",
        "nombre": "Padre",
        "apellidos": "49",
        "email": "padre49@colegiodemo.es",
        "telefono": "600000049",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-8b",
        "nombre": "Madre",
        "apellidos": "49",
        "email": "madre49@colegiodemo.es",
        "telefono": "600000049",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-9",
    "nombre": "Niña",
    "apellidos": "50",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-9a",
        "nombre": "Padre",
        "apellidos": "50",
        "email": "padre50@colegiodemo.es",
        "telefono": "600000050",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-9b",
        "nombre": "Madre",
        "apellidos": "50",
        "email": "madre50@colegiodemo.es",
        "telefono": "600000050",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2p-10",
    "nombre": "Niño",
    "apellidos": "51",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-2p-10a",
        "nombre": "Padre",
        "apellidos": "51",
        "email": "padre51@colegiodemo.es",
        "telefono": "600000051",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-2p-10b",
        "nombre": "Madre",
        "apellidos": "51",
        "email": "madre51@colegiodemo.es",
        "telefono": "600000051",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "2P",
    "cursoNombre": "2º de Primaria",
    "tutorUid": "prof-2p",
    "activo": true
  },
  {
    "id": "alum-2",
    "nombre": "Niña",
    "apellidos": "52",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "user-padre-1",
        "nombre": "Padre",
        "apellidos": "52",
        "email": "padre52@colegiodemo.es",
        "telefono": "600000052",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "user-madre-2",
        "nombre": "Madre",
        "apellidos": "52",
        "email": "madre52@colegiodemo.es",
        "telefono": "600000052",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3",
    "nombre": "Niño",
    "apellidos": "53",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "user-padre-3",
        "nombre": "Padre",
        "apellidos": "53",
        "email": "padre53@colegiodemo.es",
        "telefono": "600000053",
        "parentesco": "padre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-3",
    "nombre": "Niña",
    "apellidos": "54",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-3a",
        "nombre": "Padre",
        "apellidos": "54",
        "email": "padre54@colegiodemo.es",
        "telefono": "600000054",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-3b",
        "nombre": "Madre",
        "apellidos": "54",
        "email": "madre54@colegiodemo.es",
        "telefono": "600000054",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-4",
    "nombre": "Niño",
    "apellidos": "55",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-4a",
        "nombre": "Padre",
        "apellidos": "55",
        "email": "padre55@colegiodemo.es",
        "telefono": "600000055",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-4b",
        "nombre": "Madre",
        "apellidos": "55",
        "email": "madre55@colegiodemo.es",
        "telefono": "600000055",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-5",
    "nombre": "Niña",
    "apellidos": "56",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-5a",
        "nombre": "Padre",
        "apellidos": "56",
        "email": "padre56@colegiodemo.es",
        "telefono": "600000056",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-5b",
        "nombre": "Madre",
        "apellidos": "56",
        "email": "madre56@colegiodemo.es",
        "telefono": "600000056",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-6",
    "nombre": "Niño",
    "apellidos": "57",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-6a",
        "nombre": "Padre",
        "apellidos": "57",
        "email": "padre57@colegiodemo.es",
        "telefono": "600000057",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-6b",
        "nombre": "Madre",
        "apellidos": "57",
        "email": "madre57@colegiodemo.es",
        "telefono": "600000057",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-7",
    "nombre": "Niña",
    "apellidos": "58",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-7a",
        "nombre": "Padre",
        "apellidos": "58",
        "email": "padre58@colegiodemo.es",
        "telefono": "600000058",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-7b",
        "nombre": "Madre",
        "apellidos": "58",
        "email": "madre58@colegiodemo.es",
        "telefono": "600000058",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-8",
    "nombre": "Niño",
    "apellidos": "59",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-3p-8a",
        "nombre": "Padre",
        "apellidos": "59",
        "email": "padre59@colegiodemo.es",
        "telefono": "600000059",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-8b",
        "nombre": "Madre",
        "apellidos": "59",
        "email": "madre59@colegiodemo.es",
        "telefono": "600000059",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-9",
    "nombre": "Niña",
    "apellidos": "60",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-9a",
        "nombre": "Padre",
        "apellidos": "60",
        "email": "padre60@colegiodemo.es",
        "telefono": "600000060",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-9b",
        "nombre": "Madre",
        "apellidos": "60",
        "email": "madre60@colegiodemo.es",
        "telefono": "600000060",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-3p-10",
    "nombre": "Niño",
    "apellidos": "61",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-3p-10a",
        "nombre": "Padre",
        "apellidos": "61",
        "email": "padre61@colegiodemo.es",
        "telefono": "600000061",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-3p-10b",
        "nombre": "Madre",
        "apellidos": "61",
        "email": "madre61@colegiodemo.es",
        "telefono": "600000061",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "3P",
    "cursoNombre": "3º de Primaria",
    "tutorUid": "prof-1",
    "activo": true
  },
  {
    "id": "alum-4p-1",
    "nombre": "Niña",
    "apellidos": "62",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-1a",
        "nombre": "Padre",
        "apellidos": "62",
        "email": "padre62@colegiodemo.es",
        "telefono": "600000062",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-1b",
        "nombre": "Madre",
        "apellidos": "62",
        "email": "madre62@colegiodemo.es",
        "telefono": "600000062",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-2",
    "nombre": "Niño",
    "apellidos": "63",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-2a",
        "nombre": "Padre",
        "apellidos": "63",
        "email": "padre63@colegiodemo.es",
        "telefono": "600000063",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-2b",
        "nombre": "Madre",
        "apellidos": "63",
        "email": "madre63@colegiodemo.es",
        "telefono": "600000063",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-3",
    "nombre": "Niña",
    "apellidos": "64",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-3a",
        "nombre": "Padre",
        "apellidos": "64",
        "email": "padre64@colegiodemo.es",
        "telefono": "600000064",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-4b",
        "nombre": "Madre",
        "apellidos": "64",
        "email": "madre64@colegiodemo.es",
        "telefono": "600000064",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-4",
    "nombre": "Niño",
    "apellidos": "65",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-4p-4a",
        "nombre": "Padre",
        "apellidos": "65",
        "email": "padre65@colegiodemo.es",
        "telefono": "600000065",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-4b",
        "nombre": "Madre",
        "apellidos": "65",
        "email": "madre65@colegiodemo.es",
        "telefono": "600000065",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-5",
    "nombre": "Niña",
    "apellidos": "66",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-5a",
        "nombre": "Padre",
        "apellidos": "66",
        "email": "padre66@colegiodemo.es",
        "telefono": "600000066",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-5b",
        "nombre": "Madre",
        "apellidos": "66",
        "email": "madre66@colegiodemo.es",
        "telefono": "600000066",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-6",
    "nombre": "Niño",
    "apellidos": "67",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-6a",
        "nombre": "Padre",
        "apellidos": "67",
        "email": "padre67@colegiodemo.es",
        "telefono": "600000067",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-6b",
        "nombre": "Madre",
        "apellidos": "67",
        "email": "madre67@colegiodemo.es",
        "telefono": "600000067",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-7",
    "nombre": "Niña",
    "apellidos": "68",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-7a",
        "nombre": "Padre",
        "apellidos": "68",
        "email": "padre68@colegiodemo.es",
        "telefono": "600000068",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-7b",
        "nombre": "Madre",
        "apellidos": "68",
        "email": "madre68@colegiodemo.es",
        "telefono": "600000068",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-8",
    "nombre": "Niño",
    "apellidos": "69",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-8a",
        "nombre": "Padre",
        "apellidos": "69",
        "email": "padre69@colegiodemo.es",
        "telefono": "600000069",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-8b",
        "nombre": "Madre",
        "apellidos": "69",
        "email": "madre69@colegiodemo.es",
        "telefono": "600000069",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-9",
    "nombre": "Niña",
    "apellidos": "70",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-9a",
        "nombre": "Padre",
        "apellidos": "70",
        "email": "padre70@colegiodemo.es",
        "telefono": "600000070",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-9b",
        "nombre": "Madre",
        "apellidos": "70",
        "email": "madre70@colegiodemo.es",
        "telefono": "600000070",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-4p-10",
    "nombre": "Niño",
    "apellidos": "71",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-4p-10a",
        "nombre": "Padre",
        "apellidos": "71",
        "email": "padre71@colegiodemo.es",
        "telefono": "600000071",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-4p-10b",
        "nombre": "Madre",
        "apellidos": "71",
        "email": "madre71@colegiodemo.es",
        "telefono": "600000071",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "4P",
    "cursoNombre": "4º de Primaria",
    "tutorUid": "prof-2",
    "activo": true
  },
  {
    "id": "alum-5p-1",
    "nombre": "Niña",
    "apellidos": "72",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-1a",
        "nombre": "Padre",
        "apellidos": "72",
        "email": "padre72@colegiodemo.es",
        "telefono": "600000072",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-1b",
        "nombre": "Madre",
        "apellidos": "72",
        "email": "madre72@colegiodemo.es",
        "telefono": "600000072",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-2",
    "nombre": "Niño",
    "apellidos": "73",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-2a",
        "nombre": "Padre",
        "apellidos": "73",
        "email": "padre73@colegiodemo.es",
        "telefono": "600000073",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-2b",
        "nombre": "Madre",
        "apellidos": "73",
        "email": "madre73@colegiodemo.es",
        "telefono": "600000073",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-3",
    "nombre": "Niña",
    "apellidos": "74",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-3a",
        "nombre": "Padre",
        "apellidos": "74",
        "email": "padre74@colegiodemo.es",
        "telefono": "600000074",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-3b",
        "nombre": "Madre",
        "apellidos": "74",
        "email": "madre74@colegiodemo.es",
        "telefono": "600000074",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-4",
    "nombre": "Niño",
    "apellidos": "75",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-5p-4a",
        "nombre": "Padre",
        "apellidos": "75",
        "email": "padre75@colegiodemo.es",
        "telefono": "600000075",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-4b",
        "nombre": "Madre",
        "apellidos": "75",
        "email": "madre75@colegiodemo.es",
        "telefono": "600000075",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-5",
    "nombre": "Niña",
    "apellidos": "76",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-5a",
        "nombre": "Padre",
        "apellidos": "76",
        "email": "padre76@colegiodemo.es",
        "telefono": "600000076",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-5b",
        "nombre": "Madre",
        "apellidos": "76",
        "email": "madre76@colegiodemo.es",
        "telefono": "600000076",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-6",
    "nombre": "Niño",
    "apellidos": "77",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-6a",
        "nombre": "Padre",
        "apellidos": "77",
        "email": "padre77@colegiodemo.es",
        "telefono": "600000077",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-6b",
        "nombre": "Madre",
        "apellidos": "77",
        "email": "madre77@colegiodemo.es",
        "telefono": "600000077",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-7",
    "nombre": "Niña",
    "apellidos": "78",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-7a",
        "nombre": "Padre",
        "apellidos": "78",
        "email": "padre78@colegiodemo.es",
        "telefono": "600000078",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-7b",
        "nombre": "Madre",
        "apellidos": "78",
        "email": "madre78@colegiodemo.es",
        "telefono": "600000078",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-8",
    "nombre": "Niño",
    "apellidos": "79",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-8a",
        "nombre": "Padre",
        "apellidos": "79",
        "email": "padre79@colegiodemo.es",
        "telefono": "600000079",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-8b",
        "nombre": "Madre",
        "apellidos": "79",
        "email": "madre79@colegiodemo.es",
        "telefono": "600000079",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-9",
    "nombre": "Niña",
    "apellidos": "80",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-9a",
        "nombre": "Padre",
        "apellidos": "80",
        "email": "padre80@colegiodemo.es",
        "telefono": "600000080",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-9b",
        "nombre": "Madre",
        "apellidos": "80",
        "email": "madre80@colegiodemo.es",
        "telefono": "600000080",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-5p-10",
    "nombre": "Niño",
    "apellidos": "81",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-5p-10a",
        "nombre": "Padre",
        "apellidos": "81",
        "email": "padre81@colegiodemo.es",
        "telefono": "600000081",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-5p-10b",
        "nombre": "Madre",
        "apellidos": "81",
        "email": "madre81@colegiodemo.es",
        "telefono": "600000081",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "5P",
    "cursoNombre": "5º de Primaria",
    "tutorUid": "prof-5p",
    "activo": true
  },
  {
    "id": "alum-6p-1",
    "nombre": "Niña",
    "apellidos": "82",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-1a",
        "nombre": "Padre",
        "apellidos": "82",
        "email": "padre82@colegiodemo.es",
        "telefono": "600000082",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-1b",
        "nombre": "Madre",
        "apellidos": "82",
        "email": "madre82@colegiodemo.es",
        "telefono": "600000082",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-2",
    "nombre": "Niño",
    "apellidos": "83",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-2a",
        "nombre": "Padre",
        "apellidos": "83",
        "email": "padre83@colegiodemo.es",
        "telefono": "600000083",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-2b",
        "nombre": "Madre",
        "apellidos": "83",
        "email": "madre83@colegiodemo.es",
        "telefono": "600000083",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-3",
    "nombre": "Niña",
    "apellidos": "84",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-3a",
        "nombre": "Padre",
        "apellidos": "84",
        "email": "padre84@colegiodemo.es",
        "telefono": "600000084",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-3b",
        "nombre": "Madre",
        "apellidos": "84",
        "email": "madre84@colegiodemo.es",
        "telefono": "600000084",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-4",
    "nombre": "Niño",
    "apellidos": "85",
    "padresSeparados": true,
    "progenitores": [
      {
        "uid": "u-p-6p-4a",
        "nombre": "Padre",
        "apellidos": "85",
        "email": "padre85@colegiodemo.es",
        "telefono": "600000085",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-4b",
        "nombre": "Madre",
        "apellidos": "85",
        "email": "madre85@colegiodemo.es",
        "telefono": "600000085",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-5",
    "nombre": "Niña",
    "apellidos": "86",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-5a",
        "nombre": "Padre",
        "apellidos": "86",
        "email": "padre86@colegiodemo.es",
        "telefono": "600000086",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-5b",
        "nombre": "Madre",
        "apellidos": "86",
        "email": "madre86@colegiodemo.es",
        "telefono": "600000086",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-6",
    "nombre": "Niño",
    "apellidos": "87",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-6a",
        "nombre": "Padre",
        "apellidos": "87",
        "email": "padre87@colegiodemo.es",
        "telefono": "600000087",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-6b",
        "nombre": "Madre",
        "apellidos": "87",
        "email": "madre87@colegiodemo.es",
        "telefono": "600000087",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-7",
    "nombre": "Niña",
    "apellidos": "88",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-7a",
        "nombre": "Padre",
        "apellidos": "88",
        "email": "padre88@colegiodemo.es",
        "telefono": "600000088",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-7b",
        "nombre": "Madre",
        "apellidos": "88",
        "email": "madre88@colegiodemo.es",
        "telefono": "600000088",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-8",
    "nombre": "Niño",
    "apellidos": "89",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-8a",
        "nombre": "Padre",
        "apellidos": "89",
        "email": "padre89@colegiodemo.es",
        "telefono": "600000089",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-8b",
        "nombre": "Madre",
        "apellidos": "89",
        "email": "madre89@colegiodemo.es",
        "telefono": "600000089",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-9",
    "nombre": "Niña",
    "apellidos": "90",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-9a",
        "nombre": "Padre",
        "apellidos": "90",
        "email": "padre90@colegiodemo.es",
        "telefono": "600000090",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-9b",
        "nombre": "Madre",
        "apellidos": "90",
        "email": "madre90@colegiodemo.es",
        "telefono": "600000090",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  },
  {
    "id": "alum-6p-10",
    "nombre": "Niño",
    "apellidos": "91",
    "padresSeparados": false,
    "progenitores": [
      {
        "uid": "u-p-6p-10a",
        "nombre": "Padre",
        "apellidos": "91",
        "email": "padre91@colegiodemo.es",
        "telefono": "600000091",
        "parentesco": "padre",
        "custodia": true
      },
      {
        "uid": "u-p-6p-10b",
        "nombre": "Madre",
        "apellidos": "91",
        "email": "madre91@colegiodemo.es",
        "telefono": "600000091",
        "parentesco": "madre",
        "custodia": true
      }
    ],
    "cursoId": "6P",
    "cursoNombre": "6º de Primaria",
    "tutorUid": "prof-6p",
    "activo": true
  }
];

const DEMO_AVISOS: Aviso[] = [
  {
    id: 'aviso-1',
    titulo: 'Reunión de inicio de curso - 3º de Primaria',
    contenido: 'Estimadas familias: les convocamos el próximo martes a las 16:30h en el aula de 3º de Primaria para tratar la organización del trimestre y los proyectos de aula.',
    tipoEmisor: 'colegio',
    remitenteUid: 'prof-1',
    remitenteNombre: 'Tutor 1',
    remitenteRol: 'profesor',
    alcance: '3P',
    alcanceNombre: '3º de Primaria',
    fechaPublicacion: Date.now() - 3600000 * 24 * 2,
    esAutorizacion: false,
    activo: true,
  },
  {
    id: 'aviso-2',
    titulo: 'Autorización: Visita guiada al Jardín Botánico',
    contenido: 'El próximo viernes realizaremos una salida didáctica. Transporte en autocar escolar subvencionado. Es obligatorio registrar la autorización firmada antes del plazo límite.',
    tipoEmisor: 'colegio',
    remitenteUid: 'prof-1',
    remitenteNombre: 'Secretaría / Tutoría 3ºB',
    remitenteRol: 'profesor',
    alcance: '3P',
    alcanceNombre: '3º de Primaria',
    fechaPublicacion: Date.now() - 3600000 * 12,
    esAutorizacion: true,
    tipoFirma: 'AMBOS_PROGENITORES',
    fechaLimiteFirma: Date.now() + 3600000 * 48,
    activo: true,
  },
  {
    id: 'aviso-3',
    titulo: 'Comunicado del AMPA: Campaña solidaria de recogida de libros',
    contenido: 'Desde el AMPA iniciamos el banco de intercambio de libros de lectura y material escolar. Punto de entrega en el local del AMPA los jueves lectivos de 16:00 a 17:30h.',
    tipoEmisor: 'ampa',
    remitenteUid: 'user-ampa-1',
    remitenteNombre: 'Junta Directiva AMPA',
    remitenteRol: 'ampa',
    alcance: 'TODOS',
    alcanceNombre: 'Toda la Comunidad Educativa',
    fechaPublicacion: Date.now() - 3600000 * 4,
    esAutorizacion: false,
    activo: true,
  },
];

const DEMO_FIRMAS: ExpedienteFirmaAutorizacion[] = [
  {
    id: 'aviso-2_alum-2',
    avisoId: 'aviso-2',
    avisoTitulo: 'Visita guiada al Jardín Botánico',
    alumnoId: 'alum-2',
    alumnoNombre: 'Niña 1',
    cursoId: '3P',
    tipoFirma: 'AMBOS_PROGENITORES',
    requiereAmbos: true,
    estado: 'pendiente',
    firmas: [
      {
        progenitorUid: 'user-padre-1',
        progenitorNombre: 'Padre 1',
        progenitorDni: '12345678Z',
        fechaFirma: Date.now() - 3600000 * 6,
        aceptado: true,
      },
      // Pendiente de firma de Madre 1
    ],
  },
];

const DEMO_ENCUESTAS: Encuesta[] = [
  {
    id: 'enc-1',
    pregunta: '¿Prefieren que el festival de fin de curso sea en horario de mañana o de tarde?',
    descripcion: 'Queremos facilitar la asistencia de la mayoría de las familias.',
    opciones: [
      { id: 1, texto: 'Horario de mañana (10:30h - 12:30h)' },
      { id: 2, texto: 'Horario de tarde (17:00h - 19:00h)' },
      { id: 3, texto: 'Indiferente / Me adapto a cualquier horario' },
    ],
    esMultiple: false,
    alcance: 'TODOS',
    alcanceNombre: 'Toda la Comunidad Educativa',
    fechaCierre: Date.now() + 3600000 * 24 * 7,
    resultadosPublicos: true,
    creadorUid: 'admin-secretaria',
    creadorNombre: 'Secretaría y Dirección',
    creadoEn: Date.now() - 3600000 * 24,
    activa: true,
  },
];

const DEMO_EVENTOS: EventoEscolar[] = [
  {
    id: 'evt-1',
    titulo: 'Reunión General con Familias de 1º Trimestre',
    descripcion: 'Presentación de proyectos curriculares, normas de convivencia y calendario de evaluaciones.',
    fechaInicio: Date.now() + 3600000 * 48,
    fechaFin: Date.now() + 3600000 * 50,
    ubicacion: 'Salón de Actos del Colegio',
    alcance: 'TODOS',
    alcanceNombre: 'Toda la Comunidad Educativa',
    tipo: 'reunion',
    creadorUid: 'admin-secretaria',
    creadorNombre: 'Equipo Directivo',
    activo: true,
  },
  {
    id: 'evt-2',
    titulo: 'Salida didáctica: Visita al Jardín Botánico',
    descripcion: 'Actividad de ciencias naturales para 3º de Primaria. Salida en autobús escolar a las 09:15h.',
    fechaInicio: Date.now() + 3600000 * 72,
    fechaFin: Date.now() + 3600000 * 78,
    ubicacion: 'Jardín Botánico Histórico',
    alcance: '3P',
    alcanceNombre: '3º de Primaria',
    tipo: 'excursion',
    creadorUid: 'prof-1',
    creadorNombre: 'Tutor 1',
    activo: true,
  },
  {
    id: 'evt-3',
    titulo: 'Día no lectivo - Festividad local de San Lucas',
    descripcion: 'El centro permanecerá cerrado según el calendario escolar oficial de la delegación.',
    fechaInicio: Date.now() + 3600000 * 120,
    fechaFin: Date.now() + 3600000 * 144,
    alcance: 'TODOS',
    alcanceNombre: 'Toda la Comunidad Educativa',
    tipo: 'festivo',
    creadorUid: 'admin-secretaria',
    creadorNombre: 'Secretaría',
    activo: true,
  },
];

const DEMO_AUSENCIAS: JustificanteAusencia[] = [
  {
    id: 'aus-1',
    alumnoId: 'alum-2',
    nombreAlumno: 'Niña 1',
    cursoId: '3P',
    progenitorUid: 'user-padre-1',
    nombreProgenitor: 'Padre 1',
    fechaInicio: '2026-11-22',
    tipo: 'retraso',
    motivo: 'cita_medica',
    observacion: 'Llegará a las 10:15h tras acudir al especialista de pediatría en el centro de salud.',
    estado: 'justificada',
    fechaEnvio: Date.now() - 3600000 * 18,
    revisadoPor: 'Tutor 1',
    comentarioCentro: 'Recibido y justificado. Gracias por avisar con antelación.',
  },
];

const DEMO_RECURSOS: RecursoExterno[] = [
  {
    id: 'rec-1',
    titulo: 'Calendario Escolar Oficial y Festivos',
    descripcion: 'Accede al calendario escolar oficial aprobado por la Consejería de Educación con festivos y jornadas lectivas.',
    url: 'https://educacion.gob.es',
    icono: 'calendar',
    categoria: 'secretaria',
    orden: 1,
    destacado: true,
  },
  {
    id: 'rec-2',
    titulo: 'Canal Oficial del AMPA',
    descripcion: 'Información sobre actividades extraescolares, uniformes, banco de libros y socios del AMPA.',
    url: 'https://ampa-colegio.local',
    icono: 'globe',
    categoria: 'ampa',
    orden: 2,
    destacado: true,
  },
  {
    id: 'rec-3',
    titulo: 'Portal de Trámites y Gestión Educativa',
    descripcion: 'Portal oficial de acceso de familias a expedientes, calificaciones y trámites del centro educativo.',
    url: 'https://portal.educacion.es',
    icono: 'file-text',
    categoria: 'secretaria',
    orden: 3,
    destacado: false,
  },
];

const DEMO_ORGANOS_EMISORES: OrganoEmisor[] = [
  { id: 'emisor-1', nombre: 'Dirección', descripcion: 'Comunicaciones oficiales de la Dirección del Centro', activo: true, orden: 1 },
  { id: 'emisor-2', nombre: 'Secretaría', descripcion: 'Trámites administrativos, matrículas y avisos generales', activo: true, orden: 2 },
  { id: 'emisor-3', nombre: 'Jefatura de Estudios', descripcion: 'Organización pedagógica, horarios y normas de convivencia', activo: true, orden: 3 },
  { id: 'emisor-4', nombre: 'Equipo Directivo', descripcion: 'Comunicaciones conjuntas del equipo directivo del colegio', activo: true, orden: 4 },
  { id: 'emisor-5', nombre: 'Orientación Educativa', descripcion: 'Pautas psicopedagógicas, apoyo a familias y programas de inclusión', activo: true, orden: 5 },
  { id: 'emisor-6', nombre: 'Coordinación de Ciclo', descripcion: 'Avisos específicos de los equipos docentes de Infantil y Primaria', activo: true, orden: 6 },
  { id: 'emisor-7', nombre: 'Coordinación de Extraescolares', descripcion: 'Actividades complementarias, talleres y salidas escolares', activo: true, orden: 7 },
  { id: 'emisor-8', nombre: 'AMPA', descripcion: 'Comisión directiva de la Asociación de Madres y Padres del Alumnado', activo: true, orden: 8 },
];

const DEMO_GRUPOS: GrupoPersonalizado[] = [
  {
    id: 'grp-matinal',
    nombre: 'Monitores de Aula Matinal y Extraescolares',
    descripcion: 'Personal encargado del aula matinal temprana y talleres extraescolares.',
    color: 'emerald',
    permisos: {
      puedePublicarAvisos: true,
      puedeCrearEventos: false,
      puedeVerAusencias: true,
      puedeRecibirMensajes: true,
      puedeGestionarAlumnos: false,
      puedePublicarEncuestas: false,
    },
    miembrosUids: ['user-trabajador-1'],
    fechaCreacion: Date.now() - 3600000 * 24 * 30,
    activo: true,
  },
  {
    id: 'grp-transporte',
    nombre: 'Acompañantes de Transporte Escolar',
    descripcion: 'Monitores de las rutas 1 y 2 de transporte escolar del centro.',
    color: 'blue',
    permisos: {
      puedePublicarAvisos: true,
      puedeCrearEventos: false,
      puedeVerAusencias: true,
      puedeRecibirMensajes: true,
      puedeGestionarAlumnos: false,
      puedePublicarEncuestas: false,
    },
    miembrosUids: [],
    fechaCreacion: Date.now() - 3600000 * 24 * 20,
    activo: true,
  },
  {
    id: 'grp-delegados',
    nombre: 'Comisión de Familias Delegadas de Aula',
    descripcion: 'Madres y padres delegados de los diferentes niveles para enlace institucional.',
    color: 'purple',
    permisos: {
      puedePublicarAvisos: true,
      puedeCrearEventos: true,
      puedeVerAusencias: false,
      puedeRecibirMensajes: true,
      puedeGestionarAlumnos: false,
      puedePublicarEncuestas: true,
    },
    miembrosUids: ['user-padre-1'],
    fechaCreacion: Date.now() - 3600000 * 24 * 10,
    activo: true,
  },
];

const DEMO_CONVERSACIONES: Conversacion[] = [
  {
    id: 'conv_alum-2_user-padre-1',
    tipoCanal: 'tutoria',
    alumnoId: 'alum-2',
    alumnoNombre: 'Niña 1',
    cursoId: '3P',
    progenitorUid: 'user-padre-1',
    progenitorNombre: 'Padre 1',
    destinatarioUid: 'prof-1',
    destinatarioNombre: 'Tutor 1',
    ultimoMensaje: 'Buenos días, llevaremos la autorización firmada mañana.',
    fechaUltimoMensaje: Date.now() - 3600000 * 3,
    noLeidosDestinatario: 0,
    noLeidosProgenitor: 0,
  },
  {
    id: 'conv_alum-2_user-madre-2',
    tipoCanal: 'tutoria',
    alumnoId: 'alum-2',
    alumnoNombre: 'Niña 1',
    cursoId: '3P',
    progenitorUid: 'user-madre-2',
    progenitorNombre: 'Madre 1',
    destinatarioUid: 'prof-1',
    destinatarioNombre: 'Tutor 1',
    ultimoMensaje: 'Buenos días, hemos revisado los ejercicios escolares de clase.',
    fechaUltimoMensaje: Date.now() - 3600000 * 18,
    noLeidosDestinatario: 0,
    noLeidosProgenitor: 0,
  },
  {
    id: 'conv_ampa_user-padre-1',
    tipoCanal: 'ampa',
    progenitorUid: 'user-padre-1',
    progenitorNombre: 'Padre 1',
    destinatarioUid: 'user-ampa-1',
    destinatarioNombre: 'Buzón Directo AMPA',
    ultimoMensaje: '¿Cómo me puedo inscribir en el taller de robótica de los viernes?',
    fechaUltimoMensaje: Date.now() - 3600000 * 26,
    noLeidosDestinatario: 1,
    noLeidosProgenitor: 0,
  },
  {
    id: 'conv_ampa_user-madre-2',
    tipoCanal: 'ampa',
    progenitorUid: 'user-madre-2',
    progenitorNombre: 'Madre 1',
    destinatarioUid: 'user-ampa-1',
    destinatarioNombre: 'Buzón Directo AMPA',
    ultimoMensaje: 'Hola, ¿cuándo comenzará la entrega de libros del banco solidario?',
    fechaUltimoMensaje: Date.now() - 3600000 * 5,
    noLeidosDestinatario: 0,
    noLeidosProgenitor: 0,
  },
];

const DEMO_MENSAJES: Mensaje[] = [
  {
    id: 'msg-1',
    conversacionId: 'conv_alum-2_user-padre-1',
    remitenteUid: 'prof-1',
    remitenteNombre: 'Tutor 1',
    remitenteRol: 'profesor',
    texto: 'Buenos días. Recuerde que el viernes es la salida programada.',
    timestamp: Date.now() - 3600000 * 5,
    leido: true,
  },
  {
    id: 'msg-2',
    conversacionId: 'conv_alum-2_user-padre-1',
    remitenteUid: 'user-padre-1',
    remitenteNombre: 'Padre 1',
    remitenteRol: 'padre',
    texto: 'Buenos días, llevaremos la autorización firmada mañana.',
    timestamp: Date.now() - 3600000 * 3,
    leido: true,
  },
  {
    id: 'msg-3',
    conversacionId: 'conv_ampa_user-padre-1',
    remitenteUid: 'user-padre-1',
    remitenteNombre: 'Padre 1',
    remitenteRol: 'padre',
    texto: '¿Cómo me puedo inscribir en el taller de robótica de los viernes?',
    timestamp: Date.now() - 3600000 * 26,
    leido: false,
  },
  {
    id: 'msg-4',
    conversacionId: 'conv_ampa_user-madre-2',
    remitenteUid: 'user-madre-2',
    remitenteNombre: 'Madre 1',
    remitenteRol: 'padre',
    texto: 'Hola, ¿cuándo comenzará la entrega de libros del banco solidario?',
    timestamp: Date.now() - 3600000 * 5,
    leido: true,
  },
];

export interface PerfilPredefinido {
  id: string;
  label: string;
  descripcion: string;
  usuario: UsuarioPerfil;
}

export const PERFILES_PREDEFINIDOS: PerfilPredefinido[] = [
  {
    id: 'admin-1',
    label: '[SUPERADMIN] Secretaría / Dirección (Control Total)',
    descripcion: 'Superusuario con acceso completo a todas las pestañas: comunicaciones enviadas, recibidas, encuestas, calendario, enlaces y base de datos.',
    usuario: {
      uid: 'admin-secretaria',
      email: 'direccion@colegiodemo.es',
      nombre: 'Secretaría',
      apellidos: 'General',
      rol: 'admin',
      roles: ['admin', 'profesor'],
      cursos: ['I3', 'I4', 'I5', '1P', '2P', '3P', '4P', '5P', '6P'],
      fcmTokens: ['token-admin'],
      activo: true,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 24 * 300,
    },
  },
  {
    id: 'padre-1',
    label: '[FAMILIA] Padre 1 (Padre y Representante AMPA)',
    descripcion: 'Padre con 2 hijos/as en el centro escolar y cargo en el AMPA (dispone de ambos roles).',
    usuario: {
      uid: 'user-padre-1',
      email: 'padre1@colegiodemo.es',
      nombre: 'Padre', apellidos: '1',
      rol: 'padre',
      roles: ['padre', 'ampa'],
      cursos: ['1P', '3P'],
      fcmTokens: ['token-padre-1'],
      activo: true,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 24 * 30,
    },
  },
  {
    id: 'madre-2',
    label: '[FAMILIA] Madre 1 (Madre de Niña 1)',
    descripcion: 'Madre de Niña 1 (3º de Primaria). Canal privado para recibir avisos escolares y firmar autorizaciones.',
    usuario: {
      uid: 'user-madre-2',
      email: 'madre1@colegiodemo.es',
      nombre: 'Madre', apellidos: '1',
      rol: 'padre',
      roles: ['padre'],
      cursos: ['3P'],
      fcmTokens: ['token-madre-2'],
      activo: true,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 24 * 25,
    },
  },
  {
    id: 'profesor-1',
    label: '[DOCENTE] Tutor 1 (Tutor 3º de Primaria)',
    descripcion: 'Tutor de 3º de Primaria. Gestiona autorizaciones, avisos de curso y tutorías privadas.',
    usuario: {
      uid: 'prof-1',
      email: 'tutor1@colegiodemo.es',
      nombre: 'Tutor', apellidos: '1',
      rol: 'profesor',
      roles: ['profesor'],
      cursos: ['3P'],
      fcmTokens: ['token-prof-1'],
      activo: true,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 24 * 120,
      horarioNotificaciones: DEFAULT_HORARIO_DOCENTE,
    },
  },
  {
    id: 'ampa-1',
    label: '[AMPA] Representante AMPA 1',
    descripcion: 'Representante de la Junta del AMPA y madre de alumno de Primaria. Dispone de rol asociativo y de familia.',
    usuario: {
      uid: 'user-ampa-1',
      email: 'ampa@colegiodemo.es',
      nombre: 'Representante', apellidos: 'AMPA 1',
      rol: 'ampa',
      roles: ['ampa', 'padre'],
      cursos: ['1P'],
      fcmTokens: ['token-ampa-1'],
      activo: true,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 24 * 60,
    },
  },
  {
    id: 'trabajador-1',
    label: '[COLECTIVO] Personal 1 (Servicios Escolares)',
    descripcion: 'Personal no docente de Aula Matinal y Extraescolares. Dispone de permisos asignados para publicar avisos y consultar faltas.',
    usuario: {
      uid: 'user-trabajador-1',
      email: 'actividades@colegio.es',
      nombre: 'Personal', apellidos: '1',
      rol: 'trabajador',
      roles: ['trabajador'],
      cursos: ['I3', 'I4', 'I5', '1P', '2P', '3P', '4P', '5P', '6P'],
      grupos: ['grp-matinal'],
      fcmTokens: ['token-trabajador-1'],
      activo: true,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 24 * 40,
      permisosEspeciales: {
        puedePublicarAvisos: true,
        puedeVerAusencias: true,
        puedeRecibirMensajes: true,
      },
    },
  },
];

export interface AppContextType {
  centroInfo: CentroInfo | null;
  currentUser: UsuarioPerfil;
  selectedPerfilId: string;
  cambiarPerfil: (perfilId: string) => void;
  // Entidades
  cursos: Curso[];
  alumnos: Alumno[];
  avisos: Aviso[];
  firmas: ExpedienteFirmaAutorizacion[];
  conversaciones: Conversacion[];
  mensajes: Mensaje[];
  colaNotificaciones: NotificacionPushCola[];
  usuarios: UsuarioPerfil[];
  solicitudesPendientes: UsuarioPerfil[];
  // Encuestas, Eventos, Ausencias, Recursos y Silencio Docente
  encuestas: Encuesta[];
  votosEncuestas: Record<string, VotoEncuesta[]>;
  eventos: EventoEscolar[];
  ausencias: JustificanteAusencia[];
  recursos: RecursoExterno[];
  confirmacionesLectura: Record<string, string[]>;
  horarioSilencio: HorarioSilencioConfig;
  // Grupos personalizados y permisos granulares
  gruposPersonalizados: GrupoPersonalizado[];
  // Órganos emisores oficiales administrables
  organosEmisores: OrganoEmisor[];
  // Filtros y estados
  alumnoActivoId: string | null;
  setAlumnoActivoId: (id: string) => void;
  horarioLaboralActivo: boolean;
  toggleHorarioLaboral: () => void;
  modoSimuladorMovil: boolean;
  toggleModoSimuladorMovil: () => void;
  setModoSimuladorMovil: (val: boolean) => void;
  mostrarExplicacionRolesAmpa: boolean;
  setMostrarExplicacionRolesAmpa: (val: boolean) => void;
  mostrarTextosInformativos: boolean;
  setMostrarTextosInformativos: (val: boolean) => void;
  // Acciones
  publicarAviso: (aviso: Omit<Aviso, 'id' | 'fechaPublicacion' | 'activo'>) => void;
  firmarAutorizacion: (avisoId: string, alumnoId: string, dni: string, aceptado: boolean) => void;
  enviarMensaje: (conversacionId: string, texto: string, replicarAAmbosProgenitores?: boolean) => void;
  archivarConversacion: (conversacionId: string) => void;
  desarchivarConversacion: (conversacionId: string) => void;
  eliminarConversacion: (conversacionId: string) => void;
  conversacionesArchivadasIds: string[];
  agregarAlumno: (alumno: Omit<Alumno, 'id' | 'activo'>) => void;
  eliminarAlumno: (alumnoId: string) => void;
  agregarCurso: (curso: Omit<Curso, 'activo'>) => void;
  eliminarCurso: (cursoId: string) => void;
  aprobarSolicitud: (userId: string, rol: RolUsuario, cursos: string[]) => void;
  rechazarSolicitud: (userId: string) => void;
  importarAlumnosMasivo: (alumnos: Omit<Alumno, 'id' | 'activo'>[]) => void;
  actualizarHorarioNotificacionesUsuario: (usuarioUid: string, horario: HorarioNotificacionesProfesor) => void;
  modalPerfilOpen: boolean;
  setModalPerfilOpen: (open: boolean) => void;
  modalDatosCentroOpen: boolean;
  setModalDatosCentroOpen: (open: boolean) => void;
  actualizarDatosCentro: (datos: {
    nombreCentro?: string;
    codigoCentro?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    horarioAtencion?: string;
    logoUrl?: string;
    visibilidad?: VisibilidadDatosCentro;
  }) => void;
  // Acciones de nuevos módulos
  votarEncuesta: (encuestaId: string, opciones: number[]) => void;
  crearEncuesta: (encuesta: Omit<Encuesta, 'id' | 'creadoEn' | 'creadorUid' | 'creadorNombre' | 'activa'>) => void;
  crearEvento: (evento: Omit<EventoEscolar, 'id' | 'creadorUid' | 'creadorNombre' | 'activo'>) => void;
  enviarJustificanteAusencia: (ausencia: Omit<JustificanteAusencia, 'id' | 'estado' | 'fechaEnvio' | 'revisadoPor'>) => void;
  resolverAusencia: (ausenciaId: string, estado: 'justificada' | 'rechazada', comentario?: string) => void;
  agregarRecurso: (recurso: Omit<RecursoExterno, 'id'>) => void;
  eliminarRecurso: (id: string) => void;
  confirmarLecturaAviso: (avisoId: string) => void;
  actualizarHorarioSilencio: (config: HorarioSilencioConfig) => void;
  // Acciones de Grupos Personalizados y Control por Progenitor
  crearGrupoPersonalizado: (grupo: Omit<GrupoPersonalizado, 'id' | 'fechaCreacion' | 'activo'>) => void;
  actualizarGrupoPersonalizado: (id: string, datos: Partial<GrupoPersonalizado>) => void;
  eliminarGrupoPersonalizado: (id: string) => void;
  agregarMiembroAGrupo: (grupoId: string, usuarioUid: string) => void;
  quitarMiembroDeGrupo: (grupoId: string, usuarioUid: string) => void;
  toggleBloqueoNotificacionesPadre: (progenitorUid: string) => void;
  actualizarPermisosProgenitor: (progenitorUid: string, permisos: Partial<PermisosGrupo>) => void;
  // Acciones de Órganos Emisores
  agregarOrganoEmisor: (organo: Omit<OrganoEmisor, 'id'>) => void;
  eliminarOrganoEmisor: (id: string) => void;
  actualizarOrganoEmisor: (id: string, datos: Partial<OrganoEmisor>) => void;
  actualizarFotoPerfil: (usuarioUid: string, fotoUrl: string) => void;
  cambiarRolActivo: (nuevoRol: RolUsuario) => void;
  actualizarRolesUsuario: (uid: string, nuevosRoles: RolUsuario[]) => void;
  limpiarConfiguracion: () => void;
  restablecerDatosPrueba: () => void;
  recargarConfiguracion: () => void;
  // Firebase y Notificaciones Push
  firebaseConectado: boolean;
  fcmToken: string | null;
  permisoNotificaciones: string;
  activarNotificacionesPush: () => Promise<boolean>;
  enviarNotificacionPrueba: () => Promise<void>;
  toastNotificacion: ToastNotificacion | null;
  cerrarToastNotificacion: () => void;
}

export interface ToastNotificacion {
  id: string;
  titulo: string;
  cuerpo: string;
  fecha: number;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_CENTRO: CentroInfo = {
  nombreCentro: 'CEIP El Molinillo',
  codigoCentro: '00000000',
  direccion: 'Avenida de la Educación, 1, 28001 Madrid',
  telefono: '900 000 000',
  email: 'contacto@colegiodemo.es',
  horarioAtencion: 'Lunes a Viernes de 09:00 a 14:00 h',
  logoUrl: '',
  visibilidad: {
    mostrarDireccion: true,
    mostrarTelefono: true,
    mostrarEmail: true,
    mostrarHorarioAtencion: true,
    mostrarClaustro: true,
    mostrarEmailsProfesores: false,
    profesoresOcultos: [],
    cargosPersonalizados: {
      'admin-secretaria': 'Dirección / Secretaría General',
      'prof-i3': 'Tutora Infantil 3 años',
      'prof-i4': 'Tutora Infantil 4 años / Apoyo Educativo',
      'prof-i5': 'Tutora Infantil 5 años / Audición y Lenguaje',
      'prof-1p': 'Tutor 1º Primaria / Jefatura de Estudios',
      'prof-2p': 'Tutora 2º Primaria / Coordinación TIC',
      'prof-1': 'Tutor 3º Primaria / Secretaría Académica',
      'prof-2': 'Tutora 4º Primaria / Coordinación Bilingüe (Inglés)',
      'prof-5p': 'Tutor 5º Primaria / Educación Musical',
      'prof-6p': 'Tutor 6º Primaria / Educación Física',
    },
  },
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [centroInfo, setCentroInfo] = useState<CentroInfo | null>(DEFAULT_CENTRO);
  const [modalDatosCentroOpen, setModalDatosCentroOpen] = useState(false);
  const [modalPerfilOpen, setModalPerfilOpen] = useState(false);
  const [selectedPerfilId, setSelectedPerfilId] = useState<string>('admin-1');
  const [currentUser, setCurrentUser] = useState<UsuarioPerfil>(PERFILES_PREDEFINIDOS[0].usuario);

  const [cursos, setCursos] = useState<Curso[]>(DEMO_CURSOS);
  const [alumnos, setAlumnos] = useState<Alumno[]>(DEMO_ALUMNOS);
  const [avisos, setAvisos] = useState<Aviso[]>(DEMO_AVISOS);
  const [firmas, setFirmas] = useState<ExpedienteFirmaAutorizacion[]>(DEMO_FIRMAS);
  const [conversaciones, setConversaciones] = useState<Conversacion[]>(() => {
    try {
      const raw = localStorage.getItem('molinillo_conversaciones');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((c: Conversacion) => c.id));
          const faltantes = DEMO_CONVERSACIONES.filter((c) => !ids.has(c.id));
          return [...parsed, ...faltantes];
        }
      }
    } catch (e) {
      // ignore
    }
    return DEMO_CONVERSACIONES;
  });

  const [mensajes, setMensajes] = useState<Mensaje[]>(() => {
    try {
      const raw = localStorage.getItem('molinillo_mensajes');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const ids = new Set(parsed.map((m: Mensaje) => m.id));
          const faltantes = DEMO_MENSAJES.filter((m) => !ids.has(m.id));
          return [...parsed, ...faltantes];
        }
      }
    } catch (e) {
      // ignore
    }
    return DEMO_MENSAJES;
  });
  const [colaNotificaciones, setColaNotificaciones] = useState<NotificacionPushCola[]>([]);
  const [usuarios, setUsuarios] = useState<UsuarioPerfil[]>([
    ...PERFILES_PREDEFINIDOS.map((p) => p.usuario),
    ...DEMO_PROFESORES.filter((p) => !PERFILES_PREDEFINIDOS.some((perfil) => perfil.usuario.uid === p.uid)),
  ]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState<UsuarioPerfil[]>([
    {
      uid: 'solic-1',
      email: 'solicitante1@colegiodemo.es',
      nombre: 'Solicitante', apellidos: '1',
      telefono: '600123456',
      rol: 'pendiente',
      cursos: ['1P'],
      fcmTokens: [],
      activo: false,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 2,
    },
    {
      uid: 'solic-2',
      email: 'solicitante2@colegiodemo.es',
      nombre: 'Solicitante', apellidos: '2',
      telefono: '611987654',
      rol: 'pendiente',
      cursos: ['1P', '3P', '5P'],
      fcmTokens: [],
      activo: false,
      emailVerified: true,
      fechaRegistro: Date.now() - 3600000 * 8,
    },
  ]);
  const [alumnoActivoId, setAlumnoActivoId] = useState<string | null>('alum-2');
  const [overrideManualHorario, setOverrideManualHorario] = useState<boolean | null>(null);
  const horarioLaboralActivo =
    overrideManualHorario !== null
      ? overrideManualHorario
      : calcularEstaEnHorarioNotificaciones(currentUser.horarioNotificaciones);
  const [modoSimuladorMovil, setModoSimuladorMovil] = useState<boolean>(false);

  const [mostrarExplicacionRolesAmpa, setMostrarExplicacionRolesAmpaState] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('molinillo_mostrar_explicacion_roles_ampa');
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  const setMostrarExplicacionRolesAmpa = (val: boolean) => {
    setMostrarExplicacionRolesAmpaState(val);
    try {
      localStorage.setItem('molinillo_mostrar_explicacion_roles_ampa', String(val));
    } catch {
      // ignore
    }
  };

  const [mostrarTextosInformativos, setMostrarTextosInformativosState] = useState<boolean>(() => {
    try {
      const val = localStorage.getItem('molinillo_mostrar_textos_informativos');
      return val !== null ? val === 'true' : true;
    } catch {
      return true;
    }
  });

  const setMostrarTextosInformativos = (val: boolean) => {
    setMostrarTextosInformativosState(val);
    try {
      localStorage.setItem('molinillo_mostrar_textos_informativos', String(val));
    } catch {
      // ignore
    }
  };

  // Estados de los nuevos módulos
  const [encuestas, setEncuestas] = useState<Encuesta[]>(DEMO_ENCUESTAS);
  const [votosEncuestas, setVotosEncuestas] = useState<Record<string, VotoEncuesta[]>>({
    'enc-1': [
      { uidPadre: 'user-padre-1', nombrePadre: 'Padre 1', opcionesSeleccionadas: [2], timestamp: Date.now() - 3600000 * 12 },
    ],
  });
  const [eventos, setEventos] = useState<EventoEscolar[]>(DEMO_EVENTOS);
  const [ausencias, setAusencias] = useState<JustificanteAusencia[]>(DEMO_AUSENCIAS);
  const [recursos, setRecursos] = useState<RecursoExterno[]>(DEMO_RECURSOS);
  const [confirmacionesLectura, setConfirmacionesLectura] = useState<Record<string, string[]>>({
    'aviso-1': ['user-padre-1'],
  });
  const [horarioSilencio, setHorarioSilencio] = useState<HorarioSilencioConfig>({
    activo: true,
    horaInicio: '17:00',
    horaFin: '08:30',
    finesDeSemanaSilenciados: true,
  });
  const [gruposPersonalizados, setGruposPersonalizados] = useState<GrupoPersonalizado[]>(DEMO_GRUPOS);
  const [organosEmisores, setOrganosEmisores] = useState<OrganoEmisor[]>(DEMO_ORGANOS_EMISORES);

  // Estados de Firebase y Notificaciones Push
  const [firebaseConectado] = useState<boolean>(true);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [permisoNotificaciones, setPermisoNotificaciones] = useState<string>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission;
    }
    return 'unsupported';
  });

  const [toastNotificacion, setToastNotificacion] = useState<ToastNotificacion | null>(null);
  const cerrarToastNotificacion = () => setToastNotificacion(null);

  const mostrarToastNotificacion = (titulo: string, cuerpo: string) => {
    const id = Date.now().toString();
    setToastNotificacion({ id, titulo, cuerpo, fecha: Date.now() });
    setTimeout(() => {
      setToastNotificacion((current) => (current?.id === id ? null : current));
    }, 7000);
  };

  const isInitialSnapshotRef = useRef(true);

  // Inicialización de persistencia y listeners de Firestore para notificaciones en vivo
  useEffect(() => {
    guardarConfiguracionCentro(PROYECTO_PRUEBAS_FIREBASE_CONFIG, DEFAULT_CENTRO).catch(console.warn);

    try {
      const { db } = inicializarFirebase(PROYECTO_PRUEBAS_FIREBASE_CONFIG);
      const q = query(collection(db, 'cola_notificaciones'), orderBy('fechaCreacion', 'desc'), limit(15));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const nuevasNotifs: NotificacionPushCola[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            nuevasNotifs.push({
              id: docSnap.id,
              tokens: data.tokens || [],
              titulo: data.titulo || '',
              cuerpo: data.cuerpo || '',
              estado: data.estado || 'enviado',
              intentos: data.intentos || 0,
              fechaCreacion: data.fechaCreacion || Date.now(),
            });
          });
          if (nuevasNotifs.length > 0) {
            setColaNotificaciones(nuevasNotifs);
          }

          // Procesar cambios en tiempo real (ej. cuando el PC envía una notificación hacia el móvil)
          if (isInitialSnapshotRef.current) {
            isInitialSnapshotRef.current = false;
          } else {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                const tit = data.titulo || 'Nuevo Aviso Escolar';
                const cue = data.cuerpo || 'Tienes una nueva comunicación en el centro.';
                dispararNotificacionSistema(tit, cue, '/');
                mostrarToastNotificacion(tit, cue);
              }
            });
          }
        },
        (error) => {
          console.warn('Listener Firestore de notificaciones:', error);
        }
      );
      return () => unsubscribe();
    } catch (e) {
      console.warn('Error al inicializar listener Firestore:', e);
    }
  }, []);

  const recargarConfiguracion = () => {
    let { centro } = obtenerConfiguracionGuardada();
    if (
      !centro ||
      centro.nombreCentro?.includes('Molinillo de la Vega') ||
      centro.codigoCentro === 'CEIP-SMBA-01' ||
      centro.direccion?.includes('Sevilla') ||
      centro.telefono?.includes('954') ||
      !centro.nombreCentro
    ) {
      centro = DEFAULT_CENTRO;
      localStorage.setItem('molinillo_centro_info', JSON.stringify(centro));
    } else {
      centro = {
        ...DEFAULT_CENTRO,
        ...centro,
        codigoCentro: centro.codigoCentro === 'CEIP-SMBA-01' ? DEFAULT_CENTRO.codigoCentro : centro.codigoCentro || DEFAULT_CENTRO.codigoCentro,
        direccion: centro.direccion?.includes('Sevilla') ? DEFAULT_CENTRO.direccion : centro.direccion || DEFAULT_CENTRO.direccion,
        telefono: centro.telefono?.includes('954') ? DEFAULT_CENTRO.telefono : centro.telefono || DEFAULT_CENTRO.telefono,
        email: centro.email === 'secretaria@colegio.es' ? DEFAULT_CENTRO.email : centro.email || DEFAULT_CENTRO.email,
        horarioAtencion: centro.horarioAtencion || DEFAULT_CENTRO.horarioAtencion,
        visibilidad: {
          ...DEFAULT_CENTRO.visibilidad,
          ...(centro.visibilidad || {}),
        },
      };
    }
    setCentroInfo(centro);
  };

  useEffect(() => {
    try {
      localStorage.setItem('molinillo_conversaciones', JSON.stringify(conversaciones));
    } catch (e) {
      // ignore
    }
  }, [conversaciones]);

  useEffect(() => {
    try {
      localStorage.setItem('molinillo_mensajes', JSON.stringify(mensajes));
    } catch (e) {
      // ignore
    }
  }, [mensajes]);

  useEffect(() => {
    recargarConfiguracion();

    // Detección de vista y rol por parámetro URL (?rol=admin, ?rol=profesor, ?rol=padre, ?rol=ampa, ?view=mobile, etc.)
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    const rolParam = params.get('rol') || params.get('role');
    const perfilParam = params.get('perfil') || params.get('user');

    if (perfilParam) {
      cambiarPerfil(perfilParam);
      setModoSimuladorMovil(viewParam === 'mobile');
    } else if (rolParam) {
      const r = rolParam.toLowerCase();
      if (r.includes('admin') || r.includes('secretaria') || r.includes('direccion')) {
        cambiarPerfil('admin-1');
      } else if (r.includes('prof') || r.includes('docente') || r.includes('maestro')) {
        cambiarPerfil('profesor-1');
      } else if (r.includes('padre') || r.includes('madre') || r.includes('familia')) {
        cambiarPerfil('padre-1');
      } else if (r.includes('ampa')) {
        cambiarPerfil('ampa-1');
      } else if (r.includes('trabajador') || r.includes('personal')) {
        cambiarPerfil('trabajador-1');
      } else {
        cambiarPerfil('admin-1');
      }
      setModoSimuladorMovil(viewParam === 'mobile');
    } else if (viewParam === 'mobile') {
      cambiarPerfil('padre-1');
      setModoSimuladorMovil(true);
    } else {
      // Por defecto para cualquier carga sin parámetro, arrancar en Superusuario
      cambiarPerfil('admin-1');
      setModoSimuladorMovil(false);
    }
  }, []);

  const toggleModoSimuladorMovil = () => {
    setModoSimuladorMovil((prev) => !prev);
  };

  const actualizarFotoPerfil = (usuarioUid: string, fotoUrl: string) => {
    setCurrentUser((prev) => (prev.uid === usuarioUid ? { ...prev, fotoUrl } : prev));
    setUsuarios((prev) =>
      prev.map((u) => (u.uid === usuarioUid ? { ...u, fotoUrl } : u))
    );
    const p = PERFILES_PREDEFINIDOS.find((item) => item.usuario.uid === usuarioUid);
    if (p) {
      p.usuario.fotoUrl = fotoUrl;
    }
    try {
      localStorage.setItem(`molinillo_user_foto_${usuarioUid}`, fotoUrl);
    } catch (e) {
      console.warn('Error guardando foto:', e);
    }
  };

  const cambiarPerfil = (perfilId: string) => {
    const found = PERFILES_PREDEFINIDOS.find((p) => p.id === perfilId);
    if (found) {
      setSelectedPerfilId(perfilId);
      const savedFoto = localStorage.getItem(`molinillo_user_foto_${found.usuario.uid}`);
      let horarioUsuario = found.usuario.horarioNotificaciones;
      try {
        const rawH = localStorage.getItem(`molinillo_horario_profesor_${found.usuario.uid}`);
        if (rawH) {
          horarioUsuario = JSON.parse(rawH);
        } else if (found.usuario.rol === 'profesor' && !horarioUsuario) {
          horarioUsuario = DEFAULT_HORARIO_DOCENTE;
        }
      } catch (e) {
        // ignore
      }

      // Cargar roles personalizados si existen en localStorage
      let rolesUsuario =
        found.usuario.roles && found.usuario.roles.length > 0
          ? found.usuario.roles
          : [found.usuario.rol];
      try {
        const rawRoles = localStorage.getItem(`molinillo_user_roles_${found.usuario.uid}`);
        if (rawRoles) {
          const parsedRoles = JSON.parse(rawRoles);
          if (Array.isArray(parsedRoles) && parsedRoles.length > 0) {
            rolesUsuario = parsedRoles;
          }
        }
      } catch (e) {
        // ignore
      }

      // Cargar rol activo guardado si existe y es válido
      let rolActivo = found.usuario.rol;
      try {
        const rawRolActivo = localStorage.getItem(`molinillo_rol_activo_${found.usuario.uid}`);
        if (rawRolActivo && rolesUsuario.includes(rawRolActivo as RolUsuario)) {
          rolActivo = rawRolActivo as RolUsuario;
        }
      } catch (e) {
        // ignore
      }

      const userActualizado: UsuarioPerfil = {
        ...found.usuario,
        rol: rolActivo,
        roles: rolesUsuario,
        fotoUrl: savedFoto !== null ? savedFoto : found.usuario.fotoUrl,
        horarioNotificaciones: horarioUsuario,
      };
      setCurrentUser(userActualizado);
      setOverrideManualHorario(null);

      // Si es padre (o su rol activo es padre), asignar un alumno por defecto
      if (userActualizado.rol === 'padre') {
        const susAlumnos = alumnos.filter((a) =>
          a.progenitores.some((p) => p.uid === found.usuario.uid)
        );
        if (susAlumnos.length > 0) {
          setAlumnoActivoId(susAlumnos[0].id);
        }
      }
    }
  };

  const cambiarRolActivo = (nuevoRol: RolUsuario) => {
    setCurrentUser((prev) => {
      const userRoles = prev.roles && prev.roles.length > 0 ? prev.roles : [prev.rol];
      const rolesActualizados = userRoles.includes(nuevoRol) ? userRoles : [...userRoles, nuevoRol];
      const actualizado: UsuarioPerfil = {
        ...prev,
        rol: nuevoRol,
        roles: rolesActualizados,
      };
      try {
        localStorage.setItem(`molinillo_rol_activo_${prev.uid}`, nuevoRol);
      } catch (e) {
        // ignore
      }
      return actualizado;
    });

    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.uid === currentUser.uid) {
          const userRoles = u.roles && u.roles.length > 0 ? u.roles : [u.rol];
          const rolesActualizados = userRoles.includes(nuevoRol) ? userRoles : [...userRoles, nuevoRol];
          return { ...u, rol: nuevoRol, roles: rolesActualizados };
        }
        return u;
      })
    );

    // Si cambió al rol de padre, asegurarse de tener un alumno seleccionado
    if (nuevoRol === 'padre') {
      const susAlumnos = alumnos.filter((a) =>
        a.progenitores.some((p) => p.uid === currentUser.uid)
      );
      if (susAlumnos.length > 0) {
        setAlumnoActivoId(susAlumnos[0].id);
      }
    }
  };

  const actualizarRolesUsuario = (uid: string, nuevosRoles: RolUsuario[]) => {
    if (nuevosRoles.length === 0) return;

    try {
      localStorage.setItem(`molinillo_user_roles_${uid}`, JSON.stringify(nuevosRoles));
    } catch (e) {
      // ignore
    }

    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.uid === uid) {
          const rolActivo = nuevosRoles.includes(u.rol) ? u.rol : nuevosRoles[0];
          return { ...u, roles: nuevosRoles, rol: rolActivo };
        }
        return u;
      })
    );

    if (currentUser.uid === uid) {
      setCurrentUser((prev) => {
        const rolActivo = nuevosRoles.includes(prev.rol) ? prev.rol : nuevosRoles[0];
        try {
          localStorage.setItem(`molinillo_rol_activo_${uid}`, rolActivo);
        } catch (e) {
          // ignore
        }
        return { ...prev, roles: nuevosRoles, rol: rolActivo };
      });
    }
  };

  const toggleHorarioLaboral = () => {
    setOverrideManualHorario((prev) => (prev !== null ? !prev : !horarioLaboralActivo));
  };

  const actualizarHorarioNotificacionesUsuario = (
    usuarioUid: string,
    horario: HorarioNotificacionesProfesor
  ) => {
    setUsuarios((prev) =>
      prev.map((u) => (u.uid === usuarioUid ? { ...u, horarioNotificaciones: horario } : u))
    );
    if (currentUser.uid === usuarioUid) {
      setCurrentUser((prev) => ({ ...prev, horarioNotificaciones: horario }));
      setOverrideManualHorario(null);
    }
    try {
      localStorage.setItem(`molinillo_horario_profesor_${usuarioUid}`, JSON.stringify(horario));
    } catch (e) {
      console.error('Error guardando horario:', e);
    }
  };

  const publicarAviso = (nuevoAvisoData: Omit<Aviso, 'id' | 'fechaPublicacion' | 'activo'>) => {
    const nuevoId = 'aviso-' + Date.now();
    const avisoCompleto: Aviso = {
      ...nuevoAvisoData,
      id: nuevoId,
      fechaPublicacion: Date.now(),
      activo: true,
    };

    setAvisos((prev) => [avisoCompleto, ...prev]);

    // Si es una autorización, crear los expedientes de firma para los alumnos afectados
    if (avisoCompleto.esAutorizacion && avisoCompleto.tipoFirma) {
      const alumnosAfectados = alumnos.filter(
        (a) => avisoCompleto.alcance === 'TODOS' || a.cursoId === avisoCompleto.alcance
      );

      const nuevosExpedientes: ExpedienteFirmaAutorizacion[] = alumnosAfectados.map((alum) => ({
        id: `${nuevoId}_${alum.id}`,
        avisoId: nuevoId,
        avisoTitulo: avisoCompleto.titulo,
        alumnoId: alum.id,
        alumnoNombre: `${alum.nombre} ${alum.apellidos}`,
        cursoId: alum.cursoId,
        tipoFirma: avisoCompleto.tipoFirma!,
        requiereAmbos: alum.padresSeparados && avisoCompleto.tipoFirma === 'AMBOS_PROGENITORES',
        firmas: [],
        estado: 'pendiente',
      }));

      setFirmas((prev) => [...nuevosExpedientes, ...prev]);
    }

    // Encolar notificación push respetando la desconexión laboral si el centro lo tiene activo
    const nuevaNotif: NotificacionPushCola = {
      id: 'notif-' + Date.now(),
      tokens: ['token-padres-fcm'],
      titulo: avisoCompleto.titulo,
      cuerpo: avisoCompleto.contenido.substring(0, 100) + '...',
      estado: 'pendiente',
      intentos: 0,
      fechaCreacion: Date.now(),
    };
    setColaNotificaciones((prev) => [nuevaNotif, ...prev]);

    // Persistir aviso y notificación en Firestore del proyecto de pruebas
    try {
      const { db } = inicializarFirebase(PROYECTO_PRUEBAS_FIREBASE_CONFIG);
      addDoc(collection(db, 'avisos'), {
        ...avisoCompleto,
        fechaGuardado: Date.now(),
      }).catch((err) => console.warn('Error al guardar aviso en Firestore:', err));

      addDoc(collection(db, 'cola_notificaciones'), {
        titulo: avisoCompleto.titulo,
        cuerpo: avisoCompleto.contenido.substring(0, 100) + '...',
        alcance: avisoCompleto.alcance,
        emisor: avisoCompleto.remitenteNombre || 'Centro',
        fechaCreacion: Date.now(),
        estado: 'pendiente',
      }).catch((err) => console.warn('Error al encolar en Firestore:', err));
    } catch (e) {
      console.warn('Firestore no disponible:', e);
    }

    // Disparar notificación visual del sistema operativo
    dispararNotificacionSistema(
      avisoCompleto.titulo,
      avisoCompleto.contenido.substring(0, 100) + '...',
      '/'
    );
    mostrarToastNotificacion(
      avisoCompleto.titulo,
      avisoCompleto.contenido.substring(0, 100) + '...'
    );
  };

  const activarNotificacionesPush = async (): Promise<boolean> => {
    try {
      const token = await solicitarPermisoNotificaciones(PROYECTO_PRUEBAS_FIREBASE_CONFIG);
      if (typeof window !== 'undefined' && 'Notification' in window) {
        setPermisoNotificaciones(Notification.permission);
      }
      if (token) {
        setFcmToken(token);
        const { db } = inicializarFirebase(PROYECTO_PRUEBAS_FIREBASE_CONFIG);
        try {
          await setDoc(doc(db, 'dispositivos_fcm', token.substring(0, 24)), {
            token,
            usuarioUid: currentUser.uid,
            usuarioNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
            rol: currentUser.rol,
            fechaRegistro: Date.now(),
            navegador: navigator.userAgent,
          });
        } catch (e) {
          console.warn('Error registrando token en Firestore:', e);
        }
        dispararNotificacionSistema(
          'Notificaciones Push activadas',
          `Dispositivo vinculado con el proyecto ${PROYECTO_PRUEBAS_FIREBASE_CONFIG.projectId}`
        );
        mostrarToastNotificacion(
          'Notificaciones Push activadas',
          `Dispositivo vinculado con el proyecto ${PROYECTO_PRUEBAS_FIREBASE_CONFIG.projectId}`
        );
        return true;
      }
    } catch (err) {
      console.warn('Error al activar notificaciones:', err);
    }
    return false;
  };

  const enviarNotificacionPrueba = async (): Promise<void> => {
    const titulo = 'Prueba Push: El Molinillo';
    const cuerpo = `Canal Cloud Messaging activo en ${centroInfo?.nombreCentro || 'el centro escolar'}.`;
    try {
      const { db } = inicializarFirebase(PROYECTO_PRUEBAS_FIREBASE_CONFIG);
      await addDoc(collection(db, 'cola_notificaciones'), {
        titulo,
        cuerpo,
        alcance: 'TODOS',
        emisor: 'Sistema Molinillo',
        estado: 'pendiente',
        fechaCreacion: Date.now(),
        prueba: true,
      });
    } catch (e) {
      console.warn('Error registrando notificación de prueba en Firestore:', e);
    }
    dispararNotificacionSistema(titulo, cuerpo);
    mostrarToastNotificacion(titulo, cuerpo);
  };

  const firmarAutorizacion = (
    avisoId: string,
    alumnoId: string,
    dni: string,
    aceptado: boolean
  ) => {
    setFirmas((prev) =>
      prev.map((exp) => {
        if (exp.avisoId === avisoId && exp.alumnoId === alumnoId) {
          const nuevaFirma = {
            progenitorUid: currentUser.uid,
            progenitorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
            progenitorDni: dni,
            fechaFirma: Date.now(),
            aceptado,
          };

          // Reemplazar o añadir la firma de este progenitor
          const firmasActualizadas = [
            ...exp.firmas.filter((f) => f.progenitorUid !== currentUser.uid),
            nuevaFirma,
          ];

          // Determinar si está completada
          let completada = false;
          if (exp.requiereAmbos) {
            // Requiere dos firmas
            completada = firmasActualizadas.length >= 2;
          } else {
            // Con una sola basta
            completada = firmasActualizadas.length >= 1;
          }

          return {
            ...exp,
            firmas: firmasActualizadas,
            estado: completada ? 'completada' : 'pendiente',
          };
        }
        return exp;
      })
    );
  };

  const enviarMensaje = (
    conversacionId: string,
    texto: string,
    replicarAAmbosProgenitores: boolean = false
  ) => {
    if (!texto.trim() || texto.length > 500) return;

    const convActual = conversaciones.find((c) => c.id === conversacionId);
    if (!convActual) return;

    const nuevoMensaje: Mensaje = {
      id: 'msg-' + Date.now(),
      conversacionId,
      remitenteUid: currentUser.uid,
      remitenteNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      remitenteRol: currentUser.rol,
      texto: texto.trim(),
      timestamp: Date.now(),
      leido: false,
    };

    setMensajes((prev) => [...prev, nuevoMensaje]);

    // Actualizar último mensaje en la conversación
    setConversaciones((prev) =>
      prev.map((c) => {
        if (c.id === conversacionId) {
          return {
            ...c,
            ultimoMensaje: nuevoMensaje.texto,
            fechaUltimoMensaje: nuevoMensaje.timestamp,
          };
        }
        return c;
      })
    );

    // Si el profesor activa "Replicar a ambos progenitores" en caso de padres separados
    if (
      replicarAAmbosProgenitores &&
      currentUser.rol === 'profesor' &&
      convActual.alumnoId
    ) {
      const alumno = alumnos.find((a) => a.id === convActual.alumnoId);
      if (alumno && alumno.padresSeparados) {
        // Buscar las otras conversaciones de este alumno con los demás progenitores
        const otrasConversaciones = conversaciones.filter(
          (c) => c.alumnoId === alumno.id && c.id !== conversacionId
        );

        otrasConversaciones.forEach((otraConv) => {
          const msgReplica: Mensaje = {
            id: 'msg-' + Date.now() + '-rep',
            conversacionId: otraConv.id,
            remitenteUid: currentUser.uid,
            remitenteNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
            remitenteRol: currentUser.rol,
            texto: texto.trim(),
            timestamp: Date.now(),
            leido: false,
          };

          setMensajes((prev) => [...prev, msgReplica]);

          setConversaciones((prev) =>
            prev.map((c) => {
              if (c.id === otraConv.id) {
                return {
                  ...c,
                  ultimoMensaje: msgReplica.texto,
                  fechaUltimoMensaje: msgReplica.timestamp,
                };
              }
              return c;
            })
          );
        });
      }
    }
  };

  const [conversacionesArchivadasIds, setConversacionesArchivadasIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem('molinillo_conversaciones_archivadas');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  const archivarConversacion = (conversacionId: string) => {
    setConversacionesArchivadasIds((prev) => {
      const updated = prev.includes(conversacionId) ? prev : [...prev, conversacionId];
      try {
        localStorage.setItem('molinillo_conversaciones_archivadas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const desarchivarConversacion = (conversacionId: string) => {
    setConversacionesArchivadasIds((prev) => {
      const updated = prev.filter((id) => id !== conversacionId);
      try {
        localStorage.setItem('molinillo_conversaciones_archivadas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const eliminarConversacion = (conversacionId: string) => {
    setConversaciones((prev) => {
      const updated = prev.filter((c) => c.id !== conversacionId);
      try {
        localStorage.setItem('molinillo_conversaciones', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setMensajes((prev) => {
      const updated = prev.filter((m) => m.conversacionId !== conversacionId);
      try {
        localStorage.setItem('molinillo_mensajes', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setConversacionesArchivadasIds((prev) => {
      const updated = prev.filter((id) => id !== conversacionId);
      try {
        localStorage.setItem('molinillo_conversaciones_archivadas', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const agregarAlumno = (nuevo: Omit<Alumno, 'id' | 'activo'>) => {
    const id = 'alum-' + Date.now();
    const curso = cursos.find((c) => c.id === nuevo.cursoId);
    const alumnoCompleto: Alumno = {
      ...nuevo,
      id,
      cursoNombre: curso?.nombre || nuevo.cursoId,
      tutorUid: curso?.tutorUid || '',
      activo: true,
    };
    setAlumnos((prev) => [...prev, alumnoCompleto]);
  };

  const eliminarAlumno = (alumnoId: string) => {
    setAlumnos((prev) => prev.filter((a) => a.id !== alumnoId));
  };

  const agregarCurso = (nuevo: Omit<Curso, 'activo'>) => {
    setCursos((prev) => [...prev, { ...nuevo, activo: true }]);
  };

  const eliminarCurso = (cursoId: string) => {
    setCursos((prev) => prev.filter((c) => c.id !== cursoId));
  };

  const aprobarSolicitud = (userId: string, rol: RolUsuario, cursosAsignados: string[]) => {
    const solic = solicitudesPendientes.find((s) => s.uid === userId);
    if (!solic) return;
    const usuarioAprobado: UsuarioPerfil = {
      ...solic,
      rol,
      cursos: cursosAsignados,
      activo: true,
    };
    setUsuarios((prev) => [...prev, usuarioAprobado]);
    setSolicitudesPendientes((prev) => prev.filter((s) => s.uid !== userId));
  };

  const rechazarSolicitud = (userId: string) => {
    setSolicitudesPendientes((prev) => prev.filter((s) => s.uid !== userId));
  };

  const importarAlumnosMasivo = (nuevos: Omit<Alumno, 'id' | 'activo'>[]) => {
    const convertidos: Alumno[] = nuevos.map((n, idx) => ({
      ...n,
      id: 'alum-imp-' + Date.now() + '-' + idx,
      activo: true,
    }));
    setAlumnos((prev) => [...convertidos, ...prev]);
  };

  const actualizarDatosCentro = (datos: {
    nombreCentro?: string;
    codigoCentro?: string;
    direccion?: string;
    telefono?: string;
    email?: string;
    horarioAtencion?: string;
    logoUrl?: string;
    visibilidad?: VisibilidadDatosCentro;
  }) => {
    setCentroInfo((prev) => {
      const updated: CentroInfo = {
        ...prev,
        nombreCentro: datos.nombreCentro || prev?.nombreCentro || 'CEIP El Molinillo',
        codigoCentro: datos.codigoCentro || prev?.codigoCentro || '00000000',
        direccion: datos.direccion !== undefined ? datos.direccion : prev?.direccion,
        telefono: datos.telefono !== undefined ? datos.telefono : prev?.telefono,
        email: datos.email !== undefined ? datos.email : prev?.email,
        horarioAtencion: datos.horarioAtencion !== undefined ? datos.horarioAtencion : prev?.horarioAtencion,
        logoUrl: datos.logoUrl !== undefined ? datos.logoUrl : prev?.logoUrl,
        visibilidad: datos.visibilidad
          ? { ...(prev?.visibilidad || {}), ...datos.visibilidad }
          : prev?.visibilidad,
      };
      localStorage.setItem('molinillo_centro_info', JSON.stringify(updated));
      return updated;
    });
  };

  const limpiarConfiguracion = () => {
    localStorage.removeItem('molinillo_firebase_config');
    localStorage.removeItem('molinillo_centro_info');
    setCentroInfo(null);
  };

  const votarEncuesta = (encuestaId: string, opciones: number[]) => {
    setVotosEncuestas((prev) => {
      const actuales = prev[encuestaId] || [];
      const sinAnterior = actuales.filter((v) => v.uidPadre !== currentUser.uid);
      const nuevoVoto: VotoEncuesta = {
        uidPadre: currentUser.uid,
        nombrePadre: `${currentUser.nombre} ${currentUser.apellidos}`,
        opcionesSeleccionadas: opciones,
        timestamp: Date.now(),
      };
      return { ...prev, [encuestaId]: [...sinAnterior, nuevoVoto] };
    });
  };

  const crearEncuesta = (
    encuestaData: Omit<Encuesta, 'id' | 'creadoEn' | 'creadorUid' | 'creadorNombre' | 'activa'>
  ) => {
    const nueva: Encuesta = {
      ...encuestaData,
      id: 'enc-' + Date.now(),
      creadorUid: currentUser.uid,
      creadorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      creadoEn: Date.now(),
      activa: true,
    };
    setEncuestas((prev) => [nueva, ...prev]);
  };

  const crearEvento = (
    eventoData: Omit<EventoEscolar, 'id' | 'creadorUid' | 'creadorNombre' | 'activo'>
  ) => {
    const nuevo: EventoEscolar = {
      ...eventoData,
      id: 'evt-' + Date.now(),
      creadorUid: currentUser.uid,
      creadorNombre: `${currentUser.nombre} ${currentUser.apellidos}`,
      activo: true,
    };
    setEventos((prev) => [nuevo, ...prev]);
  };

  const enviarJustificanteAusencia = (
    ausenciaData: Omit<JustificanteAusencia, 'id' | 'estado' | 'fechaEnvio' | 'revisadoPor'>
  ) => {
    const nueva: JustificanteAusencia = {
      ...ausenciaData,
      id: 'aus-' + Date.now(),
      estado: 'pendiente',
      fechaEnvio: Date.now(),
    };
    setAusencias((prev) => [nueva, ...prev]);
  };

  const resolverAusencia = (
    ausenciaId: string,
    estado: 'justificada' | 'rechazada',
    comentario?: string
  ) => {
    setAusencias((prev) =>
      prev.map((a) =>
        a.id === ausenciaId
          ? {
              ...a,
              estado,
              comentarioCentro: comentario || a.comentarioCentro,
              revisadoPor: `${currentUser.nombre} ${currentUser.apellidos}`,
            }
          : a
      )
    );
  };

  const agregarRecurso = (recData: Omit<RecursoExterno, 'id'>) => {
    const nuevo: RecursoExterno = {
      ...recData,
      id: 'rec-' + Date.now(),
    };
    setRecursos((prev) => [...prev, nuevo]);
  };

  const eliminarRecurso = (id: string) => {
    setRecursos((prev) => prev.filter((r) => r.id !== id));
  };

  const confirmarLecturaAviso = (avisoId: string) => {
    setConfirmacionesLectura((prev) => {
      const lista = prev[avisoId] || [];
      if (lista.includes(currentUser.uid)) return prev;
      return { ...prev, [avisoId]: [...lista, currentUser.uid] };
    });
  };

  const actualizarHorarioSilencio = (config: HorarioSilencioConfig) => {
    setHorarioSilencio(config);
  };

  const crearGrupoPersonalizado = (
    grupoData: Omit<GrupoPersonalizado, 'id' | 'fechaCreacion' | 'activo'>
  ) => {
    const nuevo: GrupoPersonalizado = {
      ...grupoData,
      id: 'grp-' + Date.now(),
      fechaCreacion: Date.now(),
      activo: true,
    };
    setGruposPersonalizados((prev) => [...prev, nuevo]);
  };

  const actualizarGrupoPersonalizado = (id: string, datos: Partial<GrupoPersonalizado>) => {
    setGruposPersonalizados((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...datos } : g))
    );
  };

  const eliminarGrupoPersonalizado = (id: string) => {
    setGruposPersonalizados((prev) => prev.filter((g) => g.id !== id));
  };

  const agregarMiembroAGrupo = (grupoId: string, usuarioUid: string) => {
    setGruposPersonalizados((prev) =>
      prev.map((g) => {
        if (g.id === grupoId && !g.miembrosUids.includes(usuarioUid)) {
          return { ...g, miembrosUids: [...g.miembrosUids, usuarioUid] };
        }
        return g;
      })
    );
    // Asignar el grupo al usuario
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.uid === usuarioUid) {
          const grps = u.grupos || [];
          return grps.includes(grupoId) ? u : { ...u, grupos: [...grps, grupoId] };
        }
        return u;
      })
    );
  };

  const quitarMiembroDeGrupo = (grupoId: string, usuarioUid: string) => {
    setGruposPersonalizados((prev) =>
      prev.map((g) => {
        if (g.id === grupoId) {
          return { ...g, miembrosUids: g.miembrosUids.filter((uid) => uid !== usuarioUid) };
        }
        return g;
      })
    );
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.uid === usuarioUid) {
          return { ...u, grupos: (u.grupos || []).filter((id) => id !== grupoId) };
        }
        return u;
      })
    );
  };

  const toggleBloqueoNotificacionesPadre = (progenitorUid: string) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.uid === progenitorUid) {
          const bloqueadas = !u.notificacionesBloqueadas;
          return { ...u, notificacionesBloqueadas: bloqueadas };
        }
        return u;
      })
    );
  };

  const actualizarPermisosProgenitor = (
    progenitorUid: string,
    permisos: Partial<PermisosGrupo>
  ) => {
    setUsuarios((prev) =>
      prev.map((u) => {
        if (u.uid === progenitorUid) {
          return { ...u, permisosEspeciales: { ...u.permisosEspeciales, ...permisos } };
        }
        return u;
      })
    );
  };

  const agregarOrganoEmisor = (organo: Omit<OrganoEmisor, 'id'>) => {
    const nuevo: OrganoEmisor = {
      ...organo,
      id: `emisor-${Date.now()}`,
    };
    setOrganosEmisores((prev) => [...prev, nuevo]);
  };

  const eliminarOrganoEmisor = (id: string) => {
    setOrganosEmisores((prev) => prev.filter((o) => o.id !== id));
  };

  const actualizarOrganoEmisor = (id: string, datos: Partial<OrganoEmisor>) => {
    setOrganosEmisores((prev) =>
      prev.map((o) => (o.id === id ? { ...o, ...datos } : o))
    );
  };

  return (
    <AppContext.Provider
      value={{
        centroInfo,
        currentUser,
        selectedPerfilId,
        cambiarPerfil,
        cursos,
        alumnos,
        avisos,
        firmas,
        conversaciones,
        mensajes,
        colaNotificaciones,
        usuarios,
        solicitudesPendientes,
        encuestas,
        votosEncuestas,
        eventos,
        ausencias,
        recursos,
        confirmacionesLectura,
        horarioSilencio,
        gruposPersonalizados,
        organosEmisores,
        agregarOrganoEmisor,
        eliminarOrganoEmisor,
        actualizarOrganoEmisor,
        alumnoActivoId,
        setAlumnoActivoId,
        horarioLaboralActivo,
        toggleHorarioLaboral,
        modoSimuladorMovil,
        toggleModoSimuladorMovil,
        setModoSimuladorMovil,
        mostrarExplicacionRolesAmpa,
        setMostrarExplicacionRolesAmpa,
        mostrarTextosInformativos,
        setMostrarTextosInformativos,
        publicarAviso,
        firmarAutorizacion,
        enviarMensaje,
        archivarConversacion,
        desarchivarConversacion,
        eliminarConversacion,
        conversacionesArchivadasIds,
        agregarAlumno,
        eliminarAlumno,
        agregarCurso,
        eliminarCurso,
        aprobarSolicitud,
        rechazarSolicitud,
        importarAlumnosMasivo,
        modalDatosCentroOpen,
        setModalDatosCentroOpen,
        modalPerfilOpen,
        setModalPerfilOpen,
        actualizarDatosCentro,
        actualizarFotoPerfil,
        actualizarHorarioNotificacionesUsuario,
        votarEncuesta,
        crearEncuesta,
        crearEvento,
        enviarJustificanteAusencia,
        resolverAusencia,
        agregarRecurso,
        eliminarRecurso,
        confirmarLecturaAviso,
        actualizarHorarioSilencio,
        crearGrupoPersonalizado,
        actualizarGrupoPersonalizado,
        eliminarGrupoPersonalizado,
        agregarMiembroAGrupo,
        quitarMiembroDeGrupo,
        toggleBloqueoNotificacionesPadre,
        actualizarPermisosProgenitor,
        cambiarRolActivo,
        actualizarRolesUsuario,
        limpiarConfiguracion,
        recargarConfiguracion,
        firebaseConectado,
        fcmToken,
        permisoNotificaciones,
        activarNotificacionesPush,
        enviarNotificacionPrueba,
        toastNotificacion,
        cerrarToastNotificacion,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
};

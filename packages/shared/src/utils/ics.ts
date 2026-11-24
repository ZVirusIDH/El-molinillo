import { EventoEscolar } from '../types/evento.js';

/**
 * Formatea un timestamp Unix (ms o seg) en formato iCalendar YYYYMMDDTHHMMSSZ (UTC)
 */
export function formatIcsDate(timestamp: number): string {
  // Asegurar milisegundos si viene en segundos
  const ms = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  const d = new Date(ms);
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

/**
 * Genera el contenido en formato iCalendar (.ics) estándar
 * Compatible con Apple Calendar, Google Calendar, Outlook y Android.
 */
export function generarIcs(evento: EventoEscolar, organizadorNombre: string = 'Colegio'): string {
  const dtStart = formatIcsDate(evento.fechaInicio);
  const dtEnd = formatIcsDate(evento.fechaFin || evento.fechaInicio + 3600 * 1000);
  const dtStamp = formatIcsDate(Date.now());
  const uid = `molinillo-evt-${evento.id}@colegio`;

  // Limpiar texto para evitar romper cabeceras de iCalendar
  const cleanSummary = (evento.titulo || 'Evento Escolar').replace(/\n/g, ' ');
  const cleanDescription = (evento.descripcion || '').replace(/\n/g, '\\n');
  const cleanLocation = (evento.ubicacion || '').replace(/\n/g, ' ');

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Molinillo//Sistema de Mensajería Escolar//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${cleanSummary}`,
    `DESCRIPTION:${cleanDescription}`,
    cleanLocation ? `LOCATION:${cleanLocation}` : '',
    `ORGANIZER;CN=${organizadorNombre}:mailto:no-reply@molinillo.local`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/**
 * Descarga o lanza el archivo .ics en el navegador del usuario
 */
export function descargarIcs(evento: EventoEscolar, organizadorNombre?: string): void {
  const icsData = generarIcs(evento, organizadorNombre);
  const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${evento.titulo.replace(/[^a-zA-Z0-9_-]/g, '_')}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

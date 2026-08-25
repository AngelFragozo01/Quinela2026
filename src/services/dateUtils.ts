/**
 * Utilidades para manejo, formateo y reglas de tiempo de votación de partidos.
 */

/**
 * Retorna la etiqueta formateada para una semana (ej. "Pretemporada 3", "Semana 1").
 */
export function getWeekLabel(week: number): string {
  if (week < 0) {
    return `Pretemporada ${Math.abs(week)}`;
  }
  if (week === 0) {
    return 'Pretemporada';
  }
  return `Semana ${week}`;
}

/**
 * Obtiene el objeto Date local a medianoche correspondiente a la fecha del partido.
 * Extrae siempre el año, mes y día de forma literal para evitar desfases por zona horaria.
 */
export function getMatchLocalDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const cleanDate = dateStr.split('T')[0].trim();
    const [year, month, day] = cleanDate.split('-').map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day, 0, 0, 0);
  } catch {
    return null;
  }
}

/**
 * Determina si la votación para una semana completa está cerrada.
 * Se controla exclusivamente de forma manual por el Administrador (is_locked = true).
 */
export function isWeekVotingClosed(matchesInWeek: any[]): boolean {
  if (!matchesInWeek || matchesInWeek.length === 0) return false;
  return matchesInWeek.some(m => m.isLocked === true || m.is_locked === true);
}

/**
 * Formatea el texto de estado de cierre para la interfaz.
 */
export function formatDeadlineText(isManuallyLocked?: boolean): string {
  if (isManuallyLocked) return 'Bloqueada por el Administrador';
  return 'Votación Abierta';
}

/**
 * Calcula cuántos días faltan para un partido.
 */
export function getDaysUntilMatch(dateStr: string): number {
  const matchDate = getMatchLocalDate(dateStr);
  if (!matchDate) return 999;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);

  const diffTime = matchDate.getTime() - today.getTime();
  return Math.round(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Formatea una fecha de partido de forma segura evitando el desfase de zona horaria.
 */
export function formatMatchDate(dateStr: string): { formattedDate: string; formattedTime: string } {
  if (!dateStr) return { formattedDate: '', formattedTime: '' };

  try {
    const cleanDate = dateStr.split('T')[0].trim();
    const [year, month, day] = cleanDate.split('-').map(Number);
    
    if (year && month && day) {
      const localDate = new Date(year, month - 1, day, 12, 0, 0);
      
      let formattedTime = 'TBD';
      if (dateStr.includes('T') && !dateStr.includes('T18:00:00') && !dateStr.includes('T00:00:00')) {
        const timePart = dateStr.split('T')[1].split('.')[0];
        if (timePart && timePart !== '00:00:00') {
          const [h, m] = timePart.split(':');
          formattedTime = `${h}:${m}`;
        }
      }

      return {
        formattedDate: localDate.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }),
        formattedTime
      };
    }

    const d = new Date(dateStr);
    return {
      formattedDate: d.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }),
      formattedTime: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    };
  } catch {
    return { formattedDate: dateStr, formattedTime: '' };
  }
}

/**
 * Comprueba si la fecha del partido corresponde al día de hoy.
 */
export function isMatchToday(dateStr: string): boolean {
  return getDaysUntilMatch(dateStr) === 0;
}

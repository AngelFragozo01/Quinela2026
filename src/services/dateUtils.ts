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
 * Calcula la fecha y hora límite de votación para una semana dada.
 * Regla: La votación se cierra el jueves anterior al inicio de los partidos de esa semana a las 23:59:59.
 * Por ejemplo: Si los partidos de la Semana 1 empiezan el miércoles 9 de septiembre,
 * el jueves anterior es el jueves 3 de septiembre a las 23:59:59.
 */
export function getWeekClosingDeadline(matchesInWeek: any[]): Date | null {
  if (!matchesInWeek || matchesInWeek.length === 0) return null;

  let earliestDate: Date | null = null;
  for (const m of matchesInWeek) {
    const dateStr = m.date || m.match_date;
    const d = getMatchLocalDate(dateStr);
    if (d) {
      if (!earliestDate || d.getTime() < earliestDate.getTime()) {
        earliestDate = d;
      }
    }
  }

  if (!earliestDate) return null;

  const deadline = new Date(earliestDate.getTime());
  deadline.setDate(deadline.getDate() - 1);
  while (deadline.getDay() !== 4) { // 4 = Jueves
    deadline.setDate(deadline.getDate() - 1);
  }

  deadline.setHours(23, 59, 59, 999);
  return deadline;
}

/**
 * Determina si la votación para una semana completa ya está cerrada.
 * Se considera cerrada si:
 * 1. Fue bloqueada manualmente por el Admin (is_locked = true), O
 * 2. Ya pasó el plazo límite del jueves anterior.
 */
export function isWeekVotingClosed(matchesInWeek: any[]): boolean {
  if (!matchesInWeek || matchesInWeek.length === 0) return false;

  const isManuallyLocked = matchesInWeek.some(m => m.isLocked === true || m.is_locked === true);
  if (isManuallyLocked) return true;

  const deadline = getWeekClosingDeadline(matchesInWeek);
  if (!deadline) return false;
  return new Date().getTime() >= deadline.getTime();
}

/**
 * Formatea el texto de la fecha límite para la interfaz.
 */
export function formatDeadlineText(deadline: Date | null, isManuallyLocked?: boolean): string {
  if (isManuallyLocked) return 'Bloqueada manualmente por el Administrador';
  if (!deadline) return 'Por definir';
  const dateStr = deadline.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  return `${dateStr} a las 23:59 h`;
}

/**
 * Calcula cuántos días faltan para una fecha límite o partido.
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

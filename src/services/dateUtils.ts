/**
 * Utilidades para manejo, formateo y reglas de tiempo de votación de partidos.
 */

/**
 * Obtiene el objeto Date local a medianoche correspondiente a la fecha del partido.
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

  // Retroceder hasta encontrar el jueves previo al inicio de la jornada
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
 */
export function isWeekVotingClosed(matchesInWeek: any[]): boolean {
  const deadline = getWeekClosingDeadline(matchesInWeek);
  if (!deadline) return false;
  return new Date().getTime() >= deadline.getTime();
}

/**
 * Formatea el texto de la fecha límite para la interfaz.
 */
export function formatDeadlineText(deadline: Date | null): string {
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
    if (dateStr.includes('T00:00:00') || /^\d{4}-\d{2}-\d{2}$/.test(dateStr.trim())) {
      const cleanDate = dateStr.split('T')[0].trim();
      const [year, month, day] = cleanDate.split('-').map(Number);
      const localDate = new Date(year, month - 1, day, 12, 0, 0);

      return {
        formattedDate: localDate.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' }),
        formattedTime: 'TBD'
      };
    }

    const d = new Date(dateStr);
    if (isNaN(d.getTime())) {
      const cleanDate = dateStr.split('T')[0].trim();
      return { formattedDate: cleanDate, formattedTime: '' };
    }

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

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
 * Calcula cuántos días faltan para el partido respecto al día de hoy (en días calendario).
 * Retorna:
 *  0 = Es hoy (Día del partido)
 *  1 = Es mañana (Falta 1 día)
 *  2 = Faltan 2 días
 *  3 = Faltan 3 días
 *  < 0 = Ya pasó
 *  > 3 = Falta más de 3 días
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
 * Determina si el partido está en la ventana de visualización de Predicciones (hasta 3 días antes y el día de hoy).
 */
export function isMatchInVotingWindow(dateStr: string): boolean {
  const days = getDaysUntilMatch(dateStr);
  return days >= 0 && days <= 3;
}

/**
 * Determina si la votación para el partido está cerrada/bloqueada (el mismo día del juego o posterior).
 */
export function isMatchVotingLocked(dateStr: string): boolean {
  const days = getDaysUntilMatch(dateStr);
  // Se bloquea el mismo día del juego (0) o si ya pasó (< 0)
  return days <= 0;
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

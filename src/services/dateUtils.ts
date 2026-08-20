/**
 * Utilidades para manejo y formateo de fechas de partidos sin desfase de zona horaria.
 */

export function formatMatchDate(dateStr: string): { formattedDate: string; formattedTime: string } {
  if (!dateStr) return { formattedDate: '', formattedTime: '' };

  try {
    // Si la fecha viene en formato simple "YYYY-MM-DD" o contiene "T00:00:00" (sin hora específica)
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

export function isMatchToday(dateStr: string): boolean {
  if (!dateStr) return false;
  try {
    const cleanDate = dateStr.split('T')[0].trim();
    const [year, month, day] = cleanDate.split('-').map(Number);

    const today = new Date();
    return (
      today.getFullYear() === year &&
      today.getMonth() + 1 === month &&
      today.getDate() === day
    );
  } catch {
    return false;
  }
}

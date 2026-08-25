import { useState } from 'react';
import { supabase } from '../../supabase';
import { getTeamIdFromName } from '../../services/mockData';
import styles from './CsvImportTab.module.css';

export default function CsvImportTab() {
  const [csvText, setCsvText] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvMessage, setCsvMessage] = useState('');
  const [csvProgress, setCsvProgress] = useState<{ total: number; inserted: number; errors: string[] }>({ total: 0, inserted: 0, errors: [] });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      setCsvMessage('⚠️ Por favor ingresa o sube el contenido del archivo CSV.');
      return;
    }

    setCsvLoading(true);
    setCsvMessage('');
    const lines = csvText.trim().split('\n');
    const errors: string[] = [];
    const matchesToInsert: any[] = [];

    const startIdx = lines[0].toLowerCase().includes('semana') || lines[0].toLowerCase().includes('week') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 4) {
        errors.push(`Fila ${i + 1}: Formato inválido (${line})`);
        continue;
      }

      const [weekStr, dateStr, awayTeamRaw, homeTeamRaw] = parts;
      let week = parseInt(weekStr) || 1;
      if (weekStr.toLowerCase().includes('pretemporada 3') || weekStr.toLowerCase().includes('p3')) {
        week = -3;
      } else if (weekStr.toLowerCase().includes('pretemporada 2') || weekStr.toLowerCase().includes('p2')) {
        week = -2;
      } else if (weekStr.toLowerCase().includes('pretemporada 1') || weekStr.toLowerCase().includes('p1')) {
        week = -1;
      }

      const awayId = getTeamIdFromName(awayTeamRaw);
      const homeId = getTeamIdFromName(homeTeamRaw);

      if (!awayId) {
        errors.push(`Fila ${i + 1}: No se reconoció el equipo visitante "${awayTeamRaw}"`);
        continue;
      }
      if (!homeId) {
        errors.push(`Fila ${i + 1}: No se reconoció el equipo local "${homeTeamRaw}"`);
        continue;
      }

      let isoDateString: string;
      try {
        const cleanDate = dateStr.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
          isoDateString = `${cleanDate}T18:00:00.000Z`;
        } else {
          const parsed = new Date(cleanDate);
          if (isNaN(parsed.getTime())) throw new Error('Fecha inválida');
          isoDateString = parsed.toISOString();
        }
      } catch {
        errors.push(`Fila ${i + 1}: Fecha inválida "${dateStr}"`);
        continue;
      }

      const isLockedByDefault = week !== 1 && week !== -3;

      matchesToInsert.push({
        week: week,
        match_date: isoDateString,
        away_team_id: awayId,
        home_team_id: homeId,
        is_finished: false,
        is_locked: isLockedByDefault,
        home_score: 0,
        away_score: 0
      });
    }

    if (matchesToInsert.length === 0) {
      setCsvMessage('❌ No se encontraron partidos válidos para insertar.');
      setCsvProgress({ total: 0, inserted: 0, errors });
      setCsvLoading(false);
      return;
    }

    try {
      const chunkSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < matchesToInsert.length; i += chunkSize) {
        const chunk = matchesToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('matches').insert(chunk);
        if (error) throw error;
        insertedCount += chunk.length;
      }

      setCsvProgress({ total: matchesToInsert.length, inserted: insertedCount, errors });
      setCsvMessage(`🎉 ¡Se importaron exitosamente ${insertedCount} partidos a Supabase!`);
    } catch (err: any) {
      setCsvMessage(`❌ Error al guardar en Supabase: ${err.message}`);
    } finally {
      setCsvLoading(false);
    }
  };

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>📁 Cargar Calendario Completo (CSV)</h3>
      <p className={styles.description}>
        Sube o pega el calendario de partidos en formato CSV. El sistema mapeará automáticamente los nombres de los equipos y cargará la temporada en Supabase.
      </p>

      {csvMessage && (
        <div className={csvMessage.includes('🎉') ? styles.alertSuccess : styles.alertError}>
          {csvMessage}
        </div>
      )}

      <div className={styles.section}>
        <label className={styles.label}>1. Seleccionar archivo .csv</label>
        <input 
          type="file" 
          accept=".csv,.txt"
          onChange={handleFileUpload}
          className={styles.fileInput}
        />
      </div>

      <div className={styles.section}>
        <label className={styles.label}>2. O pegar texto CSV aquí:</label>
        <textarea
          rows={8}
          value={csvText}
          onChange={e => setCsvText(e.target.value)}
          placeholder="Semana,Fecha,Equipo Visitante,Equipo Local&#10;1,2026-09-09,New England Patriots,Seattle Seahawks&#10;1,2026-09-10,San Francisco 49ers,Los Angeles Rams..."
          className={styles.textarea}
        />
      </div>

      <button
        onClick={handleImportCsv}
        disabled={csvLoading || !csvText.trim()}
        className={styles.importBtn}
      >
        {csvLoading ? 'Procesando e Importando Partidos...' : '🚀 Importar Calendario a Supabase'}
      </button>

      {csvProgress.errors.length > 0 && (
        <div className={styles.errorBox}>
          <div className={styles.errorTitle}>
            Errores encontrados ({csvProgress.errors.length}):
          </div>
          <ul className={styles.errorList}>
            {csvProgress.errors.slice(0, 5).map((err, i) => (
              <li key={i}>{err}</li>
            ))}
            {csvProgress.errors.length > 5 && (
              <li>... y {csvProgress.errors.length - 5} más.</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

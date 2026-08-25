import { useState } from 'react';
import { supabase } from '../../supabase';
import { TEAMS } from '../../services/mockData';
import { getWeekLabel } from '../../services/dateUtils';
import styles from './CreateMatchTab.module.css';

export default function CreateMatchTab() {
  const [homeTeam, setHomeTeam] = useState('KC');
  const [awayTeam, setAwayTeam] = useState('SF');
  const [matchDate, setMatchDate] = useState('');
  const [matchWeek, setMatchWeek] = useState(-3); // Pretemporada 3 por defecto
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage('');

    try {
      const { error } = await supabase.from('matches').insert({
        home_team_id: homeTeam,
        away_team_id: awayTeam,
        match_date: new Date(matchDate).toISOString(),
        week: matchWeek,
        is_finished: false,
        is_locked: false,
      });

      if (error) throw error;
      setCreateMessage(`✅ Partido de ${getWeekLabel(matchWeek)} creado exitosamente.`);
      setMatchDate('');
    } catch (err: any) {
      setCreateMessage(`❌ Error al crear partido: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const teamOptions = Object.keys(TEAMS).map(key => (
    <option key={key} value={key}>{TEAMS[key].name}</option>
  ));

  return (
    <div className={styles.card}>
      <h3 className={styles.heading}>
        Añadir Nuevo Partido Manual (Pretemporada o Temporada Regular)
      </h3>

      {createMessage && <div className={styles.message}>{createMessage}</div>}

      <form onSubmit={handleCreateMatch} className={styles.form}>
        <div className={styles.row}>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Local</label>
            <select 
              value={homeTeam} 
              onChange={e => setHomeTeam(e.target.value)}
              className={styles.select}
            >
              {teamOptions}
            </select>
          </div>
          <div className={styles.fieldGroup}>
            <label className={styles.label}>Visitante</label>
            <select 
              value={awayTeam} 
              onChange={e => setAwayTeam(e.target.value)}
              className={styles.select}
            >
              {teamOptions}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.fieldGroupSmall}>
            <label className={styles.label}>Semana / Jornada</label>
            <select
              value={matchWeek}
              onChange={e => setMatchWeek(Number(e.target.value))}
              className={styles.select}
            >
              <optgroup label="🔥 Pretemporada">
                <option value={-3}>Pretemporada 3</option>
                <option value={-2}>Pretemporada 2</option>
                <option value={-1}>Pretemporada 1</option>
              </optgroup>
              <optgroup label="🏈 Temporada Regular">
                {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                  <option key={w} value={w}>Semana {w}</option>
                ))}
              </optgroup>
            </select>
          </div>

          <div className={styles.fieldGroupLarge}>
            <label className={styles.label}>Fecha y Hora</label>
            <input 
              type="datetime-local" 
              required
              value={matchDate}
              onChange={e => setMatchDate(e.target.value)}
              className={styles.input}
            />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={createLoading}
          className={styles.submitBtn}
        >
          {createLoading ? 'Guardando...' : 'Añadir Partido'}
        </button>
      </form>
    </div>
  );
}

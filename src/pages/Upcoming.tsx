import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';
import { getWeekLabel } from '../services/dateUtils';
import styles from './Upcoming.module.css';

export default function Upcoming() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  useEffect(() => {
    fetchUpcomingData();
  }, []);

  const fetchUpcomingData = async () => {
    setLoading(true);

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('is_finished', false)
      .order('week', { ascending: true })
      .order('match_date', { ascending: true });

    if (matchesData) {
      const formatted = matchesData.map(m => ({
        id: m.id,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        date: m.match_date,
        week: m.week ?? 1,
        isFinished: m.is_finished,
        homeScore: m.home_score,
        awayScore: m.away_score,
        winnerTeamId: m.winner_team_id
      }));
      setMatches(formatted);

      const weeks = Array.from(new Set(formatted.map(m => m.week))).sort((a, b) => a - b);
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando calendario de partidos...</div>;
  }

  const availableWeeks = Array.from(new Set(matches.map(m => m.week))).sort((a, b) => a - b);
  const currentWeekMatches = matches.filter(m => m.week === selectedWeek);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          📅 Calendario de Partidos por Semana
        </h2>
        <p className={styles.subtitle}>
          Consulta el calendario oficial de pretemporada y temporada regular organizado por semanas.
        </p>
      </div>

      {/* Selector de Semanas exclusivo */}
      {availableWeeks.length > 0 && (
        <div className={styles.weekSelector}>
          {availableWeeks.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`${styles.weekBtn} ${selectedWeek === w ? styles.weekBtnActive : ''}`}
            >
              {getWeekLabel(w)}
            </button>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <div className={styles.emptyState}>
          <p style={{ fontSize: '1.2rem' }}>No hay próximos partidos cargados en el calendario.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>El Administrador puede cargar el calendario de la temporada desde el panel de Admin.</p>
        </div>
      ) : (
        <section>
          <div className={styles.sectionHeader}>
            <span className={styles.badge}>
              {getWeekLabel(selectedWeek)}
            </span>
            <span className={styles.matchCount}>
              {currentWeekMatches.length} partidos programados
            </span>
          </div>

          <div className={styles.grid}>
            {currentWeekMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';
import { getWeekLabel } from '../services/dateUtils';
import styles from './History.module.css';

export default function History() {
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchHistoryData();
  }, []);

  const fetchHistoryData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const { data: predsData } = await supabase
        .from('predictions')
        .select('*')
        .eq('user_id', user.id);

      if (predsData) {
        const predsMap: Record<string, string> = {};
        predsData.forEach(p => {
          predsMap[p.match_id] = p.predicted_winner_id;
        });
        setPredictions(predsMap);
      }
    }

    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('is_finished', true)
      .order('week', { ascending: false })
      .order('match_date', { ascending: false });

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
      setFinishedMatches(formatted);

      const weeks = Array.from(new Set(formatted.map(m => m.week))).sort((a, b) => b - a);
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0]);
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando historial de semanas...</div>;
  }

  if (finishedMatches.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', animation: 'slideUp 0.4s ease' }}>
        <h2>📅 Historial de Partidos</h2>
        <p style={{ marginTop: '1rem' }}>Aún no hay partidos finalizados. Cuando el Administrador cierre y guarde el marcador de los partidos, aparecerán organizados por semana aquí.</p>
        <div style={{ marginTop: '2rem', fontSize: '3rem', opacity: 0.4 }}>🏆</div>
      </div>
    );
  }

  const availableWeeks = Array.from(new Set(finishedMatches.map(m => m.week))).sort((a, b) => a - b);

  const matchesByWeek: Record<number, any[]> = availableWeeks.reduce((acc, weekNum) => {
    if (selectedWeek === 'all' || selectedWeek === weekNum) {
      acc[weekNum] = finishedMatches.filter(m => m.week === weekNum);
    }
    return acc;
  }, {} as Record<number, any[]>);

  const currentWeekMatches = selectedWeek === 'all' 
    ? finishedMatches 
    : finishedMatches.filter(m => m.week === selectedWeek);

  const totalHits = currentWeekMatches.filter(m => predictions[m.id] === m.winnerTeamId).length;
  const totalPoints = totalHits * 10;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          🏆 Historial de Resultados por Semana
        </h2>
        <p className={styles.subtitle}>
          Consulta los marcadores finales oficiales y tus aciertos en cada jornada.
        </p>
      </div>

      {/* Selector de Semanas con scroll horizontal */}
      <div className={styles.weekSelector}>
        <button
          onClick={() => setSelectedWeek('all')}
          className={`${styles.weekBtn} ${selectedWeek === 'all' ? styles.weekBtnActive : ''}`}
        >
          Todas ({finishedMatches.length})
        </button>
        {availableWeeks.map(w => {
          const count = finishedMatches.filter(m => m.week === w).length;
          return (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`${styles.weekBtn} ${selectedWeek === w ? styles.weekBtnActive : ''}`}
            >
              {getWeekLabel(w)} ({count})
            </button>
          );
        })}
      </div>

      {/* Resumen de aciertos de la selección */}
      <div className={styles.performanceCard}>
        <div>
          <span className={styles.perfLabel}>
            Rendimiento {selectedWeek === 'all' ? 'Total' : getWeekLabel(selectedWeek)}
          </span>
          <div className={styles.perfValue}>
            {totalHits} aciertos de {currentWeekMatches.length} partidos
          </div>
        </div>
        <div className={styles.pointsBadge}>
          +{totalPoints} pts
        </div>
      </div>

      {/* Partidos agrupados por semana */}
      <div className={styles.weeksList}>
        {Object.keys(matchesByWeek).sort((a, b) => Number(b) - Number(a)).map(weekKey => {
          const weekNum = Number(weekKey);
          const weekMatches: any[] = matchesByWeek[weekNum];
          if (!weekMatches || weekMatches.length === 0) return null;

          return (
            <section key={weekNum}>
              <div className={styles.sectionHeader}>
                <span className={styles.weekBadge}>
                  {getWeekLabel(weekNum)}
                </span>
                <span className={styles.matchCount}>
                  {weekMatches.length} partidos finalizados
                </span>
              </div>

              <div className={styles.grid}>
                {weekMatches.map((match: any) => {
                  const userPred = predictions[match.id];
                  const isHit = userPred && userPred === match.winnerTeamId;

                  return (
                    <div key={match.id} style={{ position: 'relative' }}>
                      {userPred && (
                        <div className={`${styles.resultBadge} ${isHit ? styles.resultHit : styles.resultMiss}`}>
                          {isHit ? '🎯 ¡Acierto! (+10 pts)' : '❌ Fallado'}
                        </div>
                      )}
                      <MatchCard 
                        match={match} 
                        selectedTeamId={userPred}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

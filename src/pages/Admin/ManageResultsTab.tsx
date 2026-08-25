import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { TEAMS } from '../../services/mockData';
import { formatMatchDate, getWeekLabel } from '../../services/dateUtils';
import styles from './ManageResultsTab.module.css';

export default function ManageResultsTab() {
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({});
  const [manageMessage, setManageMessage] = useState('');

  useEffect(() => {
    fetchActiveMatches();
  }, []);

  const fetchActiveMatches = async () => {
    setManageLoading(true);
    setManageMessage('');
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('is_finished', false)
        .order('week', { ascending: true })
        .order('match_date', { ascending: true });

      if (error) throw error;

      if (data) {
        setActiveMatches(data);
        const initialScores: Record<string, { home: number; away: number }> = {};
        data.forEach(m => {
          initialScores[m.id] = { home: 0, away: 0 };
        });
        setScores(initialScores);
      }
    } catch (err: any) {
      setManageMessage(`❌ Error al cargar partidos: ${err.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  const handleScoreChange = (matchId: string, type: 'home' | 'away', val: string) => {
    const num = parseInt(val) || 0;
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: num
      }
    }));
  };

  const handleFinalizeMatch = async (matchId: string, homeTeamId: string, awayTeamId: string) => {
    const matchScores = scores[matchId];
    if (!matchScores) return;

    let winnerId: string | null = null;
    if (matchScores.home > matchScores.away) {
      winnerId = homeTeamId;
    } else if (matchScores.away > matchScores.home) {
      winnerId = awayTeamId;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          is_finished: true,
          home_score: matchScores.home,
          away_score: matchScores.away,
          winner_team_id: winnerId
        })
        .eq('id', matchId);

      if (error) throw error;
      
      setManageMessage('✅ Partido finalizado. Puntuaciones actualizadas en la clasificación e historial.');
      fetchActiveMatches();
    } catch (err: any) {
      setManageMessage(`❌ Error al finalizar partido: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Partidos Activos</h3>

      {manageMessage && <div className={styles.message}>{manageMessage}</div>}

      {manageLoading ? (
        <div>Cargando partidos activos...</div>
      ) : activeMatches.length === 0 ? (
        <div className={styles.emptyState}>No hay partidos activos por jugar.</div>
      ) : (
        activeMatches.map(match => {
          const home = TEAMS[match.home_team_id];
          const away = TEAMS[match.away_team_id];
          const matchId = match.id;
          const { formattedDate, formattedTime } = formatMatchDate(match.match_date);

          return (
            <div key={matchId} className={styles.matchCard}>
              <div className={styles.cardHeader}>
                <span className={styles.weekBadge}>
                  {getWeekLabel(match.week ?? 1)}
                </span>
                <span className={styles.dateText}>
                  {formattedDate} {formattedTime !== 'TBD' && formattedTime ? `• ${formattedTime}` : ''}
                </span>
              </div>
              
              <div className={styles.matchTeams}>
                {/* Visitante */}
                <div className={styles.teamBox}>
                  <img src={away?.logo} alt={away?.name} className={styles.teamLogo} />
                  <span className={styles.teamName}>{away?.name}</span>
                  <input 
                    type="number" 
                    min="0"
                    value={scores[matchId]?.away ?? 0}
                    onChange={e => handleScoreChange(matchId, 'away', e.target.value)}
                    className={styles.scoreInput}
                    style={{ marginLeft: 'auto' }}
                  />
                </div>

                <div className={styles.divider}>@</div>

                {/* Local */}
                <div className={styles.teamBoxReverse}>
                  <img src={home?.logo} alt={home?.name} className={styles.teamLogo} />
                  <span className={styles.teamName}>{home?.name}</span>
                  <input 
                    type="number" 
                    min="0"
                    value={scores[matchId]?.home ?? 0}
                    onChange={e => handleScoreChange(matchId, 'home', e.target.value)}
                    className={styles.scoreInput}
                    style={{ marginRight: 'auto' }}
                  />
                </div>
              </div>

              <button
                onClick={() => handleFinalizeMatch(matchId, match.home_team_id, match.away_team_id)}
                className={styles.finalizeBtn}
              >
                Finalizar y Guardar Resultado
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}

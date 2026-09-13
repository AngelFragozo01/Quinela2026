import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { TEAMS } from '../../services/mockData';
import { formatMatchDate, getWeekLabel } from '../../services/dateUtils';
import { CheckCircle2, AlertTriangle, ListTodo, History, RotateCcw, Save } from 'lucide-react';
import styles from './ManageResultsTab.module.css';

export default function ManageResultsTab() {
  const [subTab, setSubTab] = useState<'pending' | 'finished'>('pending');
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({});
  const [manageMessage, setManageMessage] = useState('');

  useEffect(() => {
    fetchAllMatches();
  }, []);

  const fetchAllMatches = async () => {
    setManageLoading(true);
    setManageMessage('');
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('week', { ascending: true })
        .order('match_date', { ascending: true });

      if (error) throw error;

      if (data) {
        const pending = data.filter(m => !m.is_finished);
        const finished = data.filter(m => m.is_finished);

        setActiveMatches(pending);
        setFinishedMatches(finished);

        const initialScores: Record<string, { home: number; away: number }> = {};
        data.forEach(m => {
          initialScores[m.id] = {
            home: m.home_score ?? 0,
            away: m.away_score ?? 0
          };
        });
        setScores(initialScores);
      }
    } catch (err: any) {
      setManageMessage(`Error al cargar partidos: ${err.message}`);
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

  // Finalizar o guardar corrección de un partido
  const handleSaveMatchResult = async (matchId: string, homeTeamId: string, awayTeamId: string, isCorrection = false) => {
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

      const winnerName = winnerId ? TEAMS[winnerId]?.name : 'Empate';
      setManageMessage(
        isCorrection
          ? `Resultado corregido con éxito. Ganador registrado: ${winnerName} (${winnerId || 'Ninguno'}). Clasificación actualizada.`
          : `Partido finalizado. Ganador: ${winnerName}. Puntuaciones actualizadas en la clasificación e historial.`
      );
      await fetchAllMatches();
    } catch (err: any) {
      setManageMessage(`Error al guardar resultado: ${err.message}`);
    }
  };

  // Reabrir un partido para volverlo a pendientes si fue cerrado por accidente
  const handleReopenMatch = async (matchId: string) => {
    if (!confirm('¿Deseas reabrir este partido? Volverá a estar pendiente y no contará puntos en la clasificación hasta que sea finalizado nuevamente.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          is_finished: false,
          winner_team_id: null
        })
        .eq('id', matchId);

      if (error) throw error;

      setManageMessage('El partido fue reabierto. Ahora se encuentra en la lista de partidos pendientes.');
      await fetchAllMatches();
    } catch (err: any) {
      setManageMessage(`Error al reabrir partido: ${err.message}`);
    }
  };

  return (
    <div className={styles.container}>
      {/* Sub-tabs para alternar entre pendientes y finalizados */}
      <div className={styles.subTabs}>
        <button
          onClick={() => setSubTab('pending')}
          className={`${styles.subTabBtn} ${subTab === 'pending' ? styles.activeSubTab : ''}`}
        >
          <ListTodo size={16} /> Partidos Pendientes ({activeMatches.length})
        </button>
        <button
          onClick={() => setSubTab('finished')}
          className={`${styles.subTabBtn} ${subTab === 'finished' ? styles.activeSubTab : ''}`}
        >
          <History size={16} /> Corregir / Finalizados ({finishedMatches.length})
        </button>
      </div>

      {manageMessage && (
        <div
          className={styles.message}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            color: manageMessage.includes('Error') ? '#ef4444' : '#10b981'
          }}
        >
          {manageMessage.includes('Error') ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {manageMessage}
        </div>
      )}

      {manageLoading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Cargando partidos...</div>
      ) : subTab === 'pending' ? (
        /* ================= VISTA DE PARTIDOS PENDIENTES ================= */
        activeMatches.length === 0 ? (
          <div className={styles.emptyState}>No hay partidos pendientes por jugar. Revisa la pestaña de Finalizados si necesitas corregir alguno.</div>
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

                  <div className={styles.divider}>VS</div>

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

                <div className={styles.cardFooter}>
                  <button
                    onClick={() => handleSaveMatchResult(matchId, match.home_team_id, match.away_team_id, false)}
                    className={styles.finalizeBtn}
                  >
                    <CheckCircle2 size={16} /> Finalizar y Guardar Resultado
                  </button>
                </div>
              </div>
            );
          })
        )
      ) : (
        /* ================= VISTA DE CORRECCIÓN DE FINALIZADOS ================= */
        finishedMatches.length === 0 ? (
          <div className={styles.emptyState}>No hay partidos finalizados aún.</div>
        ) : (
          finishedMatches.map(match => {
            const home = TEAMS[match.home_team_id];
            const away = TEAMS[match.away_team_id];
            const matchId = match.id;
            const { formattedDate, formattedTime } = formatMatchDate(match.match_date);
            const winner = match.winner_team_id ? TEAMS[match.winner_team_id] : null;

            return (
              <div key={matchId} className={styles.matchCard}>
                <div className={styles.cardHeader}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span className={styles.weekBadge}>
                      {getWeekLabel(match.week ?? 1)}
                    </span>
                    <span className={styles.winnerBadge}>
                      <CheckCircle2 size={12} /> Ganador Actual: {winner?.name || 'Empate'} ({match.winner_team_id || 'N/A'})
                    </span>
                  </div>
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

                  <div className={styles.divider}>VS</div>

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

                <div className={styles.cardFooter}>
                  <button
                    onClick={() => handleReopenMatch(matchId)}
                    className={styles.reopenBtn}
                    title="Devuelve este partido a la lista de pendientes"
                  >
                    <RotateCcw size={16} /> Reabrir Partido
                  </button>
                  <button
                    onClick={() => handleSaveMatchResult(matchId, match.home_team_id, match.away_team_id, true)}
                    className={styles.saveChangesBtn}
                  >
                    <Save size={16} /> Guardar Corrección
                  </button>
                </div>
              </div>
            );
          })
        )
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';
import ConfirmPredictionModal from '../components/ConfirmPredictionModal';
import { TEAMS } from '../services/mockData';
import { 
  getWeekClosingDeadline, 
  isWeekVotingClosed, 
  formatDeadlineText,
  getWeekLabel 
} from '../services/dateUtils';
import { Lock, CheckCircle2, Clock } from 'lucide-react';
import styles from './Predictions.module.css';

interface ConfirmModalData {
  match: any;
  teamId: string;
}

export default function Predictions() {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
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
      .eq('is_finished', false)
      .order('week', { ascending: true })
      .order('match_date', { ascending: true });
      
    if (matchesData) {
      const formattedMatches = matchesData.map(m => ({
        id: m.id,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        date: m.match_date,
        week: m.week ?? 1,
        isFinished: m.is_finished,
        isLocked: m.is_locked,
        homeScore: m.home_score,
        awayScore: m.away_score,
        winnerTeamId: m.winner_team_id
      }));
      setMatches(formattedMatches);

      const availableWeeks = Array.from(new Set(formattedMatches.map(m => m.week))).sort((a, b) => a - b);
      if (availableWeeks.length > 0) {
        const openWeek = availableWeeks.find(w => {
          const weekMatches = formattedMatches.filter(m => m.week === w);
          return !isWeekVotingClosed(weekMatches);
        });
        setSelectedWeek(openWeek ?? availableWeeks[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectTeamClick = (match: any, teamId: string) => {
    const weekMatches = matches.filter(m => m.week === match.week);
    if (isWeekVotingClosed(weekMatches)) {
      alert("⚠️ La votación para esta jornada se encuentra cerrada.");
      return;
    }

    if (predictions[match.id] === teamId) return;
    setConfirmModal({ match, teamId });
  };

  const handleConfirmPrediction = async () => {
    if (!confirmModal || !userId) return;
    const { match, teamId } = confirmModal;

    const weekMatches = matches.filter(m => m.week === match.week);
    if (isWeekVotingClosed(weekMatches)) {
      alert("⚠️ La votación para esta jornada ya ha sido cerrada.");
      setConfirmModal(null);
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('predictions')
        .upsert({
          user_id: userId,
          match_id: match.id,
          predicted_winner_id: teamId
        }, { onConflict: 'user_id, match_id' });

      if (error) throw error;

      setPredictions(prev => ({ ...prev, [match.id]: teamId }));
      setConfirmModal(null);

      const teamName = TEAMS[teamId]?.name || 'Equipo';
      setSuccessToast(`✅ ¡Pronóstico guardado para ${teamName}!`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error("Error guardando predicción:", err);
      alert("Error al guardar la predicción: " + (err.message || 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando jornada de predicciones...</div>;
  }

  const availableWeeks = Array.from(new Set(matches.map(m => m.week))).sort((a, b) => a - b);
  const currentWeekMatches = matches.filter(m => m.week === selectedWeek);

  const weekDeadline = getWeekClosingDeadline(currentWeekMatches);
  const isCurrentWeekClosed = isWeekVotingClosed(currentWeekMatches);
  const isManuallyLocked = currentWeekMatches.some(m => m.isLocked === true);

  return (
    <div className={styles.container}>
      
      {/* Toast de confirmación */}
      {successToast && (
        <div className={styles.toast}>
          <CheckCircle2 size={20} color="#10b981" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cabecera */}
      <div className={styles.header}>
        <h2 className={styles.title}>
          🏈 Quiniela Semanal
        </h2>
        <p className={styles.subtitle}>
          Haz tus pronósticos por semana. La votación cierra el <strong>jueves anterior</strong> a la jornada o por decisión del Administrador.
        </p>
      </div>

      {/* Selector de Semanas */}
      {availableWeeks.length > 0 && (
        <div className={styles.weekSelector}>
          {availableWeeks.map(w => {
            const wMatches = matches.filter(m => m.week === w);
            const isClosed = isWeekVotingClosed(wMatches);

            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                className={`${styles.weekBtn} ${selectedWeek === w ? styles.weekBtnActive : ''}`}
              >
                {isClosed && <Lock size={12} />}
                <span>{getWeekLabel(w)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Banner de Estado de la Semana */}
      <div className={`${styles.statusBanner} ${isCurrentWeekClosed ? styles.statusBannerClosed : styles.statusBannerOpen}`}>
        <div className={styles.statusLeft}>
          <div className={isCurrentWeekClosed ? styles.statusIconBoxClosed : styles.statusIconBoxOpen}>
            {isCurrentWeekClosed ? <Lock size={24} /> : <Clock size={24} />}
          </div>
          <div>
            <div className={styles.statusTitle}>
              {isCurrentWeekClosed 
                ? `🔒 Votación Cerrada • ${getWeekLabel(selectedWeek)}`
                : `🟢 Votación Abierta • ${getWeekLabel(selectedWeek)}`}
            </div>
            <div className={isCurrentWeekClosed ? styles.statusSubClosed : styles.statusSubOpen}>
              {isCurrentWeekClosed
                ? (isManuallyLocked ? 'Esta semana fue bloqueada por el Administrador.' : `El plazo límite venció el ${formatDeadlineText(weekDeadline)}.`)
                : `Cierre de votación: ${formatDeadlineText(weekDeadline)}.`}
            </div>
          </div>
        </div>

        <div className={styles.matchBadgeCount}>
          {currentWeekMatches.length} partidos en esta jornada
        </div>
      </div>

      {/* Partidos de la Semana */}
      {currentWeekMatches.length === 0 ? (
        <div className={styles.emptyState}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No hay partidos pendientes en {getWeekLabel(selectedWeek)}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Selecciona otra semana en la parte superior.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {currentWeekMatches.map(match => {
            const userChoice = predictions[match.id];

            return (
              <MatchCard 
                key={match.id} 
                match={match} 
                selectedTeamId={userChoice}
                isLocked={isCurrentWeekClosed}
                lockReason={isCurrentWeekClosed ? (userChoice ? 'VOTO CERRADO' : 'BLOQUEADO') : undefined}
                onSelectTeam={(teamId) => handleSelectTeamClick(match, teamId)}
              />
            );
          })}
        </div>
      )}

      {/* Modal de Confirmación modularizado */}
      {confirmModal && (
        <ConfirmPredictionModal
          match={confirmModal.match}
          teamId={confirmModal.teamId}
          saving={saving}
          weekDeadline={weekDeadline}
          onCancel={() => setConfirmModal(null)}
          onConfirm={handleConfirmPrediction}
        />
      )}
    </div>
  );
}

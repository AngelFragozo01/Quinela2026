import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';
import { TEAMS } from '../services/mockData';
import { 
  getWeekClosingDeadline, 
  isWeekVotingClosed, 
  formatDeadlineText,
  getWeekLabel 
} from '../services/dateUtils';
import { AlertTriangle, Lock, CheckCircle2, Clock } from 'lucide-react';

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

      // Determinar la semana activa por defecto (la primera semana abierta)
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

  // Lista de semanas disponibles
  const availableWeeks = Array.from(new Set(matches.map(m => m.week))).sort((a, b) => a - b);
  const currentWeekMatches = matches.filter(m => m.week === selectedWeek);

  // Calcular estado y fecha límite de la semana seleccionada
  const weekDeadline = getWeekClosingDeadline(currentWeekMatches);
  const isCurrentWeekClosed = isWeekVotingClosed(currentWeekMatches);
  const isManuallyLocked = currentWeekMatches.some(m => m.isLocked === true);

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      
      {/* Toast de confirmación */}
      {successToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          background: '#065f46',
          color: '#d1fae5',
          border: '1px solid #10b981',
          padding: '0.85rem 1.25rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontWeight: 600,
          animation: 'slideUp 0.3s ease'
        }}>
          <CheckCircle2 size={20} color="#10b981" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Cabecera */}
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏈 Quiniela Semanal
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Haz tus pronósticos por semana. La votación cierra el <strong>jueves anterior</strong> a la jornada o por decisión del Administrador.
        </p>
      </div>

      {/* Selector de Semanas */}
      {availableWeeks.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '1rem', 
          marginBottom: '1.5rem',
          scrollbarWidth: 'thin'
        }}>
          {availableWeeks.map(w => {
            const wMatches = matches.filter(m => m.week === w);
            const isClosed = isWeekVotingClosed(wMatches);

            return (
              <button
                key={w}
                onClick={() => setSelectedWeek(w)}
                style={{
                  padding: '0.5rem 1.15rem',
                  borderRadius: '20px',
                  border: selectedWeek === w ? '1px solid var(--primary-nfl)' : '1px solid var(--border-color)',
                  background: selectedWeek === w ? 'var(--primary-nfl)' : 'var(--bg-card)',
                  color: selectedWeek === w ? 'white' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
              >
                {isClosed && <Lock size={12} />}
                <span>{getWeekLabel(w)}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Banner de Estado de la Semana */}
      <div style={{
        background: isCurrentWeekClosed 
          ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)'
          : 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(15, 23, 42, 0.5) 100%)',
        border: isCurrentWeekClosed ? '1px solid rgba(239, 68, 68, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
        borderRadius: '12px',
        padding: '1rem 1.25rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{
            background: isCurrentWeekClosed ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            padding: '0.6rem',
            borderRadius: '10px',
            color: isCurrentWeekClosed ? '#f87171' : '#34d399',
            display: 'flex'
          }}>
            {isCurrentWeekClosed ? <Lock size={24} /> : <Clock size={24} />}
          </div>
          <div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'white' }}>
              {isCurrentWeekClosed 
                ? `🔒 Votación Cerrada • ${getWeekLabel(selectedWeek)}`
                : `🟢 Votación Abierta • ${getWeekLabel(selectedWeek)}`}
            </div>
            <div style={{ fontSize: '0.85rem', color: isCurrentWeekClosed ? '#fca5a5' : '#a7f3d0', marginTop: '0.2rem' }}>
              {isCurrentWeekClosed
                ? (isManuallyLocked ? 'Esta semana fue bloqueada por el Administrador.' : `El plazo límite venció el ${formatDeadlineText(weekDeadline)}.`)
                : `Cierre de votación: ${formatDeadlineText(weekDeadline)}.`}
            </div>
          </div>
        </div>

        <div style={{
          fontSize: '0.82rem',
          color: 'var(--text-muted)',
          background: 'rgba(0,0,0,0.25)',
          padding: '0.4rem 0.8rem',
          borderRadius: '8px',
          fontWeight: 600
        }}>
          {currentWeekMatches.length} partidos en esta jornada
        </div>
      </div>

      {/* Partidos de la Semana */}
      {currentWeekMatches.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No hay partidos pendientes en {getWeekLabel(selectedWeek)}</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Selecciona otra semana en la parte superior.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
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

      {/* Modal de Confirmación */}
      {confirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.75)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: '16px',
            maxWidth: '460px',
            width: '100%',
            padding: '1.75rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
            animation: 'slideUp 0.3s ease'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary-nfl)' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Confirmar Pronóstico</h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Vas a seleccionar como ganador a:
            </p>

            {/* Tarjeta del equipo elegido */}
            {(() => {
              const chosenTeam = TEAMS[confirmModal.teamId];
              const homeTeam = TEAMS[confirmModal.match.homeTeamId];
              const awayTeam = TEAMS[confirmModal.match.awayTeamId];
              const rivalTeam = confirmModal.teamId === homeTeam?.id ? awayTeam : homeTeam;

              return (
                <div style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `2px solid ${chosenTeam?.color || 'var(--primary-nfl)'}`,
                  borderRadius: '12px',
                  padding: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  boxShadow: `0 0 20px ${chosenTeam?.color ? `${chosenTeam.color}33` : 'transparent'}`
                }}>
                  <img src={chosenTeam?.logo} alt={chosenTeam?.name} style={{ width: '56px', height: '56px', objectFit: 'contain' }} />
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'white' }}>
                      {chosenTeam?.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      vs {rivalTeam?.name} • {getWeekLabel(confirmModal.match.week ?? 1)}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Aviso de cierre */}
            <div style={{
              background: 'rgba(59, 130, 246, 0.1)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#bfdbfe',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <Lock size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#60a5fa' }} />
              <span>
                <strong>Fecha límite:</strong> Esta jornada se cerrará el <strong>{formatDeadlineText(weekDeadline)}</strong>. Podrás ajustar tu pronóstico hasta ese momento.
              </span>
            </div>

            {/* Botones de Acción */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setConfirmModal(null)}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--border-color)',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmPrediction}
                disabled={saving}
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: '8px',
                  background: 'var(--primary-nfl)',
                  color: 'white',
                  border: 'none',
                  fontWeight: 'bold',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
              >
                {saving ? 'Guardando...' : 'Confirmar Pronóstico'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

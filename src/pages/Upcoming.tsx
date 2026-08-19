import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';
import { TEAMS } from '../services/mockData';
import { AlertTriangle, Lock, CheckCircle2 } from 'lucide-react';

interface ConfirmModalData {
  match: any;
  teamId: string;
}

export default function Upcoming() {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    fetchUpcomingData();
  }, []);

  const fetchUpcomingData = async () => {
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
      const formatted = matchesData.map(m => ({
        id: m.id,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        date: m.match_date,
        week: m.week || 1,
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

  const handleSelectTeamClick = (match: any, teamId: string) => {
    if (predictions[match.id]) return;
    setConfirmModal({ match, teamId });
  };

  const handleConfirmPrediction = async () => {
    if (!confirmModal || !userId) return;
    const { match, teamId } = confirmModal;

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
      setSuccessToast(`🔒 ¡Predicción confirmada para ${teamName}! Ha quedado bloqueada.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error("Error guardando predicción:", err);
      alert("Error al guardar la predicción: " + (err.message || 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando calendario de partidos...</div>;
  }

  const availableWeeks = Array.from(new Set(matches.map(m => m.week))).sort((a, b) => a - b);

  const matchesByWeek: Record<number, any[]> = availableWeeks.reduce((acc, weekNum) => {
    if (selectedWeek === 'all' || selectedWeek === weekNum) {
      acc[weekNum] = matches.filter(m => m.week === weekNum);
    }
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      
      {/* Toast de éxito */}
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

      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📅 Próximos Partidos por Semana
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Pronostica los partidos de toda la temporada regular agrupados por semana.
        </p>
      </div>

      {/* Alerta de bloqueo permanente */}
      <div style={{
        background: 'rgba(234, 179, 8, 0.1)',
        border: '1px solid rgba(234, 179, 8, 0.25)',
        borderRadius: '10px',
        padding: '0.75rem 1rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.6rem',
        fontSize: '0.85rem',
        color: '#fef08a'
      }}>
        <Lock size={16} color="#eab308" />
        <span>
          <strong>Regla de Apuesta:</strong> Al confirmar tu pronóstico, este quedará <strong>bloqueado permanentemente</strong> y no podrá modificarse.
        </span>
      </div>

      {/* Selector de Semanas con scroll horizontal suave */}
      {availableWeeks.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '1rem', 
          marginBottom: '1.5rem',
          scrollbarWidth: 'thin'
        }}>
          <button
            onClick={() => setSelectedWeek('all')}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: '20px',
              border: selectedWeek === 'all' ? '1px solid var(--primary-nfl)' : '1px solid var(--border-color)',
              background: selectedWeek === 'all' ? 'var(--primary-nfl)' : 'var(--bg-card)',
              color: selectedWeek === 'all' ? 'white' : 'var(--text-muted)',
              fontWeight: 600,
              fontSize: '0.85rem',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Todas las Semanas
          </button>
          {availableWeeks.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '20px',
                border: selectedWeek === w ? '1px solid var(--primary-nfl)' : '1px solid var(--border-color)',
                background: selectedWeek === w ? 'var(--primary-nfl)' : 'var(--bg-card)',
                color: selectedWeek === w ? 'white' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Semana {w}
            </button>
          ))}
        </div>
      )}

      {matches.length === 0 ? (
        <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>
          <p style={{ fontSize: '1.2rem' }}>No hay próximos partidos cargados en el calendario.</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>El Administrador puede cargar el calendario completo de la temporada desde el panel de Admin.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
          {Object.keys(matchesByWeek).map(weekKey => {
            const weekNum = Number(weekKey);
            const weekMatches: any[] = matchesByWeek[weekNum];
            if (!weekMatches || weekMatches.length === 0) return null;

            return (
              <section key={weekNum}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.75rem', 
                  marginBottom: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  paddingBottom: '0.5rem'
                }}>
                  <span style={{ 
                    background: 'linear-gradient(135deg, var(--primary-nfl) 0%, #1e40af 100%)', 
                    color: 'white', 
                    padding: '0.2rem 0.75rem', 
                    borderRadius: '8px', 
                    fontWeight: 800, 
                    fontSize: '0.9rem' 
                  }}>
                    Semana {weekNum}
                  </span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                    {weekMatches.length} partidos programados
                  </span>
                </div>

                <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                  {weekMatches.map((match: any) => {
                    const hasPrediction = !!predictions[match.id];
                    return (
                      <MatchCard
                        key={match.id}
                        match={match}
                        selectedTeamId={predictions[match.id]}
                        isLocked={hasPrediction}
                        onSelectTeam={(teamId) => handleSelectTeamClick(match, teamId)}
                      />
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}

      {/* Modal de Advertencia y Confirmación */}
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: '#eab308' }}>
              <AlertTriangle size={24} />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white' }}>Confirmar Pronóstico</h3>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.25rem' }}>
              Estás a punto de elegir al siguiente equipo como ganador:
            </p>

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
                      vs {rivalTeam?.name} • Semana {confirmModal.match.week || 1}
                    </div>
                  </div>
                </div>
              );
            })()}

            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#fca5a5',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <Lock size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Aviso importante:</strong> Una vez que presiones "Aceptar y Bloquear", tu voto quedará cerrado y <strong>no podrás cambiar de equipo</strong>.
              </span>
            </div>

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
                  background: 'var(--accent-nfl)',
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
                <Lock size={16} />
                {saving ? 'Guardando...' : 'Aceptar y Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

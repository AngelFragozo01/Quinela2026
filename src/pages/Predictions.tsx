import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';
import { TEAMS } from '../services/mockData';
import { isMatchInVotingWindow, isMatchVotingLocked, getDaysUntilMatch } from '../services/dateUtils';
import { AlertTriangle, Lock, CheckCircle2, Calendar, Clock } from 'lucide-react';

interface ConfirmModalData {
  match: any;
  teamId: string;
}

export default function Predictions() {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmModal, setConfirmModal] = useState<ConfirmModalData | null>(null);
  const [saving, setSaving] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);
  const [viewAll, setViewAll] = useState(false);

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
      .order('match_date', { ascending: true });
      
    if (matchesData) {
      const formattedMatches = matchesData.map(m => ({
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
      setMatches(formattedMatches);
    }
    setLoading(false);
  };

  const handleSelectTeamClick = (match: any, teamId: string) => {
    // Si la votación está cerrada (día de juego o fecha pasada), no permitir clic
    if (isMatchVotingLocked(match.date)) return;

    // Si ya tiene el mismo equipo seleccionado, no hacer nada
    if (predictions[match.id] === teamId) return;

    // Abrir modal de confirmación
    setConfirmModal({ match, teamId });
  };

  const handleConfirmPrediction = async () => {
    if (!confirmModal || !userId) return;
    const { match, teamId } = confirmModal;

    // Verificación de seguridad adicional en cliente
    if (isMatchVotingLocked(match.date)) {
      alert("⚠️ La votación para este partido ya cerró porque hoy es el día del juego.");
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
      setSuccessToast(`✅ ¡Pronóstico guardado para ${teamName}! Se bloqueará el día del juego.`);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error("Error guardando predicción:", err);
      alert("Error al guardar la predicción: " + (err.message || 'Error de conexión'));
    } finally {
      setSaving(false);
    }
  };

  const todayFormatted = new Date().toLocaleDateString('es-ES', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando jornada de predicciones...</div>;
  }

  // Partidos en ventana activa de votación (hasta 3 días antes y el día de hoy)
  const windowMatches = matches.filter(m => isMatchInVotingWindow(m.date));
  const displayMatches = viewAll ? matches : windowMatches;

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

      {/* Cabecera de la página */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'flex-start', 
        flexWrap: 'wrap', 
        gap: '1rem',
        marginBottom: '1.5rem' 
      }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            🏈 Quiniela Activa (Ventana de 3 Días)
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem', textTransform: 'capitalize' }}>
            Hoy: {todayFormatted}
          </p>
        </div>

        {/* Toggle para ver ventana activa o todos */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => setViewAll(false)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: !viewAll ? '1px solid var(--primary-nfl)' : '1px solid var(--border-color)',
              background: !viewAll ? 'var(--primary-nfl)' : 'var(--bg-card)',
              color: !viewAll ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Próximos 3 Días ({windowMatches.length})
          </button>
          <button
            onClick={() => setViewAll(true)}
            style={{
              padding: '0.4rem 0.85rem',
              borderRadius: '20px',
              border: viewAll ? '1px solid var(--primary-nfl)' : '1px solid var(--border-color)',
              background: viewAll ? 'var(--primary-nfl)' : 'var(--bg-card)',
              color: viewAll ? 'white' : 'var(--text-muted)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Todos los Pendientes ({matches.length})
          </button>
        </div>
      </div>

      {/* Banner de regla antifraude */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.4) 100%)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        borderRadius: '10px',
        padding: '0.85rem 1.25rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        fontSize: '0.88rem',
        color: '#bfdbfe'
      }}>
        <Clock size={20} color="#60a5fa" style={{ flexShrink: 0 }} />
        <span>
          <strong>Regla de Votación:</strong> Los partidos se habilitan <strong>3 días antes</strong>. La votación se <strong>cierra automáticamente el mismo día del juego</strong>. ¡Asegura tu pronóstico con tiempo!
        </span>
      </div>

      {/* Listado de partidos */}
      {displayMatches.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 1.5rem', 
          background: 'var(--bg-card)', 
          borderRadius: '12px',
          border: '1px solid var(--border-color)'
        }}>
          <Calendar size={48} style={{ opacity: 0.4, margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>No hay partidos en los próximos 3 días</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto 1.5rem' }}>
            Los partidos se abrirán automáticamente para votar cuando falten 3 días para su fecha de juego.
          </p>
          <Link 
            to="/upcoming"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--primary-nfl)',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: 'bold',
              fontSize: '0.95rem'
            }}
          >
            📅 Ver Calendario Completo en Próximos
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {displayMatches.map(match => {
            const userChoice = predictions[match.id];
            const isLocked = isMatchVotingLocked(match.date);
            const daysRemaining = getDaysUntilMatch(match.date);

            return (
              <MatchCard 
                key={match.id} 
                match={match} 
                selectedTeamId={userChoice}
                isLocked={isLocked}
                daysRemaining={daysRemaining}
                lockReason={isLocked ? (userChoice ? 'VOTO CERRADO' : 'TIEMPO EXPIRADO') : undefined}
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
                      vs {rivalTeam?.name} • Semana {confirmModal.match.week || 1}
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Aviso de cierre automático el día del juego */}
            <div style={{
              background: 'rgba(234, 179, 8, 0.1)',
              border: '1px solid rgba(234, 179, 8, 0.3)',
              borderRadius: '8px',
              padding: '0.85rem',
              marginBottom: '1.5rem',
              fontSize: '0.85rem',
              color: '#fef08a',
              display: 'flex',
              gap: '0.5rem',
              alignItems: 'flex-start'
            }}>
              <Lock size={16} style={{ flexShrink: 0, marginTop: '2px', color: '#eab308' }} />
              <span>
                <strong>Regla de Cierre:</strong> Podrás ajustar tu elección durante la ventana activa. <strong>El mismo día del partido se bloqueará automáticamente</strong> para evitar cambios de último minuto.
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

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';

export default function History() {
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

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

    // Obtener partidos finalizados
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('is_finished', true)
      .order('match_date', { ascending: false });

    if (matchesData) {
      const formatted = matchesData.map(m => ({
        id: m.id,
        homeTeamId: m.home_team_id,
        awayTeamId: m.away_team_id,
        date: m.match_date,
        isFinished: m.is_finished,
        homeScore: m.home_score,
        awayScore: m.away_score,
        winnerTeamId: m.winner_team_id
      }));
      setFinishedMatches(formatted);
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando historial...</div>;
  }

  if (finishedMatches.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', animation: 'slideUp 0.4s ease' }}>
        <h2>📅 Historial de Partidos</h2>
        <p style={{ marginTop: '1rem' }}>Aún no hay partidos finalizados. Cuando el Administrador cierre y guarde el marcador de un partido, aparecerá aquí.</p>
        <div style={{ marginTop: '2rem', fontSize: '3rem', opacity: 0.4 }}>🏆</div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <h2 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Historial de Partidos Finalizados</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Resultados oficiales y tus aciertos marcados.</p>

      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {finishedMatches.map(match => {
          const userPred = predictions[match.id];
          const isHit = userPred && userPred === match.winnerTeamId;

          return (
            <div key={match.id} style={{ position: 'relative' }}>
              {userPred && (
                <div 
                  style={{ 
                    position: 'absolute', 
                    top: '-10px', 
                    right: '12px', 
                    zIndex: 10,
                    padding: '0.25rem 0.75rem', 
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    background: isHit ? 'rgba(16, 185, 129, 0.9)' : 'rgba(239, 68, 68, 0.9)',
                    color: 'white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
                  }}
                >
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
    </div>
  );
}

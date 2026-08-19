import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';

export default function Predictions() {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Obtener usuario actual
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUserId(user.id);
      
      // Obtener predicciones de este usuario
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

    // Obtener solo los partidos pendientes (no finalizados)
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
        isFinished: m.is_finished,
        homeScore: m.home_score,
        awayScore: m.away_score,
        winnerTeamId: m.winner_team_id
      }));
      setMatches(formattedMatches);
    }
    setLoading(false);
  };

  const handleSelectTeam = async (matchId: string, teamId: string) => {
    if (!userId) return;

    // Actualizar UI optimísticamente
    setPredictions(prev => ({ ...prev, [matchId]: teamId }));

    // Guardar en Supabase
    const { error } = await supabase
      .from('predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        predicted_winner_id: teamId
      }, { onConflict: 'user_id, match_id' });

    if (error) {
      console.error("Error guardando predicción:", error);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando partidos...</div>;
  }

  if (matches.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', animation: 'slideUp 0.4s ease' }}>
        <h2>🏈 Próximos Partidos</h2>
        <p style={{ marginTop: '1rem' }}>No hay partidos pendientes en este momento. Revisa la pestaña de <strong>Historial</strong> para ver los partidos finalizados.</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Partidos por Jugar</h2>
      
      <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
        {matches.map(match => (
          <MatchCard 
            key={match.id} 
            match={match} 
            selectedTeamId={predictions[match.id]}
            onSelectTeam={(teamId) => handleSelectTeam(match.id, teamId)}
          />
        ))}
      </div>
    </div>
  );
}

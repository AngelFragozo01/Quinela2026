import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';

export default function Predictions() {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
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

    // Obtener todos los partidos ordenados por fecha
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .order('match_date', { ascending: true });
      
    if (matchesData) {
      // Convertir el formato snake_case de DB al camelCase que usa el componente
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
  };

  const handleSelectTeam = async (matchId: string, teamId: string) => {
    if (!userId) return;

    // Actualizar UI optimísticamente
    setPredictions(prev => ({ ...prev, [matchId]: teamId }));

    // Guardar en Supabase
    // Al usar upsert, o inserta o actualiza gracias al constraint UNIQUE
    const { error } = await supabase
      .from('predictions')
      .upsert({
        user_id: userId,
        match_id: matchId,
        predicted_winner_id: teamId
      }, { onConflict: 'user_id, match_id' });

    if (error) {
      console.error("Error guardando predicción:", error);
      // Podrías revertir el estado aquí si falla
    }
  };

  const pendingMatches = matches.filter(m => !m.isFinished);
  const finishedMatches = matches.filter(m => m.isFinished);

  if (matches.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>No hay partidos programados aún. Pide a un Administrador que añada algunos.</div>;
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>Partidos de la Semana</h2>
      
      {pendingMatches.length > 0 && (
        <div style={{ marginBottom: '2rem' }}>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Por Jugar</h3>
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {pendingMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                selectedTeamId={predictions[match.id]}
                onSelectTeam={(teamId) => handleSelectTeam(match.id, teamId)}
              />
            ))}
          </div>
        </div>
      )}

      {finishedMatches.length > 0 && (
        <div>
          <h3 style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Finalizados</h3>
          <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {finishedMatches.map(match => (
              <MatchCard 
                key={match.id} 
                match={match} 
                selectedTeamId={predictions[match.id]}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';

export default function Upcoming() {
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

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

    // Traer todos los partidos no finalizados ordenados por semana y fecha
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

      // Si hay semanas, seleccionar la primera por defecto si no es 'all'
      const weeks = Array.from(new Set(formatted.map(m => m.week))).sort((a, b) => a - b);
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectTeam = async (matchId: string, teamId: string) => {
    if (!userId) return;

    setPredictions(prev => ({ ...prev, [matchId]: teamId }));

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
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando calendario de partidos...</div>;
  }

  // Obtener todas las semanas disponibles en los partidos
  const availableWeeks = Array.from(new Set(matches.map(m => m.week))).sort((a, b) => a - b);

  // Agrupar por semana para visualización organizada
  const matchesByWeek: Record<number, any[]> = availableWeeks.reduce((acc, weekNum) => {
    if (selectedWeek === 'all' || selectedWeek === weekNum) {
      acc[weekNum] = matches.filter(m => m.week === weekNum);
    }
    return acc;
  }, {} as Record<number, any[]>);

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📅 Próximos Partidos por Semana
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Pronostica los partidos de toda la temporada regular agrupados por semana.
        </p>
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
                  {weekMatches.map((match: any) => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      selectedTeamId={predictions[match.id]}
                      onSelectTeam={(teamId) => handleSelectTeam(match.id, teamId)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

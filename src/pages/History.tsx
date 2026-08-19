import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';

export default function History() {
  const [finishedMatches, setFinishedMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

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

    // Obtener partidos finalizados ordenados por semana descendente y fecha
    const { data: matchesData } = await supabase
      .from('matches')
      .select('*')
      .eq('is_finished', true)
      .order('week', { ascending: false })
      .order('match_date', { ascending: false });

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
      setFinishedMatches(formatted);

      const weeks = Array.from(new Set(formatted.map(m => m.week))).sort((a, b) => b - a);
      if (weeks.length > 0) {
        setSelectedWeek(weeks[0]); // Seleccionar la semana más reciente por defecto
      }
    }
    setLoading(false);
  };

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando historial de semanas...</div>;
  }

  if (finishedMatches.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)', animation: 'slideUp 0.4s ease' }}>
        <h2>📅 Historial de Partidos</h2>
        <p style={{ marginTop: '1rem' }}>Aún no hay partidos finalizados. Cuando el Administrador cierre y guarde el marcador de los partidos, aparecerán organizados por semana aquí.</p>
        <div style={{ marginTop: '2rem', fontSize: '3rem', opacity: 0.4 }}>🏆</div>
      </div>
    );
  }

  // Lista de semanas con partidos finalizados
  const availableWeeks = Array.from(new Set(finishedMatches.map(m => m.week))).sort((a, b) => a - b);

  // Agrupar por semana
  const matchesByWeek: Record<number, any[]> = availableWeeks.reduce((acc, weekNum) => {
    if (selectedWeek === 'all' || selectedWeek === weekNum) {
      acc[weekNum] = finishedMatches.filter(m => m.week === weekNum);
    }
    return acc;
  }, {} as Record<number, any[]>);

  // Calcular estadísticas de la semana seleccionada (o total)
  const currentWeekMatches = selectedWeek === 'all' 
    ? finishedMatches 
    : finishedMatches.filter(m => m.week === selectedWeek);

  const totalHits = currentWeekMatches.filter(m => predictions[m.id] === m.winnerTeamId).length;
  const totalPoints = totalHits * 10;

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          🏆 Historial de Resultados por Semana
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Consulta los marcadores finales oficiales y tus aciertos en cada jornada.
        </p>
      </div>

      {/* Selector de Semanas con scroll horizontal */}
      <div style={{ 
        display: 'flex', 
        gap: '0.5rem', 
        overflowX: 'auto', 
        paddingBottom: '0.75rem', 
        marginBottom: '1.25rem',
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
          Todas ({finishedMatches.length})
        </button>
        {availableWeeks.map(w => {
          const count = finishedMatches.filter(m => m.week === w).length;
          return (
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
              Semana {w} ({count})
            </button>
          );
        })}
      </div>

      {/* Resumen de aciertos de la selección */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7) 0%, rgba(15, 23, 42, 0.8) 100%)',
        border: '1px solid var(--border-color)',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        marginBottom: '2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Rendimiento {selectedWeek === 'all' ? 'Total' : `Semana ${selectedWeek}`}
          </span>
          <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginTop: '0.2rem' }}>
            {totalHits} aciertos de {currentWeekMatches.length} partidos
          </div>
        </div>
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          color: '#10b981',
          padding: '0.4rem 1rem',
          borderRadius: '20px',
          fontWeight: 800,
          fontSize: '1.1rem'
        }}>
          +{totalPoints} pts
        </div>
      </div>

      {/* Partidos agrupados por semana */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
        {Object.keys(matchesByWeek).sort((a, b) => Number(b) - Number(a)).map(weekKey => {
          const weekNum = Number(weekKey);
          const weekMatches: any[] = matchesByWeek[weekNum];
          if (!weekMatches || weekMatches.length === 0) return null;

          return (
            <section key={weekNum}>
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.75rem', 
                marginBottom: '1.25rem',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '0.5rem'
              }}>
                <span style={{ 
                  background: 'var(--accent-nfl)', 
                  color: 'white', 
                  padding: '0.2rem 0.75rem', 
                  borderRadius: '8px', 
                  fontWeight: 800, 
                  fontSize: '0.9rem' 
                }}>
                  Semana {weekNum}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  {weekMatches.length} partidos finalizados
                </span>
              </div>

              <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                {weekMatches.map((match: any) => {
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
                            background: isHit ? 'rgba(16, 185, 129, 0.95)' : 'rgba(239, 68, 68, 0.95)',
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
            </section>
          );
        })}
      </div>
    </div>
  );
}

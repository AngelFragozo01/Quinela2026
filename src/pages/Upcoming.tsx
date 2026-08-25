import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import MatchCard from '../components/MatchCard';

export default function Upcoming() {
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  useEffect(() => {
    fetchUpcomingData();
  }, []);

  const fetchUpcomingData = async () => {
    setLoading(true);

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

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '3rem', color: 'var(--text-muted)' }}>Cargando calendario de partidos...</div>;
  }

  const availableWeeks = Array.from(new Set(matches.map(m => m.week))).sort((a, b) => a - b);
  const currentWeekMatches = matches.filter(m => m.week === selectedWeek);

  return (
    <div style={{ animation: 'slideUp 0.4s ease' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          📅 Calendario de Partidos por Semana
        </h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.95rem' }}>
          Consulta el calendario oficial de toda la temporada regular organizado por semanas.
        </p>
      </div>

      {/* Selector de Semanas exclusivo (sin 'Todas las Semanas') */}
      {availableWeeks.length > 0 && (
        <div style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '1rem', 
          marginBottom: '1.5rem',
          scrollbarWidth: 'thin'
        }}>
          {availableWeeks.map(w => (
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
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>El Administrador puede cargar el calendario de la temporada desde el panel de Admin.</p>
        </div>
      ) : (
        <section>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem', 
            marginBottom: '1.25rem',
            borderBottom: '1px solid var(--border-color)',
            paddingBottom: '0.5rem'
          }}>
            <span style={{ 
              background: 'linear-gradient(135deg, var(--primary-nfl) 0%, #1e40af 100%)', 
              color: 'white', 
              padding: '0.25rem 0.85rem', 
              borderRadius: '8px', 
              fontWeight: 800, 
              fontSize: '0.95rem' 
            }}>
              Semana {selectedWeek}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              {currentWeekMatches.length} partidos programados
            </span>
          </div>

          <div style={{ display: 'grid', gap: '1.25rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
            {currentWeekMatches.map(match => (
              <MatchCard
                key={match.id}
                match={match}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

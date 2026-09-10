import { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabase';
import Avatar from '../components/Avatar';
import { Trophy } from 'lucide-react';
import WeekCarousel from '../components/WeekCarousel';
import { getWeekLabel } from '../services/dateUtils';
import styles from './History.module.css'; // Podemos reusar los estilos de los botones de semana de History

interface UserScore {
  username: string;
  hits: number;
  points: number;
}

export default function Leaderboard() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const { data: matchesData } = await supabase.from('matches').select('*').eq('is_finished', true);
    const { data: predictionsData } = await supabase.from('predictions').select('*');

    if (profilesData) setProfiles(profilesData);
    if (matchesData) setMatches(matchesData);
    if (predictionsData) setPredictions(predictionsData);
    
    setLoading(false);
  };

  const availableWeeks = useMemo(() => {
    const weeks = new Set(matches.map(m => m.week ?? 1));
    return Array.from(weeks).sort((a, b) => a - b);
  }, [matches]);

  const leaderboard = useMemo(() => {
    const scoresMap: Record<string, UserScore> = {};

    profiles.forEach(profile => {
      scoresMap[profile.id] = {
        username: profile.username || 'Usuario Desconocido',
        hits: 0,
        points: 0
      };
    });

    const filteredMatches = selectedWeek === 'all' 
      ? matches 
      : matches.filter(m => m.week === selectedWeek);

    const matchIds = new Set(filteredMatches.map(m => m.id));

    predictions.forEach(pred => {
      if (!matchIds.has(pred.match_id)) return;
      
      const match = filteredMatches.find(m => m.id === pred.match_id);
      if (match && match.winner_team_id === pred.predicted_winner_id) {
        if (scoresMap[pred.user_id]) {
          scoresMap[pred.user_id].hits += 1;
          scoresMap[pred.user_id].points += 10;
        }
      }
    });

    return Object.values(scoresMap).sort((a, b) => b.points - a.points);
  }, [profiles, matches, predictions, selectedWeek]);

  if (loading) {
    return <div style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-muted)' }}>Cargando clasificación...</div>;
  }

  return (
    <div style={{ animation: 'slideUp 0.4s ease', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
          <Trophy size={28} color="var(--primary-nfl)" /> 
          {selectedWeek === 'all' ? 'Clasificación Global' : `Clasificación - ${getWeekLabel(selectedWeek)}`}
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Consulta los aciertos y puntos totales o fíltralos por semana.
        </p>
      </div>

      {availableWeeks.length > 0 && (
        <WeekCarousel>
          <button
            onClick={() => setSelectedWeek('all')}
            className={`${styles.weekBtn} ${selectedWeek === 'all' ? styles.weekBtnActive : ''}`}
          >
            Todas
          </button>
          {availableWeeks.map(w => (
            <button
              key={w}
              onClick={() => setSelectedWeek(w)}
              className={`${styles.weekBtn} ${selectedWeek === w ? styles.weekBtnActive : ''}`}
            >
              {getWeekLabel(w)}
            </button>
          ))}
        </WeekCarousel>
      )}

      {leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Aún no hay usuarios o resultados.</div>
      ) : (
        <div style={{ 
          background: 'var(--bg-card)', 
          borderRadius: '12px', 
          overflow: 'hidden',
          border: '1px solid var(--border-color)',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid var(--border-color)' }}>
              <tr>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Posición</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)' }}>Usuario</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'center' }}>Aciertos</th>
                <th style={{ padding: '1rem', color: 'var(--text-muted)', textAlign: 'right' }}>Puntos</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <tr key={user.username} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    {index === 0 && user.points > 0 ? <span title="Primer Lugar" style={{ display: 'flex', alignItems: 'center' }}><Trophy size={24} color="var(--accent-gold)" /></span> : `#${index + 1}`}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <Avatar name={user.username} size={32} />
                      <span style={{ fontWeight: '600' }}>{user.username}</span>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontVariantNumeric: 'tabular-nums', fontWeight: '600', color: 'var(--text-main)' }}>
                    {user.hits}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontVariantNumeric: 'tabular-nums', fontWeight: '800', color: 'var(--primary-nfl)' }}>
                    {user.points} pts
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

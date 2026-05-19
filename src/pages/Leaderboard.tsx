import { useState, useEffect } from 'react';
import { MOCK_LEADERBOARD } from '../services/mockData';
import Avatar from '../components/Avatar';

interface UserScore {
  username: string;
  hits: number;
  points: number;
}

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<UserScore[]>([]);

  useEffect(() => {
    // Simulated fetch
    // Sort by points descending
    const sorted = [...MOCK_LEADERBOARD].sort((a, b) => b.points - a.points);
    setLeaderboard(sorted);
  }, []);

  return (
    <div style={{ animation: 'slideUp 0.4s ease', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        Clasificación Global
      </h2>

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
                  {index === 0 ? <span title="Primer Lugar" style={{ fontSize: '1.5rem' }}>🏆</span> : `#${index + 1}`}
                </td>
                <td style={{ padding: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Avatar name={user.username} size={32} />
                    <span style={{ fontWeight: '600' }}>{user.username}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem', textAlign: 'center', fontSize: '1.1rem' }}>{user.hits}</td>
                <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 'bold', color: 'var(--primary-nfl)', fontSize: '1.1rem' }}>
                  {user.points}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

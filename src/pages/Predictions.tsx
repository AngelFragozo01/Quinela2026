import { useState, useEffect } from 'react';
import MatchCard from '../components/MatchCard';
import { MOCK_MATCHES, Match } from '../services/mockData';

export default function Predictions() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [predictions, setPredictions] = useState<Record<string, string>>({});

  useEffect(() => {
    // Simulated fetch
    setMatches(MOCK_MATCHES);
    
    // Load local predictions
    const localPreds = localStorage.getItem('quiniela_preds');
    if (localPreds) {
      setPredictions(JSON.parse(localPreds));
    }
  }, []);

  const handleSelectTeam = (matchId: string, teamId: string) => {
    const newPreds = { ...predictions, [matchId]: teamId };
    setPredictions(newPreds);
    localStorage.setItem('quiniela_preds', JSON.stringify(newPreds));
  };

  const pendingMatches = matches.filter(m => !m.isFinished);
  const finishedMatches = matches.filter(m => m.isFinished);

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

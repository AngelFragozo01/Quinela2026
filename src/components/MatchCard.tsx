import styles from './MatchCard.module.css';
import { TEAMS, Match } from '../services/mockData';

interface MatchCardProps {
  match: Match;
  selectedTeamId?: string;
  onSelectTeam?: (teamId: string) => void;
}

export default function MatchCard({ match, selectedTeamId, onSelectTeam }: MatchCardProps) {
  const homeTeam = TEAMS[match.homeTeamId];
  const awayTeam = TEAMS[match.awayTeamId];
  const matchDate = new Date(match.date);

  const formattedDate = matchDate.toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric' });
  const formattedTime = matchDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`${styles.card} ${match.isFinished ? styles.finished : ''}`}>
      <div className={styles.header}>
        <span className={styles.date}>{formattedDate} • {formattedTime}</span>
        {match.isFinished && <span className={styles.statusLabel}>FINALIZADO</span>}
      </div>

      <div className={styles.teams}>
        {/* Away Team */}
        <div 
          className={`${styles.team} ${selectedTeamId === awayTeam.id ? styles.selected : ''} ${match.isFinished && match.winnerTeamId === awayTeam.id ? styles.winner : ''}`}
          onClick={() => !match.isFinished && onSelectTeam && onSelectTeam(awayTeam.id)}
          style={{ '--team-color': awayTeam.color } as React.CSSProperties}
        >
          <img src={awayTeam.logo} alt={awayTeam.name} className={styles.logo} />
          <span className={styles.name}>{awayTeam.name}</span>
          {match.isFinished && <span className={styles.score}>{match.awayScore}</span>}
        </div>

        <div className={styles.divider}>@</div>

        {/* Home Team */}
        <div 
          className={`${styles.team} ${selectedTeamId === homeTeam.id ? styles.selected : ''} ${match.isFinished && match.winnerTeamId === homeTeam.id ? styles.winner : ''}`}
          onClick={() => !match.isFinished && onSelectTeam && onSelectTeam(homeTeam.id)}
          style={{ '--team-color': homeTeam.color } as React.CSSProperties}
        >
          <img src={homeTeam.logo} alt={homeTeam.name} className={styles.logo} />
          <span className={styles.name}>{homeTeam.name}</span>
          {match.isFinished && <span className={styles.score}>{match.homeScore}</span>}
        </div>
      </div>
    </div>
  );
}

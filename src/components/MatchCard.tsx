import styles from './MatchCard.module.css';
import { TEAMS, Match } from '../services/mockData';
import { formatMatchDate } from '../services/dateUtils';

interface MatchCardProps {
  match: Match;
  selectedTeamId?: string;
  isLocked?: boolean;
  lockReason?: string;
  daysRemaining?: number;
  onSelectTeam?: (teamId: string) => void;
}

export default function MatchCard({ 
  match, 
  selectedTeamId, 
  isLocked, 
  lockReason,
  daysRemaining,
  onSelectTeam 
}: MatchCardProps) {
  const homeTeam = TEAMS[match.homeTeamId];
  const awayTeam = TEAMS[match.awayTeamId];
  
  const { formattedDate, formattedTime } = formatMatchDate(match.date);
  const canClick = !match.isFinished && !isLocked;

  return (
    <div className={`${styles.card} ${match.isFinished ? styles.finished : ''} ${isLocked ? styles.locked : ''}`}>
      <div className={styles.header}>
        <span className={styles.date}>
          {formattedDate} {formattedTime !== 'TBD' && formattedTime ? `• ${formattedTime}` : ''}
        </span>
        
        {match.isFinished ? (
          <span className={styles.statusLabel}>FINALIZADO</span>
        ) : isLocked ? (
          <span style={{ 
            background: 'rgba(239, 68, 68, 0.15)', 
            color: '#f87171', 
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.2rem 0.5rem', 
            borderRadius: '4px', 
            fontSize: '0.75rem', 
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '0.25rem'
          }}>
            🔒 {lockReason || (selectedTeamId ? 'CERRADO' : 'SIN VOTAR')}
          </span>
        ) : daysRemaining !== undefined && daysRemaining > 0 ? (
          <span style={{
            background: 'rgba(16, 185, 129, 0.15)',
            color: '#34d399',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            🟢 {daysRemaining === 1 ? 'Queda 1 día' : `Quedan ${daysRemaining} días`}
          </span>
        ) : (
          <span style={{
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#60a5fa',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            ⚡ ABIERTO
          </span>
        )}
      </div>

      <div className={styles.teams}>
        {/* Away Team */}
        <div 
          className={`${styles.team} ${selectedTeamId === awayTeam?.id ? styles.selected : ''} ${match.isFinished && match.winnerTeamId === awayTeam?.id ? styles.winner : ''}`}
          onClick={() => canClick && onSelectTeam && onSelectTeam(awayTeam.id)}
          style={{ '--team-color': awayTeam?.color } as React.CSSProperties}
          title={isLocked ? (selectedTeamId === awayTeam?.id ? 'Tu pronóstico' : 'Votación cerrada') : canClick ? `Votar por ${awayTeam?.name}` : ''}
        >
          <img src={awayTeam?.logo} alt={awayTeam?.name} className={styles.logo} />
          <span className={styles.name}>{awayTeam?.name}</span>
          {match.isFinished && <span className={styles.score}>{match.awayScore}</span>}
        </div>

        <div className={styles.divider}>@</div>

        {/* Home Team */}
        <div 
          className={`${styles.team} ${selectedTeamId === homeTeam?.id ? styles.selected : ''} ${match.isFinished && match.winnerTeamId === homeTeam?.id ? styles.winner : ''}`}
          onClick={() => canClick && onSelectTeam && onSelectTeam(homeTeam.id)}
          style={{ '--team-color': homeTeam?.color } as React.CSSProperties}
          title={isLocked ? (selectedTeamId === homeTeam?.id ? 'Tu pronóstico' : 'Votación cerrada') : canClick ? `Votar por ${homeTeam?.name}` : ''}
        >
          <img src={homeTeam?.logo} alt={homeTeam?.name} className={styles.logo} />
          <span className={styles.name}>{homeTeam?.name}</span>
          {match.isFinished && <span className={styles.score}>{match.homeScore}</span>}
        </div>
      </div>
    </div>
  );
}

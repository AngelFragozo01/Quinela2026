export interface User {
  id: string;
  name: string;
  avatarSeed: string;
}

export interface Team {
  id: string;
  name: string;
  logo: string;
  color: string;
}

export interface Match {
  id: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string; // ISO String
  isFinished: boolean;
  homeScore?: number;
  awayScore?: number;
  winnerTeamId?: string | null;
}

export interface Prediction {
  matchId: string;
  userId: string;
  predictedWinnerId: string;
}

export const TEAMS: Record<string, Team> = {
  KC: { id: 'KC', name: 'Chiefs', logo: '🏈', color: '#E31837' },
  SF: { id: 'SF', name: '49ers', logo: '🏈', color: '#AA0000' },
  BAL: { id: 'BAL', name: 'Ravens', logo: '🦅', color: '#241773' },
  BUF: { id: 'BUF', name: 'Bills', logo: '🦬', color: '#00338D' },
  DAL: { id: 'DAL', name: 'Cowboys', logo: '⭐', color: '#041E42' },
  PHI: { id: 'PHI', name: 'Eagles', logo: '🦅', color: '#004C54' },
};

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    homeTeamId: 'KC',
    awayTeamId: 'BAL',
    date: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(), // Tomorrow
    isFinished: false,
  },
  {
    id: 'm2',
    homeTeamId: 'SF',
    awayTeamId: 'DAL',
    date: new Date(Date.now() + 1000 * 60 * 60 * 48).toISOString(), // 2 days from now
    isFinished: false,
  },
  {
    id: 'm3',
    homeTeamId: 'PHI',
    awayTeamId: 'BUF',
    date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // Yesterday
    isFinished: true,
    homeScore: 24,
    awayScore: 21,
    winnerTeamId: 'PHI',
  }
];

export const MOCK_LEADERBOARD = [
  { username: 'Carlos', hits: 5, points: 50 },
  { username: 'Maria', hits: 4, points: 40 },
  { username: 'Juan', hits: 3, points: 30 },
];

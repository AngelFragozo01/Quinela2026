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
  week?: number;
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
  ARI: { id: 'ARI', name: 'Cardinals', logo: '/images/Arizona_Cardinals.png', color: '#97233F' },
  ATL: { id: 'ATL', name: 'Falcons', logo: '/images/Atlanta_Falcons.png', color: '#A71930' },
  BAL: { id: 'BAL', name: 'Ravens', logo: '/images/Baltimore_Ravens.png', color: '#241773' },
  BUF: { id: 'BUF', name: 'Bills', logo: '/images/buffalo_bills.png', color: '#00338D' },
  CAR: { id: 'CAR', name: 'Panthers', logo: '/images/Carolina_Panthers.png', color: '#0085CA' },
  CHI: { id: 'CHI', name: 'Bears', logo: '/images/Chicago_Bears.png', color: '#0B162A' },
  CIN: { id: 'CIN', name: 'Bengals', logo: '/images/Cincinnati_Bengals.png', color: '#FB4F14' },
  CLE: { id: 'CLE', name: 'Browns', logo: '/images/Cleveland_Browns.png', color: '#311D00' },
  DAL: { id: 'DAL', name: 'Cowboys', logo: '/images/Dallas Cowboys.png', color: '#041E42' },
  DEN: { id: 'DEN', name: 'Broncos', logo: '/images/Denver_Broncos.png', color: '#FB4F14' },
  DET: { id: 'DET', name: 'Lions', logo: '/images/Detroit_Lions.png', color: '#0076B6' },
  GB: { id: 'GB', name: 'Packers', logo: '/images/Green Bay_Packers.png', color: '#203731' },
  HOU: { id: 'HOU', name: 'Texans', logo: '/images/Houston_Texans.png', color: '#03202F' },
  IND: { id: 'IND', name: 'Colts', logo: '/images/Indianapolis_Colts.png', color: '#002C5F' },
  JAX: { id: 'JAX', name: 'Jaguars', logo: '/images/Jacksonville_Jaguars.png', color: '#006778' },
  KC: { id: 'KC', name: 'Chiefs', logo: '/images/Kansas City_Chiefs.png', color: '#E31837' },
  LV: { id: 'LV', name: 'Raiders', logo: '/images/Las Vegas_Raiders.png', color: '#000000' },
  LAC: { id: 'LAC', name: 'Chargers', logo: '/images/Los Angeles_Chargers.png', color: '#0080C6' },
  LAR: { id: 'LAR', name: 'Rams', logo: '/images/Los Angeles_Rams.png', color: '#003594' },
  MIA: { id: 'MIA', name: 'Dolphins', logo: '/images/Miami_dolphins.png', color: '#008E97' },
  MIN: { id: 'MIN', name: 'Vikings', logo: '/images/Minnesota_Vikings.png', color: '#4F2683' },
  NE: { id: 'NE', name: 'Patriots', logo: '/images/New England_Patriots.png', color: '#002244' },
  NO: { id: 'NO', name: 'Saints', logo: '/images/New Orleans_Saints.png', color: '#D3BC8D' },
  NYG: { id: 'NYG', name: 'Giants', logo: '/images/New York_Jets_Giants.png', color: '#0B2265' },
  NYJ: { id: 'NYJ', name: 'Jets', logo: '/images/New York_Jets.png', color: '#125740' },
  PHI: { id: 'PHI', name: 'Eagles', logo: '/images/Philadelphia_Eagles.png', color: '#004C54' },
  PIT: { id: 'PIT', name: 'Steelers', logo: '/images/Pittsburgh_Steelers.png', color: '#FFB612' },
  SF: { id: 'SF', name: '49ers', logo: '/images/San Francisco_49ers.png', color: '#AA0000' },
  SEA: { id: 'SEA', name: 'Seahawks', logo: '/images/Seattle_Seahawks.png', color: '#69BE28' },
  TB: { id: 'TB', name: 'Buccaneers', logo: '/images/Tampa Bay_Buccaneers.png', color: '#D50A0A' },
  TEN: { id: 'TEN', name: 'Titans', logo: '/images/Tennessee_Titans.png', color: '#4B92DB' },
  WAS: { id: 'WAS', name: 'Commanders', logo: '/images/Washington_Commanders.png', color: '#5A1414' },
};

export const TEAM_NAME_TO_ID: Record<string, string> = {
  'arizona cardinals': 'ARI',
  'cardinals': 'ARI',
  'atlanta falcons': 'ATL',
  'falcons': 'ATL',
  'baltimore ravens': 'BAL',
  'ravens': 'BAL',
  'buffalo bills': 'BUF',
  'bills': 'BUF',
  'carolina panthers': 'CAR',
  'panthers': 'CAR',
  'chicago bears': 'CHI',
  'bears': 'CHI',
  'cincinnati bengals': 'CIN',
  'bengals': 'CIN',
  'cleveland browns': 'CLE',
  'browns': 'CLE',
  'dallas cowboys': 'DAL',
  'cowboys': 'DAL',
  'denver broncos': 'DEN',
  'broncos': 'DEN',
  'detroit lions': 'DET',
  'lions': 'DET',
  'green bay packers': 'GB',
  'packers': 'GB',
  'houston texans': 'HOU',
  'texans': 'HOU',
  'indianapolis colts': 'IND',
  'colts': 'IND',
  'jacksonville jaguars': 'JAX',
  'jaguars': 'JAX',
  'kansas city chiefs': 'KC',
  'chiefs': 'KC',
  'las vegas raiders': 'LV',
  'raiders': 'LV',
  'los angeles chargers': 'LAC',
  'chargers': 'LAC',
  'los angeles rams': 'LAR',
  'rams': 'LAR',
  'miami dolphins': 'MIA',
  'dolphins': 'MIA',
  'minnesota vikings': 'MIN',
  'vikings': 'MIN',
  'new england patriots': 'NE',
  'patriots': 'NE',
  'new orleans saints': 'NO',
  'saints': 'NO',
  'new york giants': 'NYG',
  'giants': 'NYG',
  'new york jets': 'NYJ',
  'jets': 'NYJ',
  'philadelphia eagles': 'PHI',
  'eagles': 'PHI',
  'pittsburgh steelers': 'PIT',
  'steelers': 'PIT',
  'san francisco 49ers': 'SF',
  '49ers': 'SF',
  'seattle seahawks': 'SEA',
  'seahawks': 'SEA',
  'tampa bay buccaneers': 'TB',
  'buccaneers': 'TB',
  'tennessee titans': 'TEN',
  'titans': 'TEN',
  'washington commanders': 'WAS',
  'commanders': 'WAS',
};

export const getTeamIdFromName = (name: string): string | null => {
  if (!name) return null;
  const clean = name.trim().toLowerCase();
  if (TEAMS[name.toUpperCase()]) return name.toUpperCase();
  return TEAM_NAME_TO_ID[clean] || null;
};

export const MOCK_MATCHES: Match[] = [];
export const MOCK_LEADERBOARD = [];

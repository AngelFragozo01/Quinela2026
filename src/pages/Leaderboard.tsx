import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../supabase';
import Avatar from '../components/Avatar';
import { Trophy, Crown, Medal, Sparkles, ChevronDown, CheckCircle2, RotateCcw } from 'lucide-react';
import WeekCarousel from '../components/WeekCarousel';
import { getWeekLabel } from '../services/dateUtils';
import styles from './History.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import CountUp from 'react-countup';

export interface UserScore {
  userId: string;
  username: string;
  hits: number;
  points: number;
  rank: number; // 1, 2, 3... con empates compartidos
}

interface LeaderboardProps {
  currentUser?: {
    id: string;
    username: string;
    email?: string;
    role?: string;
  } | null;
}

export default function Leaderboard({ currentUser }: LeaderboardProps) {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState<number | 'all'>('all');
  const [isCeremonyMode, setIsCeremonyMode] = useState(false);
  const [hasCompletedCeremony, setHasCompletedCeremony] = useState(false);

  const fullListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: profilesData } = await supabase.from('profiles').select('*');
    const { data: matchesData } = await supabase.from('matches').select('*');
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

  const isWeekClosed = (weekNum: number) => {
    const weekMatches = matches.filter(m => (m.week ?? 1) === weekNum);
    if (weekMatches.length === 0) return false;
    return weekMatches.every(m => m.is_locked === true) || weekMatches.every(m => m.is_finished === true);
  };

  // Ranking con empates reales compartidos
  const leaderboard: UserScore[] = useMemo(() => {
    const scoresMap: Record<string, { userId: string; username: string; hits: number; points: number }> = {};

    profiles.forEach(profile => {
      scoresMap[profile.id] = {
        userId: profile.id,
        username: profile.username || 'Usuario Desconocido',
        hits: 0,
        points: 0
      };
    });

    const finishedMatches = matches.filter(m => m.is_finished === true);
    const filteredMatches = selectedWeek === 'all'
      ? finishedMatches
      : finishedMatches.filter(m => m.week === selectedWeek);

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

    // Ordenar primero por puntos descendente, luego por aciertos
    const sorted = Object.values(scoresMap).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      return b.hits - a.hits;
    });

    // Asignar rangos estándar de competencia (1, 1, 1, 4...)
    let currentRank = 1;
    return sorted.map((user, idx) => {
      if (idx > 0) {
        const prev = sorted[idx - 1];
        if (user.points !== prev.points || user.hits !== prev.hits) {
          currentRank = idx + 1;
        }
      }
      return {
        ...user,
        rank: currentRank
      };
    });
  }, [profiles, matches, predictions, selectedWeek]);

  // Participantes que califican para podio (rango <= 3)
  const podiumUsers = useMemo(() => {
    return leaderboard.filter(u => u.rank <= 3);
  }, [leaderboard]);

  // Participantes que van a la lista inferior (rango > 3)
  const restOfUsers = useMemo(() => {
    return leaderboard.filter(u => u.rank > 3);
  }, [leaderboard]);

  // Estilo visual del podio según el rango que ocupan
  const getRankTheme = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          title: '1° Lugar',
          badgeText: '1',
          gradientBg: 'from-amber-600/70 via-amber-500/80 to-yellow-400',
          staticColBg: 'from-amber-950/70 via-amber-800/50 to-yellow-500/70',
          borderCol: 'border-yellow-400',
          heightCeremony: 'h-60 sm:h-72',
          heightStatic: 'h-40 sm:h-48',
          textGold: 'text-yellow-300',
          textColor: 'text-yellow-400',
          accentBadge: 'bg-yellow-400 text-slate-950',
          icon: <Trophy className="w-9 h-9 text-yellow-300 drop-shadow" />,
          avatarBorder: 'p-1 bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 shadow-[0_0_20px_rgba(250,204,21,0.5)]',
          avatarSize: 68,
          delay: 3.5
        };
      case 2:
        return {
          title: '2° Lugar',
          badgeText: '2',
          gradientBg: 'from-slate-800 to-slate-700/90',
          staticColBg: 'from-slate-900 via-slate-800 to-slate-700/80',
          borderCol: 'border-slate-300',
          heightCeremony: 'h-44 sm:h-56',
          heightStatic: 'h-28 sm:h-36',
          textGold: 'text-slate-200',
          textColor: 'text-slate-300',
          accentBadge: 'bg-slate-200 text-slate-900',
          icon: <Medal className="w-8 h-8 text-slate-300" />,
          avatarBorder: 'p-0.5 bg-slate-400 shadow-[0_0_12px_rgba(203,213,225,0.3)]',
          avatarSize: 58,
          delay: 2.0
        };
      default: // 3 y empates de 3
        return {
          title: '3° Lugar',
          badgeText: '3',
          gradientBg: 'from-amber-950 to-amber-800/80',
          staticColBg: 'from-slate-950 via-amber-950/80 to-amber-900/70',
          borderCol: 'border-amber-600',
          heightCeremony: 'h-32 sm:h-44',
          heightStatic: 'h-20 sm:h-28',
          textGold: 'text-amber-200',
          textColor: 'text-amber-300',
          accentBadge: 'bg-amber-700 text-white',
          icon: <Medal className="w-7 h-7 text-amber-500" />,
          avatarBorder: 'p-0.5 bg-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.3)]',
          avatarSize: 50,
          delay: 0.8
        };
    }
  };

  // Efecto para activar o no la ceremonia
  useEffect(() => {
    if (selectedWeek !== 'all') {
      const closed = isWeekClosed(selectedWeek);
      const storageKey = `hasSeenPodium_week_${selectedWeek}`;
      const seen = localStorage.getItem(storageKey);

      if (closed && !seen && podiumUsers.length > 0) {
        setIsCeremonyMode(true);
        setHasCompletedCeremony(false);
      } else {
        setIsCeremonyMode(false);
        setHasCompletedCeremony(true);
      }
    } else {
      setIsCeremonyMode(false);
      setHasCompletedCeremony(true);
    }
  }, [selectedWeek, matches, podiumUsers.length]);

  // Disparo de confeti cuando se revela el 1er lugar (o líderes)
  useEffect(() => {
    if (isCeremonyMode) {
      const hasFirstRank = podiumUsers.some(u => u.rank === 1);
      const delayMs = hasFirstRank ? 4000 : 2500;
      const timer = setTimeout(() => {
        fireKahootConfetti();
        setHasCompletedCeremony(true);
      }, delayMs);

      return () => clearTimeout(timer);
    }
  }, [isCeremonyMode, selectedWeek, podiumUsers]);

  const fireKahootConfetti = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FACC15', '#013369', '#D50A0A', '#FFFFFF']
      });

      setTimeout(() => {
        confetti({
          particleCount: 50,
          angle: 60,
          spread: 60,
          origin: { x: 0.1, y: 0.65 },
          colors: ['#FACC15', '#38BDF8', '#F59E0B']
        });
        confetti({
          particleCount: 50,
          angle: 120,
          spread: 60,
          origin: { x: 0.9, y: 0.65 },
          colors: ['#FACC15', '#38BDF8', '#F59E0B']
        });
      }, 300);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinishCeremony = () => {
    if (selectedWeek !== 'all') {
      localStorage.setItem(`hasSeenPodium_week_${selectedWeek}`, 'true');
    }
    setIsCeremonyMode(false);
    setHasCompletedCeremony(true);

    setTimeout(() => {
      fullListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
  };

  const handleReplayCeremony = () => {
    setIsCeremonyMode(true);
    setHasCompletedCeremony(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-sm font-medium tracking-wide">Cargando clasificación...</span>
        </div>
      </div>
    );
  }

  const canShowCeremonyToggle = selectedWeek !== 'all' && isWeekClosed(selectedWeek) && podiumUsers.length > 0;

  return (
    <div className="w-full max-w-4xl mx-auto pb-16 px-2 sm:px-4">
      {/* Encabezado */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-7 h-7 text-yellow-400" />
            {selectedWeek === 'all' ? 'Clasificación Global' : `Clasificación • ${getWeekLabel(selectedWeek)}`}
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            {selectedWeek === 'all'
              ? 'Puntajes y aciertos acumulados durante toda la temporada regular.'
              : `Resultados registrados de ${getWeekLabel(selectedWeek)}.`}
          </p>
        </div>

        {canShowCeremonyToggle && !isCeremonyMode && (
          <button
            onClick={handleReplayCeremony}
            className="self-start md:self-auto inline-flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 hover:bg-blue-600/30 transition shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Repetir Ceremonia
          </button>
        )}
      </div>

      {/* Carrusel de Semanas */}
      {availableWeeks.length > 0 && (
        <div className="mb-6">
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
        </div>
      )}

      {leaderboard.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400">
          Aún no hay resultados ni partidos finalizados registrados.
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* MODO CEREMONIA: ANIMACIÓN COMPLETA ESTILO KAHOOT          */}
          {/* ========================================================= */}
          <AnimatePresence>
            {isCeremonyMode && selectedWeek !== 'all' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-[#070B14]/95 backdrop-blur-md flex flex-col items-center justify-between p-4 sm:p-8 overflow-y-auto"
              >
                <motion.div
                  initial={{ y: -30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  className="text-center mt-4 sm:mt-8"
                >
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 mb-2">
                    <Sparkles className="w-3.5 h-3.5" /> Ceremonia de Premiación
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                    Resultados Oficiales • {getWeekLabel(selectedWeek)}
                  </h1>
                  <p className="text-slate-400 text-sm mt-1">El podio de honor de la jornada</p>
                </motion.div>

                {/* PODIO KAHOOT ADAPTABLE A EMPATES */}
                <div className="w-full max-w-3xl flex items-end justify-center gap-2 sm:gap-6 my-auto pt-16 pb-4 flex-wrap sm:flex-nowrap">
                  {podiumUsers.map((user) => {
                    const theme = getRankTheme(user.rank);
                    return (
                      <div
                        key={user.userId || user.username}
                        className="flex-1 min-w-[110px] sm:min-w-0 flex flex-col items-center"
                      >
                        <motion.div
                          initial={{ opacity: 0, y: 35, scale: 0.85 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: theme.delay, duration: 0.55, type: 'spring' }}
                          className="flex flex-col items-center mb-3"
                        >
                          <div className="relative">
                            {user.rank === 1 && (
                              <motion.div
                                initial={{ scale: 0, rotate: -20 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: theme.delay + 0.5, type: 'spring', stiffness: 200 }}
                                className="absolute -top-6 left-1/2 -translate-x-1/2"
                              >
                                <Crown className="w-8 h-8 text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
                              </motion.div>
                            )}

                            <div className={`rounded-full ${theme.avatarBorder}`}>
                              <Avatar name={user.username} size={theme.avatarSize} />
                            </div>
                            <div
                              className={`absolute -bottom-2 -right-1.5 ${theme.accentBadge} w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow-md border-2 border-[#070B14]`}
                            >
                              {theme.badgeText}
                            </div>
                          </div>

                          <span className={`text-sm font-black mt-3 text-center max-w-[110px] truncate ${theme.textGold}`}>
                            {user.username}
                          </span>
                          <div className={`font-black text-sm sm:text-base tabular-nums ${theme.textColor}`}>
                            <CountUp start={0} end={user.points} duration={1.5} delay={theme.delay} /> pts
                          </div>
                          <span className="text-[11px] text-slate-400">{user.hits} aciertos</span>
                        </motion.div>

                        {/* Columna con altura y estilo acorde al puesto */}
                        <motion.div
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: theme.delay, type: 'spring', stiffness: 120, damping: 14 }}
                          style={{ originY: 1 }}
                          className={`w-full ${theme.heightCeremony} rounded-t-2xl bg-gradient-to-t ${theme.gradientBg} border-t-4 ${theme.borderCol} shadow-xl flex flex-col items-center justify-between p-3`}
                        >
                          {theme.icon}
                          <span className="text-3xl sm:text-4xl font-black text-white/80">{user.rank}°</span>
                        </motion.div>
                      </div>
                    );
                  })}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: hasCompletedCeremony ? 1 : 0.4, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mb-6 sm:mb-10 text-center"
                >
                  <button
                    onClick={handleFinishCeremony}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-black text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)] transition transform hover:-translate-y-0.5 active:scale-95"
                  >
                    <span>Ver clasificación completa</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ========================================================= */}
          {/* MODO ESTÁTICO (PODIO TOP 3 / EMPATES COMPARTIDOS)          */}
          {/* ========================================================= */}
          {podiumUsers.length > 0 && (
            <div className="mb-10 pt-4">
              <div className="w-full max-w-2xl mx-auto flex items-end justify-center gap-3 sm:gap-6 px-2 flex-wrap sm:flex-nowrap">
                {podiumUsers.map((user) => {
                  const theme = getRankTheme(user.rank);
                  return (
                    <div
                      key={user.userId || user.username}
                      className="flex-1 min-w-[95px] sm:min-w-0 flex flex-col items-center"
                    >
                      <div className="relative mb-2">
                        {user.rank === 1 && (
                          <Crown className="w-6 h-6 text-yellow-400 absolute -top-5 left-1/2 -translate-x-1/2 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]" />
                        )}
                        <div className={`rounded-full ${theme.avatarBorder}`}>
                          <Avatar name={user.username} size={theme.avatarSize - 8} />
                        </div>
                        <div
                          className={`absolute -bottom-1 -right-1 ${theme.accentBadge} w-6 h-6 rounded-full flex items-center justify-center font-black text-xs shadow border-2 border-slate-900`}
                        >
                          {theme.badgeText}
                        </div>
                      </div>

                      <span className={`text-xs sm:text-sm font-bold text-center truncate max-w-[95px] sm:max-w-[120px] ${theme.textGold}`}>
                        {user.username}
                      </span>
                      <span className={`text-xs sm:text-sm font-black tabular-nums ${theme.textColor}`}>
                        {user.points} pts
                      </span>
                      <span className="text-[11px] text-slate-400 mb-2">{user.hits} aciertos</span>

                      <div
                        className={`w-full ${theme.heightStatic} rounded-t-xl bg-gradient-to-t ${theme.staticColBg} border-t-4 ${theme.borderCol} flex flex-col items-center justify-between py-2 shadow-md`}
                      >
                        {theme.icon}
                        <span className="text-2xl sm:text-3xl font-black text-white/80">{user.rank}°</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* TABLA LISTA (PUESTOS 4 EN ADELANTE Y GENERAL)             */}
          {/* ========================================================= */}
          <div ref={fullListRef} className="mt-8">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                <span>Tabla de Posiciones</span>
                {restOfUsers.length > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">
                    Puesto #{restOfUsers[0]?.rank} en adelante
                  </span>
                )}
              </h3>
            </div>

            {restOfUsers.length === 0 ? (
              <div className="text-center py-6 bg-slate-900/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
                {podiumUsers.length > 0
                  ? 'Todos los participantes se encuentran actualmente compartiendo el podio.'
                  : 'Aún no hay puntuaciones registradas.'}
              </div>
            ) : (
              <div className="bg-[#101827] rounded-xl border border-slate-800 overflow-hidden shadow-lg divide-y divide-slate-800/80">
                {restOfUsers.map((user) => {
                  const isCurrent =
                    currentUser &&
                    (user.userId === currentUser.id ||
                      user.username.toLowerCase() === currentUser.username?.toLowerCase());

                  return (
                    <div
                      key={user.userId || user.username}
                      className={`flex items-center justify-between px-4 py-3.5 transition-colors ${
                        isCurrent
                          ? 'bg-blue-600/15 border-l-4 border-l-blue-500 hover:bg-blue-600/20'
                          : 'hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Posición & Avatar & Nombre */}
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 text-center font-bold text-sm text-slate-400 tabular-nums">
                          #{user.rank}
                        </span>
                        <Avatar name={user.username} size={36} />
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-semibold text-sm text-slate-100 truncate">
                            {user.username}
                          </span>
                          {isCurrent && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              <CheckCircle2 className="w-3 h-3 text-blue-400" />
                              Tú
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Aciertos & Puntos */}
                      <div className="flex items-center gap-6">
                        <div className="text-right">
                          <span className="block text-xs text-slate-400">Aciertos</span>
                          <span className="text-sm font-bold text-slate-200 tabular-nums">
                            {user.hits}
                          </span>
                        </div>
                        <div className="text-right w-16">
                          <span className="block text-xs text-slate-400">Puntos</span>
                          <span className="text-sm font-extrabold text-blue-400 tabular-nums">
                            {user.points} pts
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

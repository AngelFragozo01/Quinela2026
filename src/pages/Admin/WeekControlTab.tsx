import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { getWeekLabel, getWeekClosingDeadline, formatDeadlineText } from '../../services/dateUtils';
import { Lock, Unlock, ShieldAlert } from 'lucide-react';
import styles from './WeekControlTab.module.css';

export default function WeekControlTab() {
  const [allMatches, setAllMatches] = useState<any[]>([]);
  const [weeksLoading, setWeeksLoading] = useState(false);
  const [weeksMessage, setWeeksMessage] = useState('');

  useEffect(() => {
    fetchAllMatchesForWeeks();
  }, []);

  const fetchAllMatchesForWeeks = async () => {
    setWeeksLoading(true);
    setWeeksMessage('');
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .order('week', { ascending: true })
        .order('match_date', { ascending: true });

      if (error) throw error;
      if (data) {
        setAllMatches(data);
      }
    } catch (err: any) {
      setWeeksMessage(`❌ Error al cargar semanas: ${err.message}`);
    } finally {
      setWeeksLoading(false);
    }
  };

  const handleToggleWeekLock = async (weekNum: number, lockStatus: boolean) => {
    setWeeksLoading(true);
    setWeeksMessage('');
    try {
      const { error } = await supabase
        .from('matches')
        .update({ is_locked: lockStatus })
        .eq('week', weekNum);

      if (error) throw error;

      setWeeksMessage(`✅ ${getWeekLabel(weekNum)} ${lockStatus ? '🔒 CERRADA y bloqueada' : '🟢 ABIERTA para votación'}.`);
      await fetchAllMatchesForWeeks();
    } catch (err: any) {
      setWeeksMessage(`❌ Error al actualizar ${getWeekLabel(weekNum)}: ${err.message}`);
    } finally {
      setWeeksLoading(false);
    }
  };

  const handleBatchLockWeeks = async (lockStatus: boolean, openWeekNum?: number) => {
    setWeeksLoading(true);
    setWeeksMessage('');
    try {
      if (openWeekNum !== undefined) {
        // Bloquear todas y abrir solo la semana seleccionada
        await supabase.from('matches').update({ is_locked: true }).neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('matches').update({ is_locked: false }).eq('week', openWeekNum);
        setWeeksMessage(`✅ ${getWeekLabel(openWeekNum)} ABIERTA y las demás CERRADAS / BLOQUEADAS.`);
      } else {
        await supabase.from('matches').update({ is_locked: lockStatus }).neq('id', '00000000-0000-0000-0000-000000000000');
        setWeeksMessage(`✅ Todas las jornadas ${lockStatus ? '🔒 BLOQUEADAS' : '🟢 ABIERTAS'} exitosamente.`);
      }

      await fetchAllMatchesForWeeks();
    } catch (err: any) {
      setWeeksMessage(`❌ Error al actualizar jornadas: ${err.message}`);
    } finally {
      setWeeksLoading(false);
    }
  };

  const availableWeeks = Array.from(new Set(allMatches.map(m => m.week ?? 1))).sort((a, b) => a - b);

  return (
    <div className={styles.container}>
      <div>
        <h3 className={styles.title}>
          🔒 Control Manual de Votaciones por Semana
        </h3>
        <p className={styles.subtitle}>
          Abre o cierra la votación de cualquier jornada con un clic. Cuando una semana está <strong>Cerrada</strong>, los usuarios no podrán emitir ni modificar votos para esos partidos.
        </p>
      </div>

      {weeksMessage && (
        <div className={styles.message}>
          {weeksMessage}
        </div>
      )}

      {/* Acciones Rápidas en Lote */}
      <div className={styles.batchBox}>
        <div className={styles.batchHeader}>
          <ShieldAlert size={18} color="var(--primary-nfl)" />
          <span>Acciones Rápidas:</span>
        </div>
        <div className={styles.batchActions}>
          <button
            onClick={() => handleBatchLockWeeks(true, -3)}
            disabled={weeksLoading}
            className={styles.batchBtnBlue}
          >
            🔥 Abrir Solo Pretemporada 3
          </button>
          <button
            onClick={() => handleBatchLockWeeks(true, 1)}
            disabled={weeksLoading}
            className={styles.batchBtnBlue}
          >
            🟢 Abrir Solo Semana 1
          </button>
          <button
            onClick={() => handleBatchLockWeeks(true)}
            disabled={weeksLoading}
            className={styles.batchBtnRed}
          >
            🔒 Bloquear Todo
          </button>
          <button
            onClick={() => handleBatchLockWeeks(false)}
            disabled={weeksLoading}
            className={styles.batchBtnGreen}
          >
            🔓 Abrir Todo
          </button>
        </div>
      </div>

      {/* Listado de Semanas */}
      {weeksLoading && allMatches.length === 0 ? (
        <div>Cargando semanas...</div>
      ) : availableWeeks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)', background: 'var(--bg-card)', borderRadius: '12px' }}>
          No hay partidos cargados todavía. Crea uno en "Crear Partido Manual" o sube el CSV.
        </div>
      ) : (
        <div className={styles.grid}>
          {availableWeeks.map(w => {
            const wMatches = allMatches.filter(m => (m.week ?? 1) === w);
            const isLocked = wMatches.some(m => m.is_locked === true);
            const deadline = getWeekClosingDeadline(wMatches);

            return (
              <div
                key={w}
                className={`${styles.weekCard} ${isLocked ? styles.weekCardLocked : styles.weekCardOpen}`}
              >
                <div className={styles.cardHeader}>
                  <span className={styles.weekTitle}>{getWeekLabel(w)}</span>
                  <span className={`${styles.badge} ${isLocked ? styles.badgeLocked : styles.badgeOpen}`}>
                    {isLocked ? <Lock size={12} /> : <Unlock size={12} />}
                    {isLocked ? 'CERRADA' : 'ABIERTA'}
                  </span>
                </div>

                <div className={styles.matchCount}>
                  {wMatches.length} partidos programados
                </div>
                {deadline && (
                  <div className={styles.deadline}>
                    Límite sugerido: {formatDeadlineText(deadline)}
                  </div>
                )}

                <div className={styles.actionFooter}>
                  {isLocked ? (
                    <button
                      onClick={() => handleToggleWeekLock(w, false)}
                      disabled={weeksLoading}
                      className={styles.openBtn}
                    >
                      <Unlock size={14} /> Abrir Votación
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleWeekLock(w, true)}
                      disabled={weeksLoading}
                      className={styles.lockBtn}
                    >
                      <Lock size={14} /> Cerrar y Bloquear
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

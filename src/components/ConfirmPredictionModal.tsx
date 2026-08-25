import styles from './ConfirmPredictionModal.module.css';
import { TEAMS } from '../services/mockData';
import { getWeekLabel } from '../services/dateUtils';
import { AlertTriangle, Lock } from 'lucide-react';

interface ConfirmPredictionModalProps {
  match: any;
  teamId: string;
  saving: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmPredictionModal({
  match,
  teamId,
  saving,
  onCancel,
  onConfirm
}: ConfirmPredictionModalProps) {
  const chosenTeam = TEAMS[teamId];
  const homeTeam = TEAMS[match.homeTeamId];
  const awayTeam = TEAMS[match.awayTeamId];
  const rivalTeam = teamId === homeTeam?.id ? awayTeam : homeTeam;
  const weekLabel = getWeekLabel(match.week ?? 1);

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <AlertTriangle size={24} />
          <h3 className={styles.title}>Confirmar Pronóstico</h3>
        </div>

        <p className={styles.description}>
          Vas a seleccionar como ganador a:
        </p>

        {/* Tarjeta del equipo elegido */}
        <div 
          className={styles.teamPreview}
          style={{
            border: `2px solid ${chosenTeam?.color || 'var(--primary-nfl)'}`,
            boxShadow: `0 0 20px ${chosenTeam?.color ? `${chosenTeam.color}33` : 'transparent'}`
          }}
        >
          <img src={chosenTeam?.logo} alt={chosenTeam?.name} className={styles.teamLogo} />
          <div>
            <div className={styles.teamName}>{chosenTeam?.name}</div>
            <div className={styles.matchMeta}>
              vs {rivalTeam?.name} • {weekLabel}
            </div>
          </div>
        </div>

        {/* Aviso de control de votación */}
        <div className={styles.warningBox}>
          <Lock size={16} className={styles.warningIcon} />
          <span>
            <strong>Nota:</strong> Podrás modificar tu pronóstico libremente mientras el Administrador mantenga abierta esta jornada.
          </span>
        </div>

        {/* Botones de Acción */}
        <div className={styles.actions}>
          <button
            onClick={onCancel}
            disabled={saving}
            className={styles.cancelBtn}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={saving}
            className={styles.confirmBtn}
          >
            {saving ? 'Guardando...' : 'Confirmar Pronóstico'}
          </button>
        </div>
      </div>
    </div>
  );
}

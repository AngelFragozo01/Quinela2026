import { Link, useLocation } from 'react-router-dom';
import { Trophy, Calendar, Clock, LogOut, Settings } from 'lucide-react';
import styles from './Header.module.css';
import Avatar from './Avatar';

interface HeaderProps {
  user: string;
  role: 'admin' | 'user';
  onLogout: () => void;
}

export default function Header({ user, role, onLogout }: HeaderProps) {
  const location = useLocation();

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <Link to="/predictions" className={styles.logo} style={{ textDecoration: 'none', color: 'inherit' }}>
            🏈 NFL Predictor
          </Link>
        </div>
        
        <nav className={styles.nav}>
          <Link to="/predictions" className={`${styles.navLink} ${location.pathname === '/predictions' ? styles.active : ''}`}>
            <Clock size={18} /> Predicciones
          </Link>
          <Link to="/leaderboard" className={`${styles.navLink} ${location.pathname === '/leaderboard' ? styles.active : ''}`}>
            <Trophy size={18} /> Clasificación
          </Link>
          <Link to="/history" className={`${styles.navLink} ${location.pathname === '/history' ? styles.active : ''}`}>
            <Calendar size={18} /> Historial
          </Link>
          {role === 'admin' && (
            <Link to="/admin" className={`${styles.navLink} ${location.pathname === '/admin' ? styles.active : ''}`} style={{ color: 'var(--primary-nfl)' }}>
              <Settings size={18} /> Admin
            </Link>
          )}
        </nav>

        <div className={styles.userSection}>
          <div className={styles.userInfo}>
            <Avatar name={user} size={32} />
            <span className={styles.userName}>{user} {role === 'admin' && '⭐'}</span>
          </div>
          <button onClick={onLogout} className={styles.logoutBtn} title="Cerrar Sesión">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}

import { useState } from 'react';
import styles from './Login.module.css';

interface LoginProps {
  onLogin: (username: string) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length > 2) {
      onLogin(name.trim());
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.logo}>🏈 NFL Predictor</div>
        <h1 className={styles.title}>Bienvenido a la Quiniela 2026</h1>
        <p className={styles.subtitle}>Ingresa tu nombre para comenzar a predecir y ganar puntos.</p>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <input 
            type="text" 
            placeholder="Tu nombre o apodo" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={styles.input}
            maxLength={20}
            autoFocus
          />
          <button 
            type="submit" 
            className={styles.button}
            disabled={name.trim().length < 3}
          >
            Entrar al juego
          </button>
        </form>
      </div>
    </div>
  );
}

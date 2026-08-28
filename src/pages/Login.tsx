import { useState } from 'react';
import { supabase } from '../supabase';
import styles from './Login.module.css';

// Convierte cualquier nombre de usuario (incluso con espacios o acentos) en un email válido para Supabase
function usernameToEmail(username: string): string {
  const clean = username.trim().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remover acentos
    .replace(/[^a-z0-9]/g, "");     // remover caracteres especiales y espacios

  return `${clean || 'user'}@quiniela.com`;
}

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [userOrEmail, setUserOrEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      if (isLogin) {
        // --- INICIO DE SESIÓN ---
        const input = userOrEmail.trim();
        if (!input) {
          throw new Error('Por favor ingresa tu usuario o correo.');
        }

        let emailToUse = input;

        if (!input.includes('@')) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', input)
            .maybeSingle();

          if (profile?.email) {
            emailToUse = profile.email;
          } else {
            emailToUse = usernameToEmail(input);
          }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (signInError) {
          console.error('Error signInWithPassword:', signInError);
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Usuario o contraseña incorrectos. Verifica tus datos.');
          }
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('⚠️ Tu proyecto de Supabase requiere confirmar correos. En Supabase -> Authentication -> Providers -> Email desactiva "Confirm email".');
          }
          throw new Error(`Error de inicio de sesión: ${signInError.message}`);
        }
      } else {
        // --- REGISTRO DE NUEVO USUARIO ---
        const cleanUsername = username.trim();
        if (cleanUsername.length < 3) {
          throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
        }

        if (password.length < 4) {
          throw new Error('La contraseña debe tener al menos 4 caracteres.');
        }

        // 1. Verificar si el usuario ya existe en profiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (existingProfile) {
          throw new Error(`El usuario "${cleanUsername}" ya existe. Elige otro nombre de usuario.`);
        }

        // 2. Generar un email sintético 100% válido
        const syntheticEmail = usernameToEmail(cleanUsername);

        // 3. Crear el usuario en Supabase Auth
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: syntheticEmail,
          password,
          options: {
            data: {
              username: cleanUsername,
            }
          }
        });

        if (signUpError) {
          console.error('Error signUp:', signUpError);
          if (signUpError.message.includes('Email signups are disabled') || signUpError.message.includes('Signups not allowed')) {
            throw new Error('⚠️ ¡Encontrado! El proveedor de Email está desactivado en Supabase. En tu panel de Supabase ve a Authentication -> Providers -> Email y ACTIVA "Enable Email provider" y "Allow new users to sign up", pero DESACTIVA "Confirm email".');
          }
          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            throw new Error(`El usuario "${cleanUsername}" ya está registrado. Intenta iniciar sesión.`);
          }
          throw new Error(`Error al registrar usuario: ${signUpError.message}`);
        }

        // 4. Si el registro no inició sesión automáticamente
        if (data?.user && !data?.session) {
          const { error: autoSignInError } = await supabase.auth.signInWithPassword({
            email: syntheticEmail,
            password,
          });

          if (autoSignInError) {
            setSuccessMessage('¡Cuenta creada! En Supabase -> Authentication -> Providers -> Email desactiva "Confirm Email" para entrar directamente.');
            return;
          }
        }

        setSuccessMessage('¡Cuenta creada con éxito! Redirigiendo...');
      }
    } catch (err: any) {
      console.error('Auth Exception:', err);
      setError(err.message || 'Ocurrió un error inesperado al autenticar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.glassCard}>
        <div className={styles.logo}>🏈 NFL Predictor</div>
        <h1 className={styles.title}>{isLogin ? 'Iniciar Sesión' : 'Registrarse'}</h1>
        <p className={styles.subtitle}>
          {isLogin ? 'Ingresa con tu usuario y contraseña.' : 'Crea tu cuenta solo con un nombre de usuario y contraseña.'}
        </p>
        
        {error && (
          <div style={{
            color: '#ef4444',
            marginBottom: '1.25rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            textAlign: 'left',
            lineHeight: 1.4,
            fontWeight: 500
          }}>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div style={{
            color: '#10b981',
            marginBottom: '1.25rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.35)',
            padding: '0.85rem 1rem',
            borderRadius: '10px',
            fontSize: '0.88rem',
            textAlign: 'left',
            lineHeight: 1.4,
            fontWeight: 500
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isLogin ? (
            <input 
              type="text" 
              placeholder="Nombre de usuario" 
              value={userOrEmail}
              onChange={(e) => setUserOrEmail(e.target.value)}
              className={styles.input}
              required
              autoFocus
            />
          ) : (
            <input 
              type="text" 
              placeholder="Elige tu usuario (ej. Carlos12)" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.input}
              maxLength={20}
              required
              autoFocus
            />
          )}

          <input 
            type="password" 
            placeholder="Contraseña" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={styles.input}
            required
          />

          <button 
            type="submit" 
            className={styles.button}
            disabled={loading || (!isLogin && username.trim().length < 3)}
          >
            {loading ? 'Cargando...' : (isLogin ? 'Entrar' : 'Crear Cuenta')}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          {isLogin ? '¿No tienes cuenta? ' : '¿Ya tienes cuenta? '}
          <button 
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
              setSuccessMessage(null);
            }}
            style={{ background: 'none', color: 'var(--primary-nfl)', fontWeight: 'bold', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            {isLogin ? 'Regístrate aquí' : 'Inicia sesión'}
          </button>
        </div>
      </div>
    </div>
  );
}

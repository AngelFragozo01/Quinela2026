import { useState } from 'react';
import { supabase } from '../supabase';
import styles from './Login.module.css';

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
        // INICIO DE SESIÓN
        const input = userOrEmail.trim();
        if (!input) {
          throw new Error('Por favor ingresa tu nombre de usuario o correo.');
        }

        let emailToUse = input;

        // Si no incluye '@', tratamos la entrada como un nombre de usuario
        if (!input.includes('@')) {
          const cleanUser = input.toLowerCase();
          // Consultar el perfil por username para obtener su email asociado
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .ilike('username', cleanUser)
            .maybeSingle();

          if (profile?.email) {
            emailToUse = profile.email;
          } else {
            emailToUse = `${cleanUser}@gmail.com`;
          }
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: emailToUse,
          password,
        });

        if (signInError) {
          console.error('Error al iniciar sesión:', signInError);

          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('Usuario o contraseña incorrectos. Verifica tus datos.');
          }
          if (signInError.message.includes('Email not confirmed')) {
            throw new Error('⚠️ Tu cuenta requiere confirmación en Supabase. Ve a Supabase -> Authentication -> Providers -> Email y desactiva "Confirm email".');
          }
          throw new Error(signInError.message);
        }
      } else {
        // REGISTRO DE USUARIO
        const cleanUsername = username.trim();
        if (cleanUsername.length < 3) {
          throw new Error('El nombre de usuario debe tener al menos 3 caracteres.');
        }

        if (password.length < 4) {
          throw new Error('La contraseña debe tener al menos 4 caracteres.');
        }

        // 1. Comprobar si el usuario ya existe en la tabla de perfiles
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('username')
          .ilike('username', cleanUsername)
          .maybeSingle();

        if (existingProfile) {
          throw new Error(`El nombre de usuario "${cleanUsername}" ya está registrado. Por favor elige otro.`);
        }

        // 2. Usar un correo sintético válido (@gmail.com) para Supabase Auth
        const syntheticEmail = `${cleanUsername.toLowerCase()}@gmail.com`;

        // 3. Crear cuenta en Supabase Auth
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
          console.error('Error al registrar usuario:', signUpError);

          if (signUpError.message.includes('already registered') || signUpError.message.includes('already exists')) {
            throw new Error(`El usuario "${cleanUsername}" ya existe. Intenta iniciar sesión.`);
          }
          if (signUpError.message.includes('Database error saving new user')) {
            throw new Error('Error en el trigger de la base de datos. Por favor ejecuta el script de corrección de base de datos en el SQL Editor de Supabase.');
          }
          throw new Error(signUpError.message);
        }

        // 4. Asegurar la creación del perfil en la tabla public.profiles si no existe
        if (data?.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .upsert({
              id: data.user.id,
              email: syntheticEmail,
              username: cleanUsername,
              role: 'user'
            }, { onConflict: 'id' });

          if (profileError) {
            console.warn('Advertencia al guardar perfil en profiles:', profileError);
          }
        }

        // 5. Intentar auto iniciar sesión por si "Confirm Email" está activo en Supabase
        if (data?.user && !data?.session) {
          const { error: autoSignInError } = await supabase.auth.signInWithPassword({
            email: syntheticEmail,
            password,
          });

          if (autoSignInError) {
            setSuccessMessage('¡Cuenta creada! Recuerda desactivar "Confirm Email" en Supabase -> Authentication -> Providers -> Email para evitar pedir correos.');
            return;
          }
        }

        setSuccessMessage('¡Cuenta creada con éxito! Ingresando...');
      }
    } catch (err: any) {
      console.error('Auth handler error:', err);
      setError(err.message || 'Ocurrió un error en la autenticación.');
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
          {isLogin ? 'Ingresa tu usuario y contraseña para participar.' : 'Crea una cuenta rápido solo con tu usuario y contraseña.'}
        </p>
        
        {error && (
          <div style={{
            color: '#ef4444',
            marginBottom: '1rem',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            textAlign: 'left',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}
        
        {successMessage && (
          <div style={{
            color: '#10b981',
            marginBottom: '1rem',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            padding: '0.85rem',
            borderRadius: '8px',
            fontSize: '0.88rem',
            textAlign: 'left',
            lineHeight: 1.4
          }}>
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          {isLogin ? (
            <input 
              type="text" 
              placeholder="Usuario o correo electrónico" 
              value={userOrEmail}
              onChange={(e) => setUserOrEmail(e.target.value)}
              className={styles.input}
              required
              autoFocus
            />
          ) : (
            <input 
              type="text" 
              placeholder="Tu nombre de usuario (ej. Carlos12)" 
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

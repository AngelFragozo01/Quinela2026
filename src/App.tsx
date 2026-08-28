import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './pages/Login';
import Predictions from './pages/Predictions';
import Upcoming from './pages/Upcoming';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';
import Admin from './pages/Admin';
import { supabase } from './supabase';

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  role: 'admin' | 'user';
}

function App() {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchProfile(session.user.id, session.user);
      else setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id, session.user);
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string, sessionUser?: any) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfile(data);
    } else if (sessionUser) {
      // Fallback de seguridad: si el trigger no creó el perfil, se crea dinámicamente
      const fallbackUsername = sessionUser.user_metadata?.username || sessionUser.email?.split('@')[0] || 'Usuario';
      const { data: newProfile } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: sessionUser.email,
          username: fallbackUsername,
          role: 'user'
        })
        .select()
        .single();

      if (newProfile) {
        setProfile(newProfile);
      } else {
        setProfile({
          id: userId,
          email: sessionUser.email || '',
          username: fallbackUsername,
          role: 'user'
        });
      }
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Cargando...</div>;
  }

  if (!session || !profile) {
    return <Login />;
  }

  return (
    <Router>
      <div className="app-container">
        <Header user={profile.username} role={profile.role} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={<History />} />
            {profile.role === 'admin' && <Route path="/admin" element={<Admin />} />}
            <Route path="*" element={<Navigate to="/predictions" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

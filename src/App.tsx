import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './pages/Login';
import Predictions from './pages/Predictions';
import Leaderboard from './pages/Leaderboard';
import History from './pages/History';

function App() {
  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is logged in (simulated with localStorage for now)
    const storedUser = localStorage.getItem('quiniela_user');
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  const handleLogin = (username: string) => {
    localStorage.setItem('quiniela_user', username);
    setUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem('quiniela_user');
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <Router>
      <div className="app-container">
        <Header user={user} onLogout={handleLogout} />
        <main className="main-content">
          <Routes>
            <Route path="/predictions" element={<Predictions />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/history" element={<History />} />
            <Route path="*" element={<Navigate to="/predictions" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

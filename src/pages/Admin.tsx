import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TEAMS } from '../services/mockData';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'create' | 'manage'>('create');
  
  // Para Crear Partido
  const [homeTeam, setHomeTeam] = useState('KC');
  const [awayTeam, setAwayTeam] = useState('SF');
  const [matchDate, setMatchDate] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  // Para Gestionar Partidos
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({});
  const [manageMessage, setManageMessage] = useState('');

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchActiveMatches();
    }
  }, [activeTab]);

  const fetchActiveMatches = async () => {
    setManageLoading(true);
    setManageMessage('');
    try {
      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .eq('is_finished', false)
        .order('match_date', { ascending: true });

      if (error) throw error;

      if (data) {
        setActiveMatches(data);
        const initialScores: Record<string, { home: number; away: number }> = {};
        data.forEach(m => {
          initialScores[m.id] = { home: 0, away: 0 };
        });
        setScores(initialScores);
      }
    } catch (err: any) {
      setManageMessage(`❌ Error al cargar partidos: ${err.message}`);
    } finally {
      setManageLoading(false);
    }
  };

  const handleCreateMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateMessage('');

    try {
      const { error } = await supabase.from('matches').insert({
        home_team_id: homeTeam,
        away_team_id: awayTeam,
        match_date: new Date(matchDate).toISOString(),
        is_finished: false,
      });

      if (error) throw error;
      setCreateMessage('✅ Partido creado exitosamente.');
      setMatchDate('');
    } catch (err: any) {
      setCreateMessage(`❌ Error al crear partido: ${err.message}`);
    } finally {
      setCreateLoading(false);
    }
  };

  const handleScoreChange = (matchId: string, type: 'home' | 'away', val: string) => {
    const num = parseInt(val) || 0;
    setScores(prev => ({
      ...prev,
      [matchId]: {
        ...prev[matchId],
        [type]: num
      }
    }));
  };

  const handleFinalizeMatch = async (matchId: string, homeTeamId: string, awayTeamId: string) => {
    const matchScores = scores[matchId];
    if (!matchScores) return;

    let winnerId: string | null = null;
    if (matchScores.home > matchScores.away) {
      winnerId = homeTeamId;
    } else if (matchScores.away > matchScores.home) {
      winnerId = awayTeamId;
    }

    try {
      const { error } = await supabase
        .from('matches')
        .update({
          is_finished: true,
          home_score: matchScores.home,
          away_score: matchScores.away,
          winner_team_id: winnerId
        })
        .eq('id', matchId);

      if (error) throw error;
      
      setManageMessage('✅ Partido finalizado. Puntuaciones actualizadas en la clasificación.');
      fetchActiveMatches();
    } catch (err: any) {
      setManageMessage(`❌ Error al finalizar partido: ${err.message}`);
    }
  };

  const teamOptions = Object.keys(TEAMS).map(key => (
    <option key={key} value={key}>{TEAMS[key].name}</option>
  ));

  return (
    <div style={{ animation: 'slideUp 0.4s ease', maxWidth: '700px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        ⚙️ Panel de Administración
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ 
            background: 'none', color: activeTab === 'create' ? 'var(--text-main)' : 'var(--text-muted)', 
            padding: '0.5rem 1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'create' ? '2px solid var(--primary-nfl)' : '2px solid transparent'
          }}
        >
          Crear Partido
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          style={{ 
            background: 'none', color: activeTab === 'manage' ? 'var(--text-main)' : 'var(--text-muted)', 
            padding: '0.5rem 1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'manage' ? '2px solid var(--primary-nfl)' : '2px solid transparent'
          }}
        >
          Gestionar Resultados ({activeMatches.length})
        </button>
      </div>

      {activeTab === 'create' ? (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Añadir Nuevo Partido
          </h3>

          {createMessage && <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', color: 'white' }}>{createMessage}</div>}

          <form onSubmit={handleCreateMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Local</label>
                <select 
                  value={homeTeam} 
                  onChange={e => setHomeTeam(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  {teamOptions}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Visitante</label>
                <select 
                  value={awayTeam} 
                  onChange={e => setAwayTeam(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  {teamOptions}
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Fecha y Hora</label>
              <input 
                type="datetime-local" 
                required
                value={matchDate}
                onChange={e => setMatchDate(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={createLoading}
              style={{ 
                marginTop: '1rem', padding: '1rem', background: 'var(--primary-nfl)', color: 'white', 
                border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' 
              }}
            >
              {createLoading ? 'Guardando...' : 'Añadir Partido'}
            </button>
          </form>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h3 style={{ color: 'var(--text-muted)' }}>Partidos Activos</h3>

          {manageMessage && <div style={{ padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', color: 'white' }}>{manageMessage}</div>}

          {manageLoading ? (
            <div>Cargando partidos activos...</div>
          ) : activeMatches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No hay partidos activos por jugar.</div>
          ) : (
            activeMatches.map(match => {
              const home = TEAMS[match.home_team_id];
              const away = TEAMS[match.away_team_id];
              const matchId = match.id;
              const dateStr = new Date(match.match_date).toLocaleDateString('es-ES', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

              return (
                <div 
                  key={matchId} 
                  style={{ 
                    background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', 
                    border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem'
                  }}
                >
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {dateStr}
                  </div>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
                    
                    {/* Visitante */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <img src={away?.logo} alt={away?.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                      <span style={{ fontWeight: 'bold' }}>{away?.name}</span>
                      <input 
                        type="number" 
                        min="0"
                        value={scores[matchId]?.away ?? 0}
                        onChange={e => handleScoreChange(matchId, 'away', e.target.value)}
                        style={{ width: '60px', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', textAlign: 'center', marginLeft: 'auto' }}
                      />
                    </div>

                    <div style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>@</div>

                    {/* Local */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '1rem', flexDirection: 'row-reverse' }}>
                      <img src={home?.logo} alt={home?.name} style={{ width: '40px', height: '40px', objectFit: 'contain' }} />
                      <span style={{ fontWeight: 'bold' }}>{home?.name}</span>
                      <input 
                        type="number" 
                        min="0"
                        value={scores[matchId]?.home ?? 0}
                        onChange={e => handleScoreChange(matchId, 'home', e.target.value)}
                        style={{ width: '60px', padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', textAlign: 'center', marginRight: 'auto' }}
                      />
                    </div>

                  </div>

                  <button
                    onClick={() => handleFinalizeMatch(matchId, match.home_team_id, match.away_team_id)}
                    style={{ 
                      padding: '0.75rem', background: 'var(--accent-nfl)', color: 'white', 
                      border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer',
                      alignSelf: 'flex-end', transition: 'background 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = 'var(--accent-hover)'}
                    onMouseOut={e => e.currentTarget.style.background = 'var(--accent-nfl)'}
                  >
                    Finalizar y Guardar Resultado
                  </button>

                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

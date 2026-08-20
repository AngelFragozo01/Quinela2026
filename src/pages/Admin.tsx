import { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { TEAMS, getTeamIdFromName } from '../services/mockData';
import { formatMatchDate } from '../services/dateUtils';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'create' | 'manage' | 'csv'>('create');
  
  // Para Crear Partido Manual
  const [homeTeam, setHomeTeam] = useState('KC');
  const [awayTeam, setAwayTeam] = useState('SF');
  const [matchDate, setMatchDate] = useState('');
  const [matchWeek, setMatchWeek] = useState(1);
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState('');

  // Para Gestionar Partidos
  const [activeMatches, setActiveMatches] = useState<any[]>([]);
  const [manageLoading, setManageLoading] = useState(false);
  const [scores, setScores] = useState<Record<string, { home: number; away: number }>>({});
  const [manageMessage, setManageMessage] = useState('');

  // Para Importar CSV
  const [csvText, setCsvText] = useState('');
  const [csvLoading, setCsvLoading] = useState(false);
  const [csvMessage, setCsvMessage] = useState('');
  const [csvProgress, setCsvProgress] = useState<{ total: number; inserted: number; errors: string[] }>({ total: 0, inserted: 0, errors: [] });

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
        .order('week', { ascending: true })
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
        week: matchWeek,
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
      
      setManageMessage('✅ Partido finalizado. Puntuaciones actualizadas en la clasificación e historial.');
      fetchActiveMatches();
    } catch (err: any) {
      setManageMessage(`❌ Error al finalizar partido: ${err.message}`);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        setCsvText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleImportCsv = async () => {
    if (!csvText.trim()) {
      setCsvMessage('⚠️ Por favor ingresa o sube el contenido del archivo CSV.');
      return;
    }

    setCsvLoading(true);
    setCsvMessage('');
    const lines = csvText.trim().split('\n');
    const errors: string[] = [];
    const matchesToInsert: any[] = [];

    const startIdx = lines[0].toLowerCase().includes('semana') || lines[0].toLowerCase().includes('week') ? 1 : 0;

    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(',').map(p => p.trim());
      if (parts.length < 4) {
        errors.push(`Fila ${i + 1}: Formato inválido (${line})`);
        continue;
      }

      const [weekStr, dateStr, awayTeamRaw, homeTeamRaw] = parts;
      const week = parseInt(weekStr) || 1;
      const awayId = getTeamIdFromName(awayTeamRaw);
      const homeId = getTeamIdFromName(homeTeamRaw);

      if (!awayId) {
        errors.push(`Fila ${i + 1}: No se reconoció el equipo visitante "${awayTeamRaw}"`);
        continue;
      }
      if (!homeId) {
        errors.push(`Fila ${i + 1}: No se reconoció el equipo local "${homeTeamRaw}"`);
        continue;
      }

      // Parsear fecha evitando desfase de zona horaria
      let isoDateString: string;
      try {
        const cleanDate = dateStr.trim();
        if (/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
          // Asignar 18:00 UTC (tarde en América) para evitar que se reste un día en husos horarios occidentales
          isoDateString = `${cleanDate}T18:00:00.000Z`;
        } else {
          const parsed = new Date(cleanDate);
          if (isNaN(parsed.getTime())) throw new Error('Fecha inválida');
          isoDateString = parsed.toISOString();
        }
      } catch {
        errors.push(`Fila ${i + 1}: Fecha inválida "${dateStr}"`);
        continue;
      }

      matchesToInsert.push({
        week: week,
        match_date: isoDateString,
        away_team_id: awayId,
        home_team_id: homeId,
        is_finished: false,
        home_score: 0,
        away_score: 0
      });
    }

    if (matchesToInsert.length === 0) {
      setCsvMessage('❌ No se encontraron partidos válidos para insertar.');
      setCsvProgress({ total: 0, inserted: 0, errors });
      setCsvLoading(false);
      return;
    }

    try {
      const chunkSize = 50;
      let insertedCount = 0;

      for (let i = 0; i < matchesToInsert.length; i += chunkSize) {
        const chunk = matchesToInsert.slice(i, i + chunkSize);
        const { error } = await supabase.from('matches').insert(chunk);
        if (error) throw error;
        insertedCount += chunk.length;
      }

      setCsvProgress({ total: matchesToInsert.length, inserted: insertedCount, errors });
      setCsvMessage(`🎉 ¡Se importaron exitosamente ${insertedCount} partidos a Supabase sin desfase de fecha!`);
    } catch (err: any) {
      setCsvMessage(`❌ Error al guardar en Supabase: ${err.message}`);
    } finally {
      setCsvLoading(false);
    }
  };

  const teamOptions = Object.keys(TEAMS).map(key => (
    <option key={key} value={key}>{TEAMS[key].name}</option>
  ));

  return (
    <div style={{ animation: 'slideUp 0.4s ease', maxWidth: '750px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        ⚙️ Panel de Administración
      </h2>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', overflowX: 'auto' }}>
        <button 
          onClick={() => setActiveTab('create')}
          style={{ 
            background: 'none', color: activeTab === 'create' ? 'var(--text-main)' : 'var(--text-muted)', 
            padding: '0.5rem 1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'create' ? '2px solid var(--primary-nfl)' : '2px solid transparent',
            whiteSpace: 'nowrap'
          }}
        >
          Crear Partido
        </button>
        <button 
          onClick={() => setActiveTab('manage')}
          style={{ 
            background: 'none', color: activeTab === 'manage' ? 'var(--text-main)' : 'var(--text-muted)', 
            padding: '0.5rem 1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'manage' ? '2px solid var(--primary-nfl)' : '2px solid transparent',
            whiteSpace: 'nowrap'
          }}
        >
          Gestionar Resultados ({activeMatches.length})
        </button>
        <button 
          onClick={() => setActiveTab('csv')}
          style={{ 
            background: 'none', color: activeTab === 'csv' ? 'var(--text-main)' : 'var(--text-muted)', 
            padding: '0.5rem 1rem', fontWeight: 'bold', border: 'none', cursor: 'pointer',
            borderBottom: activeTab === 'csv' ? '2px solid var(--primary-nfl)' : '2px solid transparent',
            whiteSpace: 'nowrap'
          }}
        >
          📁 Cargar CSV Temporada
        </button>
      </div>

      {activeTab === 'create' && (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>
            Añadir Nuevo Partido Manual
          </h3>

          {createMessage && <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '8px', color: 'white' }}>{createMessage}</div>}

          <form onSubmit={handleCreateMatch} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 200px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Local</label>
                <select 
                  value={homeTeam} 
                  onChange={e => setHomeTeam(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  {teamOptions}
                </select>
              </div>
              <div style={{ flex: '1 1 200px' }}>
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

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 120px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Semana</label>
                <select
                  value={matchWeek}
                  onChange={e => setMatchWeek(Number(e.target.value))}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
                >
                  {Array.from({ length: 18 }, (_, i) => i + 1).map(w => (
                    <option key={w} value={w}>Semana {w}</option>
                  ))}
                </select>
              </div>

              <div style={{ flex: '2 1 240px' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-muted)' }}>Fecha y Hora</label>
                <input 
                  type="datetime-local" 
                  required
                  value={matchDate}
                  onChange={e => setMatchDate(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', outline: 'none' }}
                />
              </div>
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
      )}

      {activeTab === 'manage' && (
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
              const { formattedDate, formattedTime } = formatMatchDate(match.match_date);

              return (
                <div 
                  key={matchId} 
                  style={{ 
                    background: 'var(--bg-card)', padding: '1.5rem', borderRadius: '12px', 
                    border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '1rem'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 'bold' }}>
                      Semana {match.week || 1}
                    </span>
                    <span style={{ textTransform: 'uppercase' }}>
                      {formattedDate} {formattedTime !== 'TBD' && formattedTime ? `• ${formattedTime}` : ''}
                    </span>
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

      {activeTab === 'csv' && (
        <div style={{ background: 'var(--bg-card)', padding: '2rem', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '0.5rem' }}>📁 Cargar Calendario Completo (CSV)</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Sube o pega el calendario de partidos en formato CSV (Semana, Fecha, Equipo Visitante, Equipo Local). El sistema mapeará automáticamente los nombres de los equipos y cargará toda la temporada en Supabase sin desfases de fecha.
          </p>

          {csvMessage && (
            <div style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              borderRadius: '8px', 
              background: csvMessage.includes('🎉') ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: csvMessage.includes('🎉') ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(239, 68, 68, 0.3)',
              color: 'white'
            }}>
              {csvMessage}
            </div>
          )}

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>1. Seleccionar archivo .csv</label>
            <input 
              type="file" 
              accept=".csv,.txt"
              onChange={handleFileUpload}
              style={{ padding: '0.5rem', background: 'var(--bg-dark)', borderRadius: '8px', border: '1px solid var(--border-color)', width: '100%', color: 'white' }}
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>2. O pegar texto CSV aquí:</label>
            <textarea
              rows={8}
              value={csvText}
              onChange={e => setCsvText(e.target.value)}
              placeholder="Semana,Fecha,Equipo Visitante,Equipo Local&#10;1,2026-09-09,New England Patriots,Seattle Seahawks&#10;1,2026-09-10,San Francisco 49ers,Los Angeles Rams..."
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', background: 'var(--bg-dark)', color: 'white', border: '1px solid var(--border-color)', fontFamily: 'monospace', fontSize: '0.85rem' }}
            />
          </div>

          <button
            onClick={handleImportCsv}
            disabled={csvLoading || !csvText.trim()}
            style={{
              width: '100%',
              padding: '1rem',
              background: 'var(--primary-nfl)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 'bold',
              fontSize: '1rem',
              cursor: csvLoading || !csvText.trim() ? 'not-allowed' : 'pointer',
              opacity: csvLoading || !csvText.trim() ? 0.6 : 1
            }}
          >
            {csvLoading ? 'Procesando e Importando Partidos...' : '🚀 Importar Calendario a Supabase'}
          </button>

          {csvProgress.errors.length > 0 && (
            <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
              <div style={{ fontWeight: 'bold', color: '#ef4444', marginBottom: '0.5rem' }}>
                Errores encontrados ({csvProgress.errors.length}):
              </div>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: '#f87171' }}>
                {csvProgress.errors.slice(0, 5).map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
                {csvProgress.errors.length > 5 && (
                  <li>... y {csvProgress.errors.length - 5} más.</li>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

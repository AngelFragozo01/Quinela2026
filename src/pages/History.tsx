export default function History() {
  return (
    <div style={{ animation: 'slideUp 0.4s ease', textAlign: 'center', padding: '3rem 1rem' }}>
      <h2 style={{ marginBottom: '1rem' }}>Historial de Semanas</h2>
      <p style={{ color: 'var(--text-muted)' }}>
        Aquí podrás ver los resultados de las semanas anteriores una vez que comience la temporada.
      </p>
      <div style={{ marginTop: '2rem', fontSize: '4rem', opacity: 0.5 }}>📅</div>
    </div>
  );
}

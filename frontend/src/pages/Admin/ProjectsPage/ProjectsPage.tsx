export default function ProjectsPage() {
    return (
      <div>
        <h1 style={{ marginBottom: '4px' }}>Проекты</h1>
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '32px' }}>Таймлайн и статусы проектов</p>
        <div style={{
          padding: '60px',
          border: '2px dashed var(--color-border)',
          borderRadius: '12px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}>
          <p style={{ marginBottom: '8px', fontSize: '1.2rem' }}>🚧</p>
          <p>В разработке — Шаг 5</p>
        </div>
      </div>
    );
  }
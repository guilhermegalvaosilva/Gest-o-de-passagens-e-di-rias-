export function NotificationsPanel({ logs }) {
  const recent = logs.slice(0, 8);

  return (
    <section className="dashboard-section admin-panel active">
      <div className="dashboard-card notification-panel">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Notificacoes</span>
            <h3>Atualizacoes para todos os usuarios</h3>
            <p className="table-note">
              Toda criacao ou edicao de formulario aparece aqui.
            </p>
          </div>
        </div>
        <div className="notifications-list">
          {recent.length ? (
            recent.map((log) => (
              <article className="notification-item" key={log.id}>
                <span className="notification-dot" />
                <div>
                  <strong>{log.titulo}</strong>
                  <p>
                    {log.campoAlterado}: {log.valorOriginal} -&gt; {log.valorNovo}
                  </p>
                  <small>
                    {log.dataAlteracaoClient} por {log.alteradoPor}
                  </small>
                </div>
              </article>
            ))
          ) : (
            <div className="empty-records">Ainda nao ha notificacoes.</div>
          )}
        </div>
      </div>
    </section>
  );
}

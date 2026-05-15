function Feature({ number, title, text }) {
  return (
    <div className="feature-item">
      <span className="feature-icon">{number}</span>
      <div>
        <strong>{title}</strong>
        <p className="mini-note">{text}</p>
      </div>
    </div>
  );
}

export function HomePage({ onAdmin, onForm, storageMode }) {
  return (
    <section className="landing-card">
      <div className="premium-hero">
        <div className="hero-copy">
          <span className="badge">Fiocruz Brasilia | NUGB</span>
          <h2>Solicitacao de viagens</h2>
          <p>
            Preencha o formulario para solicitar passagens e diarias vinculadas
            as atividades institucionais da Fiocruz.
          </p>
          <div className="home-buttons choice-buttons">
            <button className="btn btn-admin" type="button" onClick={onAdmin}>
              Area Administrativa
            </button>
            <button className="btn btn-secondary" type="button" onClick={onForm}>
              Responder Formulario
            </button>
          </div>
        </div>
        <div className="hero-panel" aria-label="Resumo do sistema">
          <div className="hero-panel-header">
            <span className="chip">NUGB</span>
            <span>{storageMode}</span>
          </div>
          <div className="metric-stack">
            <article>
              <small>Comprovante</small>
              <strong>PDF gerado apos o envio</strong>
            </article>
            <article>
              <small>Dados da viagem</small>
              <strong>Evento, viajante, origem e destino</strong>
            </article>
            <article>
              <small>Acompanhamento</small>
              <strong>Registro encaminhado para analise</strong>
            </article>
          </div>
        </div>
      </div>
      <div className="feature-list premium-features">
        <Feature number="01" title="Solicitacao" text="Informe os dados do evento e da viagem." />
        <Feature number="02" title="Projeto" text="Vincule a solicitacao ao ID FIOTEC." />
        <Feature number="03" title="Comprovante" text="Baixe o PDF ao finalizar o envio." />
      </div>
    </section>
  );
}

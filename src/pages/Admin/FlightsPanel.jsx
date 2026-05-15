import { normalizeText, normalizedFilterText } from "../../utils/formatters";

function Insight({ title, value, note }) {
  return (
    <article className="insight-card">
      <h4>{title}</h4>
      <strong>{value}</strong>
      <small>{note}</small>
    </article>
  );
}

export function FlightsPanel({ requests }) {
  const withFlight = requests.filter((item) => normalizeText(item.vooIda)).length;
  const routes = new Set(
    requests
      .filter((item) => normalizeText(item.localOrigem) && normalizeText(item.localDestino))
      .map((item) => `${item.localOrigem} -> ${item.localDestino}`),
  );
  const missing = requests.filter(
    (item) =>
      normalizedFilterText(item.necessidade).includes("passagens") &&
      !normalizeText(item.vooIda),
  ).length;

  return (
    <section className="dashboard-section admin-panel active">
      <div className="dashboard-card">
        <div className="panel-heading">
          <div>
            <span className="section-kicker">Logistica</span>
            <h3>Informacoes dos voos</h3>
            <p className="table-note">
              Acompanhe pedidos de passagens, rotas mais frequentes e registros
              sem indicacao de voo.
            </p>
          </div>
        </div>
        <div className="insight-grid">
          <Insight title="Pedidos com indicacao de voo" value={withFlight} note="Campo indicacao do voo de ida preenchido." />
          <Insight title="Rotas diferentes" value={routes.size} note="Origem e destino informados." />
          <Insight title="Passagens sem voo indicado" value={missing} note="Pedidos de passagem que precisam de complemento." />
        </div>
      </div>
    </section>
  );
}

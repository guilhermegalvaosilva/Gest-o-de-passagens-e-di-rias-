import {
  createdAtDisplay,
  formatCurrency,
  formatDate,
  normalizeText,
  normalizedFilterText,
  parseMoneyValue,
} from "../../utils/formatters";

function percent(value, total) {
  return total ? Math.round((value / total) * 100) : 0;
}

function dateValue(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function daysUntil(value) {
  const date = dateValue(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return Math.ceil((date.getTime() - today.getTime()) / 86400000);
}

function countBy(rows, getter) {
  return rows.reduce((acc, item) => {
    const key = normalizeText(getter(item)) || "Nao informado";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(source, limit = 5) {
  return Object.entries(source)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit);
}

function Kpi({ title, value, note, tone = "blue" }) {
  return (
    <article className={`kpi-card executive-kpi ${tone}`}>
      <div>
        <h4>{title}</h4>
        <strong>{value}</strong>
        <small>{note}</small>
      </div>
      <span className="kpi-ring" />
    </article>
  );
}

function MetricStrip({ label, value, note }) {
  return (
    <div className="metric-strip-item">
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{note}</small>
    </div>
  );
}

function BarList({ title, subtitle, rows, total }) {
  return (
    <article className="chart-card dashboard-analytics-card">
      <div className="chart-heading">
        <div>
          <h4>{title}</h4>
          <span>{subtitle}</span>
        </div>
      </div>
      <div className="bar-list">
        {rows.length ? (
          rows.map(([label, value]) => (
            <div className="bar-row" key={label}>
              <div className="bar-row-label">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
              <div className="bar-track">
                <span style={{ width: `${Math.max(percent(value, total), 4)}%` }} />
              </div>
              <small>{percent(value, total)}%</small>
            </div>
          ))
        ) : (
          <div className="empty-records">Sem dados para este indicador.</div>
        )}
      </div>
    </article>
  );
}

function RecentList({ requests }) {
  if (!requests.length) {
    return <div className="empty-records">Nenhuma solicitacao encontrada.</div>;
  }

  return (
    <div className="insight-list compact-list">
      {requests.map((item) => (
        <div className="insight-list-item" key={item.id}>
          <div>
            <strong>{item.nomeCompleto || item.nomeEvento || "Solicitacao sem nome"}</strong>
            <span>
              {item.id} | {createdAtDisplay(item)}
            </span>
          </div>
          <strong>{item.status || "Recebida"}</strong>
        </div>
      ))}
    </div>
  );
}

function UpcomingEvents({ requests }) {
  const upcoming = requests
    .map((item) => ({ ...item, days: daysUntil(item.dataEvento) }))
    .filter((item) => item.days !== null && item.days >= 0)
    .sort((a, b) => a.days - b.days)
    .slice(0, 6);

  return (
    <article className="chart-card dashboard-analytics-card">
      <div className="chart-heading">
        <div>
          <h4>Proximos eventos</h4>
          <span>Agenda operacional por data do evento</span>
        </div>
      </div>
      <div className="timeline-list">
        {upcoming.length ? (
          upcoming.map((item) => (
            <div className="timeline-item" key={item.id}>
              <div>
                <strong>{formatDate(item.dataEvento)}</strong>
                <span>{item.days === 0 ? "Hoje" : `Em ${item.days} dia(s)`}</span>
              </div>
              <p>{item.nomeEvento || item.localEvento || item.id}</p>
            </div>
          ))
        ) : (
          <div className="empty-records">Nenhum evento futuro cadastrado.</div>
        )}
      </div>
    </article>
  );
}

function AlertPanel({ alerts }) {
  return (
    <article className="chart-card dashboard-analytics-card alert-card">
      <div className="chart-heading">
        <div>
          <h4>Alertas de qualidade</h4>
          <span>Pontos que pedem conferencia</span>
        </div>
      </div>
      <div className="alert-list">
        {alerts.map((alert) => (
          <div className={alert.value ? "alert-item warning" : "alert-item ok"} key={alert.title}>
            <strong>{alert.value}</strong>
            <div>
              <span>{alert.title}</span>
              <small>{alert.note}</small>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

export function Dashboard({ requests }) {
  const total = requests.length;
  const withPassages = requests.filter((item) =>
    normalizedFilterText(item.necessidade).includes("passagens"),
  );
  const withDaily = requests.filter((item) =>
    normalizedFilterText(item.necessidade).includes("diaria"),
  );
  const withDailyValue = requests.filter(
    (item) => parseMoneyValue(item.valorMaximoDiaria) > 0,
  );
  const missingFlight = requests.filter(
    (item) =>
      normalizedFilterText(item.necessidade).includes("passagens") &&
      !normalizeText(item.vooIda),
  );
  const missingDailyValue = requests.filter(
    (item) =>
      item.necessarioValorMaximoDiaria === "SIM" &&
      parseMoneyValue(item.valorMaximoDiaria) === 0,
  );
  const totalDaily = requests.reduce(
    (sum, item) => sum + parseMoneyValue(item.valorMaximoDiaria),
    0,
  );
  const averageDaily = withDailyValue.length ? totalDaily / withDailyValue.length : 0;
  const routes = new Set(
    requests
      .filter((item) => normalizeText(item.localOrigem) && normalizeText(item.localDestino))
      .map((item) => `${item.localOrigem} -> ${item.localDestino}`),
  );
  const todayRequests = requests.filter((item) => {
    const created = dateValue(item.createdAtIso || item.createdAt);
    if (!created) return false;
    return created.toDateString() === new Date().toDateString();
  });
  const nextEventDays = requests
    .map((item) => daysUntil(item.dataEvento))
    .filter((value) => value !== null && value >= 0)
    .sort((a, b) => a - b)[0];
  const last = requests[0] ? createdAtDisplay(requests[0]) : "-";
  const statusRows = topEntries(countBy(requests, (item) => item.status || "Recebida"), 5);
  const needRows = topEntries(countBy(requests, (item) => item.necessidade), 5);
  const sectorRows = topEntries(countBy(requests, (item) => item.setorFiocruz), 5);
  const projectRows = topEntries(countBy(requests, (item) => item.idFiotec), 5);

  const alerts = [
    {
      title: "Passagens sem voo indicado",
      note: "Pedidos de passagem que precisam de complemento.",
      value: missingFlight.length,
    },
    {
      title: "Diarias sem valor informado",
      note: "Campo 25 marcado como SIM sem valor no campo 26.",
      value: missingDailyValue.length,
    },
    {
      title: "Registros sem setor",
      note: "Solicitacoes sem setor Fiocruz preenchido.",
      value: requests.filter((item) => !normalizeText(item.setorFiocruz)).length,
    },
  ];

  return (
    <section className="dashboard-section admin-panel active">
      <div className="overview-board executive-dashboard">
        <div className="overview-hero executive-hero">
          <div>
            <span className="section-kicker">Resumo executivo</span>
            <h3>Visao geral da operacao</h3>
            <p>
              Leitura completa da fila administrativa com volume, financeiro,
              logistica, qualidade dos cadastros, setores e proximos eventos.
            </p>
            <div className="hero-metric-strip">
              <MetricStrip label="Hoje" value={todayRequests.length} note="novos registros" />
              <MetricStrip label="Ultimo envio" value={last} note="registro mais recente" />
              <MetricStrip
                label="Proximo evento"
                value={nextEventDays === undefined ? "-" : `${nextEventDays}d`}
                note="dias restantes"
              />
            </div>
          </div>
          <div className="overview-status executive-status">
            <span>Fila total</span>
            <strong>{total}</strong>
            <small>solicitacoes cadastradas</small>
          </div>
        </div>

        <div className="kpi-grid overview-kpis executive-kpis">
          <Kpi title="Passagens" value={withPassages.length} note={`${percent(withPassages.length, total)}% da fila`} />
          <Kpi title="Diarias" value={withDaily.length} note={`${percent(withDaily.length, total)}% da fila`} tone="gold" />
          <Kpi title="Valor estimado" value={formatCurrency(totalDaily)} note="Soma dos valores preenchidos" tone="green" />
          <Kpi title="Rotas" value={routes.size} note="Origem e destino distintos" tone="slate" />
        </div>

        <div className="dashboard-summary-grid">
          <article className="chart-card finance-command-card">
            <div className="chart-heading">
              <div>
                <h4>Comando financeiro</h4>
                <span>Diarias, media e cobertura de valores</span>
              </div>
            </div>
            <div className="finance-command">
              <div>
                <span>Total estimado</span>
                <strong>{formatCurrency(totalDaily)}</strong>
              </div>
              <div>
                <span>Media com valor</span>
                <strong>{formatCurrency(averageDaily)}</strong>
              </div>
              <div>
                <span>Com valor informado</span>
                <strong>
                  {withDailyValue.length}/{total}
                </strong>
              </div>
            </div>
          </article>
          <AlertPanel alerts={alerts} />
        </div>

        <div className="analytics-grid">
          <BarList
            title="Distribuicao por necessidade"
            subtitle="Passagens, diarias e combinados"
            rows={needRows}
            total={total}
          />
          <BarList
            title="Status da fila"
            subtitle="Situacao administrativa atual"
            rows={statusRows}
            total={total}
          />
          <BarList
            title="Top setores Fiocruz"
            subtitle="Areas com maior volume"
            rows={sectorRows}
            total={total}
          />
          <BarList
            title="Top projetos"
            subtitle="IDs FIOTEC mais recorrentes"
            rows={projectRows}
            total={total}
          />
        </div>

        <div className="dashboard-bottom-grid">
          <article className="chart-card chart-card-large">
            <div className="chart-heading">
              <div>
                <h4>Solicitacoes recentes</h4>
                <span>Ultimos registros recebidos no painel</span>
              </div>
            </div>
            <RecentList requests={requests.slice(0, 6)} />
          </article>
          <UpcomingEvents requests={requests} />
        </div>
      </div>
    </section>
  );
}

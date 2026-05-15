import logo from "../../assets/Captura de tela 2026-04-14 121940.png";

const adminTabs = [
  ["dashboard", "Visao geral"],
  ["solicitacoes", "Solicitacoes"],
  ["alteracoes", "Auditoria"],
  ["notificacoes", "Alertas"],
  ["financeiro", "Financeiro"],
  ["voos", "Logistica"],
];

export function AdminSidebar({ activeTab, onTab, onExport, onLogout }) {
  return (
    <aside className="dashboard-sidebar" aria-label="Menu administrativo">
      <div className="sidebar-logo">
        <span className="logo-mark sidebar-logo-mark">
          <img src={logo} alt="Fiocruz Brasilia" />
        </span>
        <span>
          NUGB Viagens
          <small>Painel administrativo</small>
        </span>
      </div>
      <nav className="sidebar-nav">
        <span className="sidebar-section-label">Navegacao</span>
        {adminTabs.map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "active" : ""}
            onClick={() => onTab(tab)}
          >
            {label}
          </button>
        ))}
        <div className="sidebar-action-group">
          <span className="sidebar-section-label">Operacoes</span>
          <button type="button" onClick={onExport}>
            Exportar XLSM
          </button>
          <button type="button" onClick={onLogout}>
            Sair
          </button>
        </div>
      </nav>
    </aside>
  );
}

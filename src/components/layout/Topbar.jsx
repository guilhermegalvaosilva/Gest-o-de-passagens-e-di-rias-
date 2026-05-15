import logo from "../../assets/Captura de tela 2026-04-14 121940.png";

export function Topbar() {
  return (
    <header className="topbar">
      <div className="brand-lockup">
        <span className="brand-mark brand-logo">
          <img src={logo} alt="Fiocruz Brasilia" />
        </span>
        <div>
          <span className="eyebrow">Fiocruz Brasilia | NUGB</span>
          <h1>Viagens Institucionais</h1>
        </div>
      </div>
      <div className="topbar-meta">
        <span className="status-dot" />
        <span>Solicitacoes de viagens</span>
      </div>
    </header>
  );
}

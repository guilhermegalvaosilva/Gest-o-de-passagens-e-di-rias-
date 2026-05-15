import { REQUESTS_PAGE_SIZE } from "../../config/appConfig";
import { RecordCard } from "./RecordCard";

export function RequestsPanel({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  dateFilter,
  setDateFilter,
  rows,
  total,
  page,
  totalPages,
  setPage,
  onDelete,
}) {
  return (
    <>
      <section className="dashboard-section admin-panel active">
        <div className="dashboard-card">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Consulta rapida</span>
              <h3>Busca inteligente</h3>
              <p>Pesquise por nome, evento, projeto, origem ou destino.</p>
            </div>
          </div>
          <div className="search-row">
            <label className="search-label">
              <span>Pesquisar solicitacoes</span>
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Digite para filtrar..."
              />
            </label>
            <div className="admin-tools">
              <button type="button" onClick={() => setSearch("")}>
                Limpar filtro
              </button>
            </div>
          </div>
        </div>
      </section>
      <section className="dashboard-section admin-panel active">
        <div className="admin-table-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Registros</span>
              <h3>Solicitacoes cadastradas</h3>
              <p className="table-note">
                A fila mostra poucas solicitacoes por vez, com filtros e paginacao
                para manter a analise leve.
              </p>
            </div>
          </div>
          <div className="queue-toolbar">
            <label>
              <span>Status</span>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="all">Todos</option>
                <option value="Recebida">Recebidas</option>
              </select>
            </label>
            <label>
              <span>Periodo</span>
              <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
                <option value="all">Todas</option>
                <option value="today">Hoje</option>
              </select>
            </label>
            <div className="queue-meta">
              {total
                ? `${(page - 1) * REQUESTS_PAGE_SIZE + 1}-${Math.min(
                    page * REQUESTS_PAGE_SIZE,
                    total,
                  )} de ${total} registro(s)`
                : "0 registros"}
            </div>
          </div>
          <div className="records-list">
            {rows.length ? (
              rows.map((item) => <RecordCard key={item.id} item={item} onDelete={onDelete} />)
            ) : (
              <div className="empty-records">Nenhuma solicitacao encontrada.</div>
            )}
          </div>
          <div className="pagination-row">
            <span>
              Pagina {page} de {totalPages}
            </span>
            <div className="pagination-actions">
              <button className="btn-ghost" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                Anterior
              </button>
              <button className="btn-ghost" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                Proxima
              </button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

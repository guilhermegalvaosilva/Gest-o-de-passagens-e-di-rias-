import { useState } from "react";

import { labels } from "../../data/formData";
import { createdAtDisplay, displayValue } from "../../utils/formatters";
import { generatePDF } from "../../utils/pdf";

const recordGroups = [
  [
    "01. Cadastro do Evento",
    [
      "descricaoSolicitacao",
      "nomeEvento",
      "dataEvento",
      "localEvento",
      "justificativa",
    ],
  ],
  ["02. Projeto Vinculado", ["idFiotec", "metaProjeto", "coordenador", "setorFiocruz"]],
  [
    "03. Informacoes do Viajante",
    [
      "nomeCompleto",
      "dataNascimento",
      "cargoFuncao",
      "cpf",
      "banco",
      "agencia",
      "contaCorrente",
    ],
  ],
  [
    "04. Informacoes da Solicitacao",
    [
      "necessidade",
      "localOrigem",
      "dataIda",
      "horarioIda",
      "vooIda",
      "localDestino",
      "dataVolta",
      "horarioVolta",
      "necessarioValorMaximoDiaria",
      "valorMaximoDiaria",
    ],
  ],
];

export function RecordCard({ item, onDelete }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <article className={`record-card ${expanded ? "expanded" : ""}`}>
      <div className="record-card-header">
        <div>
          <span className="record-id">{item.id}</span>
          <h4>{item.nomeCompleto || item.nomeEvento || "Solicitacao sem nome"}</h4>
          <small>
            {createdAtDisplay(item)}
            {item.updatedAtClient ? ` | Atualizada em ${item.updatedAtClient}` : ""}
          </small>
        </div>
        <span className="status-pill">{item.status || "Recebida"}</span>
        <button
          type="button"
          className="record-toggle"
          aria-label={expanded ? "Recolher detalhes" : "Ver detalhes"}
          aria-expanded={expanded}
          onClick={() => setExpanded((current) => !current)}
        />
      </div>
      <div className="record-card-body">
        {recordGroups.map(([title, fields]) => (
          <div className="record-section" key={title}>
            <strong>{title}</strong>
            <div className="record-fields">
              {fields.map((field) => (
                <div className="record-field" key={field}>
                  <span>{labels[field] || field}</span>
                  <b>{displayValue(field, item)}</b>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="record-actions">
        <button
          type="button"
          onClick={() =>
            window.dispatchEvent(new CustomEvent("load-form-edit", { detail: item.id }))
          }
        >
          Editar
        </button>
        <button type="button" className="btn-secondary" onClick={() => generatePDF(item)}>
          PDF
        </button>
        <button type="button" className="btn-danger" onClick={() => onDelete(item.id)}>
          Apagar
        </button>
      </div>
    </article>
  );
}

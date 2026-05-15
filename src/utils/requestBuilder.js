import { linkedProjects, labels, requestFields } from "../data/formData";
import { savedSession } from "../services/api";
import { displayValue, normalizeText } from "./formatters";

function createRequestId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `SOL-${date}-${suffix}`;
}

function createAuditId() {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const suffix = Math.random().toString(16).slice(2, 10).toUpperCase();
  return `ALT-${date}-${suffix}`;
}

export function findLinkedProject(idFiotec) {
  const id = normalizeText(idFiotec).toUpperCase();
  return linkedProjects.find((project) => project.idFiotec.toUpperCase() === id);
}

export function buildRequestObject(form, existingRequest) {
  const now = new Date();
  const project = findLinkedProject(form.idFiotec);
  if (!project) throw new Error("Projeto nao localizado. Confira o ID FIOTEC.");

  const data = { ...form };
  Object.keys(data).forEach((key) => {
    data[key] = normalizeText(data[key]);
  });

  data.id = existingRequest?.id || createRequestId();
  data.status = existingRequest?.status || "Recebida";
  data.createdAt = existingRequest?.createdAt || now.toISOString();
  data.createdAtClient = existingRequest?.createdAtClient || now.toLocaleString("pt-BR");
  data.createdAtIso = existingRequest?.createdAtIso || data.createdAt;
  data.updatedAt = existingRequest ? now.toISOString() : "";
  data.updatedAtClient = existingRequest ? now.toLocaleString("pt-BR") : "";
  data.metaProjeto = project.projetoId;
  data.coordenador = project.coordenador;
  data.setorFiocruz = project.setorFiocruz;
  data.projetoVinculado = project;
  return data;
}

function auditTitle(data) {
  return (
    normalizeText(data.nomeCompleto) ||
    normalizeText(data.nomeEvento) ||
    "Solicitacao sem titulo"
  );
}

function buildAuditEntry(data, overrides = {}) {
  const id = createAuditId();
  const now = new Date();
  return {
    id,
    titulo: auditTitle(data),
    idAlteracao: id,
    idChamado: data.id,
    tipoAlteracao: "EDICAO",
    motivoAlteracao: "Formulario atualizado",
    dataAlteracao: now.toISOString(),
    dataAlteracaoClient: now.toLocaleString("pt-BR"),
    campoAlterado: "-",
    alteradoPor: savedSession().login || "usuario do formulario",
    valorOriginal: "-",
    valorNovo: "-",
    origem: "Formulario",
    observacao: "Registro automatico do sistema.",
    ...overrides,
  };
}

export function buildCreationAudit(data) {
  return [
    buildAuditEntry(data, {
      tipoAlteracao: "CRIACAO",
      motivoAlteracao: "Novo formulario enviado",
      campoAlterado: "Formulario",
      valorNovo: data.status || "Recebida",
      origem: "Formulario publico",
      observacao:
        "Nova solicitacao disponivel para todos os usuarios administrativos.",
    }),
  ];
}

export function buildChangeAuditLogs(previous, next) {
  const ignored = new Set([
    "id",
    "createdAt",
    "createdAtClient",
    "createdAtIso",
    "updatedAt",
    "updatedAtClient",
    "status",
    "projetoVinculado",
  ]);

  return requestFields
    .filter(
      (field) =>
        !ignored.has(field) &&
        normalizeText(displayValue(field, previous)) !==
          normalizeText(displayValue(field, next)),
    )
    .map((field) =>
      buildAuditEntry(next, {
        campoAlterado: labels[field] || field,
        valorOriginal: displayValue(field, previous),
        valorNovo: displayValue(field, next),
        origem: "Edicao de formulario",
        observacao: "Alteracao registrada automaticamente ao salvar a edicao.",
      }),
    );
}

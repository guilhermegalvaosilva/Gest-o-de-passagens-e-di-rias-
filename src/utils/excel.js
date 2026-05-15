import { labels, requestFields } from "../data/formData";
import {
  displayValue,
  formatCurrency,
  normalizedFilterText,
  parseMoneyValue,
} from "./formatters";

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function workbookDate() {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date());
}

function currentLogin() {
  try {
    return (
      JSON.parse(localStorage.getItem("formulario_demanda_admin_session") || "{}").login ||
      "admin"
    );
  } catch {
    return "admin";
  }
}

function summaryFromRows(rows) {
  const totalDaily = rows.reduce(
    (sum, item) => sum + parseMoneyValue(item.valorMaximoDiaria),
    0,
  );
  return [
    ["Solicitacoes", rows.length],
    [
      "Passagens",
      rows.filter((item) =>
        normalizedFilterText(item.necessidade).includes("passagens"),
      ).length,
    ],
    [
      "Diarias",
      rows.filter((item) => normalizedFilterText(item.necessidade).includes("diaria"))
        .length,
    ],
    ["Total estimado", formatCurrency(totalDaily)],
  ];
}

export function exportRequestsWorkbook(rows) {
  if (!rows.length) {
    alert("Nao ha dados para exportar.");
    return;
  }

  const summaryRows = summaryFromRows(rows)
    .map(
      ([label, value]) =>
        `<tr><td class="summary-label">${escapeHtml(label)}</td><td class="summary-value">${escapeHtml(value)}</td></tr>`,
    )
    .join("");

  const header = requestFields
    .map((field) => `<th>${escapeHtml(labels[field] || field)}</th>`)
    .join("");

  const body = rows
    .map((item, index) => {
      const cells = requestFields
        .map((field) => `<td>${escapeHtml(displayValue(field, item))}</td>`)
        .join("");
      return `<tr class="${index % 2 ? "even" : "odd"}">${cells}</tr>`;
    })
    .join("");

  const workbook = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; color: #17202e; }
    .cover { background: #08283d; color: #ffffff; padding: 22px; border-bottom: 6px solid #b98a34; }
    .cover h1 { margin: 0; font-size: 26px; }
    .cover p { margin: 6px 0 0; color: #d7e3ee; }
    table { border-collapse: collapse; width: 100%; }
    .summary { margin: 18px 0; width: 520px; }
    .summary td { border: 1px solid #c7d5e2; padding: 11px 12px; font-size: 13px; }
    .summary-label { background: #edf4f8; color: #08283d; font-weight: 700; }
    .summary-value { background: #fff7e6; color: #6d4b08; font-weight: 800; }
    .data th { background: #123f5d; color: #ffffff; border: 1px solid #0b2d44; padding: 10px; font-size: 12px; text-transform: uppercase; }
    .data td { border: 1px solid #c7d5e2; padding: 9px; font-size: 12px; vertical-align: top; mso-number-format: "\\@"; }
    .data .odd td { background: #ffffff; }
    .data .even td { background: #f3f8fc; }
  </style>
</head>
<body>
  <div class="cover">
    <h1>Relatorio Administrativo NUGB / GEREB</h1>
    <p>Arquivo XLSM gerado em ${escapeHtml(workbookDate())} - usuario: ${escapeHtml(currentLogin())}</p>
  </div>
  <table class="summary">${summaryRows}</table>
  <table class="data">
    <thead><tr>${header}</tr></thead>
    <tbody>${body}</tbody>
  </table>
</body>
</html>`;

  const blob = new Blob([`\uFEFF${workbook}`], {
    type: "application/vnd.ms-excel.sheet.macroEnabled.12;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `relatorio_nugb_${new Date().toISOString().slice(0, 10)}.xlsm`;
  link.click();
  URL.revokeObjectURL(url);
}

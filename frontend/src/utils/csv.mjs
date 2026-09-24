// Gera e baixa um CSV simples a partir de um array de objetos, sem
// precisar de nenhuma biblioteca externa.
export const downloadCSV = (filename, headers, rows) => {
  const escapar = (valor) => {
    const texto = String(valor ?? "");
    if (texto.includes(";") || texto.includes('"') || texto.includes("\n")) {
      return `"${texto.replace(/"/g, '""')}"`;
    }
    return texto;
  };

  const linhas = [
    headers.map(escapar).join(";"),
    ...rows.map((linha) => linha.map(escapar).join(";")),
  ];

  // BOM no início para o Excel reconhecer acentuação corretamente.
  const conteudo = "﻿" + linhas.join("\r\n");
  const blob = new Blob([conteudo], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

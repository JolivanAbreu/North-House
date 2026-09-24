// Gera e imprime o comprovante de uma comanda (delivery ou local) em uma
// janela separada, com CSS pensado pra bobina de impressora térmica (80mm)
// mas que também funciona normal como "Salvar como PDF" no navegador.
import { formatCurrency, formatDateTime, formatQuantidade } from "./format.mjs";

export const imprimirComanda = (comanda, nomeLoja = "Loja") => {
  const itensHtml = (comanda.PedidoItems || [])
    .map((item) => {
      const nomeProduto = item.Produto?.nome || "Produto";
      const variacao = item.variacao_nome ? ` (${item.variacao_nome})` : "";
      const subtotal = parseFloat(item.preco_unitario) * parseFloat(item.quantidade);
      return `
        <tr>
          <td>${formatQuantidade(item.quantidade)}x ${nomeProduto}${variacao}</td>
          <td style="text-align:right">${formatCurrency(subtotal)}</td>
        </tr>`;
    })
    .join("");

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Comanda #${comanda.id}</title>
        <style>
          @page { size: 80mm auto; margin: 4mm; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: 72mm; margin: 0 auto; color: #111; }
          h1 { font-size: 14px; text-align: center; margin: 0 0 4px; }
          .linha { border-top: 1px dashed #999; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 2px 0; vertical-align: top; }
          .total { font-weight: bold; font-size: 14px; }
          .centro { text-align: center; }
          .muted { color: #555; font-size: 11px; }
        </style>
      </head>
      <body onload="window.print()">
        <h1>${nomeLoja}</h1>
        <p class="centro muted">Comanda #${comanda.id} — ${comanda.tipo_entrega}</p>
        ${comanda.mesa_numero ? `<p class="centro muted">Mesa ${comanda.mesa_numero}</p>` : ""}
        <p class="muted">Cliente: ${comanda.nome_cliente || "-"}</p>
        <p class="muted">${formatDateTime(comanda.updatedAt || comanda.createdAt)}</p>
        <div class="linha"></div>
        <table>${itensHtml}</table>
        <div class="linha"></div>
        <table>
          <tr><td>Subtotal</td><td style="text-align:right">${formatCurrency(comanda.subtotal)}</td></tr>
          ${parseFloat(comanda.valor_desconto || 0) > 0 ? `<tr><td>Desconto</td><td style="text-align:right">-${formatCurrency(comanda.valor_desconto)}</td></tr>` : ""}
          <tr class="total"><td>Total</td><td style="text-align:right">${formatCurrency(comanda.valor_total)}</td></tr>
        </table>
        <p class="muted centro" style="margin-top:8px;">Pagamento: ${comanda.forma_pagamento_ilustrativa || "-"}</p>
        <p class="centro muted" style="margin-top:10px;">Obrigado pela preferência!</p>
      </body>
    </html>`;

  const janela = window.open("", "_blank", "width=380,height=600");
  if (!janela) return false;
  janela.document.write(html);
  janela.document.close();
  return true;
};

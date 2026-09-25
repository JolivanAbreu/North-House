// Gera e imprime o comprovante de uma comanda (local, delivery ou retirada)
// numa janela separada, com CSS pensado pra bobina de impressora térmica
// (80mm). Na janela de impressão também dá pra escolher "Salvar como PDF".
import { formatCurrency, formatDateTime, formatQuantidade } from "./format.mjs";
import { BRAND } from "../config/brand.mjs";
import { formatarTelefone } from "./mascaras.mjs";

// Evita que nomes digitados (cliente, produto) quebrem o HTML do comprovante.
const esc = (texto) =>
  String(texto ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * @param {object} comanda  Pedido com PedidoItems
 * @param {object} [perfil] Perfil da loja (telefone_whatsapp, link_instagram)
 * @param {number} [larguraMm=80] 80 ou 58 (bobinas mais estreitas)
 */
export const imprimirComanda = (comanda, perfil = null, larguraMm = 80) => {
  const larguraUtil = larguraMm === 58 ? 48 : 72;
  const logoUrl = new URL(BRAND.logo, window.location.origin).href;

  const itensHtml = (comanda.PedidoItems || [])
    .map((item) => {
      const nomeProduto = esc(item.Produto?.nome || "Produto");
      const variacao = item.variacao_nome ? ` (${esc(item.variacao_nome)})` : "";
      const subtotal = parseFloat(item.preco_unitario) * parseFloat(item.quantidade);
      return `
        <tr><td colspan="2">${nomeProduto}${variacao}</td></tr>
        <tr class="muted">
          <td>${formatQuantidade(item.quantidade)} x ${formatCurrency(item.preco_unitario)}</td>
          <td class="dir">${formatCurrency(subtotal)}</td>
        </tr>`;
    })
    .join("");

  const ehLocal = comanda.tipo_entrega === "Local";
  const cliente = comanda.nome_cliente && comanda.nome_cliente !== "Comanda Local" ? comanda.nome_cliente : "";
  const contato = [
    perfil?.telefone_whatsapp ? formatarTelefone(perfil.telefone_whatsapp) : "",
    perfil?.link_instagram ? "@" + String(perfil.link_instagram).replace(/\/+$/, "").split("/").pop() : "",
  ].filter(Boolean).join(" · ");

  const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
      <head>
        <meta charset="UTF-8" />
        <title>Comanda #${comanda.id} - ${esc(BRAND.nome)}</title>
        <style>
          @page { size: ${larguraMm}mm auto; margin: 3mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; width: ${larguraUtil}mm; margin: 0 auto; color: #000; }
          .logo { display: block; margin: 0 auto 4px; max-width: 28mm; max-height: 28mm; object-fit: contain; filter: grayscale(1) contrast(1.2); }
          h1 { font-size: 15px; text-align: center; margin: 0; letter-spacing: 1px; text-transform: uppercase; }
          .sub { text-align: center; font-size: 10px; margin: 1px 0 0; }
          .linha { border-top: 1px dashed #000; margin: 6px 0; }
          table { width: 100%; border-collapse: collapse; }
          td { padding: 1px 0; vertical-align: top; }
          .dir { text-align: right; white-space: nowrap; }
          .total td { font-weight: bold; font-size: 15px; padding-top: 3px; }
          .centro { text-align: center; }
          .muted { font-size: 11px; }
          p { margin: 2px 0; }
          .destaque { font-weight: bold; font-size: 13px; text-align: center; }
        </style>
      </head>
      <body>
        <img class="logo" src="${logoUrl}" alt="" onerror="this.style.display='none'" />
        <h1>${esc(BRAND.nome)}</h1>
        <p class="sub">${esc(BRAND.descricao)}</p>
        ${contato ? `<p class="sub">${esc(contato)}</p>` : ""}
        <div class="linha"></div>
        <p class="destaque">COMANDA #${comanda.id}</p>
        <p class="centro muted">${ehLocal ? (comanda.mesa_numero ? `Mesa ${esc(comanda.mesa_numero)}` : "Balcão") : esc(comanda.tipo_entrega)}</p>
        <p class="muted">Data: ${formatDateTime(comanda.updatedAt || comanda.createdAt)}</p>
        ${cliente ? `<p class="muted">Cliente: ${esc(cliente)}</p>` : ""}
        ${!ehLocal && comanda.telefone_cliente ? `<p class="muted">Tel: ${esc(formatarTelefone(comanda.telefone_cliente))}</p>` : ""}
        ${comanda.endereco_entrega ? `<p class="muted">Entrega: ${esc(comanda.endereco_entrega)}</p>` : ""}
        <div class="linha"></div>
        <table>${itensHtml}</table>
        <div class="linha"></div>
        <table>
          <tr><td>Subtotal</td><td class="dir">${formatCurrency(comanda.subtotal)}</td></tr>
          ${parseFloat(comanda.valor_desconto || 0) > 0 ? `<tr><td>Desconto</td><td class="dir">-${formatCurrency(comanda.valor_desconto)}</td></tr>` : ""}
          <tr class="total"><td>TOTAL</td><td class="dir">${formatCurrency(comanda.valor_total)}</td></tr>
        </table>
        <p class="muted" style="margin-top:6px;">Pagamento: ${esc(comanda.forma_pagamento_ilustrativa || "-")}</p>
        <div class="linha"></div>
        <p class="centro muted">Obrigado pela preferência!</p>
        <p class="centro muted">Volte sempre ao ${esc(BRAND.nome)}</p>
        <script>
          // Espera o logo carregar (ou falhar) antes de abrir a impressão
          window.addEventListener('load', function () { setTimeout(function () { window.print(); }, 150); });
        </script>
      </body>
    </html>`;

  const janela = window.open("", "_blank", "width=380,height=640");
  if (!janela) return false;
  janela.document.write(html);
  janela.document.close();
  return true;
};

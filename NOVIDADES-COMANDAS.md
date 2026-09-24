# Novidades — Comandas, Mesas, Mercearia/Cardápio e Relatórios

Este arquivo resume o que foi implementado em cima do sistema original, com base
no pedido de adaptação para um restaurante junto de um comércio (mercearia).

## Como rodar

1. Backend: `cd backend && npm install && npm run dev` (copie `.env.example` para `.env` antes)
   - O schema do banco é sincronizado automaticamente (`sequelize.sync({ alter: true })`)
     ao subir o servidor — **não precisa rodar migration manual**, os campos novos
     são criados sozinhos na primeira vez que o backend iniciar.
2. Frontend: `cd frontend && npm install && npm run dev`
3. Acesse `/admin` — a tela inicial agora é a de **Comandas** (o Dashboard antigo
   foi movido para `/admin/dashboard`, ainda acessível pelo menu lateral).

## O que foi implementado

### 1. Tela inicial de Comandas (`/admin`)
- Mostra comandas de **Delivery**, **Retirada** e **Local** juntas, com cor de
  borda diferente por tipo.
- Comanda local aparece com badge **"Aberto"** até ser paga.
- Badge extra indicando se a comanda tem itens de **Mercearia**, **Restaurante**
  ou os dois.
- Botão **"Nova comanda"**: abre uma comanda local na hora (nome do cliente e
  mesa são opcionais).
- Dentro de cada comanda local: botão **"Adicionar item"** (separado por abas
  Cardápio/Mercearia), com subtotal recalculado automaticamente a cada item.
- Footer do card com **valor total em destaque** e botão **"Pagar"** → escolhe
  forma de pagamento (Dinheiro, Cartão ou Pix — o Pix reaproveita a integração
  com Mercado Pago já existente no projeto) → **"Finalizar comanda"**.
- Depois de paga, aparece o botão **"Imprimir/PDF"** (abre uma janela com o
  comprovante formatado para impressora térmica de 80mm — também serve para
  "Salvar como PDF" pelo navegador) e **"Reabrir"**, caso precise corrigir algo.
- Painel de **controle de mesas** (botão "Mesas" no topo): cadastra mesas,
  mostra livre/ocupada, e ocupa/libera automaticamente conforme a comanda é
  aberta/finalizada.

### 2. Produtos — abas Mercearia / Cardápio
- A tela de Produtos agora tem duas abas, filtrando por `Categoria.tipo`.
- Novo campo **"Unidade de venda"** (por unidade ou por kg) — o preço aparece
  formatado como `R$ X,XX/un` ou `R$ X,XX/kg`.
- Categorias também ganharam o campo `tipo` (Mercearia/Cardápio), com abas na
  tela de Categorias.

### 3. Relatórios
- Filtros de período: **Diário, Semanal, Mensal, Semestral, Anual e Tudo**.
- Card comparativo **Comandas Locais vs. Delivery/Retirada** (faturamento e
  número de comandas no período).
- Exportação em PDF continua via **Imprimir/PDF** (botão já existente,
  `window.print()`), agora com um cabeçalho impresso com o nome da loja.

## Limitações conhecidas / próximos passos

- **Logo da loja no PDF**: hoje o cabeçalho usa só o nome da loja (texto).
  Upload de logo não foi implementado ainda — dá pra adicionar depois seguindo
  o mesmo padrão de upload de imagem que já existe em Produtos.
- **Impressora térmica ESC/POS**: a impressão usa `window.print()` com CSS de
  80mm, que funciona com qualquer impressora já instalada no Windows/navegador.
  Uma integração ESC/POS direta (sem diálogo de impressão) não foi implementada
  — precisa saber o modelo da impressora pra isso.
- **Leitor de código de barras**: o model `Produto` já ganhou um campo opcional
  `codigo_barras`, mas a leitura via leitor de código de barras em si (e/ou
  integração com uma API de EAN) fica como próxima fase, como você mesmo marcou
  para "estudar".
- **Estoque de mercearia**: `Produto` ganhou `quantidade_em_estoque` (com baixa
  automática ao finalizar uma comanda que vende esse produto) — a tela de
  Produtos ainda não tem uma UI dedicada de "reposição rápida" como a que já
  existe para Insumos; o endpoint (`PUT /produtos/:id` só com
  `quantidade_em_estoque`) já existe, faltando o botão na tela.

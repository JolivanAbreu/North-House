# Novidades desta atualização

## 1. Redesign visual completo

- Paleta de cores própria (terracota + neutros quentes) no lugar do azul/cinza padrão do Tailwind.
- Tipografia com Google Fonts (Plus Jakarta Sans nos títulos, Inter no corpo).
- Ícones consistentes com `lucide-react` no lugar dos SVGs inline duplicados.
- Componentes de UI reutilizáveis: `Button`, `Card`, `Badge`, `EmptyState`, `Skeleton`, `PageHeader`, `Input`.
- Estados de carregamento com skeleton (vitrine, dashboard, listas do admin) no lugar de "Carregando...".
- Estados vazios ilustrados (carrinho vazio, sem pedidos, sem produtos, 404).
- Micro-animações (fade-in, slide-up, hover em cards) e favicon/branding próprios.

## 2. Novas funcionalidades

**Busca e ordenação de produtos** — campo de busca por nome/descrição e ordenação (menor/maior preço, nome) na vitrine.

**Cupons de desconto** — novo model `Cupom` no backend, CRUD completo em *Admin > Cupons* (código, percentual ou valor fixo, validade, limite de usos, pedido mínimo) e aplicação do cupom no carrinho/checkout, com o valor sendo validado e recalculado no servidor.

**Dashboard aprimorado** — gráfico de tendência de faturamento (área), distribuição de pedidos por status (pizza) e comparação percentual com o período anterior, além dos indicadores que já existiam (faturamento, pedidos, ticket médio, top produtos).

**Notificações de pedido** — sininho no painel admin que avisa (toast + contador) quando chegam novos pedidos, e botão "Notificar cliente via WhatsApp" em cada pedido, que abre uma mensagem pronta com o status atual. (Notificação por e-mail/SMS automática não foi incluída por depender de um provedor pago como SendGrid/Twilio — se quiser, posso integrar depois.)

**Outros ajustes de "produto real"** — filtro e paginação na lista de pedidos, recibo com opção de impressão na página de status do pedido, página 404, e uso consistente de `Intl.NumberFormat` para moeda (R$ 1.234,50 em vez de R$ 1234.5).

## 3. Correções encontradas no código original

- URLs de imagem estavam fixas em `http://localhost:3001`, o que quebraria em produção — agora usam a variável `BASE_URL`.
- `AddStockModal` e a edição de produtos referenciavam campos que não existem no modelo (`unidade_medida`, `custo_por_unidade`); corrigido para `unidade_uso`/`custo_compra`.
- O componente `Spinner` usava classes Tailwind dinâmicas (`w-${size}`) que o Tailwind não consegue gerar — agora usa um mapa fixo de tamanhos.

## 4. Como rodar

Backend:
```
cd backend
cp .env.example .env   # preencha com seus dados
npm install
npm run dev
```

Frontend:
```
cd frontend
npm install
npm run dev
```

O banco (MariaDB) pode ser subido com `docker compose up -d` na raiz do projeto.

## 5. Atualização 2 — correções e novas funções pedidas

**Correções:**
- `nodemon` reiniciava o servidor inteiro sempre que uma imagem de produto era enviada (ele "via" o novo arquivo em `backend/uploads/` como mudança de código). Agora essa pasta é ignorada pelo nodemon.
- Adicionada uma rede de segurança no backend (`process.on('unhandledRejection'/'uncaughtException')`) para que um erro pontual nunca derrube o servidor inteiro.
- Corrigido um typo (`InMsumoId` → `InsumoId`) e protegida a reversão de transação ao concluir um pedido.
- Erro de "estoque insuficiente" ao marcar pedido como Concluído agora aparece de forma bem visível no card do pedido (antes só um toast rápido, fácil de perder), com atalho direto para repor o estoque.
- Página de status do cliente atualiza a cada 6s (era 20s) e também na hora em que a aba volta a ficar visível.

**Novidades:**
- Alerta sonoro (além do toast) quando chega um pedido novo no painel — pode ser ligado/desligado no ícone ao lado do sininho.
- Ações em massa em Pedidos: selecione vários pedidos e mude o status de todos de uma vez.
- Aviso automático por WhatsApp: ao mudar o status de um pedido, uma aba do WhatsApp já abre com a mensagem pronta pro cliente — só falta clicar em enviar (dá pra desligar no topo da página).
- Nova seção **Relatórios**: resumo geral (faturamento, pedidos, ticket médio, descontos de cupons) com filtro por período e status, exportação em CSV e opção de imprimir/gerar PDF.
- Dashboard simplificado: os gráficos deram lugar a listas diretas de nome + quantidade (produtos mais vendidos) e contagem por status.
- Cadastro rápido de insumo: ao montar a ficha técnica de um produto, dá pra criar um insumo novo na hora, sem sair da tela (a tela de Insumos continua existindo pra quem preferir cadastrar com calma).

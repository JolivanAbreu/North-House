const Produto = require('../models/Produto');
const Insumo = require('../models/Insumo');
const Categoria = require('../models/Categoria');
const FichaTecnica = require('../models/FichaTecnica');
const VariacaoProduto = require('../models/VariacaoProduto');
const sequelize = require('../database/config');
const { Op } = require('sequelize');

// --- CRUD Básico ---
exports.createProduto = async (req, res) => {
  try {
    const { nome, descricao, preco_venda, CategoriaId, disponivel, unidade_venda, quantidade_em_estoque, codigo_barras } = req.body;
    const usuarioId = req.userData.lojaId;

    if (!nome || !preco_venda || !CategoriaId) {
      return res.status(400).json({ message: 'Nome, preço e categoria são obrigatórios.' });
    }

    const categoria = await Categoria.findOne({ where: { id: CategoriaId, UsuarioId: usuarioId } });
    if (!categoria) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    const novoProduto = await Produto.create({
      nome,
      descricao,
      preco_venda,
      CategoriaId: parseInt(CategoriaId),
      UsuarioId: usuarioId,
      disponivel: disponivel === undefined ? true : disponivel === 'true' || disponivel === true,
      unidade_venda: unidade_venda === 'kg' ? 'kg' : 'unidade',
      quantidade_em_estoque: quantidade_em_estoque !== undefined && quantidade_em_estoque !== '' ? parseFloat(quantidade_em_estoque) : null,
      codigo_barras: codigo_barras || null,
    });

    res.status(201).json(novoProduto);
  } catch (error) {
    console.error('ERRO EM createProduto:', error);
    res.status(500).json({ message: 'Erro ao criar produto', error: error.message });
  }
};


exports.getProdutos = async (req, res) => {
  try {
    const usuarioId = req.userData.lojaId;
    const produtos = await Produto.findAll({
      where: { UsuarioId: usuarioId },
      include: [
        {
          model: Categoria,
          attributes: ['id', 'nome', 'tipo']
        },
        {
          model: Insumo,
          attributes: [
            'id',
            'nome',
            'unidade_uso',
            'custo_compra',
            'fator_conversao'
          ],
          through: {
            attributes: ['quantidade_usada']
          }
        },
        {
          model: VariacaoProduto,
          attributes: ['id', 'nome', 'ajuste_preco']
        }
      ],
      order: [['nome', 'ASC']]
    });
    res.status(200).json(produtos);
  } catch (error) {
    console.error('ERRO EM getProdutos:', error);
    res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
  }
};

exports.updateProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, descricao, preco_venda, CategoriaId, disponivel, unidade_venda, quantidade_em_estoque, codigo_barras } = req.body;
    const usuarioId = req.userData.lojaId;

    const produtoExistente = await Produto.findOne({ where: { id: id, UsuarioId: usuarioId } });
    if (!produtoExistente) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    // Atualização rápida (só disponibilidade, sem os outros campos obrigatórios)
    if (disponivel !== undefined && nome === undefined) {
      produtoExistente.disponivel = disponivel === 'true' || disponivel === true;
      await produtoExistente.save();
      return res.status(200).json(produtoExistente);
    }

    // Atualização rápida (só reposição de estoque, sem os outros campos obrigatórios)
    if (quantidade_em_estoque !== undefined && nome === undefined) {
      const atual = parseFloat(produtoExistente.quantidade_em_estoque) || 0;
      produtoExistente.quantidade_em_estoque = atual + parseFloat(quantidade_em_estoque);
      await produtoExistente.save();
      return res.status(200).json(produtoExistente);
    }

    const categoria = await Categoria.findOne({ where: { id: CategoriaId, UsuarioId: usuarioId } });
    if (!categoria) {
      return res.status(404).json({ message: 'Categoria não encontrada.' });
    }

    const dadosAtualizados = {
      nome,
      descricao,
      preco_venda,
      CategoriaId: parseInt(CategoriaId),
    };
    
    if (disponivel !== undefined) {
      dadosAtualizados.disponivel = disponivel === 'true' || disponivel === true;
    }
    if (unidade_venda !== undefined) {
      dadosAtualizados.unidade_venda = unidade_venda === 'kg' ? 'kg' : 'unidade';
    }
    if (quantidade_em_estoque !== undefined) {
      dadosAtualizados.quantidade_em_estoque = quantidade_em_estoque === '' ? null : parseFloat(quantidade_em_estoque);
    }
    if (codigo_barras !== undefined) {
      dadosAtualizados.codigo_barras = codigo_barras || null;
    }

    const [updated] = await Produto.update(dadosAtualizados, {
      where: {
        id: id,
        UsuarioId: usuarioId
      }
    });

    if (updated) {
      const produtoAtualizado = await Produto.findOne({ where: { id: id } });
      res.status(200).json(produtoAtualizado);
    } else {
      res.status(404).json({ message: 'Produto não encontrado ou dados idênticos.' });
    }
  } catch (error) {
    console.error('ERRO EM updateProduto:', error);
    res.status(500).json({ message: 'Erro ao atualizar produto', error: error.message });
  }
};

exports.deleteProduto = async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.userData.lojaId;

    const produtoToDelete = await Produto.findOne({ where: { id, UsuarioId: usuarioId } });
    if (!produtoToDelete) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    await FichaTecnica.destroy({
      where: { ProdutoId: id }
    });

    const deleted = await Produto.destroy({
      where: {
        id: id,
        UsuarioId: usuarioId
      }
    });

    if (deleted) {
      res.status(204).json({ message: 'Produto deletado com sucesso.' });
    } else {
      res.status(404).json({ message: 'Produto não encontrado.' });
    }
  } catch (error) {
    console.error('ERRO EM deleteProduto:', error);
    res.status(500).json({ message: 'Erro ao deletar produto', error: error.message });
  }
};


// --- Lógica da Ficha Técnica ---
exports.addInsumoToFichaTecnica = async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const { insumoId, quantidade_usada } = req.body;
    const usuarioId = req.userData.lojaId;

    const produto = await Produto.findOne({ where: { id: produtoId, UsuarioId: usuarioId } });
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const insumo = await Insumo.findOne({ where: { id: insumoId, UsuarioId: usuarioId } });
    if (!insumo) {
      return res.status(404).json({ message: 'Insumo não encontrado.' });
    }

    await produto.addInsumo(insumo, {
      through: { quantidade_usada: quantidade_usada }
    });

    res.status(201).json({ message: 'Insumo adicionado à ficha técnica com sucesso.' });

  } catch (error) {
    console.error('ERRO EM addInsumoToFichaTecnica:', error);
    res.status(500).json({ message: 'Erro ao adicionar insumo', error: error.message });
  }
};

exports.updateFichaTecnica = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const { id: produtoId } = req.params;
    const { insumos } = req.body;
    const usuarioId = req.userData.lojaId;

    const produto = await Produto.findOne({ where: { id: produtoId, UsuarioId: usuarioId } });
    if (!produto) {
      return res.status(404).json({ message: "Produto não encontrado." });
    }

    await FichaTecnica.destroy({
      where: { ProdutoId: produtoId },
      transaction: t
    });

    if (insumos && insumos.length > 0) {
      const dadosDaFicha = insumos.map(item => ({
        ProdutoId: produtoId,
        InsumoId: item.insumoId,
        quantidade_usada: item.quantidade_usada
      }));

      await FichaTecnica.bulkCreate(dadosDaFicha, { transaction: t });
    }

    await t.commit();
    res.status(200).json({ message: "Ficha técnica atualizada com sucesso." });

  } catch (error) {
    await t.rollback();
    console.error('ERRO EM updateFichaTecnica:', error);
    res.status(500).json({ message: 'Erro ao sincronizar ficha técnica', error: error.message });
  }
};


// --- Lógica de Precificação ---
exports.calcularPreco = async (req, res) => {
  try {
    const { insumos, margem_lucro } = req.body;
    const usuarioId = req.userData.lojaId;

    if (!insumos || !margem_lucro || insumos.length === 0) {
      return res.status(400).json({ message: 'Array de insumos e margem de lucro são obrigatórios.' });
    }

    const insumoIds = insumos.map(i => i.id || i.insumoId);

    const insumosDoBanco = await Insumo.findAll({
      where: {
        id: { [Op.in]: insumoIds },
        UsuarioId: usuarioId,
      },
      attributes: ['id', 'custo_compra', 'fator_conversao']
    });

    if (insumosDoBanco.length !== insumoIds.length) {
      return res.status(404).json({ message: 'Um ou mais insumos não foram encontrados.' });
    }

    const custoMap = new Map(insumosDoBanco.map(i => {
      const custo_por_uso = parseFloat(i.custo_compra) / parseFloat(i.fator_conversao);
      return [i.id, custo_por_uso];
    }));

    let custo_total = 0;
    for (const insumo of insumos) {
      const custoUnitario = custoMap.get(insumo.id || insumo.insumoId);
      const quantidade = insumo.quantidade || insumo.quantidade_usada;
      custo_total += custoUnitario * parseFloat(quantidade);
    }

    const margem = 1 + (parseFloat(margem_lucro) / 100);
    const preco_sugerido = custo_total * margem;

    res.status(200).json({
      custo_total: custo_total.toFixed(2),
      preco_sugerido: preco_sugerido.toFixed(2),
    });

  } catch (error) {
    console.error('ERRO EM calcularPreco:', error);
    res.status(500).json({ message: 'Erro ao calcular preço', error: error.message });
  }
};

// --- Variações de Produto (ex: Tamanho, Sabor, Adicionais) ---
exports.getVariacoes = async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const usuarioId = req.userData.lojaId;

    const produto = await Produto.findOne({ where: { id: produtoId, UsuarioId: usuarioId } });
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    const variacoes = await VariacaoProduto.findAll({ where: { ProdutoId: produtoId } });
    res.status(200).json(variacoes);
  } catch (error) {
    console.error('ERRO EM getVariacoes:', error);
    res.status(500).json({ message: 'Erro ao buscar variações', error: error.message });
  }
};

exports.createVariacao = async (req, res) => {
  try {
    const { id: produtoId } = req.params;
    const { nome, ajuste_preco } = req.body;
    const usuarioId = req.userData.lojaId;

    const produto = await Produto.findOne({ where: { id: produtoId, UsuarioId: usuarioId } });
    if (!produto) {
      return res.status(404).json({ message: 'Produto não encontrado.' });
    }

    if (!nome) {
      return res.status(400).json({ message: 'Nome da variação é obrigatório.' });
    }

    const novaVariacao = await VariacaoProduto.create({
      nome,
      ajuste_preco: ajuste_preco || 0,
      ProdutoId: produtoId,
    });

    res.status(201).json(novaVariacao);
  } catch (error) {
    console.error('ERRO EM createVariacao:', error);
    res.status(500).json({ message: 'Erro ao criar variação', error: error.message });
  }
};

exports.updateVariacao = async (req, res) => {
  try {
    const { variacaoId } = req.params;
    const { nome, ajuste_preco } = req.body;
    const usuarioId = req.userData.lojaId;

    const variacao = await VariacaoProduto.findOne({
      where: { id: variacaoId },
      include: [{ model: Produto, where: { UsuarioId: usuarioId }, attributes: [] }]
    });
    if (!variacao) {
      return res.status(404).json({ message: 'Variação não encontrada.' });
    }

    await variacao.update({ nome, ajuste_preco });
    res.status(200).json(variacao);
  } catch (error) {
    console.error('ERRO EM updateVariacao:', error);
    res.status(500).json({ message: 'Erro ao atualizar variação', error: error.message });
  }
};

exports.deleteVariacao = async (req, res) => {
  try {
    const { variacaoId } = req.params;
    const usuarioId = req.userData.lojaId;

    const variacao = await VariacaoProduto.findOne({
      where: { id: variacaoId },
      include: [{ model: Produto, where: { UsuarioId: usuarioId }, attributes: [] }]
    });
    if (!variacao) {
      return res.status(404).json({ message: 'Variação não encontrada.' });
    }

    await variacao.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('ERRO EM deleteVariacao:', error);
    res.status(500).json({ message: 'Erro ao deletar variação', error: error.message });
  }
};
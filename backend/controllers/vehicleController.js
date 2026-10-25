const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// ===== LISTAR TODOS OS VEÍCULOS DO USUÁRIO LOGADO =====
async function listar(req, res) {
  try {
    const [veiculos] = await pool.query(
      'SELECT * FROM veiculos WHERE usuario_id = ? AND ativo = TRUE ORDER BY criado_em DESC',
      [req.usuarioId]
    );
    return res.json(veiculos);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar veículos.' });
  }
}

// ===== BUSCAR UM VEÍCULO ESPECÍFICO =====
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;

    const [veiculos] = await pool.query(
      'SELECT * FROM veiculos WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );

    if (veiculos.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    return res.json(veiculos[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao buscar veículo.' });
  }
}

// ===== CADASTRAR NOVO VEÍCULO =====
async function cadastrar(req, res) {
  try {
    const {
      marca, modelo, ano_fabricacao, ano_modelo, cor, placa,
      quilometragem_atual, tipo_combustivel, data_aquisicao,
      valor_compra, chassi, renavam, foto_url
    } = req.body;

    if (!marca || !modelo || !placa || !tipo_combustivel) {
      return res.status(400).json({ erro: 'Marca, modelo, placa e tipo de combustível são obrigatórios.' });
    }

    // Verifica se já existe essa placa para esse usuário
    const [existentes] = await pool.query(
      'SELECT id, ativo FROM veiculos WHERE usuario_id = ? AND placa = ?',
      [req.usuarioId, placa]
    );
    if (existentes.length > 0 && existentes[0].ativo) {
      return res.status(409).json({ erro: 'Você já possui um veículo cadastrado com essa placa.' });
    }

    // A placa pertence a um veículo excluído (soft delete): reativa ele com os dados novos,
    // já que o banco não permite duas linhas com a mesma placa para o mesmo usuário
    if (existentes.length > 0) {
      await pool.query(
        `UPDATE veiculos SET
          marca = ?, modelo = ?, ano_fabricacao = ?, ano_modelo = ?, cor = ?,
          quilometragem_atual = ?, tipo_combustivel = ?, data_aquisicao = ?, valor_compra = ?,
          chassi = ?, renavam = ?, ativo = TRUE
         WHERE id = ?`,
        [
          marca, modelo, ano_fabricacao || null, ano_modelo || null, cor || null,
          quilometragem_atual || 0, tipo_combustivel, data_aquisicao || null, valor_compra || null,
          chassi || null, renavam || null, existentes[0].id
        ]
      );
      return res.status(201).json({
        mensagem: 'Veículo cadastrado com sucesso! (o histórico anterior desta placa foi restaurado)',
        id: existentes[0].id
      });
    }

    const [resultado] = await pool.query(
      `INSERT INTO veiculos 
        (usuario_id, marca, modelo, ano_fabricacao, ano_modelo, cor, placa, 
         quilometragem_atual, tipo_combustivel, data_aquisicao, valor_compra, 
         chassi, renavam, foto_url) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        req.usuarioId, marca, modelo, ano_fabricacao || null, ano_modelo || null,
        cor || null, placa, quilometragem_atual || 0, tipo_combustivel,
        data_aquisicao || null, valor_compra || null, chassi || null,
        renavam || null, foto_url || null
      ]
    );

    return res.status(201).json({
      mensagem: 'Veículo cadastrado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao cadastrar veículo.' });
  }
}

// ===== EDITAR VEÍCULO =====
async function editar(req, res) {
  try {
    const { id } = req.params;
    const {
      marca, modelo, ano_fabricacao, ano_modelo, cor, placa,
      quilometragem_atual, tipo_combustivel, data_aquisicao
    } = req.body;

    // Confirma que o veículo pertence ao usuário logado
    const [veiculos] = await pool.query(
      'SELECT * FROM veiculos WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    if (veiculos.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!marca || !modelo || !placa || !tipo_combustivel) {
      return res.status(400).json({ erro: 'Marca, modelo, placa e tipo de combustível são obrigatórios.' });
    }

    // Campos que não vieram na requisição mantêm o valor atual (a foto tem rota própria e nunca muda aqui)
    const atual = veiculos[0];
    const manter = (campo) => (req.body[campo] !== undefined ? req.body[campo] || null : atual[campo]);

    await pool.query(
      `UPDATE veiculos SET
        marca = ?, modelo = ?, ano_fabricacao = ?, ano_modelo = ?, cor = ?,
        placa = ?, quilometragem_atual = ?, tipo_combustivel = ?,
        data_aquisicao = ?, valor_compra = ?, chassi = ?, renavam = ?
       WHERE id = ? AND usuario_id = ?`,
      [
        marca, modelo, ano_fabricacao || null, ano_modelo || null, cor || null,
        placa, quilometragem_atual || 0, tipo_combustivel, data_aquisicao || null,
        manter('valor_compra'), manter('chassi'), manter('renavam'),
        id, req.usuarioId
      ]
    );

    return res.json({ mensagem: 'Veículo atualizado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar veículo.' });
  }
}

// ===== UPLOAD/ATUALIZAÇÃO DA FOTO DO VEÍCULO =====
async function atualizarFoto(req, res) {
  try {
    const { id } = req.params;

    const [veiculos] = await pool.query(
      'SELECT * FROM veiculos WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );

    if (veiculos.length === 0) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhuma imagem foi enviada.' });
    }

    // Remove a foto antiga do disco, se existir, pra não acumular arquivos órfãos
    const fotoAntiga = veiculos[0].foto_url;
    if (fotoAntiga) {
      const caminhoAntigo = path.join(__dirname, '..', 'uploads', 'veiculos', path.basename(fotoAntiga));
      if (fs.existsSync(caminhoAntigo)) {
        fs.unlinkSync(caminhoAntigo);
      }
    }

    const novaFotoUrl = `/uploads/veiculos/${req.file.filename}`;

    await pool.query(
      'UPDATE veiculos SET foto_url = ? WHERE id = ? AND usuario_id = ?',
      [novaFotoUrl, id, req.usuarioId]
    );

    return res.json({
      mensagem: 'Foto atualizada com sucesso!',
      foto_url: novaFotoUrl
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar foto.' });
  }
}

// ===== ATUALIZAR SOMENTE A QUILOMETRAGEM (uso rápido) =====
async function atualizarQuilometragem(req, res) {
  try {
    const { id } = req.params;
    const { quilometragem_atual } = req.body;

    if (quilometragem_atual === undefined) {
      return res.status(400).json({ erro: 'Quilometragem é obrigatória.' });
    }

    const [veiculos] = await pool.query(
      'SELECT quilometragem_atual FROM veiculos WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    if (veiculos.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (quilometragem_atual < veiculos[0].quilometragem_atual) {
      return res.status(400).json({ erro: 'A nova quilometragem não pode ser menor que a atual.' });
    }

    await pool.query(
      'UPDATE veiculos SET quilometragem_atual = ? WHERE id = ? AND usuario_id = ?',
      [quilometragem_atual, id, req.usuarioId]
    );

    return res.json({ mensagem: 'Quilometragem atualizada com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar quilometragem.' });
  }
}

// ===== EXCLUIR VEÍCULO (soft delete) =====
async function excluir(req, res) {
  try {
    const { id } = req.params;

    const [veiculos] = await pool.query(
      'SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    if (veiculos.length === 0) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    // Soft delete: apenas marca como inativo, preservando o histórico
    await pool.query(
      'UPDATE veiculos SET ativo = FALSE WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );

    return res.json({ mensagem: 'Veículo removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover veículo.' });
  }
}

module.exports = {
  listar,
  buscarPorId,
  cadastrar,
  editar,
  atualizarQuilometragem,
  atualizarFoto,
  excluir
};
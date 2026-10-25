const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0;
}

// ===== LISTAR DOCUMENTOS DE UM VEÍCULO =====
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [documentos] = await pool.query(
      'SELECT * FROM documentos WHERE veiculo_id = ? ORDER BY criado_em DESC',
      [veiculoId]
    );

    // Monta a URL completa de acesso a cada arquivo
    const comUrl = documentos.map(doc => ({
      ...doc,
      url: `/uploads/documentos/${path.basename(doc.caminho_arquivo)}`
    }));

    return res.json(comUrl);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar documentos.' });
  }
}

// ===== UPLOAD DE NOVO DOCUMENTO =====
async function cadastrar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { tipo_documento, data_vencimento, observacoes } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      // Remove o arquivo que já foi salvo pelo multer, já que a validação falhou
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!req.file) {
      return res.status(400).json({ erro: 'Nenhum arquivo foi enviado.' });
    }

    if (!tipo_documento) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ erro: 'Tipo de documento é obrigatório.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO documentos (veiculo_id, tipo_documento, nome_arquivo, caminho_arquivo, data_vencimento, observacoes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [veiculoId, tipo_documento, req.file.originalname, req.file.filename, data_vencimento || null, observacoes || null]
    );

    return res.status(201).json({
      mensagem: 'Documento enviado com sucesso!',
      id: resultado.insertId,
      url: `/uploads/documentos/${req.file.filename}`
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao enviar documento.' });
  }
}

// ===== EXCLUIR DOCUMENTO (remove do banco E do disco) =====
async function excluir(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [documentos] = await pool.query(
      'SELECT * FROM documentos WHERE id = ? AND veiculo_id = ?',
      [id, veiculoId]
    );
    if (documentos.length === 0) {
      return res.status(404).json({ erro: 'Documento não encontrado.' });
    }

    // Remove o arquivo físico do disco
    const caminhoCompleto = path.join(__dirname, '..', 'uploads', 'documentos', documentos[0].caminho_arquivo);
    if (fs.existsSync(caminhoCompleto)) {
      fs.unlinkSync(caminhoCompleto);
    }

    await pool.query('DELETE FROM documentos WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);

    // Documento removido não deixa alerta pendente para trás
    await pool.query(
      `DELETE FROM alertas WHERE origem_tipo = 'documento' AND origem_id = ? AND status = 'Pendente'`,
      [id]
    );

    return res.json({ mensagem: 'Documento removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover documento.' });
  }
}

module.exports = { listar, cadastrar, excluir };
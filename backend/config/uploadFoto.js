const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

// Garante que a pasta uploads/veiculos existe
const pastaDestino = path.join(__dirname, '..', 'uploads', 'veiculos');
if (!fs.existsSync(pastaDestino)) {
  fs.mkdirSync(pastaDestino, { recursive: true });
}

const storage = multer.diskStorage({
  // Pasta onde a foto enviada será salva
  destination: (req, file, cb) => {
    cb(null, pastaDestino);
  },
  // Nome aleatório para a foto (a pasta /uploads é pública), mantendo a extensão
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeUnico = `veiculo-${crypto.randomBytes(16).toString('hex')}${extensao.toLowerCase()}`;
    cb(null, nomeUnico);
  }
});

// Só aceita imagens JPG, PNG e WEBP
const filtroArquivo = (req, file, cb) => {
  const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Envie apenas JPG, PNG ou WEBP.'), false);
  }
};

const uploadFoto = multer({
  storage,
  fileFilter: filtroArquivo,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB máximo
});

module.exports = uploadFoto;
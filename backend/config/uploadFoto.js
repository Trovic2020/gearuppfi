const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const pastaDestino = path.join(__dirname, '..', 'uploads', 'veiculos');
if (!fs.existsSync(pastaDestino)) {
  fs.mkdirSync(pastaDestino, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaDestino);
  },
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname);
    const nomeUnico = `veiculo-${crypto.randomBytes(16).toString('hex')}${extensao.toLowerCase()}`;
    cb(null, nomeUnico);
  }
});

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
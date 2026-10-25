const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

// Garante que a pasta uploads/documentos existe
const pastaDestino = path.join(__dirname, '..', 'uploads', 'documentos');
if (!fs.existsSync(pastaDestino)) {
  fs.mkdirSync(pastaDestino, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, pastaDestino);
  },
  filename: (req, file, cb) => {
    // Nome aleatório e impossível de adivinhar: a pasta /uploads é pública, então o link do
    // arquivo é a única "senha" dele. O nome original fica salvo no banco (nome_arquivo).
    const extensao = path.extname(file.originalname).toLowerCase();
    const nomeUnico = `${crypto.randomBytes(16).toString('hex')}${extensao}`;
    cb(null, nomeUnico);
  }
});

// Só aceita PDF, JPG e PNG
const filtroArquivo = (req, file, cb) => {
  const tiposPermitidos = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (tiposPermitidos.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não permitido. Envie apenas PDF, JPG ou PNG.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter: filtroArquivo,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB máximo
});

module.exports = upload;
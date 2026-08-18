const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globais
const corsOptions = { origin: process.env.FRONTEND_URL || '*', optionsSuccessStatus: 200 }; app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'GearUp API rodando 🚗' });
});

// Servir arquivos de upload (documentos, fotos)
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));

// Rotas
app.use('/api/veiculos', require('./routes/vehicleRoutes'));
app.use('/api/oficinas', require('./routes/workshopRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
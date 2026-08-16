const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir arquivos de upload (documentos, fotos)
app.use('/uploads', express.static('uploads'));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'GearUp API rodando 🚗' });
});

// Servir arquivos de upload (documentos, fotos)
app.use('/uploads', express.static('uploads'));

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));

// Rota de teste
app.get('/api/health', (req, res) => {
  res.json({ status: 'GearUp API rodando 🚗' });
});

// Rotas
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/veiculos', require('./routes/vehicleRoutes'));
app.use('/api/oficinas', require('./routes/workshopRoutes'));

// TODO: as rotas dos próximos módulos serão registradas aqui
// app.use('/api/auth', require('./routes/authRoutes'));
// app.use('/api/vehicles', require('./routes/vehicleRoutes'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
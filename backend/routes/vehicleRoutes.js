const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadFoto = require('../config/uploadFoto');

// Todas as rotas de veículos exigem login
router.use(authMiddleware);

// Módulos encaixados dentro de um veículo (/api/veiculos/:veiculoId/...)
router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));
router.use('/:veiculoId/abastecimentos', require('./fuelRoutes'));
router.use('/:veiculoId/pneus', require('./tireRoutes'));
router.use('/:veiculoId/seguros', require('./insuranceRoutes'));
router.use('/:veiculoId/documentos', require('./documentRoutes'));
router.use('/:veiculoId/gastos', require('./expenseRoutes'));
router.use('/:veiculoId/alertas', require('./alertRoutes'));
router.use('/:veiculoId/dashboard', require('./dashboardRoutes'));
router.use('/:veiculoId/saude', require('./healthRoutes'));
router.use('/:veiculoId/relatorios', require('./reportRoutes'));

// GET /api/veiculos — lista os veículos ativos do usuário
router.get('/', vehicleController.listar);
// POST /api/veiculos — cadastra um veículo (ou reativa um excluído com a mesma placa)
router.post('/', vehicleController.cadastrar);
// PUT /api/veiculos/:id — edita os dados do veículo
router.put('/:id', vehicleController.editar);
// POST /api/veiculos/:id/foto — envia ou troca a foto do veículo (campo "foto")
router.post('/:id/foto', uploadFoto.single('foto'), vehicleController.atualizarFoto);
// DELETE /api/veiculos/:id — tira o veículo da lista (soft delete, o histórico é preservado)
router.delete('/:id', vehicleController.excluir);

module.exports = router;

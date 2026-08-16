const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const authMiddleware = require('../middlewares/authMiddleware');
const uploadFoto = require('../config/uploadFoto');

// Todas as rotas de veículos exigem login
router.use(authMiddleware);

router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));
router.use('/:veiculoId/abastecimentos', require('./fuelRoutes'));

router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));
router.use('/:veiculoId/abastecimentos', require('./fuelRoutes'));
router.use('/:veiculoId/pneus', require('./tireRoutes'));

router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));
router.use('/:veiculoId/abastecimentos', require('./fuelRoutes'));
router.use('/:veiculoId/pneus', require('./tireRoutes'));
router.use('/:veiculoId/seguros', require('./insuranceRoutes'));

router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));
router.use('/:veiculoId/abastecimentos', require('./fuelRoutes'));
router.use('/:veiculoId/pneus', require('./tireRoutes'));
router.use('/:veiculoId/seguros', require('./insuranceRoutes'));
router.use('/:veiculoId/documentos', require('./documentRoutes'));

router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));
router.use('/:veiculoId/abastecimentos', require('./fuelRoutes'));
router.use('/:veiculoId/pneus', require('./tireRoutes'));
router.use('/:veiculoId/seguros', require('./insuranceRoutes'));
router.use('/:veiculoId/documentos', require('./documentRoutes'));
router.use('/:veiculoId/gastos', require('./expenseRoutes'));

router.use('/:veiculoId/gastos', require('./expenseRoutes'));
router.use('/:veiculoId/alertas', require('./alertRoutes'));

router.use('/:veiculoId/alertas', require('./alertRoutes'));
router.use('/:veiculoId/dashboard', require('./dashboardRoutes'));

router.use('/:veiculoId/dashboard', require('./dashboardRoutes'));
router.use('/:veiculoId/saude', require('./healthRoutes'));

router.use('/:veiculoId/saude', require('./healthRoutes'));
router.use('/:veiculoId/relatorios', require('./reportRoutes'));

router.get('/', vehicleController.listar);
router.get('/:id', vehicleController.buscarPorId);
router.post('/', vehicleController.cadastrar);
router.put('/:id', vehicleController.editar);
router.patch('/:id/quilometragem', vehicleController.atualizarQuilometragem);
router.post('/:id/foto', uploadFoto.single('foto'), vehicleController.atualizarFoto); // 👈 nova rota
router.delete('/:id', vehicleController.excluir);



// Encaixa as rotas de manutenções dentro de veículo
router.use('/:veiculoId/manutencoes', require('./maintenanceRoutes'));

module.exports = router;
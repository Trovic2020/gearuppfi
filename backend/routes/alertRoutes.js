const express = require('express');
const router = express.Router({ mergeParams: true });
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', alertController.listar);
router.patch('/:id/status', alertController.atualizarStatus);

module.exports = router;
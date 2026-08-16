const express = require('express');
const router = express.Router({ mergeParams: true });
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', dashboardController.resumo);

module.exports = router;
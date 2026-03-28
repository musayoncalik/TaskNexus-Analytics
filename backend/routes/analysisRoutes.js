const express = require('express');
const router = express.Router();
const analysisController = require('../controllers/analysisController');
const authMiddleware = require('../middleware/authMiddleware');

// Sadece giriş yapmış (token'ı olan) kullanıcılar analizlerini görebilir
router.get('/dashboard', authMiddleware, analysisController.getDashboardStats);

module.exports = router;

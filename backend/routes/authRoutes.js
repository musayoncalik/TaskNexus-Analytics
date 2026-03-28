const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

// POST /api/auth/register
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

// GET & PUT /api/auth/profile (Mevcut Profil İşlemleri)
router.get('/profile', authMiddleware, authController.getProfile);
router.put('/profile', authMiddleware, authController.updateProfile);

// YENİ EKLENEN ROTALAR: Şifre Değiştirme ve Hesap Silme
router.put('/password', authMiddleware, authController.updatePassword);
router.delete('/profile', authMiddleware, authController.deleteAccount);

module.exports = router;

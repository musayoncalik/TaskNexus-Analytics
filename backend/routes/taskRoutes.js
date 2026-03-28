const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

// DİKKAT: Bu rotaların tamamı için authMiddleware çalışacak!
// Yani Token'ı olmayan kimse buralara istek atamaz.
router.use(authMiddleware);

// CRUD Endpoint'leri
router.post('/', taskController.createTask);       // Görev Ekle
router.get('/', taskController.getTasks);          // Görevleri Listele
router.put('/:id', taskController.updateTask);     // Görev Güncelle
router.delete('/:id', taskController.deleteTask);  // Görev Sil

module.exports = router;

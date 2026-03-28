const Task = require('../models/Task');
const redisClient = require('../config/redis');

// YARDIMCI FONKSİYON: Görevlerde değişiklik olduğunda Redis Cache'i temizler (Madde 4.5 Performans)
const clearUserCache = async (userId) => {
  try {
    await redisClient.del(`dashboard_stats_${userId}`);
  } catch (err) {
    console.error('Redis Cache temizleme hatası:', err);
  }
};

// 1. Yeni Görev Oluşturma
exports.createTask = async (req, res) => {
  try {
    // BURAYA status EKLENDİ
    const { title, description, priority, status, due_date } = req.body; 
    
    const newTask = await Task.create({
      title,
      description,
      priority,
      status, // BURAYA EKLENDİ
      due_date,
      user_id: req.user.userId
    });
    
    await clearUserCache(req.user.userId);
    res.status(201).json({ mesaj: 'Görev başarıyla oluşturuldu', task: newTask });
  } catch (error) {
    console.error('Görev Oluşturma Hatası:', error);
    res.status(500).json({ mesaj: 'Görev oluşturulurken sunucu hatası.' });
  }
};

// 2. Kullanıcının Tüm Görevlerini Listeleme (YENİ: Sayfalama/Pagination Eklendi)
exports.getTasks = async (req, res) => {
  try {
    // URL'den sayfa ve limit değerlerini alıyoruz (Örn: /api/tasks?page=1&limit=10)
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    const { count, rows } = await Task.findAndCountAll({ 
      where: { user_id: req.user.userId },
      limit: limit,
      offset: offset,
      order: [['createdAt', 'DESC']] // En yeni görevler en üstte gelsin
    });

    res.status(200).json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      tasks: rows
    });
  } catch (error) {
    res.status(500).json({ mesaj: 'Görevler getirilirken hata oluştu.' });
  }
};

// 3. Görev Güncelleme
exports.updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority, status, due_date } = req.body;

    const task = await Task.findOne({ where: { id, user_id: req.user.userId } });
    if (!task) {
      return res.status(404).json({ mesaj: 'Görev bulunamadı veya yetkiniz yok.' });
    }

    // Analiz için görev tamamlanma tarihini ayarlama (Madde 3.3)
    let completed_at = task.completed_at;
    if (status === 'Tamamlandı' && task.status !== 'Tamamlandı') {
      completed_at = new Date();
    } else if (status !== 'Tamamlandı') {
      completed_at = null; 
    }

    await task.update({ title, description, priority, status, due_date, completed_at });
    
    // YENİ: Görev güncellendiği için eski analiz verisini siliyoruz
    await clearUserCache(req.user.userId);

    res.status(200).json({ mesaj: 'Görev güncellendi', task });
  } catch (error) {
    res.status(500).json({ mesaj: 'Görev güncellenirken hata oluştu.' });
  }
};

// 4. Görev Silme
exports.deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCount = await Task.destroy({ where: { id, user_id: req.user.userId } });
    
    if (deletedCount === 0) {
      return res.status(404).json({ mesaj: 'Görev bulunamadı veya silmeye yetkiniz yok.' });
    }
    
    // YENİ: Görev silindiği için eski analiz verisini siliyoruz
    await clearUserCache(req.user.userId);
    
    res.status(200).json({ mesaj: 'Görev başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ mesaj: 'Görev silinirken hata oluştu.' });
  }
};

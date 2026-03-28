const Task = require('../models/Task');
const redisClient = require('../config/redis');
const { Op } = require('sequelize'); // YENİ: Veritabanı filtrelemeleri için Sequelize operatörleri

exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.userId;
    const cacheKey = `dashboard_stats_${userId}`;

    // 1. ÖNCE REDIS'E BAK (Veri bellekte var mı?)
    const cachedData = await redisClient.get(cacheKey);
    if (cachedData) {
      console.log(`⚡ Kullanıcı ${userId} verileri Redis Cache'den (Saliseler içinde) getirildi!`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    console.log(`🐌 Kullanıcı ${userId} verileri veritabanından hesaplanıyor...`);

    // 2. VERİTABANI SEVİYESİNDE HESAPLAMALAR (Ölçeklenebilirlik için Node.js yerine DB'yi yoruyoruz)
    const totalTasks = await Task.count({ where: { user_id: userId } });

    if (totalTasks === 0) {
      return res.status(200).json({ mesaj: "Henüz analiz edilecek görev yok.", stats: null });
    }

    const completedCount = await Task.count({ where: { user_id: userId, status: 'Tamamlandı' } });
    const pendingCount = totalTasks - completedCount;

    // Sadece gecikenleri veritabanından say (JavaScript'e çekmeden)
    const now = new Date();
    const overdueCount = await Task.count({
      where: {
        user_id: userId,
        status: { [Op.ne]: 'Tamamlandı' }, // Durumu Tamamlandı OLMAYANLAR
        due_date: { [Op.lt]: now }         // Teslim tarihi bugünden KÜÇÜK olanlar
      }
    });

    const overdueRatio = ((overdueCount / totalTasks) * 100).toFixed(1);

    // En verimli saat hesaplaması: Sadece tamamlanan görevlerin 'completed_at' bilgisini çekiyoruz (Tüm satırı çekmekten kurtulduk)
    const completedTasks = await Task.findAll({
      attributes: ['completed_at'],
      where: { 
        user_id: userId, 
        status: 'Tamamlandı', 
        completed_at: { [Op.not]: null } 
      },
      raw: true
    });

    let productiveHour = "Veri yetersiz";
    if (completedTasks.length > 0) {
      const hourCounts = {};
      completedTasks.forEach(t => {
        if (t.completed_at) {
          const hour = new Date(t.completed_at).getHours();
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        }
      });
      if (Object.keys(hourCounts).length > 0) {
        const bestHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b);
        productiveHour = `${bestHour}:00 - ${parseInt(bestHour) + 1}:00 arası`;
      }
    }

    // Case 3.3: Öneriler Sunulması
    let recommendations = [];
    if (overdueRatio > 30) recommendations.push("⚠️ Geciken görev oranınız yüksek. Görevlerinizi küçük parçalara bölün.");
    else if (overdueRatio == 0) recommendations.push("🌟 Harika gidiyorsunuz! Geciken göreviniz yok.");
    
    if (productiveHour !== "Veri yetersiz") {
      recommendations.push(`💡 En verimli saatleriniz ${productiveHour}. Zorlu görevleri bu aralığa planlayın.`);
    }

    const responseData = {
      stats: {
        totalTasks, 
        completedCount, 
        pendingCount,
        overdueCount, 
        overdueRatio: `%${overdueRatio}`, 
        productiveTime: productiveHour
      },
      recommendations
    };

    // 3. HESAPLANAN VERİYİ REDIS'E KAYDET (1 saat = 3600 saniye boyunca bellekte tut)
    await redisClient.setEx(cacheKey, 3600, JSON.stringify(responseData));

    res.status(200).json(responseData);

  } catch (error) {
    console.error('Analiz Hatası:', error);
    res.status(500).json({ mesaj: 'Analiz oluşturulurken hata.' });
  }
};

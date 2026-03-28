const sequelize = require('./config/db');
const User = require('./models/User');
const Task = require('./models/Task');
const bcrypt = require('bcrypt');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    // Veritabanı bağlantısını bekle
    await sequelize.authenticate();
    console.log('⏳ Veritabanına bağlanıldı, veriler ekleniyor...');

    // Tabloları temizle ve yeniden oluştur (Sıfırdan test ortamı)
    await sequelize.sync({ force: true });

    // 1. Test Kullanıcısı Oluştur
    const hashedPassword = await bcrypt.hash('123456', 10);
    const testUser = await User.create({
      name: 'Test Kullanıcısı',
      email: 'test@example.com',
      password_hash: hashedPassword
    });
    console.log('✅ Test kullanıcısı oluşturuldu. (Email: test@example.com, Şifre: 123456)');

    // 2. Test Görevleri Oluştur
    const now = new Date();
    
    // Geçmiş bir tarih (Dün)
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    // Gelecek bir tarih (Yarın)
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    await Task.bulkCreate([
      {
        title: 'React Projesi Başlangıç',
        description: 'Proje iskeletini kur',
        priority: 'Yüksek',
        status: 'Tamamlandı',
        due_date: yesterday,
        completed_at: new Date(now.setHours(10, 30)), // Sabah 10:30'da bitirmiş (Verimli saat analizi için)
        user_id: testUser.id
      },
      {
        title: 'Veritabanı Şeması Çizimi',
        description: 'PostgreSQL tablolarını ayarla',
        priority: 'Orta',
        status: 'Tamamlandı',
        due_date: tomorrow,
        completed_at: new Date(now.setHours(11, 15)), // Sabah 11:15'te bitirmiş
        user_id: testUser.id
      },
      {
        title: 'Analiz API Yazımı', // Bu görev GECİKMİŞ olacak!
        description: 'Geciken görevleri hesapla',
        priority: 'Yüksek',
        status: 'Yapılacak',
        due_date: yesterday, // Teslim tarihi dün ama hala "Yapılacak"
        user_id: testUser.id
      },
      {
        title: 'Frontend Dashboard Tasarımı',
        description: 'Grafikleri entegre et',
        priority: 'Düşük',
        status: 'Devam Ediyor',
        due_date: tomorrow,
        user_id: testUser.id
      }
    ]);

    console.log('✅ 4 adet test görevi (Tamamlanmış, Gecikmiş ve Bekleyen) eklendi.');
    console.log('🎉 Tohumlama (Seeding) işlemi başarıyla bitti!');
    process.exit(0); // İşlem bitince çıkış yap

  } catch (error) {
    console.error('❌ Hata oluştu:', error);
    process.exit(1);
  }
};

seedDatabase();

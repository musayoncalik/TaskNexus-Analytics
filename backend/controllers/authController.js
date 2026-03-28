const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Kullanıcı Kayıt İşlemi (Register)
exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Email zaten var mı kontrol et
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ mesaj: 'Bu email adresi zaten kullanılıyor.' });
    }

    // Şifreyi şifrele (Hash)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // Kullanıcıyı veritabanına kaydet
    const newUser = await User.create({
      name,
      email,
      password_hash
    });

    res.status(201).json({ mesaj: 'Kullanıcı başarıyla oluşturuldu!', userId: newUser.id });
  } catch (error) {
    console.error('Kayıt Hatası:', error);
    res.status(500).json({ mesaj: 'Sunucu hatası oluştu.' });
  }
};

// Kullanıcı Giriş İşlemi (Login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Kullanıcıyı bul
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ mesaj: 'Kullanıcı bulunamadı.' });
    }

    // Şifreyi doğrula
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ mesaj: 'Geçersiz şifre.' });
    }

    // JWT Token oluştur (Token 1 gün geçerli olacak)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.status(200).json({ mesaj: 'Giriş başarılı!', token });
  } catch (error) {
    console.error('Giriş Hatası:', error);
    res.status(500).json({ mesaj: 'Sunucu hatası oluştu.' });
  }
};
// Profil Bilgisi Görüntüleme
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.userId, {
      attributes: ['id', 'name', 'email', 'createdAt'] // Şifreyi göndermiyoruz!
    });
    if (!user) return res.status(404).json({ mesaj: 'Kullanıcı bulunamadı.' });
    
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ mesaj: 'Profil getirilirken hata oluştu.' });
  }
};

// Profil Bilgisi Güncelleme
exports.updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await User.findByPk(req.user.userId);
    
    if (!user) return res.status(404).json({ mesaj: 'Kullanıcı bulunamadı.' });

    // Güncelleme işlemi
    user.name = name || user.name;
    user.email = email || user.email;
    await user.save();

    res.status(200).json({ mesaj: 'Profil başarıyla güncellendi.', user: { id: user.id, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).json({ mesaj: 'Profil güncellenirken hata oluştu.' });
  }
};
// Şifre Güncelleme İşlemi (Profil sayfasındaki güvenlik bölümü için)
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findByPk(req.user.userId);
    
    if (!user) return res.status(404).json({ mesaj: 'Kullanıcı bulunamadı.' });

    // Eski şifre doğru mu kontrol et
    const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ mesaj: 'Mevcut şifreniz yanlış.' });
    }

    // Yeni şifreyi hash'le ve kaydet
    const saltRounds = 10;
    user.password_hash = await bcrypt.hash(newPassword, saltRounds);
    await user.save();

    res.status(200).json({ mesaj: 'Şifreniz başarıyla güncellendi.' });
  } catch (error) {
    console.error('Şifre Güncelleme Hatası:', error);
    res.status(500).json({ mesaj: 'Şifre güncellenirken hata oluştu.' });
  }
};

// Kullanıcı Hesabını Kalıcı Olarak Silme (Madde 3.1 ve KVKK Uyumluluğu)
exports.deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;

    // 1. Önce Redis'teki önbelleğini (cache) temizle (hata verirse yoksay)
    try {
      const redisClient = require('../config/redis');
      await redisClient.del(`dashboard_stats_${userId}`);
    } catch (redisErr) {
      console.error('Redis silme hatası (Önemli değil):', redisErr);
    }

    // 2. Veritabanından Kullanıcıyı ve Görevlerini Sil
    const Task = require('../models/Task');
    
    // Güvenlik: Önce kullanıcının tüm görevlerini silelim (Veritabanında çöp veri kalmasın)
    await Task.destroy({ where: { user_id: userId } });
    
    // Sonra kullanıcının kendisini silelim
    const deletedCount = await User.destroy({ where: { id: userId } });

    if (deletedCount === 0) {
      return res.status(404).json({ mesaj: 'Kullanıcı bulunamadı.' });
    }

    res.status(200).json({ mesaj: 'Hesap ve tüm veriler başarıyla silindi.' });
  } catch (error) {
    console.error('Hesap Silme Hatası:', error);
    res.status(500).json({ mesaj: 'Hesap silinirken sunucu hatası oluştu.' });
  }
};

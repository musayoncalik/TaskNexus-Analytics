const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Frontend'den gelen isteğin başlığında (header) token var mı bakıyoruz
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ mesaj: 'Erişim reddedildi. Token bulunamadı.' });
  }

  try {
    // Bearer kelimesini ayırıp sadece token'ı alıyoruz
    const tokenBody = token.split(' ')[1];
    
    // Token'ı gizli anahtarımızla çözüyoruz
    const decoded = jwt.verify(tokenBody, process.env.JWT_SECRET);
    
    // Çözülen kullanıcı bilgilerini (userId) req nesnesine ekliyoruz ki controller'da kullanalım
    req.user = decoded;
    next(); // İşleme devam etmesine izin ver
  } catch (error) {
    res.status(400).json({ mesaj: 'Geçersiz token.' });
  }
};

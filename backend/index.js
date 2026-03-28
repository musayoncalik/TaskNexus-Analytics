const express = require('express');
const http = require('http'); // YENİ: Socket.io için gerekli
const { Server } = require('socket.io'); // YENİ: Socket.io eklendi
const cors = require('cors');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const logger = require('./utils/logger');
const sequelize = require('./config/db');
const User = require('./models/User');
const Task = require('./models/Task');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const taskRoutes = require('./routes/taskRoutes');
const analysisRoutes = require('./routes/analysisRoutes');

const app = express();
const server = http.createServer(app); // YENİ: Express'i HTTP server'a bağladık
const PORT = process.env.PORT || 5000;

// ==========================================
// 🔌 SOCKET.IO (GERÇEK ZAMANLI LOG AKIŞI)
// ==========================================
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST", "PUT", "DELETE"] }
});

// Socket nesnesini global yapalım ki her yerden erişebilelim
global.io = io;

io.on('connection', (socket) => {
  logger.info(`NOC Ekranı Bağlandı: ${socket.id}`);
});

// ==========================================
// 🛡️ GÜVENLİK: RATE LIMITER
// ==========================================
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: { mesaj: 'Sistem güvenliği: Çok fazla istek yapıldı, lütfen 15 dakika sonra tekrar deneyin.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/api', apiLimiter);

// ==========================================
// 📝 LOGLAMA: WINSTON + SOCKET.IO YAYINI
// ==========================================
app.use((req, res, next) => {
  if(req.url.startsWith('/api')) {
    const msg = `İstek: ${req.method} ${req.url}`;
    logger.info(msg); // Dosyaya yaz
    // NOC Ekranına fırlat
    if(global.io) {
      global.io.emit('system_log', { id: Date.now(), time: new Date().toLocaleTimeString('tr-TR'), msg, type: 'info' });
    }
  }
  next();
});

// API Yönlendirmeleri
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/analysis', analysisRoutes);

sequelize.sync({ alter: true })
  .then(() => {
    const msg = 'Veritabanı tabloları senkronize edildi.';
    logger.info(msg);
    if(global.io) global.io.emit('system_log', { id: Date.now(), time: new Date().toLocaleTimeString('tr-TR'), msg, type: 'success' });
  })
  .catch(err => logger.error(`❌ Tablo oluşturma hatası: ${err.message}`));

// ==========================================
// 🚨 GLOBAL HATA YÖNETİMİ
// ==========================================
app.use((err, req, res, next) => {
  const msg = `SİSTEM HATASI: ${err.message}`;
  logger.error(`${msg} - URL: ${req.url} - Stack: ${err.stack}`);
  if(global.io) {
    global.io.emit('system_log', { id: Date.now(), time: new Date().toLocaleTimeString('tr-TR'), msg, type: 'warning' }); // Kırmızı uyarı
  }
  res.status(500).json({ mesaj: 'Sunucu tarafında beklenmeyen bir hata oluştu.' });
});

// YENİ: app.listen yerine server.listen kullanıyoruz!
server.listen(PORT, () => {
  logger.info(`🚀 Sunucu http://localhost:${PORT} adresinde çalışıyor`);
});

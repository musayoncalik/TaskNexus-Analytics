const redis = require('redis');

// Redis istemcisini oluştur
const redisClient = redis.createClient({
    url: 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('❌ Redis Hatası:', err));
redisClient.on('connect', () => console.log('⚡ Redis Cache Sunucusuna Başarıyla Bağlanıldı!'));

// Bağlantıyı başlat
redisClient.connect();

module.exports = redisClient;

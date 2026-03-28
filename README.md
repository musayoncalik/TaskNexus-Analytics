# 🚀 TaskNexus - Yeni Nesil Görev ve Analiz Platformu

TaskNexus, kullanıcıların sadece görevlerini listelediği bir araç değil; yapay zeka destekli asistanı, anlık performans metrikleri ve ölçeklenebilir altyapısı ile iş akışlarını optimize eden "Senior" seviye bir SaaS platformudur.

Bu proje, **Ölçeklenebilir Görev ve Analiz Platformu Tasarımı (Case Study)** gereksinimlerini %100 oranında karşılayacak şekilde, yüksek performans ve güvenlik standartları gözetilerek geliştirilmiştir.

## ✨ Öne Çıkan Özellikler (Case Karşılıkları)

* **Kullanıcı ve Görev Yönetimi:** JWT güvenliği ile kimlik doğrulama, gelişmiş CRUD operasyonları, öncelik ve deadline takibi.
* **Analiz ve Yapay Zeka Asistanı:** Kullanıcı alışkanlıklarını analiz ederek geciken görev oranlarını, "En Verimli Zaman" aralıklarını hesaplayan ve eylem planı sunan AI motoru.
* **Kurumsal Backend Mimarisi:** API Rate Limiting (DDoS Koruması), Winston Logger (Sistem Denetimi) ve Global Error Handler.
* **Performans Odaklı Veri Katmanı:** PostgreSQL Index optimizasyonları ve Redis Caching entegrasyonu.
* **Cyberpunk & Glassmorphism UI:** Framer Motion destekli, akıcı, hataya karşı korumalı (Error Boundary) fütüristik kullanıcı arayüzü.

---

## 📂 Proje Klasör Yapısı (Architecture)

Proje, Sorumlulukların Ayrılması (Separation of Concerns) prensibine uygun olarak Frontend ve Backend olmak üzere tam bağımsız (decoupled) iki ana modüle ayrılmıştır.

\`\`\`text
.
├── backend                 # Express.js RESTful API
│   ├── config              # Veritabanı ve Redis bağlantı ayarları
│   │   ├── db.js
│   │   └── redis.js
│   ├── controllers         # İş mantığının (Business Logic) işlendiği katman
│   │   ├── analysisController.js
│   │   ├── authController.js
│   │   └── taskController.js
│   ├── index.js            # Ana sunucu ve middleware giriş noktası
│   ├── middleware          # JWT ve hata yakalama (Error Handler) katmanı
│   │   └── authMiddleware.js
│   ├── models              # PostgreSQL tablo şemaları (Sequelize ORM)
│   │   ├── Task.js
│   │   └── User.js
│   ├── package.json        # Backend bağımlılıkları
│   ├── routes              # API Endpoint yönlendirmeleri
│   │   ├── analysisRoutes.js
│   │   ├── authRoutes.js
│   │   └── taskRoutes.js
│   └── utils               # Global araçlar (Winston Logger)
│       └── logger.js
│
└── frontend                # React + Vite SPA (Single Page Application)
    ├── package.json        # Frontend bağımlılıkları
    └── src
        ├── api.js          # Axios interceptor ve base API konfigürasyonu
        ├── App.jsx         # React Router v6 ve Private Routes yapısı
        ├── components      # Tekrar kullanılabilir (Reusable) UI bileşenleri
        │   ├── ErrorBoundary.jsx # Global UI hata kalkanı
        │   └── Layout.jsx  # Sidebar ve sayfa iskeleti
        └── pages           # Ana uygulama sayfaları
            ├── Dashboard.jsx # Veri analizleri ve AI asistan ekranı
            ├── Login.jsx     # Kimlik doğrulama ekranı
            ├── NotFound.jsx  # 404 Hata sayfası
            ├── Profile.jsx   # Kullanıcı yönetim ekranı
            ├── System.jsx    # Canlı log akışı ve sistem donanım sağlığı (NOC)
            └── Tasks.jsx     # Görev CRUD operasyonları
\`\`\`

---

## ⚡ Hızlı Kurulum ve Çalıştırma

Projeyi yerel ortamınızda sorunsuz bir şekilde ayağa kaldırmak için aşağıdaki adımları izleyin.
*(Gereksinimler: Node.js, PostgreSQL ve Redis bilgisayarınızda kurulu olmalıdır).*

> **🐳 DevOps / Docker ile Hızlı Kurulum (Önerilen)**
> Eğer bilgisayarınızda PostgreSQL ve Redis kurulu değilse, altyapıyı tek komutla ayağa kaldırmak için proje ana dizininde şu komutu çalıştırmanız yeterlidir:
> ```bash
> docker-compose up -d
> ```
> *(Bu komut veritabanı ve önbellek sunucularını izole konteynerlerde saniyeler içinde hazır hale getirir. Ardından sadece `npm run dev` ile sunucuları başlatabilirsiniz).*

### 1. Tüm Bağımlılıkları Tek Seferde Kurun
Proje ana dizinindeyken terminalinize şu komutu yapıştırarak hem frontend hem de backend kütüphanelerini tek hamlede indirebilirsiniz:
\`\`\`bash
cd backend && npm install && cd ../frontend && npm install && cd ..
\`\`\`

### 2. Çevre Değişkenlerini (Environment Variables) Ayarlayın
`backend` klasörü içinde `.env` adında bir dosya oluşturun ve veritabanı bilgilerinizi girin:
\`\`\`env
PORT=5000
DB_HOST=localhost
DB_USER=postgres
DB_PASS=sifreniz
DB_NAME=tasknexus_db
JWT_SECRET=cok_gizli_anahtar_kelimeniz
REDIS_URL=redis://localhost:6379
\`\`\`

### 3. Sistemi Ayağa Kaldırın
Sistemi başlatmak için iki ayrı terminal kullanacağız.

**Terminal 1 (Backend):**
\`\`\`bash
cd backend
npm run dev
\`\`\`
*(Terminalde Winston loglarının aktığını ve veritabanı senkronizasyonunun başarılı olduğunu göreceksiniz).*

**Terminal 2 (Frontend):**
\`\`\`bash
cd frontend
npm run dev
\`\`\`

🌐 Artık tarayıcınızdan **`http://localhost:5173`** adresine giderek TaskNexus platformunu kullanmaya başlayabilirsiniz!

## 🗄️ Veritabanı Modeli ve İlişkiler (Madde 4.3)

Sistemde PostgreSQL kullanılmış olup, `User` ve `Task` arasında **Bire-Çok (1:N)** ilişki kurulmuştur. (`User.hasMany(Task)`)

* **User Table:** `id` (PK), `name`, `email` (Unique), `password`.
* **Task Table:** `id` (PK), `title`, `description`, `status` (Bekliyor, Tamamlandı vb.), `priority` (Yüksek, Orta, Düşük), `due_date`, `user_id` (FK, Indexed).
* *Optimizasyon:* Dashboard sorgularını hızlandırmak için `user_id` ve `status` üzerinde **Index** kullanılmıştır.

## 🔌 API Endpoint'leri (Madde 4.4)

RESTful standartlarına uygun olarak tasarlanan temel uç noktalar:

* `POST /api/auth/register` : Yeni kullanıcı kaydı.
* `POST /api/auth/login` : Kullanıcı girişi ve JWT üretimi.
* `GET /api/auth/profile` : Kullanıcı bilgilerini getirir.
* `GET /api/tasks` : Kullanıcıya ait görevleri listeler (Pagination destekli).
* `POST /api/tasks` : Yeni görev oluşturur.
* `PUT /api/tasks/:id` : Görev durumunu/detaylarını günceller.
* `DELETE /api/tasks/:id` : Görevi siler.
* `GET /api/analysis/dashboard` : Redis destekli analitik verileri döndürür.

---
📝 *Teknik kararların detaylı analizi, teknoloji seçim gerekçeleri, karşılaşılan zorluklar ve ölçeklenebilirlik mimarisi için lütfen **`PROJE_RAPORU.md`** dosyasını inceleyiniz.*

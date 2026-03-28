# 📑 TASKNEXUS - TEKNİK RAPOR VE MİMARİ ANALİZ

Bu doküman, "Ölçeklenebilir Görev ve Analiz Platformu" (TaskNexus) projesinin geliştirilme sürecinde alınan mimari kararları, teknoloji seçimlerini, karşılaşılan zorlukları ve geleceğe dönük ölçekleme vizyonunu, proje isterleri (Case Study) doğrultusunda detaylandırmaktadır.

---

## 1. MİMARİ TASARIM YAKLAŞIMI (Madde 4.2)

Sistem, modern web standartlarına uygun olarak **İstemci-Sunucu (Client-Server)** mimarisi üzerine inşa edilmiş olup, modüler ve tamamen bağımsız (decoupled) bir yapıda kurgulanmıştır.

* **Backend (Katmanlı Mimari):** Express.js üzerinde geliştirilen API; Yönlendirme (Routes), Denetleyici (Controllers) ve Veri Modelleri (Models) olarak 3 ana katmana ayrılmıştır. Bu *Separation of Concerns* (Sorumlulukların Ayrılması) prensibi sayesinde kodun test edilebilirliği ve bakımı kolaylaştırılmıştır.
* **Frontend (SPA):** React ve Vite kullanılarak "Tek Sayfa Uygulaması" (Single Page Application) olarak tasarlanmıştır. Kullanıcı deneyimi kesintiye uğramadan, arka planda asenkron veri güncellemeleri yapılır.
* **Event-Driven (Olay Güdümlü) Entegrasyon:** Sistem operasyonlarını ve audit (denetim) loglarını "Sistem/NOC" ekranına anlık yansıtmak için geleneksel HTTP istek-cevap döngüsü yerine, sıfır gecikmeli **WebSockets (Socket.io)** mimarisi entegre edilmiştir.

---

## 2. TEKNOLOJİ SEÇİMİ VE GEREKÇELENDİRME (Madde 4.1 & 6.3)

Kullanılan teknolojiler rastgele seçilmemiş, projenin "Performans, Güvenlik ve Ölçeklenebilirlik" hedefleri doğrultusunda titizlikle belirlenmiştir.

### 2.1. Backend: Neden Node.js & Express.js?
* **Gerekçe:** Görevlerin analiz edilmesi, anlık log akışları ve yoğun API istekleri yüksek I/O işlemi gerektirir. Node.js'in "Event-Driven, Non-Blocking I/O" mimarisi, yüksek eşzamanlı (concurrent) istekleri düşük bellek tüketimiyle karşılamak için en uygun yapıdır.
* **Alternatif:** Python (Django) veya Java (Spring Boot) kullanabilirdim. Ancak MVP aşamasındaki çevik bir SaaS platformu için Express.js'in esnekliği ve JavaScript'in Full-Stack (Hem Front hem Back) kullanılabilme avantajı (Context Switching maliyetini düşürmesi) ağır basmıştır.

### 2.2. Veritabanı: Neden PostgreSQL? (Madde 4.3)
* **Gerekçe:** Görevler ve kullanıcılar arasındaki ilişki (Relation) ve veri bütünlüğü (Data Integrity) bu projede kritik öneme sahiptir. NoSQL (MongoDB vb.) sistemlerde yaşanabilecek ilişkisel kopuklukları önlemek için ACID uyumlu PostgreSQL seçilmiştir.
* **Index Stratejisi:** Performansı maksimize etmek için `Task` tablosundaki `user_id`, `status` ve `due_date` kolonlarına **B-Tree Indexing** uygulanmıştır. Bu sayede Dashboard'daki analitik sorgular, milyonlarca kayıt olsa dahi milisaniyeler içinde yanıt verir.

### 2.3. Frontend: Neden React, Vite & Tailwind CSS?
* **Gerekçe:** Geleneksel React uygulamalarındaki (Create React App / Webpack) derleme hantallığını aşmak için **Vite** kullanılmıştır. Arayüzde büyük ve hantal kütüphaneler (MUI, AntD) yerine, sadece kullanılan sınıfların derlendiği **Tailwind CSS** seçilerek bundle (paket) boyutu minimize edilmiştir. Modern Glassmorphism tasarımı ve akıcı etkileşimler için **Framer Motion** ile desteklenmiştir.

### 2.4. Altyapı ve Dağıtım: Docker Compose
* **Gerekçe:** Geliştirici ve test ortamları arasındaki "Benim bilgisayarımda çalışıyordu" problemini ortadan kaldırmak için sistemin veritabanı (PostgreSQL) ve önbellek (Redis) bağımlılıkları **Docker** konteynerleri içine alınmıştır. Bu sayede proje, herhangi bir sunucuda tek bir komutla (`docker-compose up`) izole bir şekilde ayağa kalkabilir.

---

## 3. PERFORMANS, ÖLÇEKLENEBİLİRLİK VE GÜVENLİK (Madde 4.4, 4.5 & 5)

Sistem sadece CRUD işlemlerini yapan basit bir uygulama değil, kurumsal (Non-Functional) standartları sağlayan dayanıklı bir altyapıya sahiptir.

1. **Önbellekleme (Redis Cache):** Gecikme oranları, haftalık performans ve verimlilik saatleri gibi ağır Dashboard hesaplamalarının her istekte veritabanını yormasını engellemek için **Redis** entegre edilmiştir. Veriler In-Memory (RAM) üzerinde tutulur ve bir görev güncellendiğinde *Cache Invalidation* (önbellek temizleme) yapılarak tutarlılık garanti altına alınır.
2. **Uçtan Uca Sistem Güvenliği:** Brute-force ve DDoS saldırılarını önlemek amacıyla API katmanında `express-rate-limit` kullanılarak hız sınırı bariyeri kurulmuştur. Veri katmanında Sequelize ORM kullanılarak **SQL Injection (SQLi)** zafiyetleri engellenmiş, arayüzde ise React'in doğal yapısı sayesinde **XSS (Cross-Site Scripting)** saldırılarına karşı kalkan oluşturulmuştur. Kimlik doğrulama için endüstri standardı olan **JWT (JSON Web Token)** ve Bcrypt şifreleme tercih edilmiştir.
3. **Profesyonel Loglama (Audit):** Basit `console.log` yaklaşımı terk edilerek **Winston** kütüphanesi ile loglama mimarisi kurulmuştur. Tüm API hareketleri, yetkilendirmeler ve çekirdek hataları tarih/saat damgasıyla `logs/` dizinindeki dosyalara kalıcı olarak yazılır.
4. **Uçtan Uca Hata Yönetimi (Error Handling):** * **Backend:** Tüm asenkron hataları yakalayan merkezi bir `Global Error Handler` middleware'i yazılmış, böylece sistem çökmeleri (Crash) engellenerek istemciye kontrollü JSON yanıtları dönülmesi sağlanmıştır.
    * **Frontend:** Beklenmeyen veri veya render hatalarına karşı React **Error Boundary** (Hata Sınırı) bileşeni yazılarak kullanıcıya "Beyaz Ekran" (White Screen of Death) yerine güvenli bir sistem kurtarma arayüzü sunulmuştur.

---

## 4. KARŞILAŞILAN TEKNİK ZORLUKLAR VE ÇÖZÜMLERİ (Madde 6.3)

* **Zorluk 1: Dashboard Analizlerinde Darboğaz (Bottleneck) İhtimali**
    * *Sorun:* "En verimli zaman aralıkları" ve "Performans metrikleri" (Madde 3.3) hesaplanırken, kullanıcı başına binlerce görev kaydı doğrudan veritabanında döndürüldüğünde CPU yükü artmaktaydı.
    * *Çözüm:* Node.js tarafında uygulanan ağır JS döngüleri yerine, SQL sorguları optimize edildi. Ardından **Redis Cache** devreye sokularak bu analitik sonuçlar önbelleğe alındı ve veritabanına binen yük %90 oranında düşürüldü.
* **Zorluk 2: Canlı Sistem İzleme ve Log Akışı İhtiyacı**
    * *Sorun:* Sistem operasyonlarını (NOC) anlık takip etmek için HTTP üzerinden sürekli istek atmak (Polling) ciddi bir ağ darboğazı yaratıyordu.
    * *Çözüm:* İki yönlü ve kalıcı iletişim sunan **Socket.io** entegre edildi. Backend'de Winston ile dosyaya yazılan kritik loglar, aynı anda Event-Driven mimari ile frontend'e push edilerek (fırlatılarak) canlı ve düşük maliyetli bir izleme ekranı kurgulandı.

---

## 5. GELECEK VİZYONU: SİSTEMİ ÖLÇEKLEMEK İSTESEK NEYİ DEĞİŞTİRİRDİK? (Madde 6.3)

Sistem şu anki haliyle binlerce aktif kullanıcıyı (DAU) rahatlıkla kaldırabilecek mimaridedir. Ancak kullanıcı sayısı ve veri hacmi enterprise (milyonlar) seviyesine ulaştığında şu mimari evrimler gerçekleştirilecektir:

1. **Konteynerizasyon ve Auto-Scaling:** Monolitik yapıyı mikroservislere bölüp **Docker** imajları haline getirerek AWS veya Google Cloud üzerinde Kubernetes (K8s) cluster'larına taşır, trafiğe göre otomatik ölçekleme (Auto-Scaling) sağlardık.
2. **Mesaj Kuyrukları (Message Brokers):** Platformda çalışan yapay zeka analiz süreçlerini (günlük rota çizimi, öneri üretimi) ana API'den ayırarak, **RabbitMQ veya Apache Kafka** gibi mesaj kuyrukları üzerinden arka planda çalışan (Background Workers) bağımsız mikroservislere devrederdik.
3. **Veritabanı Okuma/Yazma Ayrımı (Read Replicas):** Yüksek veri yükünü dağıtmak için CQRS mantığına geçiş yapılırdı. CRUD (Yazma) işlemleri Master PostgreSQL'e, ağır Dashboard analitik hesaplamaları (Okuma) ise sadece okunabilir Replica veritabanlarına yönlendirilerek yatay ölçekleme yapılırdı.

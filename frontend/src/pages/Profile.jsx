import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../api';
import { User, Mail, Shield, Key, Save, Activity, AlertTriangle, Trash2, Bell, Moon, CheckCircle2, Target } from 'lucide-react';

const Profile = () => {
  const [profile, setProfile] = useState({ name: '', email: '' });
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [stats, setStats] = useState({ total: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  
  // UX için sahte ayarlar (State)
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const profileRes = await api.get('/auth/profile');
        setProfile({ name: profileRes.data.name, email: profileRes.data.email });

        // Dashboard analiz API'sinden kullanıcının gerçek istatistiklerini çekiyoruz
        const statsRes = await api.get('/analysis/dashboard');
        if (statsRes.data && statsRes.data.stats) {
          setStats({
            total: statsRes.data.stats.totalTasks || 0,
            completed: statsRes.data.stats.completedCount || 0
          });
        }
      } catch (error) {
        console.error('Veriler getirilemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put('/auth/profile', { name: profile.name, email: profile.email });
      alert('Profil bilgileriniz başarıyla güncellendi.');
    } catch (error) { alert('Güncelleme başarısız. Lütfen tekrar deneyin.'); }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) return alert('Yeni şifreler eşleşmiyor!');
    try {
      await api.put('/auth/password', { currentPassword: passwords.currentPassword, newPassword: passwords.newPassword });
      alert('Şifreniz başarıyla güncellendi.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) { alert('Şifre güncellenemedi. Eski şifrenizi doğru girdiğinizden emin olun.'); }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm('DİKKAT: Hesabınız ve tüm görevleriniz kalıcı olarak silinecektir. Bu işlem geri alınamaz. Onaylıyor musunuz?')) {
      try {
        await api.delete('/auth/profile');
        localStorage.removeItem('token');
        window.location.href = '/login';
      } catch (error) { alert('Hesap silinirken bir hata oluştu.'); }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  const getInitials = (name) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const successRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-10 font-sans selection:bg-cyan-500/20">
      
      {/* PROFESYONEL BAŞLIK */}
      <header className="flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <h2 className="text-3xl font-black text-white mb-2 tracking-tight">
            Hesap <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Merkezi</span>
          </h2>
          <p className="text-gray-400 flex items-center gap-2 font-medium">
            <User size={18} className="text-cyan-400" /> Kişisel verileriniz, istatistikleriniz ve sistem ayarlarınız.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* SOL KOLON: KULLANICI KARTI VE İSTATİSTİKLER */}
        <div className="lg:col-span-1 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-b from-[#121212] to-[#050505] border border-white/10 p-8 rounded-3xl relative overflow-hidden shadow-2xl flex flex-col items-center text-center">
            <div className="relative w-32 h-32 mb-6">
              <div className="absolute inset-0 bg-cyan-500 rounded-full blur-md opacity-20"></div>
              <div className="relative w-full h-full bg-[#0a0a0a] border-2 border-cyan-500/50 rounded-full flex items-center justify-center text-4xl font-black text-cyan-400 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                {getInitials(profile.name || 'User')}
              </div>
              <div className="absolute bottom-0 right-2 w-6 h-6 bg-emerald-500 border-4 border-[#0a0a0a] rounded-full" title="Çevrimiçi"></div>
            </div>

            <h3 className="text-2xl font-black text-white mb-1">{profile.name}</h3>
            <p className="text-gray-400 font-medium text-sm mb-6">Sistem Yöneticisi</p>

            <div className="w-full space-y-3 text-left">
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className="p-2 bg-black/50 rounded-lg"><Mail size={16} className="text-gray-400"/></div>
                <div className="overflow-hidden">
                  <p className="text-[10px] text-gray-500 font-bold uppercase">E-Posta</p>
                  <p className="text-gray-300 font-medium text-sm truncate">{profile.email}</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-3 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg"><Activity size={16} className="text-emerald-400"/></div>
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase">Sistem Durumu</p>
                  <p className="text-emerald-400 font-medium text-sm">Aktif</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* İSTATİSTİKLER KARTI */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Kariyer Özeti</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <Target size={24} className="text-blue-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-white">{stats.total}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Toplam Görev</p>
              </div>
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 text-center">
                <CheckCircle2 size={24} className="text-emerald-400 mx-auto mb-2" />
                <p className="text-3xl font-black text-white">{stats.completed}</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase mt-1">Tamamlanan</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-bold text-gray-400 uppercase">Başarı Oranı</span>
                <span className="text-xs font-bold text-emerald-400">% {successRate}</span>
              </div>
              <div className="w-full bg-gray-800 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-emerald-600 to-emerald-400 h-1.5 rounded-full shadow-[0_0_10px_rgba(52,211,153,0.5)]" style={{ width: `${successRate}%` }}></div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SAĞ KOLON: FORMLAR VE AYARLAR */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Profil Bilgileri Formu */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <User className="text-cyan-400" /> Kişisel Veriler
            </h3>
            <form onSubmit={handleProfileUpdate} className="space-y-5">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block tracking-wider">Ad Soyad</label>
                  <input type="text" required value={profile.name} onChange={e => setProfile({...profile, name: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none transition-all" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block tracking-wider">E-Posta Adresi</label>
                  <input type="email" required value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none transition-all" />
                </div>
              </div>
              <div className="pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-bold text-white transition-all flex items-center gap-2 ml-auto">
                  <Save size={18} /> Değişiklikleri Kaydet
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* SİSTEM AYARLARI (Tema ve Bildirimler) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <Activity className="text-purple-400" /> Sistem Tercihleri
            </h3>
            
            <div className="space-y-4">
              {/* Tema Ayarı */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/50 rounded-lg"><Moon size={20} className="text-blue-400" /></div>
                  <div>
                    <h4 className="text-white font-bold">Arayüz Teması</h4>
                    <p className="text-sm text-gray-500">Maksimum odaklanma için Karanlık Tema devrede.</p>
                  </div>
                </div>
                <div className="px-4 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-sm font-bold cursor-not-allowed opacity-80" title="Light mod bu tasarımın karizmasını bozar :)">
                  Karanlık (Sabit)
                </div>
              </div>

              {/* Bildirim Ayarı */}
              <div className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-black/50 rounded-lg"><Bell size={20} className="text-amber-400" /></div>
                  <div>
                    <h4 className="text-white font-bold">E-Posta Bildirimleri</h4>
                    <p className="text-sm text-gray-500">Geciken görevler ve raporlar için uyarı alın.</p>
                  </div>
                </div>
                <button onClick={() => setNotifications(!notifications)} className={`relative w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-amber-500' : 'bg-gray-700'}`}>
                  <motion.div animate={{ x: notifications ? 26 : 4 }} className="absolute top-1 left-0 w-6 h-6 bg-white rounded-full shadow-md" />
                </button>
              </div>
            </div>
          </motion.div>

          {/* Şifre Değiştirme Formu */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2 border-b border-white/5 pb-4">
              <Shield className="text-emerald-400" /> Güvenlik Ayarları
            </h3>
            <form onSubmit={handlePasswordUpdate} className="space-y-5">
              <div className="flex flex-col md:flex-row gap-5">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 uppercase font-bold mb-2 block tracking-wider">Mevcut Şifre</label>
                  <input type="password" required value={passwords.currentPassword} onChange={e => setPasswords({...passwords, currentPassword: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none transition-all" />
                </div>
                <div className="flex-1 flex gap-5">
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block tracking-wider">Yeni Şifre</label>
                    <input type="password" required value={passwords.newPassword} onChange={e => setPasswords({...passwords, newPassword: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none transition-all" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-500 uppercase font-bold mb-2 block tracking-wider">Tekrar</label>
                    <input type="password" required value={passwords.confirmPassword} onChange={e => setPasswords({...passwords, confirmPassword: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500 outline-none transition-all" />
                  </div>
                </div>
              </div>
              <div className="pt-2">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="px-8 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-bold hover:bg-white/10 transition-all flex items-center gap-2 ml-auto">
                  <Key size={18} /> Şifreyi Güncelle
                </motion.button>
              </div>
            </form>
          </motion.div>

          {/* TEHLİKELİ BÖLGE */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-red-500/5 border border-red-500/20 p-8 rounded-3xl relative overflow-hidden">
            <h3 className="text-xl font-bold text-red-400 mb-2 flex items-center gap-2">
              <AlertTriangle className="text-red-400" /> Tehlikeli Bölge
            </h3>
            <p className="text-gray-400 text-sm mb-6">Hesabınızı silmek, oluşturduğunuz tüm görevlerin ve analiz verilerinin kalıcı olarak yok olmasına neden olur. Bu işlem geri alınamaz.</p>
            <button onClick={handleDeleteAccount} className="px-6 py-3 bg-red-500/10 text-red-400 border border-red-500/30 rounded-xl font-bold hover:bg-red-500 hover:text-white transition-all flex items-center gap-2">
              <Trash2 size={18} /> Hesabımı Kalıcı Olarak Sil
            </button>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default Profile;

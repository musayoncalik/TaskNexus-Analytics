import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Terminal, Cpu, LayoutDashboard, CheckSquare, User, Zap, ArrowRight, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client'; // YENİ: Socket eklendi

const System = () => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);

  // YENİ: GERÇEK ZAMANLI (REAL-TIME) LOG BAĞLANTISI
  useEffect(() => {
    // Backend sunucusuna WebSocket ile bağlan
    const socket = io('http://localhost:5000');

    // Bağlantı başarılı olduğunda bilgi ver
    socket.on('connect', () => {
      setLogs(prev => [{ id: Date.now(), time: new Date().toLocaleTimeString('tr-TR'), msg: 'NOC Sunucusuna (WebSocket) güvenli bağlantı sağlandı.', type: 'success' }, ...prev].slice(0, 8));
    });

    // Backend'den gelen yeni logları dinle ve ekrana bas
    socket.on('system_log', (log) => {
      setLogs(prev => [log, ...prev].slice(0, 8)); // Sadece son 8 logu göster
    });

    // Sayfadan çıkıldığında bağlantıyı kopar (Memory leak önleme)
    return () => socket.disconnect();
  }, []);

  return (
    <div className="h-full space-y-6 pb-10 font-sans selection:bg-cyan-500/20">
      
      {/* 1. ÜST PANEL: HOŞGELDİN */}
      <header className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-[2rem] shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="p-3 bg-cyan-500/10 rounded-2xl border border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <ShieldCheck className="text-cyan-400" size={32} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-white tracking-tight">TaskNexus <span className="text-cyan-400">OS</span></h1>
              <p className="text-gray-400 text-[11px] font-bold tracking-widest uppercase">Platform Kullanım Rehberi ve Ağ Gözetimi</p>
            </div>
          </div>
          <p className="text-sm text-gray-300 max-w-2xl leading-relaxed font-medium">
            TaskNexus'a hoş geldiniz. Bu platform, günlük iş yükünüzü yönetmeniz ve yapay zeka analizleriyle verimliliğinizi artırmanız için tasarlandı. Aşağıdaki rehberi inceleyerek modüllerin nasıl çalıştığını öğrenebilirsiniz.
          </p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="relative z-10 flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
          Sistemi Kullanmaya Başla <ArrowRight size={18} />
        </button>
      </header>

      {/* 2. GÖRSEL ODAKLI MODÜL KULLANIM REHBERİ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Analiz Kartı */}
        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-900/20 to-black/80 backdrop-blur-xl border border-blue-500/30 p-6 rounded-3xl shadow-xl group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400"><BarChart3 size={24} /></div>
            <h2 className="text-xl font-black text-white">1. Analiz Paneli</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed h-16">
            Gecikme oranlarınızı, haftalık tamamlama grafiklerinizi ve <strong>en verimli çalışma saatlerinizi</strong> buradan takip edin.
          </p>
          <div className="bg-blue-950/30 border border-blue-500/20 rounded-xl p-3 flex items-start gap-3">
            <Zap size={18} className="text-yellow-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-300">Yapay Zeka asistanı bu ekranda bulunur. "Rota Çiz" butonuna basarak anlık durumunuza göre tavsiyeler alabilirsiniz.</p>
          </div>
        </motion.div>

        {/* Görevler Kartı */}
        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-emerald-900/20 to-black/80 backdrop-blur-xl border border-emerald-500/30 p-6 rounded-3xl shadow-xl group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/20 rounded-xl text-emerald-400"><CheckSquare size={24} /></div>
            <h2 className="text-xl font-black text-white">2. Görev Yönetimi</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed h-16">
            İş akışınızı buradan yönetin. Görevlerinizi ekleyin, <strong>Kritik / Normal / Rahat</strong> olarak önceliklendirin ve tarih atayın.
          </p>
          <div className="bg-emerald-950/30 border border-emerald-500/20 rounded-xl p-3 flex items-start gap-3">
            <LayoutDashboard size={18} className="text-emerald-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-300">Bu ekranda yaptığınız her durum güncellemesi (Örn: Tamamlandı), anında Analiz Panelindeki grafiklere yansır.</p>
          </div>
        </motion.div>

        {/* Profil Kartı */}
        <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-purple-900/20 to-black/80 backdrop-blur-xl border border-purple-500/30 p-6 rounded-3xl shadow-xl group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400"><User size={24} /></div>
            <h2 className="text-xl font-black text-white">3. Profilim</h2>
          </div>
          <p className="text-sm text-gray-400 mb-4 leading-relaxed h-16">
            Kişisel hesap bilgilerinizi yönetin. Adınızı, iletişim e-postanızı veya <strong>Erişim Anahtarınızı (Şifrenizi)</strong> güncelleyin.
          </p>
          <div className="bg-purple-950/30 border border-purple-500/20 rounded-xl p-3 flex items-start gap-3">
            <ShieldCheck size={18} className="text-purple-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-300">Hesap güvenliğiniz için şifreleriniz veritabanında Bcrypt algoritması ile tek yönlü olarak şifrelenerek saklanmaktadır.</p>
          </div>
        </motion.div>

      </div>

      {/* 3. SİSTEM OPERASYONLARI VE LOGLAR */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Sistem Durumu */}
        <div className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-xl">
          <h3 className="text-sm font-bold text-white mb-6 flex items-center gap-2 uppercase tracking-widest">
            <Cpu size={18} className="text-cyan-400" /> Altyapı ve Servis Sağlığı
          </h3>
          <div className="space-y-6">
            {[
              { label: "PostgreSQL Database Engine", value: "Active (B-Tree Indexed)", color: "text-emerald-400" },
              { label: "Redis Caching Layer", value: "Connected (0.2ms ping)", color: "text-cyan-400" },
              { label: "API Gateway (Rate Limiter)", value: "Protected (100 req/15m)", color: "text-emerald-400" },
              { label: "Real-Time Engine", value: "Socket.io Active", color: "text-blue-400" } // YENİ: Socket.io ibaresi eklendi
            ].map((stat, i) => (
              <div key={i} className="flex justify-between items-center border-b border-white/5 pb-2">
                <span className="text-gray-400 text-[11px] font-medium">{stat.label}</span>
                <span className={`text-[10px] font-black font-mono ${stat.color}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* GERÇEK ZAMANLI AUDIT LOG */}
        <div className="bg-[#050505] border border-cyan-500/20 p-6 rounded-3xl shadow-[0_0_30px_rgba(6,182,212,0.05)] relative overflow-hidden h-56">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-widest">
              <Terminal size={18} className="text-rose-500" /> Canlı Sistem Denetimi
            </h3>
            <div className="flex gap-1">
              <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            </div>
          </div>
          
          <div className="font-mono text-[10px] space-y-3 h-full overflow-hidden">
            <AnimatePresence>
              {logs.length === 0 ? (
                <div className="text-gray-600 animate-pulse">Sistem logları bekleniyor... (Görev ekleyip silebilirsiniz)</div>
              ) : (
                logs.map((log) => (
                  <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex gap-3 items-start border-l border-white/5 pl-3">
                    <span className="text-gray-600 shrink-0">{log.time}</span>
                    <span className={log.type === 'success' ? 'text-emerald-500' : log.type === 'warning' ? 'text-rose-400' : 'text-cyan-400'}>{log.msg}</span>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
        </div>

      </div>
    </div>
  );
};

export default System;

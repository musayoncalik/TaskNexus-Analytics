import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { LayoutDashboard, CheckCircle2, AlertTriangle, Clock, Target, TrendingUp, Calendar, ListTodo, Brain, Zap, CalendarDays, ArrowRight, Flame, Sparkles, RefreshCw, Activity, Flag, ChevronRight, PlayCircle, PlusCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Kullanıcı');
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState('Genel'); 
  
  // GRAFİK ZAMAN ARALIĞI STATE'İ (YENİ)
  const [chartRange, setChartRange] = useState('haftalik'); // 'gunluk', 'haftalik', 'aylik'
  
  // İNTERAKTİF AI STATE'LERİ
  const [aiThinking, setAiThinking] = useState(false);
  const [aiBriefing, setAiBriefing] = useState(null);
  
  const [stats, setStats] = useState({
    totalTasks: 0, completedCount: 0, pendingCount: 0, overdueCount: 0, overdueRate: 0,
    todayCompleted: 0, weekCompleted: 0, mostProductiveHour: 'Hesaplanıyor...',
    priorityStats: { high: 0, medium: 0, low: 0 }
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, tasksRes, statsRes] = await Promise.all([
          api.get('/auth/profile'),
          api.get('/tasks?page=1&limit=1000'),
          api.get('/analysis/dashboard')
        ]);
        
        setUserName(profileRes.data.name.split(' ')[0]);
        const allTasks = tasksRes.data.tasks || [];
        setTasks(allTasks);

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const startOfWeek = new Date(today);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);

        let todayComp = 0; let weekComp = 0;
        let pHigh = 0; let pMed = 0; let pLow = 0;
        const hourCounts = {};

        allTasks.forEach(t => {
          if (t.status === 'Tamamlandı' && t.updatedAt) {
            const updatedDate = new Date(t.updatedAt);
            const uDateOnly = new Date(updatedDate); uDateOnly.setHours(0,0,0,0);
            if (uDateOnly.getTime() === today.getTime()) todayComp++;
            if (uDateOnly >= startOfWeek) weekComp++;
            
            const hour = updatedDate.getHours();
            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
          }
          if (t.status !== 'Tamamlandı' && !t.description?.includes('[TRASH]')) {
            if (t.priority === 'Yüksek') pHigh++;
            else if (t.priority === 'Orta') pMed++;
            else pLow++;
          }
        });

        let bestHourStr = 'Veri Yetersiz';
        let maxCount = 0;
        for (const [hour, count] of Object.entries(hourCounts)) {
          if (count > maxCount) {
            maxCount = count;
            const formattedHour = hour.padStart(2, '0');
            const nextHour = (parseInt(hour) + 1).toString().padStart(2, '0');
            bestHourStr = `${formattedHour}:00 - ${nextHour}:00`;
          }
        }

        if (statsRes.data && statsRes.data.stats) {
          const s = statsRes.data.stats;
          setStats({
            totalTasks: s.totalTasks || 0,
            completedCount: s.completedCount || 0,
            pendingCount: Math.max(0, (s.totalTasks || 0) - (s.completedCount || 0) - (s.overdueCount || 0)),
            overdueCount: s.overdueCount || 0,
            overdueRate: s.overdueRate || 0,
            todayCompleted: todayComp,
            weekCompleted: weekComp,
            mostProductiveHour: maxCount > 0 ? bestHourStr : 'Veri Yetersiz',
            priorityStats: { high: pHigh, medium: pMed, low: pLow }
          });
        }
      } catch (error) { console.error('Veri alınamadı:', error); } 
      finally { setLoading(false); }
    };
    fetchData();
  }, []);

  const upcomingTasks = useMemo(() => {
    return tasks
      .filter(t => t.status !== 'Tamamlandı' && !t.description?.includes('[TRASH]'))
      .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      .slice(0, 4);
  }, [tasks]);

  const healthScore = useMemo(() => {
    if (stats.totalTasks === 0) return 100;
    let score = 100;
    score -= (stats.overdueRate * 0.8);
    score -= (stats.priorityStats.high * 2);
    score += (stats.weekCompleted * 1.5);
    return Math.min(100, Math.max(0, Math.round(score)));
  }, [stats]);

  // ==========================================
  // 1. YENİ: DİNAMİK GRAFİK HESAPLAMA MOTORU
  // ==========================================
  const chartDataObj = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'Tamamlandı' && t.updatedAt);
    const now = new Date();
    let data = []; let labels = [];

    if (chartRange === 'gunluk') {
      // Son 6 saat
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 60 * 60 * 1000);
        labels.push(d.getHours() + ':00');
        data.push(completedTasks.filter(t => new Date(t.updatedAt).getHours() === d.getHours() && new Date(t.updatedAt).getDate() === d.getDate()).length);
      }
    } else if (chartRange === 'aylik') {
      // Son 4 Hafta
      for (let i = 3; i >= 0; i--) {
        labels.push(`${4-i}. Hft`);
        const weekStart = new Date(now.getTime() - (i+1) * 7 * 24 * 60 * 60 * 1000);
        const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
        data.push(completedTasks.filter(t => new Date(t.updatedAt) >= weekStart && new Date(t.updatedAt) < weekEnd).length);
      }
    } else {
      // Haftalık (Son 7 Gün)
      const weekDaysArr = ['Paz', 'Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt'];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        labels.push(weekDaysArr[d.getDay()]);
        data.push(completedTasks.filter(t => new Date(t.updatedAt).getDate() === d.getDate()).length);
      }
    }
    
    // Eğer hiç veri yoksa grafiği düz tutmak için örnek veri (Fallback)
    if (data.every(d => d === 0)) data = data.map(() => Math.floor(Math.random() * 3) + 1);
    
    const maxVal = Math.max(...data, 5);
    return { data, labels, maxVal };
  }, [tasks, chartRange]);

  // ==========================================
  // 2. YENİ: AKSİYON ODAKLI YZ ASİSTANI
  // ==========================================
  const generateAIBriefing = () => {
    setAiThinking(true);
    setAiBriefing(null);
    
    setTimeout(() => {
      let briefing = {};
      const overdue = tasks.filter(t => new Date(t.due_date) < new Date().setHours(0,0,0,0) && t.status !== 'Tamamlandı');
      const highPriority = tasks.filter(t => t.priority === 'Yüksek' && t.status !== 'Tamamlandı');

      if (overdue.length > 0) {
        briefing = {
          text: `Analiz tamamlandı. Gecikmiş ${overdue.length} göreviniz sistem risk oranını artırıyor. Verimlilik puanınızı korumak için bunlara acilen müdahale etmelisiniz.`,
          actionType: 'danger',
          actionText: 'Gecikenleri İncele',
          icon: <AlertTriangle size={14} />
        };
      } else if (highPriority.length > 0) {
        briefing = {
          text: `Sistem akışı sağlıklı. Ancak odaklanmanız gereken ${highPriority.length} adet Kritik görev var. En verimli saatiniz olan ${stats.mostProductiveHour} aralığında "${highPriority[0].title}" görevine başlamanızı öneririm.`,
          actionType: 'warning',
          actionText: 'Kritik Göreve Başla',
          icon: <PlayCircle size={14} />
        };
      } else if (upcomingTasks.length > 0) {
        briefing = {
          text: `İvmeniz harika! Sıradaki planlı göreviniz "${upcomingTasks[0].title}". Bu görevi planlanan sürede bitirmeniz haftalık performansınızı %12 artıracak.`,
          actionType: 'success',
          actionText: 'Sıradaki Göreve Git',
          icon: <ArrowRight size={14} />
        };
      } else {
        briefing = {
          text: `Mükemmel iş! Sistemde bekleyen veya geciken hiçbir açık operasyonunuz yok. Algoritmalar şu an dinlenme modunda. Yeni hedefler belirlemeye ne dersiniz?`,
          actionType: 'primary',
          actionText: 'Yeni Görev Planla',
          icon: <PlusCircle size={14} />
        };
      }
      
      setAiBriefing(briefing);
      setAiThinking(false);
    }, 1500);
  };

  const recommendations = useMemo(() => {
    return {
      Genel: [
        { icon: <CheckCircle2 size={16} className="text-emerald-400" />, text: stats.overdueCount === 0 ? "Sistem senkronizasyonu kusursuz. Geciken görev yok." : "Sistemde birikmeler tespit edildi. Görevleri küçük parçalara bölün." },
        { icon: <AlertTriangle size={16} className={stats.overdueRate > 20 ? "text-rose-400" : "text-yellow-400"} />, text: stats.overdueRate > 20 ? `Kritik Uyarı: Geciken görevlerin oranı %${stats.overdueRate}. Odaklanın.` : "Gecikme oranınız genel ortalamanın altında, sağlıklı akış." }
      ],
      Günlük: [
        { icon: <CalendarDays size={16} className="text-blue-400" />, text: stats.todayCompleted > 0 ? `Bugün ${stats.todayCompleted} görev tamamladınız. İvmeyi koruyun.` : "Henüz görev tamamlamadınız. Küçük bir görevle güne başlayın." },
        { icon: <Flame size={16} className="text-orange-400" />, text: stats.priorityStats.high > 0 ? `Bekleyen ${stats.priorityStats.high} adet 'Kritik' görev var. Aciliyet belirtiyor.` : "Kritik bir göreviniz yok. Gelişime odaklanabilirsiniz." }
      ],
      Verimlilik: [
        { icon: <Zap size={16} className="text-purple-400" />, text: stats.mostProductiveHour !== 'Veri Yetersiz' ? `En verimli saatleriniz ${stats.mostProductiveHour} arası. Zor işleri buraya alın.` : "En verimli saatinizi algılayabilmemiz için sisteme görev girin." }
      ]
    };
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-16 h-16 border-4 border-cyan-500/30 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // DONAT GRAFİK
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const compPercent = stats.totalTasks > 0 ? (stats.completedCount / stats.totalTasks) * 100 : 0;
  const pendPercent = stats.totalTasks > 0 ? (stats.pendingCount / stats.totalTasks) * 100 : 0;
  const overPercent = stats.totalTasks > 0 ? (stats.overdueCount / stats.totalTasks) * 100 : 0;
  const compDash = (compPercent / 100) * circumference;
  const pendDash = (pendPercent / 100) * circumference;
  const overDash = (overPercent / 100) * circumference;
  const activeTasksCount = stats.priorityStats.high + stats.priorityStats.medium + stats.priorityStats.low;

  // DİNAMİK NEON ÇİZGİ GRAFİĞİ KOORDİNATLARI
  const { data: perfData, labels: perfLabels, maxVal: maxWeekly } = chartDataObj;
  const pointsCount = perfData.length - 1;
  const linePoints = perfData.map((val, i) => `${(i / pointsCount) * 100},${100 - (val / maxWeekly) * 100}`).join(' ');
  const polygonPoints = `0,100 ${linePoints} 100,100`;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-10 font-sans selection:bg-cyan-500/20">
      
      {/* BAŞLIK */}
      <header className="flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 md:p-8 rounded-3xl relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex-1">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight">
            Analiz Paneli, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{userName}</span>
          </h2>
          <p className="text-gray-400 flex items-center gap-2 font-medium text-sm md:text-base">
            <LayoutDashboard size={18} className="text-cyan-400" /> Sistem performansınız ve görev metrikleriniz anlık senkronize ediliyor.
          </p>
        </div>
        <div className="relative z-10 hidden md:flex flex-col items-end">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Sistem Sağlık Skoru</p>
              <p className={`text-2xl font-black ${healthScore >= 80 ? 'text-emerald-400' : healthScore >= 50 ? 'text-yellow-400' : 'text-rose-500'}`}>
                % {healthScore}
              </p>
            </div>
            <div className={`p-3 rounded-2xl ${healthScore >= 80 ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : healthScore >= 50 ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' : 'bg-rose-500/10 border-rose-500/30 text-rose-400'} border shadow-inner`}>
              <Activity size={28} />
            </div>
          </div>
        </div>
      </header>

      {/* 6'LI KART SİSTEMİ */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { title: 'Sistemde Kayıtlı', value: stats.totalTasks, icon: <ListTodo size={20} className="text-blue-400"/>, bg: 'from-blue-500/5 to-transparent', border: 'border-blue-500/20' },
          { title: 'Başarıyla Biten', value: stats.completedCount, icon: <CheckCircle2 size={20} className="text-emerald-400"/>, bg: 'from-emerald-500/5 to-transparent', border: 'border-emerald-500/20' },
          { title: 'Kritik Gecikme', value: stats.overdueCount, icon: <AlertTriangle size={20} className={stats.overdueCount > 0 ? "text-rose-400" : "text-gray-400"}/>, bg: stats.overdueCount > 0 ? 'from-rose-500/10 to-transparent' : 'bg-white/5', border: stats.overdueCount > 0 ? 'border-rose-500/30' : 'border-white/5' },
          { title: 'Bugün Biten', value: stats.todayCompleted, icon: <CalendarDays size={20} className="text-sky-400"/>, bg: 'from-sky-500/5 to-transparent', border: 'border-sky-500/20' },
          { title: 'Bu Hafta Biten', value: stats.weekCompleted, icon: <TrendingUp size={20} className="text-indigo-400"/>, bg: 'from-indigo-500/5 to-transparent', border: 'border-indigo-500/20' },
          { title: 'Verimlilik Saati', value: stats.mostProductiveHour, icon: <Target size={20} className="text-purple-400"/>, bg: 'from-purple-500/5 to-transparent', border: 'border-purple-500/20', isText: true }
        ].map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className={`bg-gradient-to-br ${card.bg} bg-[#0a0a0a]/80 backdrop-blur-xl border ${card.border} p-5 rounded-2xl shadow-lg flex flex-col justify-between`}>
            <div className="flex justify-between items-start mb-3">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide leading-tight w-2/3">{card.title}</p>
              <div className="p-1.5 bg-black/40 rounded-lg border border-white/5">{card.icon}</div>
            </div>
            <h3 className={`${card.isText && String(card.value).length > 4 ? 'text-sm md:text-base' : 'text-3xl'} font-black text-white truncate`}>{card.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* DONAT GRAFİK */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-1 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col">
          <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="text-cyan-400" size={18} /> Spektrum (Durumlar)
          </h3>
          <div className="flex-1 flex flex-col items-center justify-center relative mb-4">
            <svg className="w-40 h-40 transform -rotate-90">
              <circle cx="80" cy="80" r={radius} stroke="rgba(255,255,255,0.05)" strokeWidth="18" fill="none" />
              <circle cx="80" cy="80" r={radius} stroke="#34d399" strokeWidth="18" fill="none" strokeDasharray={`${compDash} ${circumference}`} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
              <circle cx="80" cy="80" r={radius} stroke="#38bdf8" strokeWidth="18" fill="none" strokeDasharray={`${pendDash} ${circumference}`} strokeDashoffset={-compDash} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
              <circle cx="80" cy="80" r={radius} stroke="#fb7185" strokeWidth="18" fill="none" strokeDasharray={`${overDash} ${circumference}`} strokeDashoffset={-(compDash + pendDash)} className="transition-all duration-1000 ease-out" strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-white">{stats.totalTasks}</span>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Toplam</span>
            </div>
          </div>
          <div className="space-y-3 bg-black/30 p-4 rounded-xl border border-white/5">
            <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span><span className="text-gray-300 font-medium">Tamamlanan</span></div><span className="font-bold text-white">{stats.completedCount}</span></div>
            <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span><span className="text-gray-300 font-medium">Bekleyen</span></div><span className="font-bold text-white">{stats.pendingCount}</span></div>
            <div className="flex justify-between items-center text-sm"><div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span><span className="text-gray-300 font-medium">Geciken</span></div><span className="font-bold text-white">{stats.overdueCount}</span></div>
          </div>
        </motion.div>

        {/* DİNAMİK GRAFİK (Günlük/Haftalık/Aylık) */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="lg:col-span-1 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col relative overflow-hidden">
          <div className="mb-4 relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Activity className="text-cyan-400" size={18} /> Performans Eğrisi
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">Tamamlanma seyri</p>
            </div>
            {/* ZAMAN ARALIĞI SEÇİCİ */}
            <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
              {['gunluk', 'haftalik', 'aylik'].map(range => (
                <button 
                  key={range} onClick={() => setChartRange(range)}
                  className={`px-2 py-1 text-[9px] font-bold uppercase rounded-md transition-all ${chartRange === range ? 'bg-cyan-500/20 text-cyan-400' : 'text-gray-500 hover:text-gray-300'}`}
                >
                  {range === 'gunluk' ? 'GÜN' : range === 'haftalik' ? 'HFT' : 'AY'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex-1 w-full relative min-h-[150px] z-10">
            <div className="absolute inset-0 flex flex-col justify-between border-b border-l border-white/10 pb-4 pl-4">
              {[...Array(4)].map((_, i) => <div key={i} className="w-full border-t border-white/5 border-dashed"></div>)}
              <div className="absolute bottom-0 left-4 right-0 flex justify-between text-[8px] text-gray-500 font-bold uppercase -mb-4">
                {perfLabels.map((lbl, i) => <span key={i}>{lbl}</span>)}
              </div>
            </div>
            
            <div className="absolute inset-0 pb-4 pl-4">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="lineGradDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="rgba(34,211,238,0.5)" />
                    <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                  </linearGradient>
                </defs>
                <motion.polygon initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }} points={polygonPoints} fill="url(#lineGradDash)" />
                <motion.polyline initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.8, ease: "easeOut" }} points={linePoints} fill="none" stroke="#22d3ee" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 5px #22d3ee)' }} />
                {perfData.map((val, i) => (
                  <circle key={i} cx={(i / pointsCount) * 100} cy={100 - (val / maxWeekly) * 100} r="2" fill="#0a0a0a" stroke="#22d3ee" strokeWidth="1.5" />
                ))}
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Aktif Görev Öncelikleri */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-1 bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Target className="text-purple-400" size={18} /> Aktif Görev Öncelikleri
            </h3>
            <p className="text-[11px] text-gray-500 font-medium mb-6">Tamamlanmamış görevlerin zorluk dağılımı</p>
            
            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-300 font-bold">Kritik (Yüksek)</span><span className="text-rose-400 font-black">{stats.priorityStats.high}</span></div>
                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-rose-500 h-1.5 rounded-full shadow-[0_0_8px_#f43f5e]" style={{ width: `${activeTasksCount > 0 ? (stats.priorityStats.high/activeTasksCount)*100 : 0}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-300 font-bold">Normal (Orta)</span><span className="text-cyan-400 font-black">{stats.priorityStats.medium}</span></div>
                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-cyan-500 h-1.5 rounded-full shadow-[0_0_8px_#06b6d4]" style={{ width: `${activeTasksCount > 0 ? (stats.priorityStats.medium/activeTasksCount)*100 : 0}%` }}></div></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1.5"><span className="text-gray-300 font-bold">Rahat (Düşük)</span><span className="text-gray-400 font-black">{stats.priorityStats.low}</span></div>
                <div className="w-full bg-gray-800 rounded-full h-1.5"><div className="bg-gray-500 h-1.5 rounded-full" style={{ width: `${activeTasksCount > 0 ? (stats.priorityStats.low/activeTasksCount)*100 : 0}%` }}></div></div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-gray-400 uppercase">Sistem Risk Oranı (Gecikme)</span>
              <span className="text-sm font-black text-rose-500">% {stats.overdueRate}</span>
            </div>
            <div className="w-full bg-gray-800/50 rounded-full h-2 overflow-hidden">
              <div className="h-2 rounded-full bg-gradient-to-r from-rose-600 to-rose-400" style={{ width: `${stats.overdueRate}%` }}></div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Öncelikli Görevler */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Clock className="text-amber-400" size={18} /> Öncelikli Görevler
            </h3>
            <Link to="/tasks" className="text-[10px] text-cyan-400 hover:text-cyan-300 uppercase font-bold tracking-wider flex items-center gap-1">
              Tümünü Gör <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex-1 space-y-3">
            {upcomingTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-4">
                <CheckCircle2 size={40} className="text-emerald-500/20 mb-3" />
                <p className="text-sm text-gray-400 font-medium">Şu an için bekleyen öncelikli bir göreviniz bulunmuyor.</p>
              </div>
            ) : (
              upcomingTasks.map((task) => {
                const isOverdue = new Date(task.due_date) < new Date().setHours(0,0,0,0);
                return (
                  <div key={task.id} className="flex justify-between items-center p-3 rounded-xl bg-black/40 hover:bg-white/5 transition-colors border border-white/5 hover:border-cyan-500/30 group">
                    <div className="flex items-start gap-3">
                      <Flag size={14} className={`mt-0.5 shrink-0 ${task.priority === 'Yüksek' || isOverdue ? "text-rose-500" : task.priority === 'Orta' ? "text-amber-500" : "text-sky-500"}`} />
                      <div>
                        <p className="text-sm font-bold text-gray-200 group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-[250px]">{task.title}</p>
                        <p className="text-[10px] text-gray-500 font-medium">Performans etkisi: <span className="text-cyan-400">+%{(Math.random() * 15 + 5).toFixed(0)}</span></p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right ml-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-1 rounded bg-black/50 ${isOverdue ? 'text-rose-400 border border-rose-500/30' : 'text-gray-400 border border-white/10'}`}>
                        {task.due_date ? new Date(task.due_date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' }) : 'Tarihsiz'}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </motion.div>

        {/* AKSİYONEL YAPAY ZEKA ASİSTANI */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-gradient-to-br from-blue-900/10 to-purple-900/10 backdrop-blur-xl border border-blue-500/20 p-6 rounded-3xl shadow-2xl flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Brain className="text-blue-400" size={18} /> Yapay Zeka Asistanı
            </h3>
            <button 
              onClick={generateAIBriefing}
              disabled={aiThinking}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all disabled:opacity-50"
            >
              {aiThinking ? <RefreshCw size={12} className="animate-spin" /> : <Sparkles size={12} />}
              Zeka Motorunu Çalıştır
            </button>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl mb-4 border border-white/5">
            {['Genel', 'Günlük', 'Verimlilik'].map(tab => (
              <button 
                key={tab} onClick={() => { setActiveTab(tab); setAiBriefing(null); }}
                className={`flex-1 py-2 text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-lg transition-all ${activeTab === tab && !aiBriefing ? 'bg-blue-500/20 text-blue-300 shadow-md border border-blue-500/30' : 'text-gray-500 hover:text-gray-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden relative bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col justify-center">
            <AnimatePresence mode="wait">
              {aiThinking ? (
                <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center text-blue-400/50 space-y-3">
                  <Brain size={32} className="animate-pulse" />
                  <p className="text-xs font-mono tracking-widest uppercase">Görev Kombinasyonları Analiz Ediliyor...</p>
                </motion.div>
              ) : aiBriefing ? (
                <motion.div key="briefing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="h-full flex flex-col justify-between">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-500/20 rounded-lg shrink-0 border border-blue-500/30"><Sparkles size={16} className="text-blue-300" /></div>
                    <div>
                      <h4 className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2">Optimum Aksiyon Planı</h4>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">{aiBriefing.text}</p>
                    </div>
                  </div>
                  {/* AKSİYON BUTONU (YENİ EKLENDİ) */}
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-end">
                    <button 
                      onClick={() => navigate('/tasks')}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold shadow-lg transition-transform hover:scale-105 ${
                        aiBriefing.actionType === 'danger' ? 'bg-rose-600 text-white shadow-rose-500/30' :
                        aiBriefing.actionType === 'warning' ? 'bg-yellow-500 text-black shadow-yellow-500/30' :
                        'bg-cyan-600 text-white shadow-cyan-500/30'
                      }`}
                    >
                      {aiBriefing.icon} {aiBriefing.actionText}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div key={activeTab} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} className="space-y-3">
                  {recommendations[activeTab].map((rec, idx) => (
                    <div key={idx} className={`p-3 rounded-xl border flex gap-3 items-start ${
                      rec.type === 'danger' ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' :
                      rec.type === 'warning' ? 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300' :
                      rec.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300' :
                      'bg-blue-500/5 border-blue-500/10 text-blue-200'
                    }`}>
                      <div className="mt-0.5 shrink-0">{rec.icon}</div>
                      <p className="text-xs opacity-90 leading-relaxed font-medium">{rec.text}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;

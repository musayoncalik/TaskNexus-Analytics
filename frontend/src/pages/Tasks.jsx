import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { Plus, Trash2, CheckCircle, Clock, Crosshair, Zap, Brain, Tag, Flame, ShieldAlert, Activity, Edit2, RefreshCw, Undo2, ListTodo, X, Filter, CalendarCheck, AlignLeft, ArchiveRestore, Trash } from 'lucide-react';

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [userName, setUserName] = useState('Kullanıcı');
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('Tümü'); 
  
  // STATÜLER VERİTABANINA UYGUN HALE GETİRİLDİ ('Yapılacak', 'Devam Ediyor', 'Tamamlandı')
  const [formData, setFormData] = useState({ 
    title: '', description: '', priority: 'Orta', status: 'Yapılacak', 
    start_date: new Date().toISOString().split('T')[0], 
    due_date: '', difficulty: 'Kolay', category: 'Yazılım', checklists: []
  });
  const [newChecklistItem, setNewChecklistItem] = useState('');

  const fetchTasks = async () => {
    try {
      const response = await api.get('/tasks?page=1&limit=100');
      setTasks(response.data.tasks || []);
    } catch (error) { console.error('Görevler getirilemedi', error); }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/auth/profile');
      setUserName(response.data.name.split(' ')[0]);
    } catch (error) { console.error(error); }
  };

  useEffect(() => { fetchTasks(); fetchProfile(); }, []);

  // 1. TERTEMİZ VERİ ÇÖZÜMLEYİCİ (Sadece ihtiyacımız olanları okuruz)
  const parseTaskData = (desc) => {
    let category = 'Genel', difficulty = 'Kolay', checklists = [], start_date = '', isTrash = false, text = desc || '';
    
    if (text.includes('[TRASH]')) { isTrash = true; text = text.replace('[TRASH]', ''); }
    const sdMatch = text.match(/\[S:(.*?)\]/); if (sdMatch) { start_date = sdMatch[1]; text = text.replace(sdMatch[0], ''); }
    const catMatch = text.match(/\[C:(.*?)\]/); if (catMatch) { category = catMatch[1]; text = text.replace(catMatch[0], ''); }
    const difMatch = text.match(/\[D:(.*?)\]/); if (difMatch) { difficulty = difMatch[1]; text = text.replace(difMatch[0], ''); }
    const chkMatch = text.match(/\[K:(.*?)\]/);
    
    if (chkMatch && chkMatch[1]) {
      checklists = chkMatch[1].split('|').map(item => {
        const r = item.match(/(.*)\((1|0)\)/);
        return r ? { text: r[1], completed: r[2] === '1' } : null;
      }).filter(Boolean);
      text = text.replace(chkMatch[0], '');
    }
    return { start_date, category, difficulty, checklists, isTrash, text: text.trim() };
  };

  // 2. GÜVENLİ VERİ PAKETLEYİCİ
  const encodeDescription = (start, cat, diff, checks, txt, isTrash = false) => {
    const checkStr = checks.map(c => `${c.text}(${c.completed ? 1 : 0})`).join('|');
    return `${isTrash ? '[TRASH]' : ''}[S:${start}][C:${cat}][D:${diff}]${checkStr ? `[K:${checkStr}]` : ''} ${txt}`;
  };

  const safeDate = (dateStr) => {
    if (!dateStr) return null;
    try { return new Date(dateStr).toISOString().split('T')[0]; } catch { return null; }
  };

  // GÖREV EKLEME / GÜNCELLEME (API Birebir Eşleşiyor)
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (formData.due_date && formData.start_date > formData.due_date) return alert("HATA: Teslim tarihi başlangıçtan önce olamaz!");

      const encodedDesc = encodeDescription(formData.start_date, formData.category, formData.difficulty, formData.checklists, formData.description);

      const payload = { 
        title: formData.title, description: encodedDesc, priority: formData.priority, status: formData.status
      };
      if (formData.due_date) payload.due_date = safeDate(formData.due_date);

      if (editingTaskId) {
        await api.put(`/tasks/${editingTaskId}`, payload);
      } else {
        await api.post('/tasks', payload);
      }
      resetForm(); 
      fetchTasks();
    } catch (error) { alert('Sistem Hatası: ' + error.response?.data?.mesaj || 'Kayıt başarısız.'); }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', priority: 'Orta', status: 'Yapılacak', start_date: new Date().toISOString().split('T')[0], due_date: '', difficulty: 'Kolay', category: 'Yazılım', checklists: [] });
    setNewChecklistItem('');
    setEditingTaskId(null); 
  };

  const startEditing = (task) => {
    const parsed = parseTaskData(task.description);
    setFormData({
      title: task.title || '', description: parsed.text || '', category: parsed.category || 'Yazılım', difficulty: parsed.difficulty || 'Kolay',
      priority: task.priority || 'Orta', status: task.status || 'Yapılacak', 
      start_date: parsed.start_date || new Date().toISOString().split('T')[0], 
      due_date: task.due_date ? task.due_date.split('T')[0] : '', 
      checklists: parsed.checklists || []
    });
    setEditingTaskId(task.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const addChecklistItem = () => {
    if (!newChecklistItem.trim()) return;
    setFormData({ ...formData, checklists: [...formData.checklists, { text: newChecklistItem.slice(0, 30), completed: false }] });
    setNewChecklistItem('');
  };
  const removeChecklistItem = (index) => {
    const newLists = [...formData.checklists]; newLists.splice(index, 1);
    setFormData({ ...formData, checklists: newLists });
  };

  // CHECKLIST TIKLANINCA OTOMATİK DURUM DEĞİŞTİRME (Backend ENUM Uyumlu)
  const toggleTaskChecklist = async (task, parsedData, index) => {
    const newChecklists = [...parsedData.checklists];
    newChecklists[index].completed = !newChecklists[index].completed;
    
    const allDone = newChecklists.every(c => c.completed);
    const anyDone = newChecklists.some(c => c.completed);
    
    let newStatus = task.status;
    if (allDone) newStatus = 'Tamamlandı';
    else if (anyDone && task.status === 'Yapılacak') newStatus = 'Devam Ediyor';
    else if (!allDone && task.status === 'Tamamlandı') newStatus = 'Devam Ediyor';

    const encodedDesc = encodeDescription(parsedData.start_date, parsedData.category, parsedData.difficulty, newChecklists, parsedData.text, parsedData.isTrash);
    
    try {
      const payload = { title: task.title, priority: task.priority, status: newStatus, description: encodedDesc };
      if (task.due_date) payload.due_date = safeDate(task.due_date);
      await api.put(`/tasks/${task.id}`, payload);
      fetchTasks();
    } catch (error) { alert('Checklist güncellenemedi.'); }
  };

  // DOĞRUDAN DURUM GÜNCELLEME
  const handleStatusChange = async (task, newStatus) => { 
    try { 
      const payload = { title: task.title, description: task.description, priority: task.priority, status: newStatus };
      if (task.due_date) payload.due_date = safeDate(task.due_date);
      await api.put(`/tasks/${task.id}`, payload); 
      fetchTasks(); 
    } catch (error) { alert('Durum güncellenemedi.'); } 
  };

  // ÇÖP KUTUSU (SOFT DELETE - TRASH ETİKETİ EKLER)
  const handleSoftDelete = async (task) => {
    try {
      const p = parseTaskData(task.description);
      const encodedDesc = encodeDescription(p.start_date, p.category, p.difficulty, p.checklists, p.text, true); // isTrash = true
      const payload = { title: task.title, description: encodedDesc, priority: task.priority, status: task.status };
      if (task.due_date) payload.due_date = safeDate(task.due_date);

      await api.put(`/tasks/${task.id}`, payload);
      fetchTasks();
    } catch (error) { alert('Görev çöpe taşınamadı.'); }
  };

  // ÇÖP KUTUSUNDAN ÇIKAR
  const handleRestore = async (task) => {
    try {
      const p = parseTaskData(task.description);
      const encodedDesc = encodeDescription(p.start_date, p.category, p.difficulty, p.checklists, p.text, false); // isTrash = false
      const payload = { title: task.title, description: encodedDesc, priority: task.priority, status: task.status };
      if (task.due_date) payload.due_date = safeDate(task.due_date);

      await api.put(`/tasks/${task.id}`, payload);
      fetchTasks();
    } catch (error) { alert('Görev geri yüklenemedi.'); }
  };

  // KALICI OLARAK SİL (Soru sormadan direkt siler)
  const handleHardDelete = async (id) => { 
    try { 
      await api.delete(`/tasks/${id}`); 
      fetchTasks(); 
    } catch (error) { 
      alert("Silinemedi"); 
    } 
  };

  const aiAnalysis = useMemo(() => {
    if (!formData.due_date) return { score: 100, msg: "Analiz için teslim tarihini belirleyin.", color: "text-gray-400" };
    if (!formData.start_date) return { score: 100, msg: "Analiz için başlangıç tarihini belirleyin.", color: "text-gray-400" };
    
    const start = new Date(formData.start_date); const due = new Date(formData.due_date); const today = new Date(); today.setHours(0,0,0,0); 
    const totalDuration = Math.ceil((due - start) / (1000 * 60 * 60 * 24)) + 1; 
    const daysLeft = Math.ceil((due - today) / (1000 * 60 * 60 * 24)); 
    let score = 100;

    if (daysLeft < 0) return { score: 0, msg: "HATA: Son teslim tarihi geçmiş!", color: "text-red-500" };
    if (totalDuration <= 0) return { score: 0, msg: "HATA: Teslim tarihi başlangıçtan önce olamaz!", color: "text-red-500" };
    
    if (formData.difficulty === 'Zor' || formData.difficulty === 'İmkansız') {
      if (totalDuration < 3) score -= 50; else if (totalDuration < 7) score -= 20;
    } else { if (totalDuration < 1) score -= 30; }

    if (formData.priority === 'Yüksek') score -= 10;
    if (daysLeft <= 1) score -= 30; 

    const finalScore = Math.max(0, score);
    if (finalScore >= 80) return { score: finalScore, msg: "Zaman planlaması mükemmel. Rahatça tamamlanabilir.", color: "text-emerald-400" };
    if (finalScore >= 50) return { score: finalScore, msg: "Süre yeterli ancak disiplinli çalışma gerektirir.", color: "text-yellow-400" };
    return { score: finalScore, msg: "KRİTİK RİSK! Bu süre bu görev için çok dar. Görevi parçalayın.", color: "text-rose-500" };
  }, [formData.start_date, formData.due_date, formData.priority, formData.difficulty]);

  const getPriorityStyle = (priority) => {
    switch(priority) {
      case 'Yüksek': return 'from-rose-500/20 border-rose-500/50 text-rose-400';
      case 'Orta': return 'from-cyan-500/20 border-cyan-500/50 text-cyan-400';
      case 'Düşük': return 'from-gray-500/20 border-gray-500/50 text-gray-400';
      default: return 'from-gray-500/20 border-gray-500/50 text-gray-400';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Tamamlandı': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'Devam Ediyor': return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
      default: return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const allTasksWithParsedData = tasks.map(t => {
    const parsed = parseTaskData(t.description);
    return { ...t, parsedData: parsed };
  });

  const activeTasks = allTasksWithParsedData.filter(t => !t.parsedData.isTrash);
  const trashTasks = allTasksWithParsedData.filter(t => t.parsedData.isTrash);

  const counts = {
    Tümü: activeTasks.length,
    Yapılacak: activeTasks.filter(t => t.status === 'Yapılacak').length,
    'Devam Ediyor': activeTasks.filter(t => t.status === 'Devam Ediyor').length,
    Tamamlandı: activeTasks.filter(t => t.status === 'Tamamlandı').length,
    'Çöp Kutusu': trashTasks.length,
  };

  const displayedTasks = (activeFilter === 'Çöp Kutusu' ? trashTasks : activeTasks)
    .filter(t => activeFilter === 'Tümü' || activeFilter === 'Çöp Kutusu' ? true : t.status === activeFilter)
    .sort((a, b) => {
      if (a.status === 'Tamamlandı' && b.status !== 'Tamamlandı') return 1;
      if (a.status !== 'Tamamlandı' && b.status === 'Tamamlandı') return -1;
      return new Date(a.due_date) - new Date(b.due_date);
    });

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-10 font-sans selection:bg-cyan-500/20">
      
      <header className="flex justify-between items-center bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-8 rounded-3xl relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl group-hover:bg-cyan-500/20 transition-colors"></div>
        <div className="relative z-10">
          <h2 className="text-4xl font-black text-white mb-2 tracking-tight">
            Görev Yöneticisi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">{userName}</span>.
          </h2>
          <p className="text-gray-400 flex items-center gap-2 font-medium tracking-wide">
            <Activity size={18} className="text-cyan-400" /> Sistemde {counts.Tümü} aktif görev bulunuyor.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        <div className="xl:col-span-4">
          <AnimatePresence mode="wait">
            {activeFilter !== 'Çöp Kutusu' ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="bg-[#0a0a0a]/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl sticky top-8 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                  <Crosshair className="text-cyan-400" /> {editingTaskId ? "Görevi Güncelle" : "Yeni Görev Planla"}
                </h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <input type="text" placeholder="Görev Başlığı" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none transition-all placeholder:text-gray-600" />
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Mevcut Durum</label>
                      <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none appearance-none">
                        <option value="Yapılacak" className="bg-gray-900">Yapılacak</option>
                        <option value="Devam Ediyor" className="bg-gray-900">Devam Ediyor</option>
                        <option value="Tamamlandı" className="bg-gray-900 text-emerald-400">Tamamlandı</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Zorluk</label>
                      <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none appearance-none">
                        <option value="Kolay" className="bg-gray-900">Kolay</option>
                        <option value="Orta" className="bg-gray-900">Orta</option>
                        <option value="Zor" className="bg-gray-900 text-yellow-400">Zor</option>
                        <option value="İmkansız" className="bg-gray-900 text-rose-500">Çok Zor</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Öncelik</label>
                      <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none appearance-none">
                        <option value="Düşük" className="bg-gray-900">Düşük</option>
                        <option value="Orta" className="bg-gray-900">Normal</option>
                        <option value="Yüksek" className="bg-gray-900 text-rose-400">Kritik</option>
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Kategori</label>
                      <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none appearance-none">
                        <option value="Siber Güvenlik" className="bg-gray-900">Siber Güvenlik</option>
                        <option value="Yapay Zeka" className="bg-gray-900">Yapay Zeka</option>
                        <option value="Yazılım" className="bg-gray-900">Yazılım</option>
                        <option value="Araştırma" className="bg-gray-900">Araştırma</option>
                        <option value="Kişisel" className="bg-gray-900">Kişisel</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block flex items-center gap-1"><CalendarCheck size={12}/> Başlangıç</label>
                      <input type="date" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-gray-300 focus:border-cyan-500 outline-none [color-scheme:dark]" />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block flex items-center gap-1"><Clock size={12}/> Teslim</label>
                      <input type="date" required value={formData.due_date} onChange={e => setFormData({...formData, due_date: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-gray-300 focus:border-cyan-500 outline-none [color-scheme:dark]" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-white/10">
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-2 flex items-center gap-1"><ListTodo size={12}/> Alt Görevler (Opsiyonel)</label>
                    <div className="flex gap-2 mb-3">
                      <input type="text" placeholder="Adım ekle..." value={newChecklistItem} onChange={e => setNewChecklistItem(e.target.value)} onKeyDown={e => { if(e.key === 'Enter') { e.preventDefault(); addChecklistItem(); } }} className="flex-1 bg-black/40 border border-white/10 rounded-xl py-2 px-3 text-sm text-white focus:border-cyan-500 outline-none" />
                      <button type="button" onClick={addChecklistItem} className="px-3 bg-white/10 hover:bg-white/20 rounded-xl text-white"><Plus size={18}/></button>
                    </div>
                    <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                      {formData.checklists.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center bg-black/20 p-2 rounded-lg border border-white/5">
                          <span className="text-sm text-gray-300">{item.text}</span>
                          <button type="button" onClick={() => removeChecklistItem(idx)} className="text-red-400"><X size={14}/></button>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] text-gray-500 uppercase font-bold mb-1 block">Görev Açıklaması</label>
                    <textarea placeholder="Detaylar..." rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500 outline-none resize-none" />
                  </div>

                  <div className={`p-4 rounded-xl border ${aiAnalysis.score >= 80 ? 'bg-emerald-500/10 border-emerald-500/30' : aiAnalysis.score >= 50 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-rose-500/10 border-rose-500/30'} shadow-inner`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Brain size={16} className={aiAnalysis.color} />
                      <span className={`text-xs font-bold uppercase ${aiAnalysis.color}`}>Yapay Zeka (Skor: {aiAnalysis.score})</span>
                    </div>
                    <p className="text-sm text-gray-300">{aiAnalysis.msg}</p>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className={`flex-1 py-4 rounded-xl font-bold text-white shadow-lg transition-all flex justify-center items-center gap-2 ${editingTaskId ? 'bg-gradient-to-r from-yellow-600 to-orange-600' : 'bg-gradient-to-r from-cyan-600 to-blue-600'}`}>
                      {editingTaskId ? <><RefreshCw size={20} /> Güncelle</> : <><Plus size={20} /> Kaydet</>}
                    </motion.button>
                    {editingTaskId && <motion.button type="button" onClick={resetForm} className="py-4 px-6 bg-white/5 border border-white/10 rounded-xl text-gray-400">İptal</motion.button>}
                  </div>
                </form>
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col items-center justify-center h-[400px] border border-dashed border-red-500/20 rounded-3xl bg-red-500/5">
                <Trash size={60} className="text-red-500/40 mb-4" />
                <h3 className="text-2xl font-bold text-red-400/50">Çöp Kutusu</h3>
                <p className="text-gray-500 text-center mt-2 px-4">
                  Silinen görevler burada saklanır. İstediğin zaman geri yükleyebilirsin.
                  <span className="block mt-4 text-red-400 font-bold border border-red-500/20 bg-red-500/10 py-2 px-3 rounded-xl">
                    DİKKAT: Buradan silinen görevler kalıcı olarak veritabanından silinir!
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* SAĞ: GÖREV LİSTESİ VE FİLTRELER */}
        <div className="xl:col-span-8 space-y-6">
          
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0a0a0a]/50 p-2 rounded-2xl border border-white/5 shadow-inner">
            <div className="flex flex-wrap items-center gap-3">
              <div className="px-3 text-gray-500"><Filter size={18} /></div>
              {['Tümü', 'Yapılacak', 'Devam Ediyor', 'Tamamlandı'].map((filterType) => (
                <button key={filterType} onClick={() => setActiveFilter(filterType)} className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${activeFilter === filterType ? 'bg-white/10 text-white shadow-md border border-white/20' : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'}`}>
                  {filterType} <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${activeFilter === filterType ? 'bg-cyan-500/20 text-cyan-400' : 'bg-black/50 text-gray-500'}`}>{counts[filterType]}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setActiveFilter('Çöp Kutusu')} className={`px-4 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 ${activeFilter === 'Çöp Kutusu' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'text-gray-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent'}`}>
              <Trash2 size={16} /> Çöp Kutusu <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-black/50">{counts['Çöp Kutusu']}</span>
            </button>
          </div>

          <AnimatePresence mode='popLayout'>
            {displayedTasks.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center justify-center h-[400px] border border-dashed border-white/10 rounded-3xl bg-white/5 shadow-inner">
                <ShieldAlert size={60} className="text-gray-600 mb-4" />
                <h3 className="text-2xl font-bold text-gray-400">Liste Boş</h3>
                <p className="text-gray-500 mt-2 font-medium">Bu görünüme ait görev bulunamadı.</p>
              </motion.div>
            ) : (
              displayedTasks.map((task) => {
                const parsedData = task.parsedData;
                const totalSubs = parsedData.checklists.length;
                const completedSubs = parsedData.checklists.filter(c => c.completed).length;
                const progressPercent = totalSubs > 0 ? Math.round((completedSubs / totalSubs) * 100) : (task.status === 'Tamamlandı' ? 100 : 0);

                return (
                  <motion.div layout key={task.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }} className={`relative overflow-hidden group bg-gradient-to-br from-[#121212] to-[#0a0a0a] border-l-4 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,255,255,0.03)] ${activeFilter === 'Çöp Kutusu' ? 'border-red-500/50 opacity-75' : task.status === 'Tamamlandı' ? 'border-emerald-500 opacity-60' : 'border-white/10 hover:border-cyan-400'}`}>
                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start gap-6">
                      
                      <div className="flex-1 w-full">
                        <div className="flex flex-wrap items-center gap-3 mb-3 pb-3 border-b border-white/5">
                          <h4 className={`text-2xl font-black tracking-tight ${task.status === 'Tamamlandı' || activeFilter === 'Çöp Kutusu' ? 'line-through text-gray-500' : 'text-white'}`}>{task.title}</h4>
                          <span className={`flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded border shadow-inner ${getStatusColor(task.status)}`}>{task.status}</span>
                          <span className="flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-1 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30"><Tag size={12}/> {parsedData.category}</span>
                        </div>
                        
                        {parsedData.text && (
                          <div className="mb-4 bg-black/30 p-4 rounded-xl border border-white/5">
                            <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase mb-2"><AlignLeft size={14}/> Detaylar</span>
                            <p className="text-gray-300 text-sm">{parsedData.text}</p>
                          </div>
                        )}
                        
                        {totalSubs > 0 && activeFilter !== 'Çöp Kutusu' && (
                          <div className="mb-5 bg-black/40 rounded-xl p-4 border border-white/5 shadow-inner">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-gray-400 uppercase">İlerleme Adımları</span>
                              <span className="text-xs font-bold text-cyan-400 font-mono">% {progressPercent}</span>
                            </div>
                            <div className="w-full bg-gray-800 rounded-full h-2 mb-4 overflow-hidden border border-white/5">
                              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-500" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <div className="space-y-2.5">
                              {parsedData.checklists.map((chk, idx) => (
                                <label key={idx} className="flex items-center gap-3 cursor-pointer group/chk select-none">
                                  <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${chk.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-600 bg-gray-900 group-hover/chk:border-cyan-400'}`}>
                                    {chk.completed && <CheckCircle size={14} />}
                                  </div>
                                  <span className={`text-sm font-semibold transition-colors ${chk.completed ? 'text-gray-600 line-through' : 'text-gray-300 group-hover/chk:text-white'}`}>{chk.text}</span>
                                  <input type="checkbox" className="hidden" checked={chk.completed} onChange={() => toggleTaskChecklist(task, parsedData, idx)} />
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-4 text-xs font-medium mt-2 bg-black/20 p-3 rounded-lg border border-white/5">
                          <span className={`px-3 py-1.5 rounded-full border shadow-sm ${getPriorityStyle(task.priority)}`}>{task.priority} Öncelik</span>
                          <span className="flex items-center gap-1.5 text-gray-300"><CalendarCheck size={14} className="text-emerald-400" /> {parsedData.start_date ? new Date(parsedData.start_date).toLocaleDateString() : 'Belirtilmedi'}</span>
                          <span className="flex items-center gap-1.5 text-gray-300"><Clock size={14} className="text-cyan-400" /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : 'Belirtilmedi'}</span>
                        </div>
                      </div>
                      
                      <div className="flex flex-row md:flex-col gap-2.5 w-full md:w-auto mt-4 md:mt-0 pt-4 md:pt-0 border-t md:border-t-0 border-white/5">
                        
                        {activeFilter === 'Çöp Kutusu' ? (
                          <>
                            <button onClick={() => handleRestore(task)} className="flex-1 md:flex-none px-4 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn" title="Geri Yükle">
                              <ArchiveRestore size={18} className="group-hover/btn:scale-110 transition-transform" /> <span className="font-bold md:hidden">Geri Yükle</span>
                            </button>
                            <button onClick={() => handleHardDelete(task.id)} className="flex-1 md:flex-none px-4 py-3 bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn" title="DİKKAT: Bu görev kalıcı olarak veritabanından silinir">
                              <Trash size={18} className="group-hover/btn:scale-110 transition-transform" /> <span className="font-bold md:hidden">Kalıcı Sil</span>
                            </button>
                          </>
                        ) : (
                          <>
                            {task.status === 'Tamamlandı' ? (
                              <button onClick={() => handleStatusChange(task, 'Devam Ediyor')} className="flex-1 md:flex-none px-4 py-3 bg-yellow-500/10 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn" title="Geri Al">
                                <Undo2 size={18} className="group-hover/btn:-rotate-45 transition-transform" />
                              </button>
                            ) : (
                              <button onClick={() => handleStatusChange(task, 'Tamamlandı')} className="flex-1 md:flex-none px-4 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn" title="Tamamla">
                                <CheckCircle size={18} className="group-hover/btn:scale-110 transition-transform" />
                              </button>
                            )}
                            <button onClick={() => startEditing(task)} className="flex-1 md:flex-none px-4 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn" title="Düzenle">
                              <Edit2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                            <button onClick={() => handleSoftDelete(task)} className="flex-1 md:flex-none px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 group/btn" title="Çöpe At">
                              <Trash2 size={18} className="group-hover/btn:scale-110 transition-transform" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Tasks;

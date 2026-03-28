import { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
// YENİ EKLENTİ: Monitor ikonunu lucide-react'ten import ettik
import { LayoutDashboard, CheckSquare, User, LogOut, Activity, ChevronLeft, ChevronRight, Monitor } from 'lucide-react';
import api from '../api'; 

const Layout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profile, setProfile] = useState({ name: 'Kullanıcı', email: 'Yükleniyor...' });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await api.get('/auth/profile');
        setProfile({ name: response.data.name, email: response.data.email });
      } catch (error) {
        console.error('Profil getirilemedi', error);
      }
    };
    fetchProfile();
  }, []);

  const handleLogout = () => {
    if (window.confirm('Sistemden çıkış yapmak istediğinize emin misiniz?')) {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  // YENİ EKLENTİ: '/system' rotasını menünün en üstüne ekledik
  const menuItems = [
    { path: '/system', icon: <Monitor size={24} />, label: 'Sistem' },
    { path: '/dashboard', icon: <LayoutDashboard size={24} />, label: 'Analiz' },
    { path: '/tasks', icon: <CheckSquare size={24} />, label: 'Görevler' },
    { path: '/profile', icon: <User size={24} />, label: 'Profilim' },
  ];

  return (
    <div className="flex h-screen bg-[#050505] text-gray-100 overflow-hidden font-sans selection:bg-cyan-500/30">
      
      {/* Arka Plan Atmosferi */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-cyan-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-blue-900/20 rounded-full blur-[120px]"></div>
      </div>

      {/* SİDEBAR (Yan Menü) - Glassmorphism */}
      <motion.div 
        initial={{ width: 280 }}
        animate={{ width: isCollapsed ? 88 : 280 }}
        transition={{ duration: 0.4, type: "spring", bounce: 0.1 }}
        className="relative z-10 h-full bg-white/5 backdrop-blur-2xl border-r border-white/10 flex flex-col justify-between"
      >
        <div>
          {/* Logo Alanı */}
          <div className="p-6 flex items-center justify-between border-b border-white/10 h-[88px]">
            <motion.div 
              className={`flex items-center gap-3 overflow-hidden ${isCollapsed ? 'justify-center w-full' : ''}`}
            >
              <div className="p-2 shrink-0 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-[0_0_15px_rgba(6,182,212,0.5)]">
                <Activity size={24} className="text-white" />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.h1 
                    initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}
                    className="text-2xl font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 whitespace-nowrap"
                  >
                    TASK<span className="text-white">Nexus</span>
                  </motion.h1>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Menü Linkleri */}
          <nav className="p-4 space-y-2 mt-2">
            {menuItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  relative flex items-center gap-4 p-3 rounded-2xl transition-all duration-300 group overflow-hidden
                  ${isActive ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-400 border border-cyan-500/30 shadow-[0_0_20px_rgba(6,182,212,0.15)]' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'}
                  ${isCollapsed ? 'justify-center' : ''}
                `}
                title={isCollapsed ? item.label : ""}
              >
                {({ isActive }) => (
                  <>
                    {isActive && <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1.5 bg-cyan-400 shadow-[0_0_15px_rgba(34,211,238,1)] rounded-r-full" />}
                    <div className="relative z-10 flex items-center gap-4">
                      <div className="shrink-0">{item.icon}</div>
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.span 
                            initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: "auto" }} exit={{ opacity: 0, width: 0 }}
                            className="font-semibold tracking-wide whitespace-nowrap"
                          >
                            {item.label}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </div>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Alt Kısım: Mini Profil, Daraltma ve Çıkış */}
        <div className="p-4 border-t border-white/10 flex flex-col gap-2">
          
          <div 
            onClick={() => navigate('/profile')}
            className={`flex items-center gap-3 p-2 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 hover:border-cyan-500/30 transition-all cursor-pointer group ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? "Profile Git" : ""}
          >
            <div className="w-10 h-10 shrink-0 bg-[#0a0a0a] border border-cyan-500/50 rounded-full flex items-center justify-center text-sm font-bold text-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.2)] relative group-hover:shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-shadow">
              {getInitials(profile.name)}
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[#0a0a0a] rounded-full"></div>
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-white truncate">{profile.name}</p>
                <p className="text-xs text-gray-500 truncate group-hover:text-gray-300 transition-colors">{profile.email}</p>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="flex items-center justify-center w-full p-3 text-gray-400 hover:text-white hover:bg-white/5 rounded-2xl transition-colors mt-2"
            title={isCollapsed ? "Menüyü Genişlet" : ""}
          >
            {isCollapsed ? <ChevronRight size={24} /> : <div className="flex items-center gap-4 w-full"><ChevronLeft size={24} /><span className="font-medium whitespace-nowrap">Daralt</span></div>}
          </button>
          
          <button 
            onClick={handleLogout}
            className={`flex items-center gap-4 w-full p-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-2xl transition-all group ${isCollapsed ? 'justify-center' : ''}`}
            title={isCollapsed ? "Çıkış Yap" : ""}
          >
            <LogOut size={24} className="shrink-0 group-hover:scale-110 transition-transform" />
            {!isCollapsed && <span className="font-semibold whitespace-nowrap">Çıkış Yap</span>}
          </button>
        </div>
      </motion.div>

      {/* ANA İÇERİK ALANI (Sayfaların geleceği yer) */}
      <main className="relative z-10 flex-1 h-full overflow-y-auto overflow-x-hidden p-8">
        <Outlet />
      </main>

    </div>
  );
};

export default Layout;

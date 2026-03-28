import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';
import { Mail, Lock, User, ShieldCheck, Fingerprint } from 'lucide-react';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email: formData.email, password: formData.password });
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
        window.location.reload(); 
      } else {
        await api.post('/auth/register', formData);
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.response?.data?.mesaj || 'Erişim reddedildi, protokolü kontrol edin.');
    } finally { setLoading(false); }
  };

  return (
    // ANA KONTEYNER (HTML/CSS'teki body özellikleri)
    <div className="min-h-screen flex items-center justify-center bg-[#050210] relative overflow-hidden font-sans text-white perspective-[1000px] selection:bg-cyan-500/30">
      
      {/* 1. 3D ARKA PLAN GRID AĞ (HTML/CSS'teki .bg-grid) */}
      <div 
        className="absolute top-[-50%] left-[-50%] w-[200vw] h-[200vh] -z-10"
        style={{
          backgroundImage: `
            linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
          transform: 'rotateX(60deg) translateY(-100px)',
          animation: 'gridMove 20s linear infinite'
        }}
      >
        <style>{`
          @keyframes gridMove {
            0% { transform: rotateX(60deg) translateY(0); }
            100% { transform: rotateX(60deg) translateY(50px); }
          }
          @keyframes rotateNeon {
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>

      {/* ANA LOGİN KARTI (.login-box) */}
      <div className="relative w-full max-w-[420px] p-1 mx-4">
        
        {/* KARTIN ETRAFINDA DÖNEN NEON ÇİZGİ ANİMASYONU (.login-box::before) */}
        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] z-[-2]"
             style={{
               background: 'conic-gradient(transparent, rgba(0, 255, 255, 0.8), transparent 30%)',
               animation: 'rotateNeon 4s linear infinite'
             }}>
        </div>
        
        {/* İÇ KART ARKAPLANI (.login-box::after) */}
        <div className="absolute inset-[2px] bg-[rgba(10,10,25,0.85)] rounded-[18px] backdrop-blur-[20px] z-[-1]"></div>

        {/* KARTIN İÇERİĞİ (.login-box içeriği) */}
        <div className="relative z-10 p-8 md:p-10 flex flex-col items-center shadow-[0_0_40px_rgba(0,255,255,0.1),inset_0_0_20px_rgba(138,43,226,0.2)] rounded-[20px] overflow-hidden bg-[rgba(10,10,30,0.6)] backdrop-blur-[12px]">
          
          {/* USER AVATARI (Resimdeki sağ üst detay) */}
          <div className="absolute top-5 right-5 flex items-center gap-2">
            <span className="text-gray-300 font-medium text-xs">User</span>
            <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
              <User size={16} className="text-gray-400" />
            </div>
          </div>

          {/* KALKAN VE LOGO ALANI (.logo-area) */}
          <div className="text-center mb-8 relative mt-2 w-full flex flex-col items-center">
            
            {/* Orijinal tasarımdaki devasa dönen halkalar */}
            <div className="relative w-[110px] h-[110px] mb-4 flex items-center justify-center">
               <svg className="absolute w-[110px] h-[110px] text-purple-500/60 animate-[spin_10s_linear_infinite]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="10 5" />
              </svg>
              <svg className="absolute w-[80px] h-[80px] text-cyan-400/80 animate-[spin_8s_linear_infinite_reverse]" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="20 10" />
              </svg>
              <ShieldCheck className="w-12 h-12 text-[#00ffff] drop-shadow-[0_0_10px_#00ffff]" strokeWidth={1.5} />
            </div>

            <h1 className="m-0 text-4xl font-black tracking-[2px] drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]">TaskNexus</h1>
            <p className="m-0 mt-1 text-[#8b9bb4] tracking-[3px] text-[10px] uppercase font-bold">Görev ve Analiz Platformu</p>
          </div>

          {/* HATA MESAJI */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, height: 0 }} className="w-full mb-4">
                <p className="text-[11px] font-semibold text-rose-300 bg-rose-500/10 border border-rose-500/30 p-2 rounded-lg text-center">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="w-full space-y-6">
            
            {/* KAYIT MODU - İSİM */}
            <AnimatePresence mode='wait'>
              {!isLogin && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="relative">
                  <label className="block mb-2 text-[#00ffff] text-[10px] tracking-[1px] uppercase font-bold">Kullanıcı Adı</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                    <input type="text" placeholder="İsim" required={!isLogin} className="w-full p-3 pl-11 bg-[rgba(0,20,40,0.5)] border border-[rgba(0,255,255,0.3)] rounded-lg text-white text-sm outline-none transition-all duration-300 focus:border-[#00ffff] focus:bg-[rgba(0,40,60,0.5)] focus:shadow-[0_0_15px_rgba(0,255,255,0.3),inset_0_0_10px_rgba(0,255,255,0.1)]" onChange={(e) => setFormData({...formData, name: e.target.value})} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* E-POSTA ALANI */}
            <div className="relative">
              <label className="block mb-2 text-[#00ffff] text-[10px] tracking-[1px] uppercase font-bold">Eposta</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="email" placeholder="user@testcase.com" required className="w-full p-3 pl-11 bg-[rgba(0,20,40,0.5)] border border-[rgba(0,255,255,0.3)] rounded-lg text-white text-sm outline-none transition-all duration-300 focus:border-[#00ffff] focus:bg-[rgba(0,40,60,0.5)] focus:shadow-[0_0_15px_rgba(0,255,255,0.3),inset_0_0_10px_rgba(0,255,255,0.1)]" onChange={(e) => setFormData({...formData, email: e.target.value})} />
              </div>
            </div>

            {/* ŞİFRE ALANI VE BİYOMETRİK İKON */}
            <div className="relative">
              <label className="block mb-2 text-[#00ffff] text-[10px] tracking-[1px] uppercase font-bold">Erişim Anahtarı</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="password" placeholder="Şifre veya Biyometri" required className="w-full p-3 pl-11 pr-12 bg-[rgba(0,20,40,0.5)] border border-[rgba(0,255,255,0.3)] rounded-lg text-white text-sm outline-none transition-all duration-300 focus:border-[#00ffff] focus:bg-[rgba(0,40,60,0.5)] focus:shadow-[0_0_15px_rgba(0,255,255,0.3),inset_0_0_10px_rgba(0,255,255,0.1)] peer" onChange={(e) => setFormData({...formData, password: e.target.value})} />
                
                {/* Orijinal CSS'teki Biyometrik Parmak İzi (.fingerprint) */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-60 peer-focus:opacity-100 peer-focus:drop-shadow-[0_0_8px_#00ffff] transition-all duration-300 pointer-events-none">
                  <Fingerprint className="w-5 h-5 text-[#00ffff]" strokeWidth={1.5} />
                </div>
              </div>
            </div>

            {/* SİSTEME GİR BUTONU (Orijinal Gradient) */}
            <motion.button 
              type="submit" disabled={loading} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="w-full mt-6 p-[15px] bg-gradient-to-r from-[#003366] via-[#0077b6] to-[#00b4d8] hover:from-[#0077b6] hover:via-[#00b4d8] hover:to-[#48cae4] border border-[#00ffff] rounded-lg text-white text-sm font-bold tracking-[2px] uppercase shadow-[0_0_15px_rgba(0,180,216,0.4)] hover:shadow-[0_0_25px_rgba(0,255,255,0.6)] hover:text-shadow-[0_0_5px_white] transition-all duration-300 flex items-center justify-center gap-2"
              style={{ textShadow: '0 0 2px rgba(255,255,255,0.5)' }}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                isLogin ? <>➔ SİSTEME GİR</> : <>➔ KİMLİĞİ OLUŞTUR</>
              )}
            </motion.button>
          </form>

          {/* ALT YAZI (.footer) */}
          <footer className="mt-8 text-center text-[11px] text-[#6b7a90] tracking-wide w-full">
            <button type="button" onClick={() => { setIsLogin(!isLogin); setError(''); }} className="hover:text-[#00ffff] transition-all duration-300" style={{ textShadow: 'none' }}>
              {isLogin ? (
                <>Yeni kimlik oluşturmak ister misiniz? <span className="text-[#00ffff] hover:underline hover:drop-shadow-[0_0_5px_#00ffff]">Yeni Kimlik Oluştur</span></>
              ) : (
                <>Mevcut kimliğinizle giriş yapın. <span className="text-[#00ffff] hover:underline hover:drop-shadow-[0_0_5px_#00ffff]">Sisteme Gir</span></>
              )}
            </button>
          </footer>

        </div>
      </div>
    </div>
  );
};

export default Login;

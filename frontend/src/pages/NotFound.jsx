import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

const NotFound = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-6 selection:bg-cyan-500/30">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-md w-full">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <ShieldAlert size={80} className="text-cyan-500/50 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]" />
            <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xl font-black text-white">404</span>
          </div>
        </div>
        
        <h1 className="text-3xl font-black text-white mb-4">Sektör Bulunamadı</h1>
        <p className="text-gray-400 mb-8">Erişmeye çalıştığınız koordinatlar TaskNexus veri tabanında mevcut değil veya yetkiniz kısıtlanmış olabilir.</p>
        
        <Link to="/dashboard" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)]">
          <ArrowLeft size={20} /> Güvenli Bölgeye Dön
        </Link>
      </motion.div>
    </div>
  );
};

export default NotFound;

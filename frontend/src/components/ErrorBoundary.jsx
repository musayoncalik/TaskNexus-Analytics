import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error.message };
  }

  componentDidCatch(error, errorInfo) {
    // Burada loglama servisine hata gönderilebilir (Case 5 uyumluluğu)
    console.error("KRİTİK SİSTEM HATASI:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 font-sans selection:bg-rose-500/30 text-white">
          <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-rose-900/10 rounded-full blur-[120px]"></div>
          </div>
          
          <div className="relative z-10 max-w-lg w-full bg-[#0a0a0a]/80 backdrop-blur-xl border border-rose-500/20 p-8 rounded-3xl shadow-[0_0_50px_rgba(225,29,72,0.1)] text-center">
            <div className="w-20 h-20 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_20px_rgba(225,29,72,0.2)]">
              <AlertTriangle size={40} className="text-rose-500" />
            </div>
            
            <h1 className="text-3xl font-black mb-3">Sistem Çöktü</h1>
            <p className="text-gray-400 mb-6 text-sm">TaskNexus arayüzünde beklenmeyen bir çekirdek hatası meydana geldi. Korumalı moda geçildi.</p>
            
            <div className="bg-black/50 border border-rose-500/10 rounded-xl p-4 text-left mb-8 overflow-x-auto">
              <p className="text-xs font-mono text-rose-400">Hata Logu:</p>
              <p className="text-xs font-mono text-gray-300 mt-1">{this.state.errorMsg || "Bilinmeyen Fatal Error"}</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => window.location.reload()} className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-xl transition-colors">
                <RefreshCw size={18} /> Sistemi Yeniden Başlat
              </button>
              <button onClick={() => window.location.href = '/dashboard'} className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition-colors">
                <Home size={18} /> Ana Ekrana Dön
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;

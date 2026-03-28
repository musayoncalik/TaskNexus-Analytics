import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import System from './pages/System';
import Profile from './pages/Profile';
import Layout from './components/Layout'; 
import ErrorBoundary from './components/ErrorBoundary';
import NotFound from './pages/NotFound';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    // 1. UYGULAMANIN ETRAFINI HATA YAKALAYICI İLE SARIYORUZ
    <ErrorBoundary>
      <Routes>
        {/* Kullanıcı giriş yaptıysa direkt /system ekranına yönlendir */}
        <Route path="/login" element={isAuthenticated ? <Navigate to="/system" /> : <Login />} />
        
        {/* SADECE GİRİŞ YAPANLARIN GÖRECEĞİ EKRANLAR LAYOUT İÇİNDE */}
        <Route element={isAuthenticated ? <Layout /> : <Navigate to="/login" />}>
          {/* Sitenin ana kökü (/) artık System sayfasına gidecek */}
          <Route path="/" element={<Navigate to="/system" />} />
          
          <Route path="/system" element={<System />} /> {/* YENİ EKLENEN: Sistem Rotası */}
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
        
        {/* 2. 404 KORUMA SAYFASI: Üstteki hiçbir URL ile eşleşmezse bu sayfa açılır */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </ErrorBoundary>
  );
}

export default App;

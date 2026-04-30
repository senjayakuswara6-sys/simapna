import React, { useState, useEffect } from 'react';
import { auth, signInWithGoogle, db, handleFirestoreError } from './lib/firebase';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { GraduationCap, LogIn, LogOut, Users, Settings as SettingsIcon, FileText, LayoutDashboard, Plus, Download, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import StudentTable from './components/StudentTable';
import SettingsForm from './components/SettingsForm';
import Dashboard from './components/Dashboard';
import PublicSearch from './components/PublicSearch';
import SubjectManager from './components/SubjectManager';

interface SchoolSettings {
  schoolName: string;
  secondaryLogoUrl: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'settings' | 'subjects'>('dashboard');
  const [isPublicView, setIsPublicView] = useState(true);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [generalSnap, uiLogoSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_ui'))
        ]);
        
        if (generalSnap.exists()) {
          const data = generalSnap.data();
          setSettings({
            schoolName: data.schoolName || 'SIMAPNA',
            secondaryLogoUrl: uiLogoSnap.exists() ? uiLogoSnap.data().url : ''
          });
        }
      } catch (error) {
        handleFirestoreError(error, 'get', 'settings/general');
      }
    };
    fetchSettings();
  }, [user]);

  useEffect(() => {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      if (user) setIsPublicView(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isPublicView) {
    return (
      <div className="relative">
        <PublicSearch />
        <button 
          onClick={() => setIsPublicView(false)}
          className="fixed bottom-6 right-6 bg-white/80 backdrop-blur-md text-slate-600 px-4 py-2 rounded-full text-xs font-bold shadow-lg border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
        >
          <LogIn className="w-4 h-4" />
          Halaman Admin
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative"
        >
          <button 
            onClick={() => setIsPublicView(true)}
            className="absolute top-4 left-4 text-slate-400 hover:text-slate-600 text-sm flex items-center gap-1"
          >
            Kembali ke Cek NISN
          </button>
          <div className="bg-blue-100 p-4 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6 mt-4">
            {settings?.secondaryLogoUrl ? (
              <img src={settings.secondaryLogoUrl} alt="Logo" className="w-12 h-12 object-contain" />
            ) : (
              <GraduationCap className="w-10 h-10 text-blue-600" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2 truncate px-4">
            {settings?.schoolName || 'SIMAPNA'}
          </h1>
          <p className="text-gray-500 mb-8">Sistem Informasi Kelulusan Siswa</p>
          <button
            onClick={signInWithGoogle}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-200"
          >
            <LogIn className="w-5 h-5" />
            Masuk dengan Google
          </button>
          <p className="mt-6 text-xs text-gray-400">
            Hanya Admin yang dapat mengakses sistem ini.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-50 flex overflow-hidden print:static print:block print:overflow-visible print:bg-white simapna-app">
      {/* Desktop Sidebar - Strictly hidden on mobile */}
      <aside className="w-72 bg-white border-r border-slate-200 hidden md:flex flex-col shrink-0 print:hidden">
        <div className="p-6 flex items-center gap-3 border-b border-slate-100 min-h-[88px]">
          <div className="bg-blue-600 p-1.5 rounded-lg shadow-lg shadow-blue-100 shrink-0">
            {settings?.secondaryLogoUrl ? (
              <img src={settings.secondaryLogoUrl} alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
            ) : (
              <GraduationCap className="w-6 h-6 text-white" />
            )}
          </div>
          <span className="font-black text-lg text-slate-800 tracking-tight truncate">
            {settings?.schoolName || 'SIMAPNA'}
          </span>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <SidebarLink 
            icon={<LayoutDashboard />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
          />
          <SidebarLink 
            icon={<Users />} 
            label="Data Siswa" 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')} 
          />
          <SidebarLink 
            icon={<BookOpen />} 
            label="Mata Pelajaran" 
            active={activeTab === 'subjects'} 
            onClick={() => setActiveTab('subjects')} 
          />
          <SidebarLink 
            icon={<SettingsIcon />} 
            label="Pengaturan" 
            active={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')} 
          />
        </nav>

        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          {deferredPrompt && (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-xl transition-all shadow-lg hover:shadow-blue-200 mb-4 text-xs font-bold"
            >
              <Download className="w-4 h-4" />
              INSTAL APLIKASI
            </button>
          )}
          <div className="flex items-center gap-3 mb-4 p-2">
            <img src={user.photoURL || ''} alt="" className="w-10 h-10 rounded-full border-2 border-white shadow-sm" />
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-slate-800 truncate">{user.displayName}</p>
              <p className="text-[10px] text-slate-500 truncate font-medium uppercase">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-red-600 hover:bg-red-50 p-2.5 rounded-lg transition-all text-xs font-bold border border-transparent hover:border-red-100"
          >
            <LogOut className="w-4 h-4" />
            KELUAR SISTEM
          </button>
        </div>
      </aside>

      {/* Main Content */}
       <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative h-full print:block print:h-auto print:static print:bg-white">
         {/* Mobile Header (Fixed) */}
         <header className="md:hidden sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200 p-4 flex items-center justify-between shadow-sm h-16 shrink-0 print:hidden">
           <div className="flex items-center gap-2 overflow-hidden">
             <div className="bg-blue-600 p-1.5 rounded-lg shadow-md shadow-blue-100 shrink-0">
                {settings?.secondaryLogoUrl ? (
                  <img src={settings.secondaryLogoUrl} alt="Logo" className="w-5 h-5 object-contain brightness-0 invert" />
                ) : (
                  <GraduationCap className="w-5 h-5 text-white" />
                )}
             </div>
             <span className="font-extrabold text-lg text-slate-800 tracking-tight truncate">
               {settings?.schoolName || 'SIMAPNA'}
             </span>
           </div>
           <div className="flex items-center gap-2 shrink-0">
             {deferredPrompt && (
               <button 
                 onClick={handleInstallClick}
                 className="bg-blue-600 text-white text-[10px] font-bold px-3 py-2 rounded-lg flex items-center gap-1 shadow-md active:scale-95 transition-transform"
               >
                 <Download className="w-3 h-3" />
                 INSTAL
               </button>
             )}
             <button onClick={() => signOut(auth)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
               <LogOut className="w-5 h-5" />
             </button>
           </div>
         </header>

         {/* Tab Content */}
         <div className="flex-1 overflow-y-auto p-4 md:p-10 pb-28 md:pb-10 scroll-smooth print:overflow-visible print:p-0 print:block">
           <div className="max-w-7xl mx-auto">
             <AnimatePresence mode="wait">
               <motion.div
                 key={activeTab}
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 exit={{ opacity: 0, y: -10 }}
                 transition={{ duration: 0.2, ease: "easeOut" }}
               >
                 {activeTab === 'dashboard' && <Dashboard onNavigateStudents={() => setActiveTab('students')} />}
                 {activeTab === 'students' && <StudentTable />}
                  {activeTab === 'subjects' && <SubjectManager />}
                 {activeTab === 'settings' && <SettingsForm />}
               </motion.div>
             </AnimatePresence>
           </div>
         </div>

         {/* Mobile Navigation (Fixed Footer) */}
         <nav className="md:hidden fixed bottom-4 left-4 right-4 z-50 bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-white/10 flex justify-around items-center p-3 shadow-2xl overflow-hidden">
           <MobileNavLink 
             icon={<LayoutDashboard />} 
             label="Beranda" 
             active={activeTab === 'dashboard'} 
             onClick={() => setActiveTab('dashboard')} 
           />
           <MobileNavLink 
             icon={<Users />} 
             label="Siswa" 
             active={activeTab === 'students'} 
             onClick={() => setActiveTab('students')} 
           />
           <MobileNavLink 
             icon={<BookOpen />} 
             label="Mapel" 
             active={activeTab === 'subjects'} 
             onClick={() => setActiveTab('subjects')} 
           />
           <MobileNavLink 
             icon={<SettingsIcon />} 
             label="Setting" 
             active={activeTab === 'settings'} 
             onClick={() => setActiveTab('settings')} 
           />
         </nav>
       </main>
    </div>
  );
}

function SidebarLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
        active 
          ? 'bg-blue-50 text-blue-600 shadow-sm' 
          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
      }`}
    >
      {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      {label}
    </button>
  );
}

function MobileNavLink({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 transition-all ${
        active ? 'text-blue-600' : 'text-slate-400'
      }`}
    >
      <div className={`p-2 rounded-xl transition-all ${active ? 'bg-blue-50' : ''}`}>
        {React.cloneElement(icon as React.ReactElement, { className: 'w-5 h-5' })}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
      {active && <motion.div layoutId="mobile-indicator" className="w-1 h-1 bg-blue-600 rounded-full" />}
    </button>
  );
}

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { Student, SchoolSettings } from '../types';
import { Search, GraduationCap, Printer, AlertCircle, CheckCircle2, XCircle, Info, ShieldCheck, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SKLPreview from './SKLPreview';
import confetti from 'canvas-confetti';

interface PublicSearchProps {
  onAdminLogin?: () => void;
}

export default function PublicSearch({ onAdminLogin }: PublicSearchProps) {
  const [nisn, setNisn] = useState('');
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    // Real-time settings listener
    const unsubGeneral = onSnapshot(doc(db, 'settings', 'general'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as SchoolSettings;
        setSettings(prev => {
          const prevSettings = prev || {} as SchoolSettings;
          const newSettings = { ...prevSettings, ...data };
          
          if (newSettings.isCountdownActive && newSettings.countdownTargetDate) {
            const target = new Date(newSettings.countdownTargetDate).getTime();
            const now = new Date().getTime();
            setIsLocked(target > now);
          } else {
            setIsLocked(false);
          }
          
          return newSettings;
        });
      }
      setLoadingSettings(false);
    }, (err) => {
      handleFirestoreError(err, 'get', 'settings/general');
    });

    const unsubLogo = onSnapshot(doc(db, 'settings', 'logo_header'), (snap) => {
      if (snap.exists()) setSettings(prev => ({ ...(prev || {}), logoUrl: snap.data().url } as SchoolSettings));
    }, (err) => {
      handleFirestoreError(err, 'get', 'settings/logo_header');
    });

    const unsubUILogo = onSnapshot(doc(db, 'settings', 'logo_ui'), (snap) => {
      if (snap.exists()) setSettings(prev => ({ ...(prev || {}), secondaryLogoUrl: snap.data().url } as SchoolSettings));
    }, (err) => {
      handleFirestoreError(err, 'get', 'settings/logo_ui');
    });

    return () => {
      unsubGeneral();
      unsubLogo();
      unsubUILogo();
    };
  }, []);

  const [celebrating, setCelebrating] = useState(false);
  const [countdown, setCountdown] = useState(15);
  const [showResult, setShowResult] = useState(false);
  
  // Real-time Countdown State
  const [timeLeft, setTimeLeft] = useState<{ days: number, hours: number, minutes: number, seconds: number } | null>(null);
  const [isLocked, setIsLocked] = useState(false);

  useEffect(() => {
    if (!settings?.isCountdownActive || !settings?.countdownTargetDate) {
      setIsLocked(false);
      setTimeLeft(null);
      return;
    }

    const calculate = () => {
      const target = new Date(settings.countdownTargetDate!).getTime();
      const now = new Date().getTime();
      const difference = target - now;

      if (difference <= 0) {
        setIsLocked(false);
        setTimeLeft(null);
        return true; // Finished
      } else {
        setIsLocked(true);
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        setTimeLeft({ days, hours, minutes, seconds });
        return false;
      }
    };

    const isFinished = calculate();
    if (isFinished) return;

    const timer = setInterval(() => {
      const finished = calculate();
      if (finished) clearInterval(timer);
    }, 1000);

    return () => clearInterval(timer);
  }, [settings?.isCountdownActive, settings?.countdownTargetDate]);

  useEffect(() => {
    let timer: any;
    if (celebrating && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (celebrating && countdown === 0) {
      setCelebrating(false);
      setShowResult(true);
    }
    return () => clearInterval(timer);
  }, [celebrating, countdown]);

  const [selectedTemplate, setSelectedTemplate] = useState<'V1' | 'V2'>('V2');

  const performSearch = async (targetNisn: string) => {
    if (isLocked) {
      setError('Akses pencarian belum dibuka.');
      return;
    }
    const cleanNisn = targetNisn.trim();
    if (!cleanNisn) return;

    setSearching(true);
    setError(null);
    setStudent(null);
    setShowResult(false);
    setCelebrating(false);

    try {
      const directDoc = await getDoc(doc(db, 'students', cleanNisn));
      
      if (directDoc.exists()) {
        const studentData = { id: directDoc.id, ...directDoc.data() } as Student;
        setStudent(studentData);
        
        if (studentData.status === 'LULUS') {
          setCelebrating(true);
          setCountdown(10);
          
          const duration = 5 * 1000;
          const animationEnd = Date.now() + duration;
          const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
          const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

          const interval: any = setInterval(() => {
            const timeLeft = animationEnd - Date.now();
            if (timeLeft <= 0) return clearInterval(interval);
            const particleCount = 50 * (timeLeft / duration);
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
          }, 250);
        } else {
          setShowResult(true);
        }
      } else {
        const q = query(collection(db, 'students'), where('nisn', '==', cleanNisn), limit(1));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          setError('Data siswa tidak ditemukan. Silakan cek kembali NISN Anda.');
        } else {
          const studentData = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student;
          setStudent(studentData);
          
          if (studentData.status === 'LULUS') {
            setCelebrating(true);
            setCountdown(10);
            confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
          } else {
            setShowResult(true);
          }
        }
      }
    } catch (err: any) {
      handleFirestoreError(err, 'get', 'students/search');
      setError('Sistem sedang sibuk. Silakan coba beberapa saat lagi.');
    } finally {
      setSearching(false);
    }
  };

  const handlePrint = () => {
    if (!student) return;
    const originalTitle = document.title;
    const fileName = `SKL_${student.name.replace(/\s+/g, '_').toUpperCase()}`;
    document.title = fileName;
    window.print();
    setTimeout(() => { document.title = originalTitle; }, 1000);
  };

  if (loadingSettings) {
    return (
      <div className="min-min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (celebrating) {
    return (
      <div className="fixed inset-0 z-[100] bg-slate-900 flex flex-col items-center justify-center p-6 text-center overflow-hidden">
        <div className="absolute inset-0 opacity-40">
           <div className="w-full h-full bg-gradient-to-br from-blue-900 to-slate-900"></div>
        </div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 space-y-8 max-w-lg"
        >
          <div className="bg-white/10 backdrop-blur-xl p-12 rounded-[3rem] border border-white/20 shadow-2xl">
            <h2 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight uppercase">SELAMAT!</h2>
            <p className="text-blue-200 text-lg font-medium mb-12 italic">Perjuanganmu membuahkan hasil yang manis...</p>
            <div className="space-y-4">
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 10, ease: "linear" }}
                  className="h-full bg-blue-500"
                />
              </div>
              <p className="text-white/60 font-medium tracking-widest uppercase text-xs">Menyiapkan Lembar Kelulusan... {countdown}s</p>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center relative font-sans selection:bg-blue-100 selection:text-blue-700">
      <div className="absolute top-0 left-0 w-full h-[50vh] bg-blue-600 clip-path-hero pointer-events-none opacity-[0.03]"></div>
      
      <div className="max-w-4xl w-full px-4 pt-16 pb-24 z-10 space-y-12">
        {/* Branding Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8"
        >
          <div className="relative inline-block">
             <div className="absolute inset-0 bg-blue-600 blur-[40px] opacity-20 rounded-full"></div>
             {settings?.secondaryLogoUrl ? (
                <img src={settings.secondaryLogoUrl} alt="Logo" className="h-24 md:h-32 mx-auto relative z-10 drop-shadow-2xl" />
             ) : (
                <div className="bg-white p-6 rounded-[2.5rem] shadow-2xl relative z-10 border border-slate-100">
                  <GraduationCap className="w-16 h-16 text-blue-600" />
                </div>
             )}
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              INFO KELULUSAN SISWA
            </h1>
            <div className="inline-flex items-center gap-3 bg-white px-6 py-2 rounded-full shadow-sm border border-slate-200">
               <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
               <p className="text-slate-600 font-bold text-sm md:text-base uppercase tracking-wider">
                 {settings?.schoolName || 'SIMAPNA'} — TA {settings?.academicYear || '2025/2026'}
               </p>
            </div>
          </div>
        </motion.div>

        {/* Professional Prompt Section */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           transition={{ delay: 0.2 }}
           className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
             <div className="bg-blue-50 p-3 rounded-2xl">
                <ShieldCheck className="w-6 h-6 text-blue-600" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Validitas Data</p>
             <p className="text-xs font-medium text-slate-600">Hasil yang ditampilkan adalah data resmi dari pangkalan data sekolah.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
             <div className="bg-indigo-50 p-3 rounded-2xl">
                <Info className="w-6 h-6 text-indigo-600" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cara Pengecekan</p>
             <p className="text-xs font-medium text-slate-600">Masukkan 10 digit NISN Anda dengan teliti pada kolom yang disediakan.</p>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center text-center gap-3">
             <div className="bg-emerald-50 p-3 rounded-2xl">
                <Clock className="w-6 h-6 text-emerald-600" />
             </div>
             <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Akses 24 Jam</p>
             <p className="text-xs font-medium text-slate-600">Layanan ini tersedia 24 jam untuk memudahkan akses bagi seluruh siswa.</p>
          </div>
        </motion.div>

        {/* Search Container */}
        <div className="relative max-w-2xl mx-auto w-full">
          <AnimatePresence mode="wait">
            {isLocked ? (
              <motion.div
                key="countdown"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-100 text-center space-y-8"
              >
                <div className="space-y-2">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">HASIL BELUM DIUMUMKAN</h2>
                  <p className="text-slate-500 font-medium italic">Sabar ya, pengumuman akan dibuka secara otomatis dalam:</p>
                </div>
                {timeLeft && (
                  <div className="grid grid-cols-4 gap-4">
                    {[
                      { label: 'HARI', val: timeLeft.days },
                      { label: 'JAM', val: timeLeft.hours },
                      { label: 'MENIT', val: timeLeft.minutes },
                      { label: 'DETIK', val: timeLeft.seconds },
                    ].map((t, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <p className="text-3xl font-black text-blue-600 tabular-nums">{String(t.val).padStart(2, '0')}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{t.label}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="pt-6 border-t border-slate-100">
                  <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">Target Waktu</p>
                  <p className="text-sm text-slate-600 font-bold">
                    {new Date(settings?.countdownTargetDate || '').toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' })} WIB
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="search-form"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-8"
              >
                 <form onSubmit={(e) => { e.preventDefault(); performSearch(nisn); }} className="relative group">
                    <div className="relative overflow-hidden rounded-[2.5rem] shadow-2xl shadow-blue-100 border-4 border-white transition-all focus-within:ring-4 focus-within:ring-blue-100">
                      <input 
                        type="text" 
                        placeholder="Masukkan NISN Siswa..." 
                        className="w-full pl-8 pr-40 py-7 bg-white outline-none text-xl md:text-2xl font-black placeholder:text-slate-300 text-slate-800"
                        value={nisn}
                        onChange={e => setNisn(e.target.value)}
                        maxLength={10}
                      />
                      <button 
                        type="submit"
                        disabled={searching}
                        className="absolute right-3 top-3 bottom-3 bg-blue-600 hover:bg-blue-700 text-white font-black px-10 rounded-3xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50 shadow-lg shadow-blue-200"
                      >
                        {searching ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                        ) : (
                          <>
                            <Search className="w-5 h-5" />
                            <span>CEK</span>
                          </>
                        )}
                      </button>
                    </div>
                 </form>
                 
                 <div className="bg-blue-50/50 p-6 rounded-3xl border border-blue-100/50 flex items-start gap-4 text-left">
                    <AlertCircle className="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                       <p className="text-sm font-bold text-blue-900">Perhatian Sebelum Pencarian</p>
                       <p className="text-xs text-blue-700 leading-relaxed">
                          Pastikan NISN yang Anda masukkan terdiri dari 10 digit angka. Jika terjadi kendala dalam pengecekan atau data tidak ditemukan, silakan hubungi operator sekolah pada jam kerja.
                       </p>
                    </div>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {error && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center text-rose-500 font-bold text-sm bg-rose-50 py-3 px-6 rounded-full inline-block mx-auto w-full">{error}</motion.p>}
          
          {showResult && student && (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
               <div className="bg-white p-8 md:p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100 text-left space-y-10 relative overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-8 items-start justify-between">
                     <div className="space-y-4">
                        <div className="inline-flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
                           <GraduationCap className="w-4 h-4 text-slate-500" />
                           <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Profil Peserta Didik</span>
                        </div>
                        <h2 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight uppercase underline decoration-blue-500 decoration-4 underline-offset-8">
                           {student.name}
                        </h2>
                        <div className="grid grid-cols-2 gap-8 md:gap-16 pt-4">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">NISN / NIS</p>
                              <p className="text-xl font-bold text-slate-800">{student.nisn} / {student.nis}</p>
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">PROGRAM / KELAS</p>
                              <p className="text-xl font-bold text-slate-800 uppercase">{student.className}</p>
                           </div>
                        </div>
                     </div>

                     <div className={`w-full md:w-auto p-8 rounded-[2.5rem] flex flex-col items-center justify-center text-center transition-all border-4 ${
                       student.status === 'LULUS' ? 'bg-emerald-50 border-emerald-500/20 shadow-emerald-100' : 'bg-rose-50 border-rose-500/20 shadow-rose-100'
                     } shadow-2xl`}>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-4 opacity-60">Hasil Kelulusan</p>
                        {student.status === 'LULUS' ? <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" /> : <XCircle className="w-16 h-16 text-rose-500 mb-4" />}
                        <h3 className={`text-5xl font-black italic ${student.status === 'LULUS' ? 'text-emerald-600' : 'text-rose-600'}`}>
                           {student.status}
                        </h3>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row gap-6 items-center justify-between">
                     <div className="flex items-center gap-6">
                        <div className="text-center md:text-left">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Rata-rata Nilai</p>
                           <p className="text-3xl font-black text-slate-900">{student.averageScore?.toFixed(2)}</p>
                        </div>
                        <div className="w-[1px] h-10 bg-slate-200"></div>
                        <div className="text-center md:text-left">
                           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Waktu Pengecekan</p>
                           <p className="text-sm font-bold text-slate-600 uppercase italic">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                     </div>
                     
                     <div className="flex flex-col gap-2 w-full md:w-auto">
                        <div className="flex bg-slate-100 p-1 rounded-xl mb-2">
                           <button 
                             onClick={() => setSelectedTemplate('V1')}
                             className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${selectedTemplate === 'V1' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                           >
                             FORMAT CLASSIC (V1)
                           </button>
                           <button 
                             onClick={() => setSelectedTemplate('V2')}
                             className={`flex-1 px-4 py-2 rounded-lg text-[10px] font-black transition-all ${selectedTemplate === 'V2' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-400'}`}
                           >
                             FORMAT MODERN (V2)
                           </button>
                        </div>
                        <button 
                          onClick={handlePrint}
                          className="flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white px-10 py-5 rounded-2xl font-black shadow-xl transition-all active:scale-95 group"
                        >
                          <Printer className="w-6 h-6" />
                          CETAK SKL RESMI
                        </button>
                        <p className="text-[10px] text-center font-bold text-slate-400 uppercase tracking-widest leading-tight">
                           {settings?.sklShowHeader === false ? 'Hapus Kop Kertas Sebelum Cetak' : 'Validitas dokumen terjamin'}
                        </p>
                     </div>
                  </div>
               </div>

               <div className="hidden print:block fixed inset-0 z-[100] bg-white">
                  <SKLPreview 
                    student={student} 
                    isAdminView={false} 
                    template={selectedTemplate}
                  />
               </div>
               
               <button 
                 onClick={() => { setStudent(null); setShowResult(false); setNisn(''); }}
                 className="mx-auto flex items-center gap-2 text-slate-400 hover:text-blue-600 font-bold uppercase text-xs tracking-widest transition-colors py-4"
               >
                 <Search className="w-4 h-4 rotate-180" />
                 Kembali ke Pencarian
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-auto w-full max-w-4xl px-4 py-12 border-t border-slate-200/50 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-slate-400 text-[10px] font-black tracking-[0.3em] uppercase">
          {settings?.schoolName || 'SIMAPNA'} &copy; {new Date().getFullYear()}
        </div>
        <div className="flex items-center gap-8">
           <button onClick={onAdminLogin} className="text-[10px] font-black text-slate-300 hover:text-slate-900 transition-colors uppercase tracking-widest cursor-default">
             Sistem v2.5.0
           </button>
        </div>
      </footer>
      
      <style>{`
        .clip-path-hero {
          clip-path: polygon(0 0, 100% 0, 100% 85%, 0% 100%);
        }
      `}</style>
    </div>
  );
}

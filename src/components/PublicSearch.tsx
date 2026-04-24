import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, limit, doc, getDoc } from 'firebase/firestore';
import { Student, SchoolSettings } from '../types';
import { Search, GraduationCap, Printer, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SKLPreview from './SKLPreview';

export default function PublicSearch() {
  const [nisn, setNisn] = useState('');
  const [searching, setSearching] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      const docSnap = await getDoc(doc(db, 'settings', 'general'));
      if (docSnap.exists()) {
        setSettings(docSnap.data() as SchoolSettings);
      }
    };
    fetchSettings();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNisn = nisn.trim();
    if (!cleanNisn) return;

    setSearching(true);
    setError(null);
    setStudent(null);

    try {
      const q = query(
        collection(db, 'students'), 
        where('nisn', '==', cleanNisn), 
        limit(1)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setError('Data siswa tidak ditemukan. Pastikan NISN yang dimasukkan benar.');
      } else {
        setStudent({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Student);
      }
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('index')) {
        setError('Database memerlukan indeks. Silakan hubungi admin atau tunggu sejenak.');
      } else {
        setError('Gagal mencari data. Pastikan koneksi internet stabil.');
      }
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center relative overflow-x-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-blue-600 to-transparent opacity-10 pointer-events-none"></div>
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>
      <div className="absolute top-80 -left-40 w-96 h-96 bg-indigo-400 rounded-full blur-[100px] opacity-10 pointer-events-none"></div>

      <div className="max-w-xl w-full px-4 pt-12 pb-24 z-10 space-y-8">
        {/* Header / Brand */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-6"
        >
          {settings?.secondaryLogoUrl ? (
            <img src={settings.secondaryLogoUrl} alt="School Logo" className="h-20 mx-auto object-contain drop-shadow-md" />
          ) : settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="School Logo" className="h-20 mx-auto object-contain drop-shadow-md" />
          ) : (
            <div className="bg-white p-5 rounded-3xl w-24 h-24 flex items-center justify-center mx-auto shadow-xl ring-4 ring-blue-50">
              <GraduationCap className="w-12 h-12 text-blue-600" />
            </div>
          )}
          
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight uppercase">
              {settings?.schoolName || 'SIMAPNA KELULUSAN'}
            </h1>
            <p className="text-slate-500 font-medium md:text-lg">Tahun Pelajaran {settings?.academicYear || '2024/2025'}</p>
          </div>
        </motion.div>

        {/* Search Box */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSearch} className="relative group">
            <div className="relative overflow-hidden rounded-[2rem] shadow-2xl shadow-blue-100 ring-8 ring-white">
              <input 
                type="text" 
                placeholder="Masukkan NISN..." 
                className="w-full pl-7 pr-36 py-6 bg-white border-none outline-none text-xl font-bold placeholder:text-slate-300 text-slate-800"
                value={nisn}
                onChange={e => setNisn(e.target.value)}
              />
              <button 
                type="submit"
                disabled={searching}
                className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 rounded-[1.5rem] flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              >
                {searching ? (
                   <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                ) : (
                  <>
                    <Search className="w-5 h-5" />
                    <span className="hidden sm:inline">Cari</span>
                  </>
                )}
              </button>
            </div>
          </form>
          <p className="mt-4 text-center text-slate-400 text-sm font-medium">
            Nomor Induk Siswa Nasional (10 Digit)
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {error && (
            <motion.div 
              key="error"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-rose-50 text-rose-700 p-5 rounded-3xl border border-rose-100 flex items-center gap-4 font-semibold shadow-lg shadow-rose-100"
            >
              <div className="p-2 bg-rose-100 rounded-full">
                <AlertCircle className="w-6 h-6" />
              </div>
              {error}
            </motion.div>
          )}

          {student && (
            <motion.div 
              key="result"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-slate-200 ring-1 ring-slate-100 text-left space-y-8 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <GraduationCap className="w-24 h-24 text-slate-900" />
              </div>

              <div className="space-y-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Nama Lengkap</p>
                  <p className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">{student.name}</p>
                </div>

                <div className="flex flex-wrap gap-8">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">NISN</p>
                    <p className="text-lg font-bold text-slate-700">{student.nisn}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">NIS</p>
                    <p className="text-lg font-bold text-slate-700">{student.nis}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Status Kelulusan</p>
                    {student.status === 'LULUS' ? (
                      <div className="inline-flex items-center gap-2 px-5 py-2 bg-emerald-50 text-emerald-700 rounded-full text-sm font-black ring-1 ring-emerald-100">
                        <CheckCircle2 className="w-4 h-4" />
                        LULUS
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-5 py-2 bg-rose-50 text-rose-700 rounded-full text-sm font-black ring-1 ring-rose-100">
                        <XCircle className="w-4 h-4" />
                        TIDAK LULUS
                      </div>
                    )}
                  </div>
                  
                  <button 
                    onClick={() => window.print()}
                    className="flex lg:flex items-center justify-center gap-3 bg-slate-900 hover:bg-slate-800 text-white px-8 py-5 rounded-2xl font-bold shadow-xl shadow-slate-200 transition-all active:scale-95 group shrink-0"
                  >
                    <Printer className="w-5 h-5 group-hover:scale-110 transition-transform" />
                    Download / Cetak SKL
                  </button>
                </div>

                <p className="text-center text-[10px] text-slate-400 font-medium">
                  *Gunakan opsi "Simpan sebagai PDF" saat mencetak di HP
                </p>
              </div>

              {/* Hidden preview for printing */}
              <div className="hidden print:block fixed inset-0 z-[100] bg-white">
                 <SKLPreview student={student} isAdminView={false} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="mt-auto py-8 text-slate-400 text-xs font-bold tracking-widest uppercase">
        {settings?.schoolName || 'SIMAPNA'} &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}

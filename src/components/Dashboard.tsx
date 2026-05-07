import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, doc, getDoc, setDoc, getDocs } from 'firebase/firestore';
import { Users, FileCheck, FileX, TrendingUp, Award, BarChart3, BookOpen, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Student } from '../types';

export default function Dashboard({ onNavigateStudents }: { onNavigateStudents: () => void }) {
  const [dashboardData, setDashboardData] = useState<{
    stats: { total: number; lulus: number; tidakLulus: number; average: number };
    classStats: any[];
    subjectStats: any[];
    topStudents: Student[];
    lastSync?: string;
    loading: boolean;
  }>({
    stats: { total: 0, lulus: 0, tidakLulus: 0, average: 0 },
    classStats: [],
    subjectStats: [],
    topStudents: [],
    loading: true
  });

  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cacheDoc = await getDoc(doc(db, 'dashboard', 'summary'));
        if (cacheDoc.exists()) {
          setDashboardData({
            ...cacheDoc.data() as any,
            loading: false
          });
        } else {
          handleSync();
        }
      } catch (error) {
        console.error("Error loading cache:", error);
        handleSync();
      }
    };
    loadCache();
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const q = query(collection(db, 'students'));
      const snapshot = await getDocs(q);
      const students = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      
      if (students.length === 0) {
        const emptyState = {
          stats: { total: 0, lulus: 0, tidakLulus: 0, average: 0 },
          classStats: [],
          subjectStats: [],
          topStudents: [],
          lastSync: new Date().toISOString(),
          loading: false
        };
        await setDoc(doc(db, 'dashboard', 'summary'), emptyState);
        setDashboardData(emptyState);
        return;
      }

      // Stats calculation
      const total = students.length;
      const lulusCount = students.filter(s => s.status === 'LULUS').length;
      const tidakLulusCount = total - lulusCount;
      const totalAvg = students.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) / total;

      const stats = {
        total,
        lulus: lulusCount,
        tidakLulus: tidakLulusCount,
        average: parseFloat(totalAvg.toFixed(2))
      };

      // Class stats
      const classes: Record<string, { total: number, sum: number }> = {};
      students.forEach(s => {
        const cls = s.className || 'Tanpa Kelas';
        const score = typeof s.averageScore === 'number' ? s.averageScore : 0;
        if (!classes[cls]) classes[cls] = { total: 0, sum: 0 };
        classes[cls].total += 1;
        classes[cls].sum += score;
      });

      const classStats = Object.keys(classes).map(name => ({
        name,
        avg: parseFloat((classes[name].sum / (classes[name].total || 1)).toFixed(2)),
        total: classes[name].total
      })).sort((a, b) => b.avg - a.avg);

      // Subject stats
      const subjects: Record<string, { total: number, sum: number }> = {};
      students.forEach(s => {
        const subList = Array.isArray(s.subjects) ? s.subjects : [];
        subList.forEach(sub => {
          if (sub && sub.subjectName) {
            const name = sub.subjectName.trim();
            const score = typeof sub.score === 'number' ? sub.score : 0;
            if (!subjects[name]) subjects[name] = { total: 0, sum: 0 };
            subjects[name].total += 1;
            subjects[name].sum += score;
          }
        });
      });

      const subjectStats = Object.keys(subjects).map(name => ({
        name,
        avg: parseFloat((subjects[name].sum / (subjects[name].total || 1)).toFixed(2))
      })).sort((a, b) => b.avg - a.avg);

      const topStudents = [...students].sort((a, b) => b.averageScore - a.averageScore).slice(0, 10);
      
      const newData = {
        stats,
        classStats,
        subjectStats,
        topStudents,
        lastSync: new Date().toISOString(),
        loading: false
      };

      await setDoc(doc(db, 'dashboard', 'summary'), newData);
      setDashboardData(newData);
    } catch (error) {
      handleFirestoreError(error, 'get', 'dashboard_sync');
    } finally {
      setIsSyncing(false);
    }
  };

  const { stats, classStats, subjectStats, topStudents, loading, lastSync } = dashboardData;

  if (loading) {
     return (
       <div className="h-96 flex flex-col items-center justify-center space-y-4">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium italic animate-pulse">Menghubungkan ke pusat data...</p>
       </div>
     );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Ringkasan Data</h2>
          <p className="text-slate-500 mt-1">Laporan performa kelulusan & capaian akademik.</p>
        </div>
        <div className="flex items-center gap-4">
            {lastSync && (
              <div className="text-[10px] text-right hidden lg:block">
                <p className="text-slate-400 font-bold uppercase tracking-widest">Terakhir Diperbarui</p>
                <p className="text-slate-600 font-black">{new Date(lastSync).toLocaleString('id-ID')}</p>
              </div>
            )}
            <button 
              onClick={handleSync}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all
                ${isSyncing ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:shadow-sm active:scale-95'}
              `}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Memperbarui...' : 'Perbarui Statistik'}
            </button>
        </div>
      </div>

      {!lastSync && stats.total > 0 && (
        <AlertBox 
          title="Sinkronisasi Diperlukan" 
          message="Data statistik belum dihitung. Klik tombol 'Perbarui Statistik' untuk melihat ringkasan terbaru." 
        />
      )}

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-600" />} 
          label="Total Peserta Didik" 
          value={stats.total} 
          color="bg-blue-50" 
          description="Siswa terdaftar aktif"
        />
        <StatCard 
          icon={<FileCheck className="text-emerald-600" />} 
          label="Siswa Lulus" 
          value={stats.lulus} 
          color="bg-emerald-50" 
          trend={`${((stats.lulus / (stats.total || 1)) * 100).toFixed(0)}%`}
          description="Memenuhi kriteria"
        />
        <StatCard 
          icon={<FileX className="text-rose-600" />} 
          label="Siswa Tidak Lulus" 
          value={stats.tidakLulus} 
          color="bg-rose-50" 
          description="Perlu peninjauan"
        />
        <StatCard 
          icon={<TrendingUp className="text-amber-600" />} 
          label="Rata-rata Sekolah" 
          value={stats.average} 
          color="bg-amber-50" 
          description="Seluruh mata pelajaran"
        />
      </div>

      {/* Performance Chart */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-indigo-50 rounded-lg">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
             </div>
             <h3 className="font-bold text-slate-800">Performa Nilai Per Kelas</h3>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
                Tertinggi
             </div>
             <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-300"></div>
                Lainnya
             </div>
          </div>
        </div>
        <div className="flex-1 min-h-[300px]">
          {classStats.length > 0 ? (
             <ResponsiveContainer width="100%" height={300}>
                <BarChart data={classStats}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                  <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tick={{ fill: '#64748B', fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }} cursor={{ fill: '#F8FAFC' }} />
                  <Bar dataKey="avg" radius={[8, 8, 0, 0]} barSize={45}>
                    {classStats.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={index === 0 ? '#4F46E5' : '#A5B4FC'} />
                    ))}
                  </Bar>
                </BarChart>
             </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
               Belum ada data nilai per kelas
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Performers Section */}
        <div className="lg:col-span-12 xl:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-50 rounded-xl">
                   <Award className="w-5 h-5 text-amber-600" />
                </div>
                <h3 className="font-bold text-slate-800">10 Siswa Berprestasi</h3>
              </div>
              <span className="text-[10px] font-black text-slate-400 bg-slate-50 px-2 py-1 rounded-md uppercase">Top Rank</span>
           </div>
           <div className="space-y-3">
              {topStudents.map((s, idx) => (
                <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group">
                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black shrink-0 transition-transform group-hover:scale-110
                      ${idx === 0 ? 'bg-amber-100 text-amber-700 ring-2 ring-amber-50' : 
                        idx === 1 ? 'bg-slate-100 text-slate-600 ring-2 ring-slate-50' :
                        idx === 2 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-50' : 
                        'bg-slate-50 text-slate-400'}
                   `}>
                      {idx + 1}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate uppercase group-hover:text-blue-600 transition-colors">{s.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase tracking-tighter">{s.className}</span>
                        <span className="text-[9px] font-bold text-slate-300">|</span>
                        <span className="text-[9px] font-bold text-slate-400">{s.nisn || 'No NISN'}</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <p className="text-base font-black text-slate-900">{s.averageScore?.toFixed(2) || '0.00'}</p>
                      <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">RERATA</p>
                   </div>
                </div>
              ))}
              {topStudents.length === 0 && (
                 <div className="py-12 text-center text-slate-400 italic text-sm">
                    Data peringkat belum tersedia
                 </div>
              )}
           </div>
        </div>

         {/* Subject Averages Table */}
         <div className="lg:col-span-12 xl:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
               <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-50 rounded-xl">
                     <BookOpen className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-none">Rerata Per Mata Pelajaran</h3>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-wider">Analisis capaian seluruh mapel</p>
                  </div>
               </div>
               <div className="bg-emerald-50 text-emerald-700 px-4 py-1.5 rounded-full text-xs font-bold">
                  {subjectStats.length} Mata Pelajaran
               </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {subjectStats.map((sub, idx) => (
                 <motion.div 
                   key={idx} 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: idx * 0.01 }}
                   className="group p-4 border border-slate-100 rounded-2xl bg-white hover:border-emerald-200 hover:shadow-md hover:shadow-emerald-500/5 transition-all"
                 >
                    <div className="flex items-center justify-between mb-3">
                       <span className="text-xs font-black text-slate-700 truncate mr-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          {sub.name}
                       </span>
                       <span className="text-base font-black text-emerald-600">{sub.avg.toFixed(2)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         animate={{ width: `${sub.avg}%` }}
                         transition={{ duration: 1, ease: "easeOut" }}
                         className={`h-full rounded-full ${
                           sub.avg >= 85 ? 'bg-emerald-500' : 
                           sub.avg >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                         }`}
                       />
                    </div>
                    <div className="flex justify-between mt-1 text-[8px] font-black text-slate-300 uppercase tracking-widest">
                       <span>Score</span>
                       <span>100</span>
                    </div>
                 </motion.div>
               ))}
               {subjectStats.length === 0 && (
                  <div className="col-span-2 py-24 text-center">
                    <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 italic text-sm font-medium">Belum ada rincian nilai per mapel terdata</p>
                  </div>
               )}
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color, description, trend }: { 
  icon: React.ReactNode, label: string, value: string | number, color: string, description?: string, trend?: string
}) {
  return (
    <motion.div whileHover={{ y: -5 }} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
      <div className="flex justify-between items-start mb-4">
         <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center shrink-0`}>{icon}</div>
         {trend && <div className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-black tracking-widest uppercase">{trend}</div>}
      </div>
      <div>
         <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</p>
         <p className="text-3xl font-black text-slate-800 mt-1">{value}</p>
         {description && <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase tracking-tight">{description}</p>}
      </div>
    </motion.div>
  );
}

function AlertBox({ title, message }: { title: string, message: string }) {
  return (
    <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-800">
        <p className="font-bold">{title}</p>
        <p className="opacity-80">{message}</p>
      </div>
    </div>
  );
}

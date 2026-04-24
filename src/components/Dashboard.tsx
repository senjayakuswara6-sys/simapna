import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, getCountFromServer } from 'firebase/firestore';
import { Users, FileCheck, FileX, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard({ onNavigateStudents }: { onNavigateStudents: () => void }) {
  const [stats, setStats] = useState({
    total: 0,
    lulus: 0,
    tidakLulus: 0,
    average: 0
  });

  useEffect(() => {
    const fetchStats = async () => {
      const q = query(collection(db, 'students'));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map(doc => doc.data());
      
      const total = data.length;
      const lulusCount = data.filter(s => s.status === 'LULUS').length;
      const tidakLulusCount = total - lulusCount;
      const avg = total > 0 ? data.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) / total : 0;

      setStats({
        total,
        lulus: lulusCount,
        tidakLulus: tidakLulusCount,
        average: parseFloat(avg.toFixed(2))
      });
    };

    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Ringkasan Data</h2>
        <p className="text-slate-500">Pantau statistik kelulusan siswa secara real-time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          icon={<Users className="text-blue-600" />} 
          label="Total Siswa" 
          value={stats.total} 
          color="bg-blue-100" 
        />
        <StatCard 
          icon={<FileCheck className="text-emerald-600" />} 
          label="Lulus" 
          value={stats.lulus} 
          color="bg-emerald-100" 
        />
        <StatCard 
          icon={<FileX className="text-rose-600" />} 
          label="Tidak Lulus" 
          value={stats.tidakLulus} 
          color="bg-rose-100" 
        />
        <StatCard 
          icon={<TrendingUp className="text-amber-600" />} 
          label="Rata-rata Nilai" 
          value={stats.average} 
          color="bg-amber-100" 
        />
      </div>

      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 space-y-4">
            <h3 className="text-xl font-bold text-slate-800">Mulai Kelola Data Siswa</h3>
            <p className="text-slate-500 leading-relaxed">
              Anda dapat menginput data siswa secara manual atau melakukan import massal menggunakan file Excel untuk mempercepat proses. Semua data akan otomatis diformat menjadi Surat Keterangan Lulus (SKL) siap cetak.
            </p>
            <button 
              onClick={onNavigateStudents}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all"
            >
              Kelola Data Sekarang
            </button>
          </div>
          <div className="hidden lg:block w-72">
             <img src="https://illustrations.popsy.co/white/student-going-to-school.svg" alt="Graduation" className="w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode, label: string, value: string | number, color: string }) {
  return (
    <motion.div 
      whileHover={{ y: -5 }}
      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
    >
      <div className={`${color} w-12 h-12 rounded-xl flex items-center justify-center mb-4`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="text-2xl font-bold text-slate-800 mt-1">{value}</p>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Download, Upload, AlertCircle, CheckCircle2, FileJson, History } from 'lucide-react';
import { motion } from 'motion/react';

export default function BackupRestore() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleBackup = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const collections = ['students', 'subjects', 'settings'];
      const backupData: any = {};

      for (const colName of collections) {
        const snap = await getDocs(collection(db, colName));
        backupData[colName] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simapna-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setStatus({ type: 'success', message: 'Backup berhasil diunduh' });
    } catch (error) {
      handleFirestoreError(error, 'list', 'backup');
      setStatus({ type: 'error', message: 'Gagal melakukan backup' });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm('Peringatan: Restore data akan menimpa data yang ada. Lanjutkan?')) return;

    setLoading(true);
    setStatus(null);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      for (const colName in data) {
        const batch = writeBatch(db);
        const docs = data[colName];
        
        // This is a simplified restore. For production, you might want to delete existing first or match by ID.
        for (const item of docs) {
          const { id, ...rest } = item;
          const docRef = doc(db, colName, id);
          batch.set(docRef, rest);
        }
        await batch.commit();
      }

      setStatus({ type: 'success', message: 'Restore data berhasil dilakukan' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Gagal melakukan restore. Pastikan format file benar.' });
    } finally {
      setLoading(false);
      if (e.target) e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-slate-800">Backup & Restore Data</h2>
      </div>

      {status && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl flex items-center gap-3 ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
          }`}
        >
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <p className="text-sm font-medium">{status.message}</p>
        </motion.div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="bg-blue-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Download className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Backup Data</h3>
          <p className="text-slate-500 mb-6 text-sm">Cadangkan semua data siswa, mata pelajaran, dan pengaturan ke dalam file JSON.</p>
          <button
            onClick={handleBackup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" /> : <History className="w-5 h-5" />}
            Backup Sekarang
          </button>
        </div>

        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
          <div className="bg-amber-100 p-4 rounded-2xl w-16 h-16 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
            <Upload className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">Restore Data</h3>
          <p className="text-slate-500 mb-6 text-sm">Kembalikan data dari file backup sebelumnya. Data saat ini akan diperbarui sesuai file.</p>
          <label className="relative block">
            <input
              type="file"
              accept=".json"
              onChange={handleRestore}
              disabled={loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
            <div className={`w-full flex items-center justify-center gap-2 ${loading ? 'bg-slate-100 text-slate-400' : 'bg-amber-600 hover:bg-amber-700 text-white'} font-bold py-3 px-6 rounded-xl transition-all`}>
              {loading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-slate-300 border-t-slate-600" /> : <FileJson className="w-5 h-5" />}
              Pilih File Backup
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}

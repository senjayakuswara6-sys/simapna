import React, { useState } from 'react';
import { read, utils, writeFile } from 'xlsx';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { Upload, Download, AlertCircle, CheckCircle2, FileSpreadsheet, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export default function ImportNomor() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  const downloadFormat = () => {
    const data = [
      {
        'NO': 1,
        'NAMA SISWA': 'ABDUL AZIZ',
        'KELAS': 'XII-1',
        'NISN': '0072251219',
        'NOMOR SKL': '285/SMA-PGRI/1.6/O.2026',
        'NOMOR IJAZAH NASIONAL': '',
        'NOMOR TRANSKRIP NILAI IJAZAH': '',
        'TANGGAL LULUS': '2026-05-04'
      }
    ];
    
    const ws = utils.json_to_sheet(data);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Format Import Nomor');
    writeFile(wb, 'Format_Import_Nomor.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setStatus(null);
    try {
      const data = await file.arrayBuffer();
      const workbook = read(data);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const json: any[] = utils.sheet_to_json(ws);
      
      setPreview(json);
      setLoading(false);
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Gagal membaca file Excel' });
      setLoading(false);
    }
  };

  const processImport = async () => {
    if (preview.length === 0) return;
    
    setLoading(true);
    let successCount = 0;
    let failCount = 0;

    try {
      const batch = writeBatch(db);
      
      for (const row of preview) {
        const nisn = String(row['NISN'] || '').trim();
        if (!nisn) continue;

        // Find student by NISN
        const q = query(collection(db, 'students'), where('nisn', '==', nisn));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const studentDoc = snap.docs[0];
          batch.update(doc(db, 'students', studentDoc.id), {
            sklNumber: row['NOMOR SKL'] || '',
            ijazahNasionalNumber: row['NOMOR IJAZAH NASIONAL'] || '',
            transkripNilaiNumber: row['NOMOR TRANSKRIP NILAI IJAZAH'] || '',
            graduationDate: row['TANGGAL LULUS'] || '',
            updatedAt: new Date().toISOString()
          });
          successCount++;
        } else {
          failCount++;
        }
      }

      await batch.commit();
      setStatus({ 
        type: 'success', 
        message: `Berhasil memperbarui ${successCount} siswa. ${failCount > 0 ? `${failCount} NISN tidak ditemukan.` : ''}` 
      });
      setPreview([]);
    } catch (error) {
      handleFirestoreError(error, 'update', 'students/import-nomor');
      setStatus({ type: 'error', message: 'Terjadi kesalahan saat memproses data' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Import Nomor Dokumen</h2>
          <p className="text-slate-500 text-sm">Update Nomor SKL, Ijazah, dan Transkrip secara massal via Excel</p>
        </div>
        <button
          onClick={downloadFormat}
          className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all text-sm"
        >
          <Download className="w-4 h-4" />
          Download Format
        </button>
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

      {!preview.length ? (
        <div className="bg-white p-12 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center text-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <FileSpreadsheet className="w-10 h-10 text-blue-600" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">Unggah File Excel</h3>
          <p className="text-slate-500 mb-6 text-sm max-w-md">Pastikan NISN siswa sudah terdaftar di sistem. Gunakan format yang telah disediakan.</p>
          <label className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl cursor-pointer transition-all shadow-lg hover:shadow-blue-200">
            <Upload className="w-5 h-5 inline mr-2" />
            Pilih File Excel
            <input type="file" className="hidden" accept=".xlsx, .xls" onChange={handleFileUpload} />
          </label>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700">Preview Data ({preview.length} baris)</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPreview([])} 
                className="text-xs font-bold text-slate-500 hover:text-slate-700 px-3 py-1.5"
                disabled={loading}
              >
                Batal
              </button>
              <button 
                onClick={processImport} 
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-1.5 rounded-lg flex items-center gap-2 shadow-sm"
                disabled={loading}
              >
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
          <div className="overflow-x-auto max-h-[400px]">
            <table className="w-full text-left border-collapse">
              <thead className="bg-white sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">NISN</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">Nama Siswa</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">Nomor SKL</th>
                  <th className="px-4 py-3 text-xs font-bold text-slate-500 uppercase border-b border-slate-100">Jazah/Transkrip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {preview.slice(0, 10).map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">{row['NISN']}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{row['NAMA SISWA']}</td>
                    <td className="px-4 py-3 text-sm text-blue-600 font-mono">{row['NOMOR SKL']}</td>
                    <td className="px-4 py-3 text-sm text-slate-500 truncate max-w-[200px]">
                      {row['NOMOR IJAZAH NASIONAL']} / {row['NOMOR TRANSKRIP NILAI IJAZAH']}
                    </td>
                  </tr>
                ))}
                {preview.length > 10 && (
                  <tr>
                    <td colSpan={4} className="px-4 py-3 text-center text-slate-400 text-xs italic">
                      ... dan {preview.length - 10} baris lainnya
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

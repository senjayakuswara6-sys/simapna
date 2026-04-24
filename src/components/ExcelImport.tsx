import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';
import { Download, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import { Student } from '../types';

export default function ExcelImport({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const downloadTemplate = () => {
    const template = [
      {
        'Nama': 'CONTOH SISWA',
        'Tempat Lahir': 'Cianjur',
        'Tanggal Lahir': '2007-05-28',
        'Nama Orang Tua': 'SAEPUL ROHMAN',
        'NIS': '222310009',
        'NISN': '0079495901',
        'Kelas': 'XII-1',
        'Daftar Mapel (pisahkan koma)': 'Kimia, Biologi, Geografi',
        'Rata-rata Nilai Akhir': 88.50,
        'Status (LULUS/TIDAK LULUS)': 'LULUS'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'template_import_skl.xlsx');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws) as any[];

        let count = 0;
        for (const row of data) {
          const subjectsStr = String(row['Daftar Mapel (pisahkan koma)'] || '');
          const subjects = subjectsStr.split(',').map(s => s.trim()).filter(s => s !== '');
          const averageScore = parseFloat(row['Rata-rata Nilai Akhir']) || 0;

          const studentData: Student = {
            name: row['Nama'] || '',
            birthPlace: row['Tempat Lahir'] || '',
            birthDate: row['Tanggal Lahir'] || '',
            parentName: row['Nama Orang Tua'] || '',
            nis: String(row['NIS'] || ''),
            nisn: String(row['NISN'] || ''),
            className: row['Kelas'] || 'XII-1',
            subjects,
            averageScore,
            status: (row['Status (LULUS/TIDAK LULUS)'] || 'LULUS').toUpperCase() as any,
            sklNumber: '',
            updatedAt: new Date().toISOString(),
          };

          if (studentData.name && studentData.nisn) {
            await addDoc(collection(db, 'students'), studentData);
            count++;
          }
        }

        setSuccess(count);
        setTimeout(onClose, 2000);
      } catch (err: any) {
        setError('Gagal memproses file. Pastikan format sesuai template.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 flex items-start gap-4">
        <Download className="w-6 h-6 text-blue-600 shrink-0 mt-1" />
        <div>
          <h4 className="font-bold text-blue-900 mb-1">Unduh Template Terlebih Dahulu</h4>
          <p className="text-sm text-blue-700 leading-relaxed mb-4">
            Gunakan template Excel standar kami untuk memastikan data siswa terimpor dengan benar ke sistem.
          </p>
          <button 
            onClick={downloadTemplate}
            className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-blue-50"
          >
            Unduh Template .xlsx
          </button>
        </div>
      </div>

      <div className="relative group">
        <input 
          type="file" 
          accept=".xlsx, .xls" 
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 opacity-0 cursor-pointer z-10 disabled:cursor-not-allowed"
        />
        <div className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
          loading ? 'bg-slate-50 border-slate-200' : 'border-slate-200 group-hover:border-blue-400 group-hover:bg-blue-50'
        }`}>
          <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
            <UploadCloud className={`w-8 h-8 ${loading ? 'text-slate-400 animate-bounce' : 'text-slate-600 group-hover:text-blue-600'}`} />
          </div>
          <p className="text-slate-800 font-bold">Klik atau seret file Excel ke sini</p>
          <p className="text-slate-500 text-sm mt-1">Hanya file .xlsx atau .xls yang didukung</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-3 text-slate-600 font-medium py-4">
          <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-600/30 border-t-blue-600"></div>
          Memproses data... Mohon tunggu.
        </div>
      )}

      {success !== null && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 flex items-center gap-3 font-medium">
          <CheckCircle2 className="w-5 h-5" />
          Berhasil mengimpor {success} data siswa!
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center gap-3 font-medium">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}
    </div>
  );
}

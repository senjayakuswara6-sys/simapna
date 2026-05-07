import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, setDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { Download, AlertCircle, CheckCircle2, UploadCloud } from 'lucide-react';
import { Student, StudentSubjectScore, Subject } from '../types';

export default function ExcelImport({ onClose }: { onClose: () => void }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setAvailableSubjects(data);
    };
    fetchSubjects();
  }, []);

  const downloadTemplate = (format: 'A4' | 'F4') => {
    let headers: any[] = [
      {
        'Nama': 'CONTOH SISWA',
        'NIS': '222310009',
        'NISN': '0073231219',
        'Jenis Kelamin': 'L',
        'Tempat Lahir': 'Cianjur',
        'Tanggal Lahir': '2007-05-28',
        'Nama Orang Tua': 'SAEPUL ROHMAN',
        'Kelas': 'XII MIPA 1',
        'Peminatan': 'MIPA',
      }
    ];

    if (format === 'F4') {
      // Add all available subjects as columns
      availableSubjects.forEach(s => {
        headers[0][s.name] = 0;
      });
    }

    headers[0]['Rata-rata Nilai Akhir'] = 85.08;
    headers[0]['Status (LULUS/TIDAK LULUS)'] = 'LULUS';

    const ws = XLSX.utils.json_to_sheet(headers);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, `template_import_skl_${format.toLowerCase()}.xlsx`);
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
        const fixedKeys = ['Nama', 'Tempat Lahir', 'Tanggal Lahir', 'Nama Orang Tua', 'NIS', 'NISN', 'Kelas', 'Jenis Kelamin', 'Peminatan', 'Jurusan', 'Rata-rata Nilai Akhir', 'Status (LULUS/TIDAK LULUS)'];

        for (const row of data) {
          const subjects: StudentSubjectScore[] = [];
          
          // Detect subject columns
          Object.keys(row).forEach(key => {
            if (!fixedKeys.includes(key) && key !== 'Nomor SKL') { // Exclude Nomor SKL if present in old files
              const score = parseFloat(row[key]);
              if (!isNaN(score) && score >= 0) {
                const roundedScore = Math.round(score * 100) / 100;
                // Find category from availableSubjects
                const refSubject = availableSubjects.find(s => s.name.toLowerCase() === key.toLowerCase());
                subjects.push({
                  subjectName: key,
                  score: roundedScore,
                  category: refSubject ? refSubject.category : 'UMUM'
                });
              }
            }
          });

          const averageScore = parseFloat(row['Rata-rata Nilai Akhir']) || (subjects.length > 0 ? subjects.reduce((a, b) => a + b.score, 0) / subjects.length : 0);

          const studentData: Student = {
            name: (row['Nama'] || '').toString().trim(),
            birthPlace: (row['Tempat Lahir'] || '').toString().trim(),
            birthDate: (row['Tanggal Lahir'] || '').toString().trim(),
            parentName: (row['Nama Orang Tua'] || '').toString().trim(),
            nis: String(row['NIS'] || '').trim(),
            nisn: String(row['NISN'] || '').trim(),
            gender: (() => {
              const val = (row['Jenis Kelamin'] || 'L').toString().trim().toUpperCase();
              if (val.startsWith('P')) return 'P';
              return 'L';
            })(),
            className: (row['Kelas'] || 'XII-1').toString().trim(),
            peminatan: (row['Peminatan'] || row['Jurusan'] || '').toString().trim(),
            subjects,
            averageScore: parseFloat(averageScore.toFixed(2)),
            status: (row['Status (LULUS/TIDAK LULUS)'] || 'LULUS').toUpperCase() as any,
            updatedAt: new Date().toISOString(),
          };

          if (studentData.name && studentData.nisn) {
            try {
              await setDoc(doc(db, 'students', studentData.nisn), studentData);
              count++;
            } catch (err: any) {
              handleFirestoreError(err, 'write' as any, `students/${studentData.nisn}`);
            }
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
        <div className="flex-1">
          <h4 className="font-bold text-blue-900 mb-1">Unduh Template Terlebih Dahulu</h4>
          <p className="text-sm text-blue-700 leading-relaxed mb-4">
            Pilih format template yang sesuai dengan kebutuhan cetak Anda. Nomor SKL tidak perlu diisi (otomatis dari sistem).
          </p>
          <div className="flex flex-wrap gap-2">
            <button 
              onClick={() => downloadTemplate('A4')}
              className="flex items-center gap-2 bg-white text-blue-600 border border-blue-200 px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-50 transition-colors"
            >
              Unduh Template A4 (Tanpa Nilai)
            </button>
            <button 
              onClick={() => downloadTemplate('F4')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm hover:bg-blue-700 transition-colors"
            >
              Unduh Template F4 (Dengan Nilai)
            </button>
          </div>
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

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, doc, deleteDoc, addDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Student } from '../types';
import { Search, Plus, Upload, Trash2, Printer, Edit, X, Download, FileSpreadsheet, Filter, ArrowUpDown, Users, BookOpen } from 'lucide-react';
import ExcelImport from './ExcelImport';
import StudentForm from './StudentForm';
import SKLPreview from './SKLPreview';
import TranscriptPreview from './TranscriptPreview';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

export default function StudentTable({ mode = 'all' }: { mode?: 'all' | 'grades' | 'graduation' | 'print-skl' | 'print-transcript' }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'nisn-asc' | 'avg-asc' | 'avg-desc'>('name-asc');
  const [classFilter, setClassFilter] = useState('Semua Kelas');
  const [showImport, setShowImport] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [previewingStudent, setPreviewingStudent] = useState<Student | null>(null);
  const [previewMode, setPreviewMode] = useState<'skl' | 'transcript'>('skl');
  const [printAllMode, setPrintAllMode] = useState(false);
  const [printAllType, setPrintAllType] = useState<'skl' | 'transcript'>('skl');
  const [globalShowStamp, setGlobalShowStamp] = useState(true);
  const [settings, setSettings] = useState<any>(null);

  const getTitle = () => {
    switch(mode) {
      case 'grades': return 'Input Nilai Transkrip';
      case 'graduation': return 'Penetapan Kelulusan';
      case 'print-skl': return 'Cetak Surat Keterangan Lulus';
      case 'print-transcript': return 'Cetak Transkrip Nilai';
      default: return 'Data Siswa';
    }
  };

  const getSubtitle = () => {
    switch(mode) {
      case 'grades': return 'Kelola nilai mata pelajaran untuk transkrip ijazah.';
      case 'graduation': return 'Tetapkan status kelulusan siswa.';
      case 'print-skl': return 'Pilih siswa untuk mencetak SKL (Surat Keterangan Lulus).';
      case 'print-transcript': return 'Pilih siswa untuk mencetak Transkrip Nilai Ijazah.';
      default: return `Total ${students.length} siswa terdaftar.`;
    }
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'general'));
        if (docSnap.exists()) {
          setSettings(docSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, 'get', 'settings/general');
      }
    };
    fetchSettings();
  }, []);

  const handlePrint = () => {
    const originalTitle = document.title;
    const appName = settings?.schoolName || 'SIMAPNA';
    
    let fileName = `CETAK_MASAL_${appName.replace(/\s+/g, '_').toUpperCase()}`;
    if (previewingStudent) {
      fileName = `${previewingStudent.name.replace(/\s+/g, '_').toUpperCase()}_${previewingStudent.nisn}_${appName.replace(/\s+/g, '_').toUpperCase()}`;
    }
    
    document.title = fileName;
    window.print();
    
    setTimeout(() => {
      document.title = originalTitle;
    }, 1000);
  };

  useEffect(() => {
    const q = query(collection(db, 'students'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student));
      setStudents(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, 'get', 'students');
    });
    return () => unsubscribe();
  }, []);

  const classes = ['Semua Kelas', ...new Set(students.map(s => s.className).filter(Boolean))].sort() as string[];

  const filteredAndSortedStudents = students
    .filter(s => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = (s.name || '').toLowerCase().includes(term) || 
                           (s.nisn || '').includes(searchTerm) ||
                           (s.nis || '').includes(searchTerm);
      const matchesClass = classFilter === 'Semua Kelas' || s.className === classFilter;
      return matchesSearch && matchesClass;
    })
    .sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      if (sortBy === 'name-desc') return (b.name || '').localeCompare(a.name || '');
      if (sortBy === 'nisn-asc') return (a.nisn || '').localeCompare(b.nisn || '');
      if (sortBy === 'avg-asc') return (a.averageScore || 0) - (b.averageScore || 0);
      if (sortBy === 'avg-desc') return (b.averageScore || 0) - (a.averageScore || 0);
      return 0;
    });

  const handleDelete = async (id: string) => {
    if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
      try {
        await deleteDoc(doc(db, 'students', id));
      } catch (error) {
        handleFirestoreError(error, 'delete', `students/${id}`);
      }
    }
  };

  const handleExport = (format?: 'A4' | 'F4') => {
    // Collect all unique subject names across filtered students
    const allSubjectNames = new Set<string>();
    filteredAndSortedStudents.forEach(s => {
      s.subjects?.forEach(subj => {
        if (subj.subjectName) allSubjectNames.add(subj.subjectName);
      });
    });

    const subjectHeaders = Array.from(allSubjectNames).sort();

    const exportData = filteredAndSortedStudents.map(s => {
      const row: any = {
        'Nama': s.name,
        'NIS': s.nis,
        'NISN': s.nisn,
        'Jenis Kelamin': (!s.gender || s.gender.toString().toUpperCase().startsWith('L')) ? 'Laki-laki' : 'Perempuan',
        'Tempat Lahir': s.birthPlace,
        'Tanggal Lahir': s.birthDate,
        'Nama Orang Tua': s.parentName,
        'Kelas': s.className || '',
        'Peminatan': s.peminatan || '',
      };

      if (mode !== 'all') {
        row['Status Kelulusan'] = s.status;
        row['Rata-rata Nilai'] = s.averageScore;
        
        if (format === 'F4') {
          // Add scores for each subject
          subjectHeaders.forEach(header => {
            const subjScore = s.subjects?.find(subj => subj.subjectName === header);
            row[header] = subjScore ? subjScore.score : 0;
          });
        }
      }

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data Siswa");
    const fileNameSuffix = mode === 'all' ? 'Identitas' : (format || 'Full');
    XLSX.writeFile(wb, `Data_Siswa_${fileNameSuffix}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden print-hide">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{getTitle()}</h2>
          <p className="text-slate-500">Total {students.length} siswa terdaftar.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {mode === 'print-skl' && (
            <button 
              onClick={() => {
                setPrintAllType('skl');
                setPrintAllMode(true);
              }}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Cetak Semua SKL
            </button>
          )}
          {mode === 'print-transcript' && (
            <button 
              onClick={() => {
                setPrintAllType('transcript');
                setPrintAllMode(true);
              }}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Cetak Semua Transkrip
            </button>
          )}
          <div className="relative group/export inline-block">
            <button 
              onClick={() => mode === 'all' && handleExport()}
              className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
            >
              <FileSpreadsheet className="w-4 h-4" />
              {mode === 'all' ? 'Ekspor Data Siswa' : 'Ekspor Nilai'}
            </button>
            {mode !== 'all' && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-xl border border-slate-200 opacity-0 invisible group-hover/export:opacity-100 group-hover/export:visible transition-all z-20 overflow-hidden">
                <button 
                  onClick={() => handleExport('A4')}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors"
                >
                  Format Identitas (A4)
                </button>
                <button 
                  onClick={() => handleExport('F4')}
                  className="w-full text-left px-4 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  Format Identitas + Nilai (F4)
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
          >
            <Upload className="w-4 h-4" />
            {mode === 'all' ? 'Import Excel' : 'Import Nilai'}
          </button>
          {mode === 'all' && (
            <button 
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tambah Siswa
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:hidden print-hide">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Cari Nama, NIS, atau NISN..." 
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white cursor-pointer min-w-[140px] appearance-none"
              >
                {classes.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as any)}
                className="pl-10 pr-8 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm bg-white cursor-pointer min-w-[160px] appearance-none"
              >
                <option value="name-asc">Nama (A-Z)</option>
                <option value="name-desc">Nama (Z-A)</option>
                <option value="nisn-asc">NISN Terkecil</option>
                <option value="avg-asc">Rerata (Terkecil)</option>
                <option value="avg-desc">Rerata (Terbesar)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4 w-16">No</th>
                <th className="px-6 py-4">Siswa</th>
                <th className="px-6 py-4">Kelas / Jurusan</th>
                {mode === 'all' && <th className="px-6 py-4 whitespace-nowrap">NIS / NISN</th>}
                <th className="px-6 py-4 tracking-tighter">Rata-rata</th>
                {(mode === 'graduation') && <th className="px-6 py-4">Status</th>}
                {mode === 'grades' && <th className="px-6 py-4">Kelola Nilai</th>}
                {mode === 'print-skl' && <th className="px-6 py-4 text-center">Cetak SKL</th>}
                {mode === 'print-transcript' && <th className="px-6 py-4 text-center">Cetak Transkrip</th>}
                <th className="px-6 py-4 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">Memuat data...</td>
                </tr>
              ) : filteredAndSortedStudents.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">Belum ada data tersedia.</td>
                </tr>
              ) : (
                filteredAndSortedStudents.map((student, index) => (
                  <tr key={student.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-sm font-bold text-slate-400 tabular-nums">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-12 bg-slate-100 rounded-md border border-slate-200 flex-shrink-0 overflow-hidden flex items-center justify-center">
                          {student.photoBase64 ? (
                            <img src={student.photoBase64} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Users className="w-4 h-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 leading-tight">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                            {(!student.gender || student.gender.toString().toUpperCase().startsWith('L')) ? 'Laki-laki' : 'Perempuan'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-700">{student.className || '-'}</p>
                      <p className="text-[10px] font-medium text-slate-400 uppercase">{student.peminatan || '-'}</p>
                    </td>
                    {mode === 'all' && (
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-slate-600">NIS: {student.nis}</p>
                        <p className="text-xs font-bold text-slate-400">NISN: {student.nisn}</p>
                      </td>
                    )}
                    <td className="px-6 py-4">
                      <p className="text-sm font-bold text-slate-800">
                        {student.averageScore?.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                      </p>
                    </td>
                    {(mode === 'graduation') && (
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                          student.status === 'LULUS' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                    )}
                    {mode === 'grades' && (
                      <td className="px-6 py-4">
                        <button 
                          onClick={() => {
                            setEditingStudent(student);
                            setShowForm(true);
                          }}
                          className="flex items-center gap-1.5 text-blue-600 hover:text-blue-700 font-bold text-[10px] uppercase bg-blue-50 px-2 py-1 rounded-lg"
                        >
                          <BookOpen className="w-3 h-3" />
                          {student.subjects?.length || 0} Mapel Terisi
                        </button>
                      </td>
                    )}
                    {mode === 'print-skl' && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => {
                            setPreviewMode('skl');
                            setPreviewingStudent(student);
                          }} 
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Cetak SKL"
                        >
                          <Printer className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    )}
                    {mode === 'print-transcript' && (
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => {
                            setPreviewMode('transcript');
                            setPreviewingStudent(student);
                          }} 
                          className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"
                          title="Cetak Transkrip"
                        >
                          <FileSpreadsheet className="w-4 h-4 mx-auto" />
                        </button>
                      </td>
                    )}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => {
                            setEditingStudent(student);
                            setShowForm(true);
                          }}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        {mode === 'all' && (
                          <button 
                            onClick={() => handleDelete(student.id!)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showImport && (
          <Modal title="Import Masal Data Siswa" onClose={() => setShowImport(false)}>
            <ExcelImport onClose={() => setShowImport(false)} />
          </Modal>
        )}

        {showForm && (
          <Modal title={editingStudent ? "Edit Data Siswa" : "Tambah Siswa Baru"} onClose={() => {
            setShowForm(false);
            setEditingStudent(null);
          }}>
            <StudentForm 
              initialData={editingStudent} 
              mode={mode}
              onClose={() => {
                setShowForm(false);
                setEditingStudent(null);
              }} 
            />
          </Modal>
        )}

        {previewingStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:block print:static print:bg-white skl-preview-modal print-modal-root overflow-hidden print:overflow-visible">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
              onClick={() => setPreviewingStudent(null)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden print:w-full print:h-auto print:rounded-none print:shadow-none print:static print:overflow-visible print:opacity-100 print:transform-none print-modal-content"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 print:hidden print-hide">
                <h3 className="font-bold text-lg text-slate-800">
                  {previewMode === 'skl' ? 'Preview & Cetak SKL' : 'Preview & Cetak Transkrip'}
                </h3>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                  >
                    <Printer className="w-4 h-4" />
                    {previewMode === 'skl' ? (settings?.sklFormat === 'FORMAT_2' ? 'Cetak F4' : 'Cetak A4') : 'Cetak Transkrip'}
                  </button>
                  <button onClick={() => setPreviewingStudent(null)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center items-start print:bg-white print:p-0 print:overflow-visible print:block">
                {previewMode === 'skl' ? (
                  <SKLPreview student={previewingStudent} isAdminView={true} />
                ) : (
                  <TranscriptPreview student={previewingStudent} />
                )}
              </div>
            </motion.div>
          </div>
        )}

        {printAllMode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:p-0 print:block print:static print:bg-white print-all-container print-modal-root overflow-hidden print:overflow-visible">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm print:hidden"
              onClick={() => setPrintAllMode(false)}
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden print:w-full print:h-auto print:rounded-none print:shadow-none print:static print:overflow-visible print:opacity-100 print:transform-none print-modal-content"
            >
              <div className="flex items-center justify-between p-4 border-b border-slate-100 shrink-0 print:hidden print-hide">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    Cetak Masal {printAllType === 'skl' ? 'SKL' : 'Transkrip'}
                  </h3>
                  <p className="text-xs text-slate-500">Mencetak {filteredAndSortedStudents.length} dokumen sekaligus.</p>
                </div>
                <div className="flex items-center gap-4">
                  {/* Global Stamp Toggle - Only for SKL */}
                  {printAllType === 'skl' && (
                    <div className="bg-slate-100 p-1 rounded-lg flex items-center gap-1 print:hidden">
                      <button 
                        onClick={() => setGlobalShowStamp(true)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${globalShowStamp ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        DENGAN CAP
                      </button>
                      <button 
                        onClick={() => setGlobalShowStamp(false)}
                        className={`px-3 py-1.5 rounded-md text-[10px] font-black transition-all ${!globalShowStamp ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500'}`}
                      >
                        TANPA CAP
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={handlePrint}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-indigo-100"
                  >
                    <Printer className="w-4 h-4" />
                    Cetak Sekarang
                  </button>
                  <button onClick={() => setPrintAllMode(false)} className="p-2 hover:bg-slate-100 rounded-full">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-slate-200 p-8 space-y-8 print:bg-white print:p-0 print:space-y-0 print:overflow-visible print:block print-all-wrapper">
                {filteredAndSortedStudents.map((s, idx) => (
                  <div key={s.id} className="print:break-after-page mb-8 print:mb-0">
                    {printAllType === 'skl' ? (
                      <SKLPreview student={s} isAdminView={false} forcedShowStamp={globalShowStamp} />
                    ) : (
                      <TranscriptPreview student={s} />
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Modal({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        <div className="flex items-center justify-between p-6 border-b border-slate-100 shrink-0">
          <h3 className="font-bold text-xl text-slate-800">{title}</h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </motion.div>
    </div>
  );
}

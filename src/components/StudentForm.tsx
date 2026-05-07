import React, { useState, useEffect, useRef } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, setDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Student, StudentSubjectScore, Subject } from '../types';
import { Plus, Trash2, Save, RefreshCcw, Camera, X, ChevronRight, BookOpen } from 'lucide-react';

interface StudentFormProps {
  initialData?: Student | null;
  onClose: () => void;
  mode?: 'all' | 'grades' | 'graduation' | 'print-skl' | 'print-transcript';
}

export default function StudentForm({ initialData, onClose, mode = 'all' }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [showAcademic, setShowAcademic] = useState(mode !== 'all');
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<Student>(initialData || {
    name: '',
    birthPlace: '',
    birthDate: '',
    parentName: '',
    nis: '',
    nisn: '',
    gender: 'L',
    photoBase64: '',
    className: '',
    subjects: [],
    averageScore: 0,
    status: 'LULUS',
    sklNumber: '',
    peminatan: ''
  });

  const [subjectsScores, setSubjectsScores] = useState<StudentSubjectScore[]>(
    initialData?.subjects || []
  );

  useEffect(() => {
    setShowAcademic(mode !== 'all');
  }, [mode]);

  useEffect(() => {
    const fetchSubjects = async () => {
      const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setAvailableSubjects(data);
    };
    fetchSubjects();
  }, []);

  const handleAutoPopulate = () => {
    const filtered = availableSubjects.filter(s => 
      s.className === 'SEMUA' || s.className === formData.className
    );
    
    // Merge with existing scores if any
    const newList = filtered.map(s => {
      const existing = subjectsScores.find(score => score.subjectName === s.name);
      return {
        subjectName: s.name,
        score: existing ? existing.score : 0,
        category: s.category
      };
    });
    setSubjectsScores(newList);
  };

  const handleAddSubject = () => {
    setSubjectsScores([...subjectsScores, { subjectName: '', score: 0, category: 'UMUM' }]);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjectsScores(subjectsScores.filter((_, i) => i !== index));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Resize strictly for "irit" storage
        const maxDimension = 300;
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress as low-quality jpeg for maximum irit
        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.6);
        setFormData({ ...formData, photoBase64: compressedBase64 });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const calculateAverage = () => {
    if (subjectsScores.length === 0) return 0;
    const sum = subjectsScores.reduce((acc, curr) => acc + curr.score, 0);
    const avg = sum / subjectsScores.length;
    const finalAvg = parseFloat(avg.toFixed(2));
    setFormData(prev => ({ ...prev, averageScore: finalAvg }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      subjects: subjectsScores.filter(s => s.subjectName.trim() !== ''),
      updatedAt: new Date().toISOString()
    };

    try {
      const studentId = initialData?.id || data.nisn;
      if (initialData?.id) {
        if (initialData.nisn !== data.nisn && initialData.id === initialData.nisn) {
          await setDoc(doc(db, 'students', data.nisn), data);
          await deleteDoc(doc(db, 'students', initialData.id));
        } else {
          await updateDoc(doc(db, 'students', initialData.id), data as any);
        }
      } else {
        await setDoc(doc(db, 'students', data.nisn), data);
      }
      onClose();
    } catch (error) {
      handleFirestoreError(error, initialData?.id ? 'update' : 'create', initialData?.id ? `students/${initialData.id}` : 'students');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Profil Identity Section */}
      <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Camera className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Identitas Utama Siswa</h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Input Data Lengkap Beserta Foto</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Photo Section */}
          <div className="shrink-0 flex flex-col items-center gap-4">
            <div className="relative group/photo">
              <div className="w-32 h-44 bg-white rounded-xl border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center transition-all group-hover/photo:border-blue-400">
                {formData.photoBase64 ? (
                  <img src={formData.photoBase64} alt="Foto" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-4">
                    <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-[10px] font-bold text-slate-400 uppercase">3x4 Photo</p>
                  </div>
                )}
              </div>
              {formData.photoBase64 && (
                <button 
                  type="button"
                  onClick={() => setFormData({ ...formData, photoBase64: '' })}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-1.5 rounded-full shadow-lg hover:bg-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handlePhotoChange} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all flex items-center gap-2"
            >
              <Plus className="w-3 h-3" />
              UPLOAD FOTO
            </button>
          </div>

          {/* Form Fields */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="col-span-1 md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Lengkap</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.name || ''}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                placeholder="NAMA LENGKAP SISWA"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">NIS</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.nis || ''}
                onChange={e => setFormData({ ...formData, nis: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">NISN</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.nisn || ''}
                onChange={e => setFormData({ ...formData, nisn: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tempat Lahir</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.birthPlace || ''}
                onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tanggal Lahir</label>
              <input 
                type="date" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.birthDate || ''}
                onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Jenis Kelamin</label>
              <select 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm appearance-none"
                value={formData.gender || 'L'}
                onChange={e => setFormData({ ...formData, gender: e.target.value as any })}
              >
                <option value="L">LAKI-LAKI</option>
                <option value="P">PEREMPUAN</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Nama Orang Tua</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.parentName || ''}
                onChange={e => setFormData({ ...formData, parentName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Kelas</label>
              <input 
                type="text" required 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.className || ''}
                placeholder="XII MIPA 1"
                onChange={e => setFormData({ ...formData, className: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Peminatan / Jurusan</label>
              <input 
                type="text" 
                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
                value={formData.peminatan || ''}
                onChange={e => setFormData({ ...formData, peminatan: e.target.value })}
                placeholder="MIPA / IPS / Dll"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Graduation & Grades Management Section - Only shown in SKL/Grades context */}
      {showAcademic && (
        <div className="space-y-6 pt-4 border-t-2 border-dashed border-slate-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-slate-900 p-2 rounded-lg">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Status & Nilai Akademik</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Input Kelulusan dan Nilai Transkrip</p>
            </div>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 rounded-2xl border border-slate-200">
             <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Status Kelulusan</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  value={formData.status || 'LULUS'}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="LULUS">LULUS</option>
                  <option value="TIDAK LULUS">TIDAK LULUS</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor SKL (Manual)</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs font-bold"
                  value={formData.sklNumber || ''}
                  placeholder="No: 060/TU.01-SMAN1PDL"
                  onChange={e => setFormData({ ...formData, sklNumber: e.target.value })}
                />
              </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-black text-slate-800 text-sm italic">INPUT NILAI MATA PELAJARAN</h4>
              <div className="flex gap-4">
                <button 
                  type="button" 
                  onClick={handleAutoPopulate}
                  className="text-xs font-black text-emerald-600 flex items-center gap-1 hover:underline bg-emerald-50 px-2 py-1 rounded"
                >
                  <RefreshCcw className="w-3 h-3" />
                  AUTO-FILL MAPEL {formData.className}
                </button>
                <button 
                  type="button" 
                  onClick={handleAddSubject}
                  className="text-xs font-black text-blue-600 flex items-center gap-1 hover:underline bg-blue-50 px-2 py-1 rounded"
                >
                  <Plus className="w-3 h-3" />
                  TAMBAH BARIS
                </button>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-100 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-2">Mata Pelajaran</th>
                    <th className="px-4 py-2 w-32">Kategori</th>
                    <th className="px-4 py-2 w-24">Nilai</th>
                    <th className="px-4 py-2 w-12"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {subjectsScores.map((s, idx) => (
                    <tr key={idx}>
                      <td className="px-2 py-2">
                        <input 
                          type="text" required 
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-300 rounded focus:border-blue-500 outline-none transition-all bg-transparent font-bold"
                          value={s.subjectName}
                          onChange={e => {
                            const newList = [...subjectsScores];
                            newList[idx].subjectName = e.target.value;
                            setSubjectsScores(newList);
                          }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <select 
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-300 rounded focus:border-blue-500 outline-none transition-all bg-transparent font-bold text-xs"
                          value={s.category}
                          onChange={e => {
                            const newList = [...subjectsScores];
                            newList[idx].category = e.target.value as any;
                            setSubjectsScores(newList);
                          }}
                        >
                          <option value="UMUM">UMUM</option>
                          <option value="PILIHAN">PILIHAN</option>
                          <option value="MULOK">MULOK</option>
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <input 
                          type="number" step="0.01" required 
                          className="w-full px-2 py-1 border border-transparent hover:border-slate-300 rounded focus:border-blue-500 outline-none transition-all bg-transparent font-bold text-center"
                          value={s.score}
                          onBlur={calculateAverage}
                          onChange={e => {
                            const newList = [...subjectsScores];
                            newList[idx].score = parseFloat(e.target.value) || 0;
                            setSubjectsScores(newList);
                          }}
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button 
                          type="button" 
                          onClick={() => handleRemoveSubject(idx)}
                          className="p-1 text-slate-400 hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {subjectsScores.length === 0 && (
                <p className="text-center py-8 text-slate-400 text-xs italic">Gunakan Auto-Fill untuk memuat mata pelajaran kelas ini.</p>
              )}
            </div>

            <div className="flex justify-between items-center bg-blue-50 p-4 rounded-xl border border-blue-100">
              <span className="text-sm font-bold text-blue-800 uppercase tracking-widest">Rata-rata Nilai:</span>
              <span className="text-2xl font-black text-blue-600 tabular-nums">{formData.averageScore}</span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
        <button 
          type="button" 
          onClick={onClose} 
          className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-50 rounded-lg"
        >
          Batal
        </button>
        <button 
          type="submit" 
          disabled={loading}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-8 rounded-lg shadow-lg disabled:opacity-50"
        >
          {loading ? 'Menyimpan...' : (
            <>
              <Save className="w-4 h-4" />
              Simpan Data
            </>
          )}
        </button>
      </div>
    </form>
  );
}

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, setDoc, updateDoc, doc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';
import { Student, StudentSubjectScore, Subject } from '../types';
import { Plus, Trash2, Save, RefreshCcw } from 'lucide-react';

interface StudentFormProps {
  initialData?: Student | null;
  onClose: () => void;
}

export default function StudentForm({ initialData, onClose }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
  const [availableSubjects, setAvailableSubjects] = useState<Subject[]>([]);
  const [formData, setFormData] = useState<Student>(initialData || {
    name: '',
    birthPlace: '',
    birthDate: '',
    parentName: '',
    nis: '',
    nisn: '',
    className: 'XII-1',
    subjects: [],
    averageScore: 0,
    status: 'LULUS',
    sklNumber: ''
  });

  const [subjectsScores, setSubjectsScores] = useState<StudentSubjectScore[]>(
    initialData?.subjects || []
  );

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

  const calculateAverage = () => {
    if (subjectsScores.length === 0) return 0;
    const sum = subjectsScores.reduce((acc, curr) => acc + curr.score, 0);
    const avg = sum / subjectsScores.length;
    setFormData({ ...formData, averageScore: parseFloat(avg.toFixed(2)) });
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
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Lengkap</label>
          <input 
            type="text" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.name || ''}
            onChange={e => setFormData({ ...formData, name: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tempat Lahir</label>
          <input 
            type="text" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.birthPlace || ''}
            onChange={e => setFormData({ ...formData, birthPlace: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Lahir</label>
          <input 
            type="date" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.birthDate || ''}
            onChange={e => setFormData({ ...formData, birthDate: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Orang Tua</label>
          <input 
            type="text" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.parentName || ''}
            onChange={e => setFormData({ ...formData, parentName: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Status Kelulusan</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.status || 'LULUS'}
            onChange={e => setFormData({ ...formData, status: e.target.value as any })}
          >
            <option value="LULUS">LULUS</option>
            <option value="TIDAK LULUS">TIDAK LULUS</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">NIS</label>
          <input 
            type="text" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.nis || ''}
            onChange={e => setFormData({ ...formData, nis: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">NISN</label>
          <input 
            type="text" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.nisn || ''}
            onChange={e => setFormData({ ...formData, nisn: e.target.value })}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Kelas</label>
          <select 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
            value={formData.className || 'XII-1'}
            onChange={e => setFormData({ ...formData, className: e.target.value })}
          >
            <option value="XII-1">XII-1</option>
            <option value="XII-2">XII-2</option>
            <option value="XII-3">XII-3</option>
            <option value="XII-4">XII-4</option>
            <option value="XII-5">XII-5</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor SKL (Opsional)</label>
          <input 
            type="text" 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-mono text-xs"
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
                      className="w-full px-2 py-1 border border-transparent hover:border-slate-300 rounded focus:border-blue-500 outline-none transition-all bg-transparent"
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
                      className="w-full px-2 py-1 border border-transparent hover:border-slate-300 rounded focus:border-blue-500 outline-none transition-all bg-transparent"
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

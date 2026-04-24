import React, { useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, addDoc, updateDoc, doc } from 'firebase/firestore';
import { Student } from '../types';
import { Plus, Trash2, Save } from 'lucide-react';

interface StudentFormProps {
  initialData?: Student | null;
  onClose: () => void;
}

export default function StudentForm({ initialData, onClose }: StudentFormProps) {
  const [loading, setLoading] = useState(false);
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

  const [subjectsList, setSubjectsList] = useState<string[]>(
    initialData 
      ? (Array.isArray(initialData.subjects) ? initialData.subjects : Object.keys(initialData.subjects || {})) 
      : []
  );

  const handleAddSubject = () => {
    setSubjectsList([...subjectsList, '']);
  };

  const handleRemoveSubject = (index: number) => {
    setSubjectsList(subjectsList.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const data = {
      ...formData,
      subjects: subjectsList.filter(s => s.trim() !== ''),
      updatedAt: new Date().toISOString()
    };

    try {
      if (initialData?.id) {
        await updateDoc(doc(db, 'students', initialData.id), data as any);
      } else {
        await addDoc(collection(db, 'students'), data);
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
          </select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">Nilai Rata-rata Akhir</label>
          <input 
            type="number" step="0.01" required 
            className="w-full px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 font-bold text-blue-600"
            value={formData.averageScore || 0}
            onChange={e => setFormData({ ...formData, averageScore: parseFloat(e.target.value) || 0 })}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-bold text-slate-800">Daftar Mata Pelajaran (Tanpa Nilai)</h4>
          <button 
            type="button" 
            onClick={handleAddSubject}
            className="text-sm font-bold text-blue-600 flex items-center gap-1 hover:underline"
          >
            <Plus className="w-4 h-4" />
            Tambah Mapel
          </button>
        </div>

        <div className="space-y-3">
          {subjectsList.map((s, idx) => (
            <div key={idx} className="flex items-center gap-3">
              <input 
                type="text" placeholder="Nama Mapel" 
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                value={s}
                onChange={e => {
                  const newList = [...subjectsList];
                  newList[idx] = e.target.value;
                  setSubjectsList(newList);
                }}
              />
              <button 
                type="button" 
                onClick={() => handleRemoveSubject(idx)}
                className="p-2 text-slate-400 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {subjectsList.length === 0 && (
            <p className="text-center py-4 text-slate-400 text-sm">Belum ada mata pelajaran ditambahkan.</p>
          )}
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

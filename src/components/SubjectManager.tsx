import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy, getDocs } from 'firebase/firestore';
import { Subject, SubjectCategory, Student } from '../types';
import { Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'motion/react';
import toast from 'react-hot-toast';

export default function SubjectManager() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newSubject, setNewSubject] = useState<Partial<Subject>>({
    name: '',
    category: 'UMUM',
    className: 'SEMUA',
    order: 0
  });

  useEffect(() => {
    const q = query(collection(db, 'subjects'), orderBy('order', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
      setSubjects(data);
    }, (error) => {
      handleFirestoreError(error, 'list', 'subjects');
    });
    return () => unsubscribe();
  }, []);

  const handleReorder = async (newOrder: Subject[]) => {
    setSubjects(newOrder);
    // Persist new order using a batch or individual updates
    try {
      await Promise.all(newOrder.map((s, idx) => {
        if (s.order !== idx) {
          return updateDoc(doc(db, 'subjects', s.id!), { order: idx });
        }
        return Promise.resolve();
      }));
    } catch (error) {
      handleFirestoreError(error, 'update', 'subjects/reorder');
    }
  };

  const handleAdd = async () => {
    if (!newSubject.name) return;
    try {
      await addDoc(collection(db, 'subjects'), {
        ...newSubject,
        order: subjects.length
      });
      toast.success('Mata pelajaran berhasil ditambahkan');
      setNewSubject({ name: '', category: 'UMUM', className: 'SEMUA', order: subjects.length + 1 });
      setIsAdding(false);
    } catch (error) {
      handleFirestoreError(error, 'create', 'subjects');
    }
  };

  const handleUpdate = async (id: string, data: Partial<Subject>) => {
    const originalSubject = subjects.find(s => s.id === id);
    try {
      await updateDoc(doc(db, 'subjects', id), data);
      toast.success('Mata pelajaran diperbarui');
      
      // If name changed, propogate to all students
      if (data.name && originalSubject && originalSubject.name !== data.name) {
        const studentsSnap = await getDocs(collection(db, 'students'));
        const updatePromises = studentsSnap.docs.map(studentDoc => {
          const student = studentDoc.data() as Student;
          if (student.subjects && student.subjects.length > 0) {
            const hasSubject = student.subjects.some(s => s.subjectName === originalSubject.name);
            if (hasSubject) {
              const newSubjects = student.subjects.map(s => 
                s.subjectName === originalSubject.name ? { ...s, subjectName: data.name! } : s
              );
              return updateDoc(doc(db, 'students', studentDoc.id), { subjects: newSubjects });
            }
          }
          return Promise.resolve();
        });
        await Promise.all(updatePromises);
      }
      
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, 'update', `subjects/${id}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Hapus mata pelajaran ini?')) {
      try {
        await deleteDoc(doc(db, 'subjects', id));
        toast.success('Mata pelajaran dihapus');
      } catch (error) {
        handleFirestoreError(error, 'delete', `subjects/${id}`);
      }
    }
  };

  const classes = ['SEMUA', 'XII MIPA 1', 'XII MIPA 2', 'XII MIPA 3', 'XII IPS 1', 'XII IPS 2', 'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'];
  const categories: SubjectCategory[] = ['UMUM', 'PILIHAN', 'MULOK'];

  // Calculate global indices for each subject
  const getGlobalIndex = (subjectId: string) => {
    return subjects.findIndex(s => s.id === subjectId) + 1;
  };

  const groupedSubjects = categories.reduce((acc, cat) => {
    acc[cat] = subjects.filter(s => s.category === cat);
    return acc;
  }, {} as Record<SubjectCategory, Subject[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Pemetaan Mata Pelajaran</h2>
          <p className="text-sm text-slate-500 text-pretty font-medium">Atur urutan dan penomoran mata pelajaran untuk SKL & Transkrip.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
        >
          <Plus className="w-4 h-4" />
          TAMBAH MAPEL
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-5 rounded-2xl border-2 border-blue-100 shadow-xl flex flex-wrap gap-4 items-end"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Nama Mata Pelajaran</label>
            <input
              type="text"
              value={newSubject.name}
              onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
              placeholder="Contoh: Matematika"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Kategori</label>
            <select
              value={newSubject.category}
              onChange={e => setNewSubject({ ...newSubject, category: e.target.value as SubjectCategory })}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 tracking-widest">Target Kelas</label>
            <select
              value={newSubject.className}
              onChange={e => setNewSubject({ ...newSubject, className: e.target.value })}
              className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-blue-600 text-white p-2.5 rounded-xl hover:bg-blue-700 shadow-md">
              <Save className="w-5 h-5" />
            </button>
            <button onClick={() => setIsAdding(false)} className="bg-slate-100 text-slate-600 p-2.5 rounded-xl hover:bg-slate-200">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {categories.map(cat => (
        <div key={cat} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-slate-800 text-sm tracking-tight flex items-center gap-2 bg-slate-100 px-4 py-1.5 rounded-full">
              <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
              Kelompok {cat}
            </h3>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
            <Reorder.Group 
              axis="y" 
              values={groupedSubjects[cat]} 
              onReorder={(newVal) => {
                // Find indices of current category subjects in global list
                const categoryIndices = subjects.map((s, i) => s.category === cat ? i : -1).filter(i => i !== -1);
                const newGlobalOrder = [...subjects];
                newVal.forEach((s, idx) => {
                  newGlobalOrder[categoryIndices[idx]] = s;
                });
                handleReorder(newGlobalOrder);
              }}
              className="divide-y divide-slate-100"
            >
              {groupedSubjects[cat].length === 0 ? (
                <div className="px-4 py-10 text-center text-slate-300 italic text-sm">Belum ada mata pelajaran dalam kategori ini.</div>
              ) : (
                groupedSubjects[cat].map((s) => (
                  <Reorder.Item 
                    key={s.id} 
                    value={s}
                    className="flex items-center gap-4 px-6 py-4 bg-white hover:bg-slate-50/50 transition-colors"
                  >
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 shrink-0">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex items-center gap-2 bg-slate-100 rounded-lg pr-3 overflow-hidden shrink-0">
                      <div className="w-10 h-10 bg-slate-200 border-r border-slate-300 flex items-center justify-center font-black text-slate-500 text-sm">
                        #
                      </div>
                      <input
                        type="number"
                        defaultValue={s.order}
                        onBlur={(e) => handleUpdate(s.id!, { order: parseInt(e.target.value) || 0 })}
                        className="w-12 bg-transparent text-center font-black text-slate-600 text-sm outline-none focus:text-blue-600 transition-colors"
                        title="Edit Urutan"
                      />
                    </div>
                    
                    <div className="flex-1">
                      {editingId === s.id ? (
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            defaultValue={s.name}
                            onBlur={(e) => handleUpdate(s.id!, { name: e.target.value })}
                            className="w-full px-3 py-1.5 border-2 border-blue-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                            autoFocus
                          />
                          <select
                            defaultValue={s.className}
                            onChange={(e) => handleUpdate(s.id!, { className: e.target.value })}
                            className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase outline-none"
                          >
                            {classes.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-800 text-lg">{s.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full uppercase tracking-widest">{s.className}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order #{s.order}</span>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => setEditingId(s.id!)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                        title="Ubah Nama"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(s.id!)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </Reorder.Item>
                ))
              )}
            </Reorder.Group>
          </div>
        </div>
      ))}
    </div>
  );
}

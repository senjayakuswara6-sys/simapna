import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { collection, query, onSnapshot, doc, addDoc, updateDoc, deleteDoc, orderBy, getDocs } from 'firebase/firestore';
import { Subject, SubjectCategory, Student } from '../types';
import { Plus, Trash2, Edit2, Save, X, GripVertical } from 'lucide-react';
import { motion, Reorder } from 'motion/react';

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
      } catch (error) {
        handleFirestoreError(error, 'delete', `subjects/${id}`);
      }
    }
  };

  const classes = ['SEMUA', 'XII-1', 'XII-2', 'XII-3', 'XII-4', 'XII-5'];
  const categories: SubjectCategory[] = ['UMUM', 'PILIHAN', 'MULOK'];

  const groupedSubjects = categories.reduce((acc, cat) => {
    acc[cat] = subjects.filter(s => s.category === cat);
    return acc;
  }, {} as Record<SubjectCategory, Subject[]>);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Manajemen Mata Pelajaran</h2>
          <p className="text-sm text-slate-500 text-pretty">Atur daftar mata pelajaran yang akan muncul di SKL Format 2.</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium text-sm hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Tambah Mapel
        </button>
      </div>

      {isAdding && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap gap-4 items-end"
        >
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nama Mapel</label>
            <input
              type="text"
              value={newSubject.name}
              onChange={e => setNewSubject({ ...newSubject, name: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Contoh: Matematika"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kategori</label>
            <select
              value={newSubject.category}
              onChange={e => setNewSubject({ ...newSubject, category: e.target.value as SubjectCategory })}
              className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Kelas</label>
            <select
              value={newSubject.className}
              onChange={e => setNewSubject({ ...newSubject, className: e.target.value })}
              className="px-3 py-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            >
              {classes.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
              <Save className="w-5 h-5" />
            </button>
            <button onClick={() => setIsAdding(false)} className="bg-slate-200 text-slate-600 p-2 rounded-lg hover:bg-slate-300">
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {categories.map(cat => (
        <div key={cat} className="space-y-4">
          <div className="flex items-center gap-4">
            <h3 className="font-black text-slate-400 text-xs tracking-widest uppercase">Kelompok {cat}</h3>
            <div className="flex-1 h-px bg-slate-100"></div>
          </div>
          
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
            <Reorder.Group 
              axis="y" 
              values={groupedSubjects[cat]} 
              onReorder={(newVal) => {
                const otherSubjects = subjects.filter(s => s.category !== cat);
                handleReorder([...otherSubjects, ...newVal]);
              }}
              className="divide-y divide-slate-100"
            >
              {groupedSubjects[cat].length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-300 italic text-sm">Belum ada mata pelajaran dalam kategori ini.</div>
              ) : (
                groupedSubjects[cat].map((s) => (
                  <Reorder.Item 
                    key={s.id} 
                    value={s}
                    className="flex items-center gap-4 px-4 py-3 bg-white hover:bg-slate-50 transition-colors"
                  >
                    <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500">
                      <GripVertical className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1">
                      {editingId === s.id ? (
                        <input
                          type="text"
                          defaultValue={s.name}
                          onBlur={(e) => handleUpdate(s.id!, { name: e.target.value })}
                          className="w-full px-2 py-1 border border-blue-200 rounded outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                      ) : (
                        <span className="font-bold text-slate-700">{s.name}</span>
                      )}
                    </div>

                    <div className="w-24">
                      <select
                        value={s.className}
                        onChange={(e) => handleUpdate(s.id!, { className: e.target.value })}
                        className="w-full px-2 py-1 border border-slate-100 rounded bg-white text-xs"
                      >
                        {classes.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => setEditingId(s.id!)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-all">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(s.id!)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-all">
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

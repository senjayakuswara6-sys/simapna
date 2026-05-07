import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Save, 
  Loader2, 
  FileCheck, 
  Info, 
  Plus, 
  Trash2, 
  Eye,
  Settings,
  Layout,
  Clock,
  UserCheck,
  FileSignature
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GraduationSKSettings } from '../../types';

interface DecisionSettingsProps {
  onPreview?: () => void;
}

export default function DecisionSettings({ onPreview }: DecisionSettingsProps) {
  const [settings, setSettings] = useState<GraduationSKSettings>({
    number: '280/SMA.PGRI/I.6/O/2026',
    subject: 'KRITERIA KELULUSAN UJIAN SEKOLAH TAHUN PELAJARAN 2025/2026',
    considering: [
      'Bahwa dalam rangka mengendalikan mutu Pendidikan sesuai Standar Nasional Pendidikan yaitu Standar Penilaian pada jenjang Pendidikan Dasar dan Menengah yang terdiri atas penilaian hasil belajar oleh satuan pendidikan dan penilaian hasil belajar oleh pemerintah, maka perlu menetapkan Kriteria Kelulusan Ujian Sekolah Tahun Pelajaran 2025/2026.'
    ],
    bearing: [
      'Undang-undang Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;',
      'Peraturan Pemerintah Nomor 57 Tahun 2021 tentang Standar Nasional Pendidikan sebagaimana diubah dengan Peraturan Pemerintah nomor 4 Tahun 2022;',
      'Peraturan Menteri Pendidikan, Riset dan Teknologi Republik Indonesia Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan;',
      'Permendikdasmen No. 10 tahun 2025 tentang Standar Kompetensi Lulusan;',
      'Permendikdasmen Nomor 12 Tahun 2025 tentang Standar Isi;',
      'Permendikdasmen Nomor 1 Tahun 2026 tentang Standar Proses;',
      'Program Kerja SMAS PGRI NARINGGUL Tahun Pelajaran 2025/2026.'
    ],
    observing: [
      'Peraturan Menteri Pendidikan, Riset dan Teknologi Republik Indonesia Nomor 21 Tahun 2022 tentang Standar Penilaian Pendidikan;',
      'Surat Edaran Kepala Dinas Pendidikan Provinsi Jawa Barat Nomor 21501/PK.07.01/PSMA Tanggal 13 Februari Tahun 2026;',
      'Berdasarkan hasil Rapat Dewan Guru tanggal 02 Mei 2026;'
    ],
    deciding: [
      'Kriteria Kelulusan Ujian Sekolah bagi Peserta Didik Tahun Pelajaran 2025/2026 dari Satuan Pendidikan SMAS PGRI NARINGGUL',
      'Peserta didik dinyatakan lulus Ujian Sekolah apabila mendapatkan nilai paling rendah 75 dan paling tinggi 100;',
      'Keputusan ini mulai berlaku pada tanggal ditetapkan.'
    ],
    minimumScore: 75,
    appendix1Title: 'KRITERIA KELULUSAN SISWA',
    appendix1Content: [
      { text: 'Kriteria Kelulusan Ujian Sekolah mendapatkan nilai paling rendah 75 dan paling tinggi 100;', subItems: [] },
      { 
        text: 'Kriteria Kelulusan dari SMAS PGRI NARINGGUL diantaranya:', 
        subItems: [
          'Menyelesaikan seluruh program pembelajaran yang dibuktikan dengan memiliki nilai rapor lengkap dari semester 1 – 5 dan nilai rapor semester 6 hasil dari pengolahan nilai rata-rata tugas harian, portofolio dan Ujian Sekolah;',
          'Memperoleh nilai sikap dan perilaku minimal baik;',
          'Mengikuti penilaian sumatif akhir jenjang yang diselenggarakan oleh satuan pendidikan;'
        ] 
      },
      { 
        text: 'Perhitungan nilai rata-rata Ujian Sekolah untuk setiap mata pelajaran adalah:', 
        subItems: [
          'Untuk mata pelajaran wajib dan Mulok diperoleh pada fase E and F',
          'Untuk mata pelajaran IPA, IPS, Informatika, Seni, Budaya, dan Prakarya diperoleh pada fase E',
          'Untuk mata pelajaran Sejarah, Seni dan Budaya dan mata pelajaran Pilihan diperoleh pada fase F'
        ] 
      },
      { text: 'Kehadiran peserta didik di kelas mencapai 80% (di hitung mulai dari semester 1 – 6);', subItems: [] },
      { text: 'Kelulusan peserta didik dari Satuan Pendidikan ditetapkan melalui rapat dewan guru.', subItems: [] }
    ],
    tableNoLabel: 'NO',
    tableNisLabel: 'NIS',
    tableNisnLabel: 'NISN',
    tableNameLabel: 'NAMA PESERTA DIDIK',
    tableGenderLabel: 'L/P',
    tableResultLabel: 'KEPUTUSAN',
    showHeader: true,
    headerMargin: 0,
    fontSize: 10,
    lineHeight: 1.2,
    showLampiranKriteria: true,
    showLampiranDaftar: true,
    pengawasName: 'AI MUFLIHAH, S.Pd.,M.Pd.',
    pengawasNip: '197602272006042017',
    showPengawasSignature: true
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'narasi' | 'lampiran' | 'layout'>('narasi');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'graduation_decision'));
        if (docSnap.exists()) {
          setSettings({
            ...settings,
            ...docSnap.data()
          } as GraduationSKSettings);
        }
      } catch (error) {
        handleFirestoreError(error, 'get', 'settings/graduation_decision');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'graduation_decision'), settings);
      toast.success('Template SK Kelulusan berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, 'write', 'settings/graduation_decision');
    } finally {
      setSaving(false);
    }
  };

  const removeItem = (field: keyof GraduationSKSettings, index: number) => {
    const items = [...(settings[field] as string[])];
    items.splice(index, 1);
    setSettings({ ...settings, [field]: items });
  };

  const addItem = (field: keyof GraduationSKSettings) => {
    const items = [...(settings[field] as string[])];
    items.push('');
    setSettings({ ...settings, [field]: items });
  };

  const updateItem = (field: keyof GraduationSKSettings, index: number, value: string) => {
    const items = [...(settings[field] as string[])];
    items[index] = value;
    setSettings({ ...settings, [field]: items });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
        <p className="text-slate-400 font-black tracking-widest text-xs animate-pulse">MEMUAT KONFIGURASI SK...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative z-10 space-y-6">
        {/* Header Branding */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10 relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <FileCheck className="w-48 h-48 rotate-12" />
           </div>

           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                 <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
                   <div className="p-2 bg-indigo-500/20 rounded-xl">
                     <FileCheck className="w-6 h-6 text-indigo-400" />
                   </div>
                   SETTING SK KELULUSAN
                 </h3>
                 <p className="text-slate-400 text-sm font-medium italic">Konfigurasi Surat Keputusan (SK) Penetapan Kelulusan Kolektif.</p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                 <button 
                  onClick={() => setActiveSubTab('narasi')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'narasi' ? 'bg-indigo-50 text-indigo-950 font-black shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                 >
                   NARASI SK
                 </button>
                 <button 
                  onClick={() => setActiveSubTab('lampiran')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'lampiran' ? 'bg-amber-50 text-amber-950 font-black shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                 >
                   LAMPIRAN
                 </button>
                 <button 
                  onClick={() => setActiveSubTab('layout')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'layout' ? 'bg-slate-50 text-slate-950 font-black shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                 >
                   TATA LETAK
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 space-y-6">
              {activeSubTab === 'narasi' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="space-y-6">
                      <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                          <FileSignature className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Informasi Utama & Konsiderans</h4>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Atur nomor SK, perihal, rujukan hukum, dan dasar keputusan</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-bold text-slate-700">
                         <div className="space-y-6">
                            <div className="space-y-1">
                               <label className="text-slate-400 uppercase tracking-widest text-[9px]">Nomor Surat Keputusan</label>
                               <input 
                                 type="text" 
                                 value={settings.number}
                                 onChange={(e) => setSettings({...settings, number: e.target.value})}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 tracking-tight"
                               />
                            </div>
                            <div className="space-y-1">
                               <label className="text-slate-400 uppercase tracking-widest text-[9px]">Tentang / Perihal SK</label>
                               <textarea 
                                 value={settings.subject}
                                 onChange={(e) => setSettings({...settings, subject: e.target.value})}
                                 className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 min-h-[100px]"
                               />
                            </div>
                         </div>

                         <div className="space-y-6">
                            <div className="bg-emerald-50/50 p-6 rounded-3xl border border-emerald-100 space-y-4 shadow-sm">
                               <h5 className="font-black text-emerald-700 tracking-widest text-[10px] uppercase flex items-center gap-2">
                                  <UserCheck className="w-3 h-3" /> Pengawas Pembina
                               </h5>
                               <div className="grid grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                     <label className="text-emerald-500 text-[9px] uppercase tracking-widest">Nama Pengawas</label>
                                     <input type="text" value={settings.pengawasName} onChange={(e) => setSettings({...settings, pengawasName: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white text-[11px]" />
                                  </div>
                                  <div className="space-y-1">
                                     <label className="text-emerald-500 text-[9px] uppercase tracking-widest">NIP Pengawas</label>
                                     <input type="text" value={settings.pengawasNip} onChange={(e) => setSettings({...settings, pengawasNip: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white text-[11px]" />
                                  </div>
                               </div>
                            </div>

                            <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4 shadow-sm">
                               <h5 className="font-black text-indigo-700 tracking-widest text-[10px] uppercase flex items-center gap-2">
                                  <Clock className="w-3 h-3" /> Memperhatikan
                               </h5>
                               <div className="space-y-3">
                                  {settings.observing.map((item, idx) => (
                                    <div key={idx} className="flex gap-2">
                                      <textarea value={item} onChange={(e) => updateItem('observing', idx, e.target.value)} className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-medium min-h-[60px]" />
                                      <button onClick={() => removeItem('observing', idx)} className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg transition-colors shrink-0 self-start"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                  ))}
                                  <button onClick={() => addItem('observing')} className="w-full py-2 bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all">Tambah Poin</button>
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                         {/* Considering (Menimbang) */}
                         <div className="space-y-4">
                            <h5 className="font-black text-slate-500 tracking-widest text-[10px] uppercase border-b pb-2 flex items-center justify-between">
                               Menimbang <button onClick={() => addItem('considering')} className="text-indigo-600 hover:bg-indigo-50 p-1 px-2 rounded-lg text-[9px]">ADD</button>
                            </h5>
                            <div className="space-y-3">
                               {settings.considering.map((item, idx) => (
                                 <div key={idx} className="flex flex-col gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <textarea value={item} onChange={(e) => updateItem('considering', idx, e.target.value)} className="w-full bg-transparent text-[11px] font-medium border-none focus:ring-0 p-0" />
                                    <button onClick={() => removeItem('considering', idx)} className="text-rose-500 text-[10px] font-black self-end">DEL</button>
                                 </div>
                               ))}
                            </div>
                         </div>

                         {/* Bearing (Mengingat) */}
                         <div className="space-y-4">
                            <h5 className="font-black text-slate-500 tracking-widest text-[10px] uppercase border-b pb-2 flex items-center justify-between">
                               Mengingat <button onClick={() => addItem('bearing')} className="text-indigo-600 hover:bg-indigo-50 p-1 px-2 rounded-lg text-[9px]">ADD</button>
                            </h5>
                            <div className="space-y-3">
                               {settings.bearing.map((item, idx) => (
                                 <div key={idx} className="flex flex-col gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <textarea value={item} onChange={(e) => updateItem('bearing', idx, e.target.value)} className="w-full bg-transparent text-[11px] font-medium border-none focus:ring-0 p-0" />
                                    <button onClick={() => removeItem('bearing', idx)} className="text-rose-500 text-[10px] font-black self-end">DEL</button>
                                 </div>
                               ))}
                            </div>
                         </div>

                         {/* Deciding (Menetapkan) */}
                         <div className="space-y-4">
                            <h5 className="font-black text-slate-500 tracking-widest text-[10px] uppercase border-b pb-2 flex items-center justify-between">
                               Menetapkan <button onClick={() => addItem('deciding')} className="text-indigo-600 hover:bg-indigo-50 p-1 px-2 rounded-lg text-[9px]">ADD</button>
                            </h5>
                            <div className="space-y-3">
                               {settings.deciding.map((item, idx) => (
                                 <div key={idx} className="flex flex-col gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                                    <textarea value={item} onChange={(e) => updateItem('deciding', idx, e.target.value)} className="w-full bg-transparent text-[11px] font-medium border-none focus:ring-0 p-0" />
                                    <button onClick={() => removeItem('deciding', idx)} className="text-rose-500 text-[10px] font-black self-end">DEL</button>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeSubTab === 'lampiran' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Layout className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Judul Kolom & Kriteria</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Konfigurasi tabel pada lampiran SK</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-bold text-slate-700">
                      <div className="space-y-8">
                         <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 shadow-sm space-y-6">
                            <h5 className="font-black text-amber-700 tracking-widest text-[10px] uppercase flex items-center gap-2">
                               <Settings className="w-3 h-3" /> Judul Kolom Tabel Lampiran II
                            </h5>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-amber-500 text-[9px] uppercase tracking-widest">Judul No</label>
                                  <input type="text" value={settings.tableNoLabel} onChange={(e) => setSettings({...settings, tableNoLabel: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white" placeholder="No" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-amber-500 text-[9px] uppercase tracking-widest">Judul Nama</label>
                                  <input type="text" value={settings.tableNameLabel} onChange={(e) => setSettings({...settings, tableNameLabel: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white" placeholder="Nama Peserta Didik" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-amber-500 text-[9px] uppercase tracking-widest">Judul NIS</label>
                                  <input type="text" value={settings.tableNisLabel} onChange={(e) => setSettings({...settings, tableNisLabel: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white" placeholder="NIS" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-amber-500 text-[9px] uppercase tracking-widest">Judul NISN</label>
                                  <input type="text" value={settings.tableNisnLabel} onChange={(e) => setSettings({...settings, tableNisnLabel: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white" placeholder="NISN" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-amber-500 text-[9px] uppercase tracking-widest">Judul L/P</label>
                                  <input type="text" value={settings.tableGenderLabel} onChange={(e) => setSettings({...settings, tableGenderLabel: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white" placeholder="L/P" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-amber-500 text-[9px] uppercase tracking-widest">Judul Keputusan</label>
                                  <input type="text" value={settings.tableResultLabel} onChange={(e) => setSettings({...settings, tableResultLabel: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white" placeholder="Keputusan" />
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                            <h5 className="font-black text-indigo-700 tracking-widest text-[10px] uppercase flex items-center gap-2">
                               <Layout className="w-3 h-3" /> Konten Lampiran I (Kriteria)
                            </h5>
                            <div className="space-y-1">
                               <label className="text-indigo-500 text-[9px] uppercase tracking-widest">Judul Lampiran I</label>
                               <input type="text" value={settings.appendix1Title} onChange={(e) => setSettings({...settings, appendix1Title: e.target.value})} className="w-full p-2.5 border rounded-lg bg-white text-[11px]" />
                            </div>
                            <div className="space-y-3">
                               <label className="text-indigo-500 text-[9px] uppercase tracking-widest block">Poin-poin Kriteria</label>
                               {settings.appendix1Content?.map((item, idx) => (
                                 <div key={idx} className="space-y-2 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                   <div className="flex gap-2">
                                     <textarea 
                                       value={item.text} 
                                       onChange={(e) => {
                                         const newContent = [...settings.appendix1Content];
                                         newContent[idx] = { ...item, text: e.target.value };
                                         setSettings({...settings, appendix1Content: newContent});
                                       }} 
                                       placeholder="Poin Utama"
                                       className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-bold min-h-[50px]" 
                                     />
                                     <button 
                                       onClick={() => {
                                         const newContent = [...settings.appendix1Content];
                                         newContent.splice(idx, 1);
                                         setSettings({...settings, appendix1Content: newContent});
                                       }} 
                                       className="text-rose-500 hover:bg-rose-50 p-2 rounded-lg shrink-0 self-start"
                                     >
                                       <Trash2 className="w-4 h-4" />
                                     </button>
                                   </div>

                                   {/* Sub Items */}
                                   <div className="pl-6 space-y-2 border-l-2 border-indigo-100 ml-2">
                                     {item.subItems?.map((sub, sIdx) => (
                                       <div key={sIdx} className="flex gap-2">
                                         <span className="text-[10px] font-bold text-indigo-400 mt-2">{String.fromCharCode(97 + sIdx)}.</span>
                                         <textarea 
                                           value={sub} 
                                           onChange={(e) => {
                                             const newContent = [...settings.appendix1Content];
                                             const newSubItems = [...(item.subItems || [])];
                                             newSubItems[sIdx] = e.target.value;
                                             newContent[idx] = { ...item, subItems: newSubItems };
                                             setSettings({...settings, appendix1Content: newContent});
                                           }} 
                                           placeholder="Sub Poin"
                                           className="flex-1 px-3 py-1.5 bg-indigo-50/30 border border-indigo-100 rounded-xl text-[10px] font-medium min-h-[40px]" 
                                         />
                                         <button 
                                           onClick={() => {
                                              const newContent = [...settings.appendix1Content];
                                              const newSubItems = [...(item.subItems || [])];
                                              newSubItems.splice(sIdx, 1);
                                              newContent[idx] = { ...item, subItems: newSubItems };
                                              setSettings({...settings, appendix1Content: newContent});
                                           }} 
                                           className="text-rose-400 hover:bg-rose-50 p-1 rounded-lg shrink-0 self-start"
                                         >
                                           <Trash2 className="w-3.5 h-3.5" />
                                         </button>
                                       </div>
                                     ))}
                                     <button 
                                       onClick={() => {
                                         const newContent = [...settings.appendix1Content];
                                         const newSubItems = [...(item.subItems || []), ''];
                                         newContent[idx] = { ...item, subItems: newSubItems };
                                         setSettings({...settings, appendix1Content: newContent});
                                       }} 
                                       className="text-[9px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1 hover:text-indigo-700 transition-colors"
                                     >
                                       <Plus className="w-3 h-3" /> Tambah Sub Poin
                                     </button>
                                   </div>
                                 </div>
                               ))}
                               <button 
                                 onClick={() => setSettings({...settings, appendix1Content: [...(settings.appendix1Content || []), { text: '', subItems: [] }]})} 
                                 className="w-full py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 active:scale-95 transition-all"
                               >
                                 Tambah Poin Utama
                               </button>
                            </div>
                         </div>

                         <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl space-y-6 relative overflow-hidden group">
                             <div className="absolute top-0 right-0 p-8 opacity-5">
                               <Info className="w-32 h-32" />
                             </div>
                             <h5 className="font-black text-slate-400 tracking-widest text-[10px] uppercase">Indikator Kriteria</h5>
                             <div className="space-y-1">
                                <label className="text-slate-500 block uppercase tracking-widest text-[9px] font-black">Nilai Minimal Lulus (Rata-rata)</label>
                                <div className="flex items-center gap-4">
                                   <input 
                                     type="number" 
                                     value={settings.minimumScore}
                                     onChange={(e) => setSettings({...settings, minimumScore: Number(e.target.value)})}
                                     className="w-full p-4 bg-slate-800 border border-slate-700 rounded-2xl font-black text-2xl text-emerald-400 text-center shadow-inner" 
                                   />
                                   <span className="text-slate-500 font-black text-xl">PTS</span>
                                </div>
                             </div>
                             <p className="text-[10px] text-slate-500 leading-relaxed italic font-medium">Batas nilai minimal untuk lampiran I SK kriteria kelulusan akademik.</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeSubTab === 'layout' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600">
                        <Layout className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Tipografi & Margin</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Atur detail cetak dan ukuran font</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-bold font-black">
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Ukuran Font Dokumen (pt)</label>
                            <input type="number" value={settings.fontSize} onChange={(e) => setSettings({...settings, fontSize: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Jarak Antar Baris (Default 1.3)</label>
                            <input type="number" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({...settings, lineHeight: Number(e.target.value)})} className="w-full p-3 border rounded-xl" />
                         </div>
                      </div>
                      <div className="space-y-4">
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Margin Atas Tanpa KOPSurat (Cm)</label>
                            <input type="number" step="0.1" value={settings.headerMargin} onChange={(e) => setSettings({...settings, headerMargin: Number(e.target.value)})} className="w-full p-3 border rounded-xl text-indigo-600" />
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden flex flex-col gap-8 sticky top-24 border border-white/5 group">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-all duration-700" />
                
                <div className="space-y-6 relative z-10">
                   <div className="bg-indigo-500/20 w-20 h-20 rounded-3xl flex items-center justify-center border border-indigo-500/30 shadow-inner">
                      <Save className="w-10 h-10 text-indigo-400" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">Simpan SK</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Seluruh perubahan SK akan disimpan ke permanen.</p>
                   </div>
                   
                   <div className="space-y-3">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-indigo-500 hover:bg-indigo-600 text-slate-950 h-16 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 whitespace-nowrap"
                      >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                        SIMPAN PERUBAHAN
                      </button>
                      
                      {onPreview && (
                        <button 
                          onClick={onPreview}
                          className="w-full bg-white/5 hover:bg-white/10 text-white h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all border border-white/10 flex items-center justify-center gap-3 uppercase shadow-sm group"
                        >
                          <Eye className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                          LIHAT PREVIEW
                        </button>
                      )}
                   </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4 relative z-10">
                   <h5 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Lampiran & Visibilitas</h5>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[10px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Cetak KOP</span>
                         <button onClick={() => setSettings({...settings, showHeader: !settings.showHeader})} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all border ${settings.showHeader ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                           <Layout className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[10px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Kriteria</span>
                         <button onClick={() => setSettings({...settings, showLampiranKriteria: !settings.showLampiranKriteria})} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all border ${settings.showLampiranKriteria ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                           <Settings className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[10px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Daftar Nama</span>
                         <button onClick={() => setSettings({...settings, showLampiranDaftar: !settings.showLampiranDaftar})} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all border ${settings.showLampiranDaftar ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                           <UserCheck className="w-4 h-4" />
                         </button>
                      </div>
                   </div>
                </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

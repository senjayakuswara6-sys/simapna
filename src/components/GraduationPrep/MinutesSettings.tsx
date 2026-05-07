import React, { useState, useEffect } from 'react';
import { 
  Save, 
  FileSignature, 
  Settings, 
  Info, 
  Loader2, 
  Plus, 
  Trash2, 
  Eye,
  Layout,
  Clock,
  MapPin,
  UserCheck
} from 'lucide-react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import toast from 'react-hot-toast';

interface Witness {
  name: string;
  role: string;
  idType: string;
  idNumber: string;
}

interface BA_Settings {
  day: string;
  dateSpelled: string;
  month: string;
  yearSpelled: string;
  startTime: string;
  endTime: string;
  room: string;
  openingParagraph: string;
  secondParagraph: string;
  closingParagraph: string;
  meetingLocation: string;
  leaderName: string;
  attendees: string;
  meetingResult: string;
  notaryName: string;
  notaryIdType: string;
  notaryIdNumber: string;
  witnesses: Witness[];
  showNotule: boolean;
  showHeader: boolean;
  fontSize: number;
  lineHeight: number;
  headerMargin: number;
  showTableStats: boolean;
  showTablePassed: boolean;
  showWitnesses: boolean;
  tableNoLabel: string;
  tableProgramLabel: string;
  tableMaleLabel: string;
  tableFemaleLabel: string;
  tableTotalLabel: string;
  passedLabel: string;
  notPassedLabel: string;
  appendixLabel: string;
  defaultProgramLabel: string;
  headmasterTitle: string;
  fontFamily: 'serif' | 'sans';
  useManualStats: boolean;
  manualStats: {
    program: string;
    male: number;
    female: number;
    total: number;
    passedMale: number;
    passedFemale: number;
    passedTotal: number;
  }[];
}

interface MinutesSettingsProps {
  onPreview?: () => void;
}

const MinutesSettings: React.FC<MinutesSettingsProps> = ({ onPreview }) => {
  const [settings, setSettings] = useState<BA_Settings>({
    day: 'Sabtu',
    dateSpelled: 'Dua',
    month: 'Mei',
    yearSpelled: 'Dua Ribu Dua Puluh Enam',
    startTime: '10.00',
    endTime: '12.00',
    room: 'Ruang Guru SMAS PGRI NARINGGUL',
    openingParagraph: 'Pada hari ini {day} Tanggal {dateSpelled} Bulan {month} Tahun {yearSpelled}, pukul {startTime} s/d {endTime} Bertempat di {room} Kecamatan Naringgul Kabupaten Cianjur telah dilakukan Rapat Pleno Penetapan Kelulusan Siswa.',
    secondParagraph: 'Kami yang bertanda tangan dibawah ini, {headmasterTitle}, bersama dengan Dewan Guru dan staf-staf TU telah mengadakan Rapat Pleno Penetapan Kelulusan Siswa {schoolName} tahun pelajaran {academicYear} dan menghasilkan keputusan sebagai :',
    closingParagraph: 'Demikian Berita Cara rapat penentuan dan penetapan Kelulusan Siswa Tahun Pelajaran {academicYear} ini dibuat untuk dapat dipergunakan sebagaimana mestinya.',
    meetingLocation: 'Naringgul',
    leaderName: 'Dedi, S.Pd., Gr.',
    attendees: 'Seluruh Dewan Guru dan Staf Tata Usaha SMAS PGRI Naringgul',
    meetingResult: 'Berdasarkan hasil Rapat Dewan Guru SMAS PGRI Naringgul tentang Kelulusan Peserta Didik Tahun Pelajaran 2025/2026, maka diputuskan nama-nama yang tercantum dalam lampiran dinyatakan Lulus/Tidak Lulus.',
    notaryName: 'Asep Saepul Hayat, S.Pd.',
    notaryIdType: 'NPA',
    notaryIdNumber: '32032416943',
    witnesses: [
      { name: 'Dedi, S.Pd., Gr.', role: 'Kepala Sekolah', idType: 'NPA', idNumber: '32032416943' }
    ],
    showNotule: true,
    showHeader: true,
    fontSize: 11,
    lineHeight: 1.5,
    headerMargin: 2.5,
    showTableStats: true,
    showTablePassed: true,
    showWitnesses: true,
    tableNoLabel: "No",
    tableProgramLabel: "Program",
    tableMaleLabel: "Laki-laki",
    tableFemaleLabel: "Perempuan",
    tableTotalLabel: "Jumlah",
    passedLabel: "Dinyatakan lulus",
    notPassedLabel: "Dinyatakan tidak lulus",
    appendixLabel: "Nama-nama peserta yang dinyatakan LULUS tercantum dalam daftar terlampir.",
    defaultProgramLabel: "XII",
    headmasterTitle: "Kepala SMAS PGRI NARINGGUL",
    fontFamily: 'serif',
    useManualStats: false,
    manualStats: [
      { program: 'XII', male: 0, female: 0, total: 0, passedMale: 0, passedFemale: 0, passedTotal: 0 }
    ]
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'halaman1' | 'halaman2' | 'tampilan'>('halaman1');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'graduation_minutes');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettings(prev => ({
            ...prev,
            ...data,
            manualStats: data.manualStats || prev.manualStats || [],
            useManualStats: data.useManualStats ?? prev.useManualStats ?? false
          } as BA_Settings));
        }
      } catch (error) {
        console.error("Error fetching BA settings:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'graduation_minutes'), settings);
      toast.success('Pengaturan Berita Acara berhasil disimpan');
    } catch (error) {
      console.error("Error saving BA settings:", error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const addWitness = () => {
    setSettings({
      ...settings,
      witnesses: [...settings.witnesses, { name: '', role: '', idType: 'NPA', idNumber: '' }]
    });
  };

  const removeWitness = (index: number) => {
    const newWitnesses = [...settings.witnesses];
    newWitnesses.splice(index, 1);
    setSettings({ ...settings, witnesses: newWitnesses });
  };

  const updateWitness = (index: number, field: keyof Witness, value: string) => {
    const newWitnesses = [...settings.witnesses];
    newWitnesses[index] = { ...newWitnesses[index], [field]: value };
    setSettings({ ...settings, witnesses: newWitnesses });
  };

  const addManualStat = () => {
    setSettings({
      ...settings,
      manualStats: [...settings.manualStats, { program: '', male: 0, female: 0, total: 0, passedMale: 0, passedFemale: 0, passedTotal: 0 }]
    });
  };

  const removeManualStat = (index: number) => {
    const newStats = [...settings.manualStats];
    newStats.splice(index, 1);
    setSettings({ ...settings, manualStats: newStats });
  };

  const updateManualStat = (index: number, field: string, value: string | number) => {
    const newStats = [...settings.manualStats];
    const item = { ...newStats[index], [field]: value };
    
    // Auto calculate totals if needed
    if (field === 'male' || field === 'female') {
      item.total = Number(item.male || 0) + Number(item.female || 0);
    }
    if (field === 'passedMale' || field === 'passedFemale') {
      item.passedTotal = Number(item.passedMale || 0) + Number(item.passedFemale || 0);
    }
    
    newStats[index] = item;
    setSettings({ ...settings, manualStats: newStats });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-400 font-black tracking-widest text-xs animate-pulse">MEMUAT KONFIGURASI...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative z-10 space-y-6">
        {/* Main Controls Overlay Style */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
                <div className="p-2 bg-emerald-500/20 rounded-xl">
                  <Settings className="w-6 h-6 text-emerald-400" />
                </div>
                PENGATURAN BERITA ACARA
              </h3>
              <p className="text-slate-400 text-sm font-medium">Konfigurasi mendalam untuk dokumen Berita Acara & Notulen Rapat.</p>
            </div>
            <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
              <button 
                onClick={() => setActiveSubTab('halaman1')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'halaman1' ? 'bg-emerald-50 text-emerald-950 shadow-lg font-black' : 'hover:bg-white/5 text-slate-400'}`}
              >
                HALAMAN 1
              </button>
              <button 
                onClick={() => setActiveSubTab('halaman2')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'halaman2' ? 'bg-indigo-50 text-indigo-950 shadow-lg font-black' : 'hover:bg-white/5 text-slate-400'}`}
              >
                HALAMAN 2
              </button>
              <button 
                onClick={() => setActiveSubTab('tampilan')}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'tampilan' ? 'bg-amber-50 text-amber-950 shadow-lg font-black' : 'hover:bg-white/5 text-slate-400'}`}
              >
                TAMPILAN & TABEL
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
             {/* Content Sections */}
             {activeSubTab === 'halaman1' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
                        <FileSignature className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Konten Berita Acara (Halaman 1)</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Narasi waktu, tempat, dan kepala sekolah</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 italic px-2 bg-emerald-50 py-1 inline-block rounded">Konfigurasi Waktu & Tempat</h5>
                         <div className="grid grid-cols-2 gap-4 text-xs font-bold text-slate-700">
                            <div className="space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Hari Pelaksanaan</label>
                              <input type="text" value={settings.day} onChange={(e) => setSettings({...settings, day: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Ruangan / Tempat</label>
                              <input type="text" value={settings.room} onChange={(e) => setSettings({...settings, room: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="col-span-2 space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Tanggal Sidang (Terbilang)</label>
                              <input type="text" value={settings.dateSpelled} onChange={(e) => setSettings({...settings, dateSpelled: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Bulan Sidang</label>
                              <input type="text" value={settings.month} onChange={(e) => setSettings({...settings, month: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Tahun (Terbilang)</label>
                              <input type="text" value={settings.yearSpelled} onChange={(e) => setSettings({...settings, yearSpelled: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Waktu Mulai</label>
                              <input type="text" value={settings.startTime} onChange={(e) => setSettings({...settings, startTime: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                              <label className="text-slate-400 uppercase tracking-widest text-[9px]">Waktu Selesai</label>
                              <input type="text" value={settings.endTime} onChange={(e) => setSettings({...settings, endTime: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                         </div>

                         <div className="pt-4 space-y-4">
                            <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 italic px-2 bg-emerald-50 py-1 inline-block rounded">Saksi-Saksi (Ttd)</h5>
                            <div className="space-y-4">
                               {settings.witnesses.map((witness, index) => (
                                 <div key={index} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex flex-col gap-2 relative group shadow-sm transition-all hover:bg-white">
                                    <button 
                                      onClick={() => removeWitness(index)}
                                      className="absolute top-2 right-2 text-rose-500 opacity-0 group-hover:opacity-100 transition-all p-1 hover:bg-rose-50 rounded"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                    <input type="text" value={witness.name} onChange={(e) => updateWitness(index, 'name', e.target.value)} placeholder="Nama Saksi" className="w-full bg-white p-2 rounded-lg text-xs font-bold border border-slate-200" />
                                    <div className="grid grid-cols-2 gap-2">
                                       <select 
                                          value={witness.idType}
                                          onChange={(e) => updateWitness(index, 'idType', e.target.value)}
                                          className="bg-white p-2 rounded-lg text-[10px] font-bold border border-slate-200 uppercase"
                                       >
                                          <option value="NIP">NIP</option>
                                          <option value="NPA">NPA</option>
                                          <option value="NUPTK">NUPTK</option>
                                          <option value="NIY">NIY</option>
                                       </select>
                                       <input type="text" value={witness.idNumber} onChange={(e) => updateWitness(index, 'idNumber', e.target.value)} placeholder="Nomor ID" className="bg-white p-2 rounded-lg text-[10px] font-bold border border-slate-200" />
                                    </div>
                                    <input type="text" value={witness.role} onChange={(e) => updateWitness(index, 'role', e.target.value)} placeholder="Jabatan" className="bg-white p-2 rounded-lg text-[10px] font-bold border border-slate-200 text-emerald-600" />
                                 </div>
                               ))}
                               <button onClick={addWitness} className="w-full flex items-center justify-center gap-2 border border-dashed border-emerald-300 text-emerald-600 py-3 rounded-xl text-xs font-black hover:bg-emerald-50 transition-all uppercase tracking-widest">
                                  <Plus className="w-4 h-4" /> TAMBAH SAKSI
                               </button>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-6">
                         <h5 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-4 italic px-2 bg-emerald-50 py-1 inline-block rounded">Kustomisasi Redaksi Kalimat</h5>
                         <div className="space-y-6">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                PARAGRAF PEMBUKA <Info className="w-3 h-3" />
                              </label>
                              <textarea 
                                value={settings.openingParagraph}
                                onChange={(e) => setSettings({...settings, openingParagraph: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 leading-relaxed min-h-[120px] focus:bg-white transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                PARAGRAF HASIL RAPAT <Info className="w-3 h-3" />
                              </label>
                              <textarea 
                                value={settings.secondParagraph}
                                onChange={(e) => setSettings({...settings, secondParagraph: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 leading-relaxed min-h-[120px] focus:bg-white transition-colors"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">PENUTUP BERITA ACARA</label>
                              <textarea 
                                value={settings.closingParagraph}
                                onChange={(e) => setSettings({...settings, closingParagraph: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-[11px] font-bold text-slate-700 leading-relaxed min-h-[80px] focus:bg-white transition-colors"
                              />
                            </div>
                         </div>
                      </div>
                    </div>
                  </div>
               </div>
             )}

             {activeSubTab === 'halaman2' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                     <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <FileSignature className="w-5 h-5 rotate-12" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Konten Notulen Rapat (Halaman 2)</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Detail pimpinan sidang, hadir, dan notulis</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-bold text-slate-700">
                       <div className="space-y-6">
                          <div className="space-y-1">
                            <label className="text-slate-400 block tracking-widest uppercase text-[9px]">Lokasi Pelaksanaan Sidang / Rapat</label>
                            <input type="text" value={settings.meetingLocation} onChange={(e) => setSettings({...settings, meetingLocation: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 block tracking-widest uppercase text-[9px]">Nama Pimpinan Sidang</label>
                            <input type="text" value={settings.leaderName} onChange={(e) => setSettings({...settings, leaderName: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 block tracking-widest uppercase text-[9px]">Daftar Yang Hadir (Teks Naratif)</label>
                            <textarea value={settings.attendees} onChange={(e) => setSettings({...settings, attendees: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white min-h-[100px]" />
                          </div>
                          <div className="space-y-1">
                            <label className="text-slate-400 block tracking-widest uppercase text-[9px]">Hasil Keputusan Rapat</label>
                            <textarea value={settings.meetingResult} onChange={(e) => setSettings({...settings, meetingResult: e.target.value})} className="w-full p-3 border rounded-xl bg-slate-50 focus:bg-white min-h-[150px]" />
                          </div>
                       </div>

                       <div className="space-y-8">
                          <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 space-y-6">
                             <h5 className="font-black text-indigo-600 tracking-widest text-[10px] uppercase border-b border-indigo-100 pb-2">Identitas Penulis Notulen (Notulis)</h5>
                             <div className="space-y-4">
                                <div className="space-y-1">
                                   <label className="text-indigo-400 text-[9px] uppercase tracking-widest font-black">Nama Lengkap & Gelar</label>
                                   <input 
                                      type="text" 
                                      value={settings.notaryName}
                                      onChange={(e) => setSettings({...settings, notaryName: e.target.value})}
                                      className="w-full p-3 border border-indigo-200 rounded-xl bg-white shadow-sm font-black text-xs text-indigo-900"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                   <div className="space-y-1">
                                      <label className="text-indigo-400 text-[9px] uppercase tracking-widest font-black">Tipe ID</label>
                                      <input 
                                        type="text" 
                                        placeholder="NPA / NIP"
                                        value={settings.notaryIdType}
                                        onChange={(e) => setSettings({...settings, notaryIdType: e.target.value})}
                                        className="w-full p-3 border border-indigo-200 rounded-xl bg-white shadow-sm font-black text-xs text-indigo-900"
                                      />
                                   </div>
                                   <div className="space-y-1">
                                      <label className="text-indigo-400 text-[9px] uppercase tracking-widest font-black">Nomor ID</label>
                                      <input 
                                        type="text" 
                                        value={settings.notaryIdNumber}
                                        onChange={(e) => setSettings({...settings, notaryIdNumber: e.target.value})}
                                        className="w-full p-3 border border-indigo-200 rounded-xl bg-white shadow-sm font-black text-xs text-indigo-900"
                                      />
                                   </div>
                                </div>
                             </div>
                          </div>

                          <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-4 shadow-xl border border-white/5">
                             <div className="flex items-center justify-between">
                                <div>
                                  <h5 className="font-black text-slate-200 tracking-widest text-[10px] uppercase">Sertakan Notulen</h5>
                                  <p className="text-[10px] text-slate-500 font-medium">Cetak Halaman 2 dokumen?</p>
                                </div>
                                <button 
                                  onClick={() => setSettings({...settings, showNotule: !settings.showNotule})}
                                  className={`w-12 h-6 rounded-full transition-all relative ${settings.showNotule ? 'bg-indigo-500 shadow-inner' : 'bg-slate-700'}`}
                                >
                                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${settings.showNotule ? 'left-7' : 'left-1'}`} />
                                </button>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
             )}

             {activeSubTab === 'tampilan' && (
               <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8">
                     <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                        <Layout className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Layout Global & Judul Tabel</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tipografi, margin, dan kustomisasi judul kolom tabel</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold text-xs">
                       <div className="space-y-8">
                          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
                             <h5 className="font-black text-slate-500 tracking-widest text-[10px] uppercase flex items-center gap-2">
                                <Clock className="w-3 h-3 text-slate-400" /> 1. Tipografi & Jabatan
                             </h5>
                             <div className="grid gap-6">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Gaya Font Dokumen</label>
                                  <select 
                                    value={settings.fontFamily}
                                    onChange={(e) => setSettings({...settings, fontFamily: e.target.value as 'serif' | 'sans'})}
                                    className="w-full p-3 border rounded-xl bg-white text-slate-700 font-black"
                                  >
                                    <option value="serif">Formal Heritage (Serif)</option>
                                    <option value="sans">Minimalist Modern (Sans)</option>
                                  </select>
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Titel Jabatan Kepala Sekolah</label>
                                  <input type="text" value={settings.headmasterTitle} onChange={(e) => setSettings({...settings, headmasterTitle: e.target.value})} className="w-full p-3 border rounded-xl font-black bg-white focus:ring-2 focus:ring-amber-500 outline-none" />
                                </div>
                             </div>
                          </div>

                          <div className="bg-amber-50/50 p-6 rounded-3xl border border-amber-100 space-y-4 shadow-sm">
                              <h5 className="font-black text-amber-700 tracking-widest text-[10px] uppercase flex items-center gap-2">
                                 <Layout className="w-3 h-3" /> 2. Judul Kolom Tabel Statistik
                              </h5>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-500 uppercase block mb-1">Judul No</label>
                                    <input type="text" value={settings.tableNoLabel} onChange={(e) => setSettings({...settings, tableNoLabel: e.target.value})} className="w-full p-3 border-amber-200 border rounded-xl bg-white focus:bg-amber-50 transition-colors" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-500 uppercase block mb-1">Judul Program</label>
                                    <input type="text" value={settings.tableProgramLabel} onChange={(e) => setSettings({...settings, tableProgramLabel: e.target.value})} className="w-full p-3 border-amber-200 border rounded-xl bg-white focus:bg-amber-50 transition-colors" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-500 uppercase block mb-1">Label Kolom Laki-laki</label>
                                    <input type="text" value={settings.tableMaleLabel} onChange={(e) => setSettings({...settings, tableMaleLabel: e.target.value})} className="w-full p-3 border-amber-200 border rounded-xl bg-white focus:bg-amber-50 transition-colors" placeholder="Contoh: Jumlah Siswa Laki-laki" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-500 uppercase block mb-1">Label Kolom Perempuan</label>
                                    <input type="text" value={settings.tableFemaleLabel} onChange={(e) => setSettings({...settings, tableFemaleLabel: e.target.value})} className="w-full p-3 border-amber-200 border rounded-xl bg-white focus:bg-amber-50 transition-colors" placeholder="Contoh: Jumlah Siswa Perempuan" />
                                 </div>
                                 <div className="space-y-1">
                                    <label className="text-[9px] font-bold text-amber-500 uppercase block mb-1">Judul Kolom Total (Header)</label>
                                    <input type="text" value={settings.tableTotalLabel} onChange={(e) => setSettings({...settings, tableTotalLabel: e.target.value})} className="w-full p-3 border-amber-200 border rounded-xl bg-white focus:bg-amber-50 transition-colors" placeholder="Contoh: Jumlah" />
                                 </div>
                                 <div className="col-span-2 space-y-1">
                                    <label className="text-[9px] font-bold text-indigo-500 uppercase block mb-1 font-black underline">Teks Program Jika Kosong (Default: XII)</label>
                                    <input type="text" value={settings.defaultProgramLabel} onChange={(e) => setSettings({...settings, defaultProgramLabel: e.target.value})} className="w-full p-3 border-indigo-200 border rounded-xl bg-indigo-100/50 font-black text-xs text-indigo-700 placeholder:text-indigo-300" placeholder="XII atau Generic" />
                                 </div>
                              </div>
                          </div>

                          <div className="bg-slate-900 p-6 rounded-3xl text-white space-y-6 shadow-xl border border-white/5">
                              <div className="flex items-center justify-between">
                                 <div>
                                   <h5 className="font-black text-indigo-400 tracking-widest text-[10px] uppercase">Input Statistik Manual</h5>
                                   <p className="text-[10px] text-slate-500 font-medium">Aktifkan untuk mengisi angka statistik secara manual.</p>
                                 </div>
                                 <button 
                                   onClick={() => setSettings({...settings, useManualStats: !settings.useManualStats})}
                                   className={`w-12 h-6 rounded-full transition-all relative ${settings.useManualStats ? 'bg-indigo-500 shadow-inner' : 'bg-slate-700'}`}
                                 >
                                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg transition-all ${settings.useManualStats ? 'left-7' : 'left-1'}`} />
                                 </button>
                              </div>

                              {settings.useManualStats && (
                                <div className="space-y-4 pt-4 border-t border-white/10">
                                  <div className="grid grid-cols-1 gap-4">
                                    {settings.manualStats.map((stat, index) => (
                                      <div key={index} className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-3 relative group">
                                        <button 
                                          onClick={() => removeManualStat(index)}
                                          className="absolute top-2 right-2 text-rose-400 p-1 hover:bg-rose-500/20 rounded-lg group-hover:opacity-100 opacity-0 transition-all font-bold"
                                        >
                                          <Trash2 className="w-3 h-3" />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Program / Jurusan</label>
                                            <input 
                                              type="text" 
                                              value={stat.program} 
                                              placeholder="Contoh: XII IPA"
                                              onChange={(e) => updateManualStat(index, 'program', e.target.value)} 
                                              className="w-full bg-slate-800 border-none rounded-lg p-2 text-[11px] font-bold text-white focus:ring-1 focus:ring-indigo-500 shadow-inner"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Siswa L</label>
                                            <input 
                                              type="number" 
                                              value={stat.male} 
                                              onChange={(e) => updateManualStat(index, 'male', parseInt(e.target.value) || 0)} 
                                              className="w-full bg-slate-800 border-none rounded-lg p-2 text-[11px] font-bold text-white shadow-inner"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Siswa P</label>
                                            <input 
                                              type="number" 
                                              value={stat.female} 
                                              onChange={(e) => updateManualStat(index, 'female', parseInt(e.target.value) || 0)} 
                                              className="w-full bg-slate-800 border-none rounded-lg p-2 text-[11px] font-bold text-white shadow-inner"
                                            />
                                          </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 border-t border-white/5">
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Lulus L</label>
                                            <input 
                                              type="number" 
                                              value={stat.passedMale} 
                                              onChange={(e) => updateManualStat(index, 'passedMale', parseInt(e.target.value) || 0)} 
                                              className="w-full bg-emerald-500/10 border-none rounded-lg p-2 text-[11px] font-bold text-emerald-400 shadow-inner"
                                            />
                                          </div>
                                          <div className="space-y-1">
                                            <label className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Lulus P</label>
                                            <input 
                                              type="number" 
                                              value={stat.passedFemale} 
                                              onChange={(e) => updateManualStat(index, 'passedFemale', parseInt(e.target.value) || 0)} 
                                              className="w-full bg-emerald-500/10 border-none rounded-lg p-2 text-[11px] font-bold text-emerald-400 shadow-inner"
                                            />
                                          </div>
                                        </div>

                                        <div className="flex justify-between items-center text-[9px] font-black px-1">
                                          <span className="text-slate-500 uppercase tracking-wider">Total: <span className="text-white">{stat.total}</span></span>
                                          <span className="text-slate-500 uppercase tracking-wider">Total Lulus: <span className="text-emerald-400">{stat.passedTotal}</span></span>
                                        </div>
                                      </div>
                                    ))}
                                    
                                    <button 
                                      onClick={addManualStat}
                                      className="flex items-center justify-center gap-2 py-3 border border-dashed border-indigo-500/30 rounded-2xl text-[10px] font-black text-indigo-400 hover:bg-white/5 transition-all uppercase tracking-widest"
                                    >
                                      <Plus className="w-3 h-3" /> Tambah Baris Statistik
                                    </button>
                                  </div>
                                </div>
                              )}
                          </div>
                       </div>

                       <div className="space-y-8">
                          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
                             <h5 className="font-black text-slate-500 tracking-widest text-[10px] uppercase flex items-center gap-2">
                                <MapPin className="w-3 h-3 text-slate-400" /> 3. Gaya Cetak & Layout
                             </h5>
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Font Size (pt)</label>
                                  <input type="number" value={settings.fontSize} onChange={(e) => setSettings({...settings, fontSize: Number(e.target.value)})} className="w-full p-3 border rounded-xl bg-white font-black" />
                                </div>
                                <div>
                                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wider">Line Space</label>
                                  <input type="number" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({...settings, lineHeight: Number(e.target.value)})} className="w-full p-3 border rounded-xl bg-white font-black" />
                                </div>
                             </div>
                             <div className="pt-2">
                                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-widest">Komersial Margin Atas - Cm (Jika Tanpa Kop)</label>
                                <div className="flex items-center gap-3">
                                   <input type="number" step="0.1" value={settings.headerMargin} onChange={(e) => setSettings({...settings, headerMargin: Number(e.target.value)})} className="w-full p-3 border rounded-xl bg-white font-black text-indigo-600" />
                                   <span className="text-[10px] font-black text-slate-400 uppercase">CM</span>
                                </div>
                             </div>
                          </div>

                          <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 space-y-4 shadow-sm">
                             <h5 className="font-black text-indigo-600 tracking-widest text-[10px] uppercase flex items-center gap-2">
                                <UserCheck className="w-3 h-3" /> 4. Teks Indikator Status
                             </h5>
                             <div className="space-y-4">
                                <div className="space-y-1">
                                   <label className="text-[9px] uppercase text-indigo-400 font-bold">Label Status Lulus</label>
                                   <input type="text" value={settings.passedLabel} onChange={(e) => setSettings({...settings, passedLabel: e.target.value})} placeholder="Status Lulus" className="w-full p-3 border border-indigo-200 rounded-xl bg-white shadow-sm font-black text-xs" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] uppercase text-indigo-400 font-bold">Label Status Tidak Lulus</label>
                                   <input type="text" value={settings.notPassedLabel} onChange={(e) => setSettings({...settings, notPassedLabel: e.target.value})} placeholder="Status Tidak Lulus" className="w-full p-3 border border-indigo-200 rounded-xl bg-white shadow-sm font-black text-xs" />
                                </div>
                                <div className="space-y-1">
                                   <label className="text-[9px] uppercase text-indigo-400 font-bold">Kalimat Keterangan Appendix</label>
                                   <textarea value={settings.appendixLabel} onChange={(e) => setSettings({...settings, appendixLabel: e.target.value})} placeholder="Lampiran Teks" className="w-full p-3 border border-indigo-200 rounded-xl bg-white shadow-sm text-[11px] font-bold min-h-[80px]" />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
               </div>
             )}
          </div>

          <div className="space-y-6">
             <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col gap-8 sticky top-24 border border-white/5 group">
                {/* Decorative glow */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-all duration-700" />
                
                <div className="space-y-6 relative z-10">
                   <div className="bg-emerald-500/20 w-20 h-20 rounded-3xl flex items-center justify-center border border-emerald-500/30 shadow-inner">
                      <Save className="w-10 h-10 text-emerald-400" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">Simpan Perubahan</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Seluruh konfigurasi Berita Acara akan langsung diterapkan ke dokumen PDF saat dicetak.</p>
                   </div>
                   
                   <div className="space-y-3">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 text-slate-950 h-16 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3"
                      >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                        SIMPAN SEMUA
                      </button>
                      
                      {onPreview && (
                        <button 
                          onClick={onPreview}
                          className="w-full bg-white/5 hover:bg-white/10 text-white h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all border border-white/10 flex items-center justify-center gap-3 uppercase shadow-sm group"
                        >
                          <Eye className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                          LIHAT PRATINJAU
                        </button>
                      )}
                   </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-6 relative z-10">
                   <h5 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Status Visibilitas</h5>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[11px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Tampilkan KOP</span>
                         <button 
                           onClick={() => setSettings({...settings, showHeader: !settings.showHeader})} 
                           className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${settings.showHeader ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50' : 'bg-slate-800 text-slate-600 border-slate-700'}`}
                         >
                           <Eye className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[11px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Tabel Statistik</span>
                         <button 
                           onClick={() => setSettings({...settings, showTableStats: !settings.showTableStats})} 
                           className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${settings.showTableStats ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-600 border-slate-700'}`}
                         >
                           <Layout className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[11px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Daftar Lulus</span>
                         <button 
                           onClick={() => setSettings({...settings, showTablePassed: !settings.showTablePassed})} 
                           className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${settings.showTablePassed ? 'bg-indigo-500/20 text-indigo-400 border-indigo-500/50' : 'bg-slate-800 text-slate-600 border-slate-700'}`}
                         >
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
};

export default MinutesSettings;

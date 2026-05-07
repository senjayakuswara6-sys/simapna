import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  Save, 
  Loader2, 
  Mail, 
  Info, 
  Eye, 
  Settings, 
  Calendar, 
  Layout, 
  Plus, 
  Trash2,
  MapPin,
  Clock,
  Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { GraduationInvitationSettings } from '../../types';

interface InviteSettingsProps {
  onPreview?: () => void;
}

export default function InviteSettings({ onPreview }: InviteSettingsProps) {
  const [settings, setSettings] = useState<GraduationInvitationSettings>({
    number: '283/SMA.PGRI/I.6/O.2026',
    attachment: '-',
    subject: 'Undangan Rapat Verifikasi Kelulusan Kelas XII Tahun Pelajaran 2025/2026',
    date: 'Saturday, 2026-05-02',
    day: 'Sabtu',
    time: '10.00 s.d Selesai',
    venue: 'SMAS PGRI NARINGGUL',
    agenda: 'Rapat Pleno Penetapan Kelulusan Siswa Kelas XII',
    signDate: 'Cianjur, 30 April 2026',
    tembusan: [
      'Kepala Cabang Dinas Wilayah VI Provinsi Jawa Barat.',
      'Ketua Umum (YPLP DIKDASMEN) PGRI PROVINSI JAWA BARAT.',
      'Arsip'
    ],
    showHeader: true,
    headerMargin: 0,
    fontSize: 12,
    lineHeight: 1.5,
    showStamp: true,
    indentation: 1.5
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'konten' | 'layout'>('konten');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docSnap = await getDoc(doc(db, 'settings', 'graduation_invitation'));
        if (docSnap.exists()) {
          setSettings({
            ...settings,
            ...docSnap.data()
          } as GraduationInvitationSettings);
        }
      } catch (error) {
        handleFirestoreError(error, 'get', 'settings/graduation_invitation');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'graduation_invitation'), settings);
      toast.success('Template Undangan berhasil disimpan!');
    } catch (error) {
      handleFirestoreError(error, 'write', 'settings/graduation_invitation');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
        <p className="text-slate-400 font-black tracking-widest text-xs animate-pulse">MEMUAT KONFIGURASI UNDANGAN...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="relative z-10 space-y-6">
        {/* Header Section */}
        <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl border border-white/10 overflow-hidden relative group">
           <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none group-hover:scale-110 transition-transform duration-1000">
              <Mail className="w-48 h-48 rotate-12" />
           </div>
           
           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div>
                 <h3 className="text-2xl font-black tracking-tight mb-2 flex items-center gap-3">
                   <div className="p-2 bg-blue-500/20 rounded-xl">
                     <Mail className="w-6 h-6 text-blue-400" />
                   </div>
                   SETTING SURAT UNDANGAN
                 </h3>
                 <p className="text-slate-400 text-sm font-medium">Konfigurasi redaksi, tembusan, dan tata letak surat undangan resmi.</p>
              </div>
              <div className="flex items-center gap-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                 <button 
                  onClick={() => setActiveSubTab('konten')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'konten' ? 'bg-blue-50 text-blue-950 font-black shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                 >
                   KONTEN SURAT
                 </button>
                 <button 
                  onClick={() => setActiveSubTab('layout')}
                  className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all ${activeSubTab === 'layout' ? 'bg-indigo-50 text-indigo-950 font-black shadow-lg' : 'hover:bg-white/5 text-slate-400'}`}
                 >
                   TATA LETAK
                 </button>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
           <div className="lg:col-span-3 space-y-6">
              {activeSubTab === 'konten' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Redaksi & Konten Utaman</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Atur nomor, perihal, dan detail agenda rapat</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 font-bold text-xs">
                      <div className="space-y-6">
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Nomor Surat</label>
                            <input 
                              type="text" 
                              value={settings.number}
                              onChange={(e) => setSettings({...settings, number: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-indigo-600 tracking-tight"
                            />
                         </div>
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Perihal / Hal</label>
                            <textarea 
                              value={settings.subject}
                              onChange={(e) => setSettings({...settings, subject: e.target.value})}
                              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700 min-h-[80px]"
                            />
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                               <label className="text-slate-400 uppercase tracking-widest text-[9px]">Hari</label>
                               <input type="text" value={settings.day} onChange={(e) => setSettings({...settings, day: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                            <div className="space-y-1">
                               <label className="text-slate-400 uppercase tracking-widest text-[9px]">Jam</label>
                               <input type="text" value={settings.time} onChange={(e) => setSettings({...settings, time: e.target.value})} className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl" />
                            </div>
                         </div>
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Tempat Pelaksanaan</label>
                            <input type="text" value={settings.venue} onChange={(e) => setSettings({...settings, venue: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                         </div>
                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Agenda Utama</label>
                            <input type="text" value={settings.agenda} onChange={(e) => setSettings({...settings, agenda: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl" />
                         </div>
                      </div>

                      <div className="space-y-6">
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4 shadow-sm">
                            <h5 className="font-black text-indigo-600 tracking-widest text-[10px] uppercase flex items-center gap-2 underline decoration-indigo-200">
                               <Send className="w-3 h-3" /> Tembusan Surat
                            </h5>
                            <textarea 
                              rows={6}
                              value={settings.tembusan.join('\n')}
                              onChange={(e) => setSettings({...settings, tembusan: e.target.value.split('\n')})}
                              className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 leading-relaxed text-[11px]"
                              placeholder="1. Kepala Sekolah&#10;2. Arsip"
                            />
                            <p className="text-[10px] text-slate-400 italic">Sertakan nomor atau list per baris untuk tampilan tembusan yang rapi.</p>
                         </div>

                         <div className="space-y-1">
                            <label className="text-slate-400 uppercase tracking-widest text-[9px]">Tempat & Tanggal Surat (Ttd)</label>
                            <input type="text" value={settings.signDate} onChange={(e) => setSettings({...settings, signDate: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-black text-xs text-blue-600" />
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeSubTab === 'layout' && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                      <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Layout className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Layout & Tipografi</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Atur margin, font, dan elemen visual surat</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-xs font-bold text-slate-700">
                      <div className="space-y-8">
                         <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                            <h5 className="font-black text-slate-500 tracking-widest text-[10px] uppercase">Gaya Teks & Paragraf</h5>
                            <div className="grid grid-cols-2 gap-4">
                               <div className="space-y-1">
                                  <label className="text-slate-400 text-[9px] uppercase tracking-widest">Font Size (pt)</label>
                                  <input type="number" value={settings.fontSize} onChange={(e) => setSettings({...settings, fontSize: Number(e.target.value)})} className="w-full p-2.5 border rounded-lg bg-white" />
                               </div>
                               <div className="space-y-1">
                                  <label className="text-slate-400 text-[9px] uppercase tracking-widest">Line Space</label>
                                  <input type="number" step="0.1" value={settings.lineHeight} onChange={(e) => setSettings({...settings, lineHeight: Number(e.target.value)})} className="w-full p-2.5 border rounded-lg bg-white" />
                               </div>
                               <div className="col-span-2 space-y-1">
                                  <label className="text-slate-400 text-[9px] uppercase tracking-widest">Indentasi Paragraf (Cm)</label>
                                  <input type="number" step="0.1" value={settings.indentation} onChange={(e) => setSettings({...settings, indentation: Number(e.target.value)})} className="w-full p-2.5 border rounded-lg bg-white" />
                               </div>
                            </div>
                         </div>
                      </div>

                      <div className="space-y-8">
                         <div className="bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100 shadow-sm space-y-4">
                            <h5 className="font-black text-indigo-600 tracking-widest text-[10px] uppercase">Margin Atas (Cm)</h5>
                            <div className="flex items-center gap-3">
                               <input type="number" step="0.1" value={settings.headerMargin} onChange={(e) => setSettings({...settings, headerMargin: Number(e.target.value)})} className="w-full p-3 border border-indigo-200 rounded-xl bg-white font-black text-indigo-600" />
                               <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest shrink-0">BILA TANPA KOP</span>
                            </div>
                            <p className="text-[9px] text-indigo-600/70 italic font-medium">Jika KOP dinonaktifkan, gunakan margin ini untuk memberi ruang bagi KOP surat cetak pabrik.</p>
                         </div>
                      </div>
                   </div>
                </div>
              )}
           </div>

           <div className="space-y-6">
              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col gap-8 sticky top-24 border border-white/5 group">
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-500/10 blur-[80px] rounded-full group-hover:bg-blue-500/20 transition-all duration-700" />
                
                <div className="space-y-6 relative z-10">
                   <div className="bg-blue-500/20 w-20 h-20 rounded-3xl flex items-center justify-center border border-blue-500/30 shadow-inner">
                      <Save className="w-10 h-10 text-blue-400" />
                   </div>
                   <div>
                      <h4 className="text-2xl font-black mb-2 uppercase tracking-tight">Simpan</h4>
                      <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-relaxed">Update template undangan secara instan.</p>
                   </div>
                   
                   <div className="space-y-3">
                      <button 
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-slate-950 h-16 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3"
                      >
                        {saving ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                        SIMPAN
                      </button>
                      
                      {onPreview && (
                        <button 
                          onClick={onPreview}
                          className="w-full bg-white/5 hover:bg-white/10 text-white h-14 rounded-2xl font-black text-[10px] tracking-widest transition-all border border-white/10 flex items-center justify-center gap-3 uppercase shadow-sm group"
                        >
                          <Eye className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                          PREVIEW
                        </button>
                      )}
                   </div>
                </div>

                <div className="pt-8 border-t border-white/10 space-y-4 relative z-10">
                   <h5 className="text-[10px] font-black text-slate-500 tracking-[0.2em] uppercase">Visibility</h5>
                   <div className="space-y-4">
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[11px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Header / KOP</span>
                         <button onClick={() => setSettings({...settings, showHeader: !settings.showHeader})} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${settings.showHeader ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-inner' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                           <Layout className="w-4 h-4" />
                         </button>
                      </div>
                      <div className="flex items-center justify-between group/toggle">
                         <span className="text-[11px] font-black text-slate-400 group-hover/toggle:text-white transition-colors uppercase tracking-widest">Stempel</span>
                         <button onClick={() => setSettings({...settings, showStamp: !settings.showStamp})} className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all border ${settings.showStamp ? 'bg-blue-500/20 text-blue-400 border-blue-500/50 shadow-inner' : 'bg-slate-800 text-slate-600 border-slate-700'}`}>
                           <Settings className="w-4 h-4" />
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

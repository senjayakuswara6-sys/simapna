import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SchoolSettings } from '../types';
import { Save, CheckCircle2, AlertCircle, Printer, FileText, Settings as UISettings, UserCheck, Layout, Type, Calculator, PenTool, BookOpen, Info, HelpCircle, Eye, RefreshCw, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SKLPreview from './SKLPreview';
import TranscriptPreview from './TranscriptPreview';
import { Student } from '../types';
import toast from 'react-hot-toast';

export default function SettingsForm() {
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: '',
    address: '',
    district: '',
    regency: '',
    headmasterName: '',
    headmasterNip: '',
    headmasterIdType: 'NIP',
    academicYear: '2024/2025',
    graduationDate: new Date().toISOString().split('T')[0],
    plenaryDate: new Date().toISOString().split('T')[0],
    letterNumberTemplate: '285/SMA-PGRI/1.6/O.2026',
    signatureStampUrl: '',
    isCountdownActive: false,
    countdownTargetDate: new Date().toISOString().slice(0, 16),
    sklFormat: 'FORMAT_2',
    f4TopMargin: 5,
    f4BottomMargin: 1,
    f4LeftMargin: 1.5,
    f4RightMargin: 1.5,
    printScale: 100,
    
    // Default SKL Content
    sklShowHeader: true,
    sklHeaderMargin: 5,
    sklTitle: 'SURAT KETERANGAN LULUS',
    sklIsiTeks1: 'Yang bertanda tangan di bawah ini Kepala SMAS PGRI Naringgul, Menerangkan bahwa :',
    sklIdentitas1: 'Nama Peserta Didik',
    sklIdentitas2: 'Tempat & Tanggal Lahir',
    sklIdentitas3: 'Jenis Kelamin',
    sklIdentitas4: 'Nomor Induk Siswa',
    sklIdentitas5: 'Nomor Induk Siswa Nasional',
    sklIdentitas6: 'Agama',
    sklIdentitas7: 'Nama Orang Tua',
    sklIdentitas8: 'Peminatan (K13)',
    sklIsiTeks2: 'berdasarkan kriteria kelulusan peserta didik yang sudah ditetapkan sebagai berikut :\n1. Penyelesaian seluruh program pembelajaran pada Kurikulum Merdeka;\n2. Kriteria kelulusan dari satuan pendidikan sesuai dengan peraturan perundang-undangan;\n3. Rapat Pleno Dewan Guru tentang Penetapan Kelulusan pada tanggal 2 Mei 2026;\nMaka yang bersangkutan dinyatakan :',
    sklStatusKelulusanLabel: 'Status Kelulusan',
    sklShowStatus: true,
    sklIsiTeks3: 'dari satuan pendidikan SMAS PGRI Naringgul berdasarkan Pengumuman Kelulusan Nomor 285/SMAS-PGRI/1.6/O.2026, tanggal 4 Mei 2026, dengan nilai sebagai berikut :',
    sklAdaTabelNilai: true,
    sklJudulKolomNilai: 'Nilai',
    sklIsiTeks4: 'Surat Keterangan Lulus ini bersifat sementara, dan hanya berlaku sampai dikeluarkannya ijazah.\nDemikian Surat Keterangan ini diberikan untuk dapat dipergunakan sebagaimana mestinya, apabila dikemudian hari terdapat kekeliruan maka akan dilakukan perbaikan atau Surat Keterangan ini tidak berlaku.',
    
    numDecimalNilai: 2,
    showRataRata: true,
    numDecimalRataRata: 2,
    ttdTempatTanggal: 'Cianjur, 4 Mei 2026',
    ttdJabatan: 'Kepala Sekolah',
    showFotoSiswa: false,
    showTtdKepala: false,
    sklFotoSpacing: 3,
    namaSiswaKapital: true,
    showIdentitasKurikulum: true,
    showPeminatanSKL: true,
    sklTemplate: 'V1',
    sklFontSize: 11,
    sklLineHeight: 1.3,
    sklTableFontSize: 9.5,
    sklTableLineHeight: 1.15
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isChangingTemplate, setIsChangingTemplate] = useState(false);
  const [previewType, setPreviewType] = useState<'skl' | 'transcript' | null>(null);

  // Mock student for preview
  const mockStudent: Student = {
    nisn: '0012345678',
    nis: '232410001',
    name: 'CONTOH NAMA SISWA LENGKAP',
    gender: 'L',
    birthPlace: 'Cianjur',
    birthDate: '2008-05-20',
    parentName: 'NAMA ORANG TUA',
    className: 'XII MIPA 1',
    peminatan: 'MIPA',
    status: 'LULUS',
    averageScore: 88.50,
    subjects: [
      { subjectName: 'Pendidikan Agama dan Budi Pekerti', score: 85, category: 'UMUM' },
      { subjectName: 'Pendidikan Pancasila dan Kewarganegaraan', score: 87, category: 'UMUM' },
      { subjectName: 'Bahasa Indonesia', score: 90, category: 'UMUM' },
      { subjectName: 'Matematika', score: 82, category: 'UMUM' },
    ]
  };

  const handleTemplateChange = (format: 'FORMAT_1' | 'FORMAT_2') => {
    setIsChangingTemplate(true);
    setTimeout(() => {
      setSettings(prev => ({ ...prev, sklFormat: format }));
      setIsChangingTemplate(false);
    }, 1000);
  };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [generalSnap, logoSnap, uiLogoSnap, signatureSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDoc(doc(db, 'settings', 'logo_ui')),
          getDoc(doc(db, 'settings', 'signature_stamp'))
        ]);

        if (generalSnap.exists()) {
          const data = generalSnap.data();
          setSettings(prev => ({
            ...prev,
            ...data,
            logoUrl: logoSnap.exists() ? logoSnap.data().url : '',
            secondaryLogoUrl: uiLogoSnap.exists() ? uiLogoSnap.data().url : '',
            signatureStampUrl: signatureSnap.exists() ? signatureSnap.data().url : '',
          } as SchoolSettings));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const { logoUrl, secondaryLogoUrl, signatureStampUrl, ...generalData } = settings;
      
      await Promise.all([
        setDoc(doc(db, 'settings', 'general'), generalData),
      ]);

      toast.success('Pengaturan berhasil disimpan!');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      handleFirestoreError(error, 'write', 'settings/general');
      toast.error('Gagal menyimpan pengaturan.');
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (file: File, type: 'logoUrl' | 'secondaryLogoUrl' | 'signatureStampUrl') => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings(prev => ({ ...prev, [type]: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  if (loading) return null;

  return (
    <div className="max-w-6xl mx-auto -mb-10 min-h-screen flex flex-col relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Layout className="w-6 h-6 text-blue-600" />
            Setting Tampilan SKL dan Transkrip Nilai Ijazah
          </h2>
          <p className="text-slate-500 text-sm font-medium">Sesuaikan isi dan tampilan dokumen SKL secara detail.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button" 
            className="group flex items-center gap-2 bg-slate-100 hover:bg-white hover:ring-2 hover:ring-slate-200 text-slate-600 px-4 py-2.5 rounded-xl transition-all font-bold text-xs"
          >
            <HelpCircle className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
            PETUNJUK SETTING
          </button>
          <button 
            type="button" 
            onClick={() => setPreviewType('skl')}
            className="flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-blue-600 hover:text-white transition-all shadow-sm"
          >
            <Eye className="w-4 h-4" />
            PRATINJAU SKL
          </button>
          <button 
            type="button" 
            onClick={() => setPreviewType('transcript')}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
          >
            <Printer className="w-4 h-4" />
            PRATINJAU TRANSKRIP
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 flex-1 pb-32">
        {/* Template Selection Section */}
        <section className="relative bg-slate-900 p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl overflow-hidden group">
           <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/20 blur-[80px] rounded-full -mr-20 -mt-20"></div>
           
           <AnimatePresence>
             {isChangingTemplate && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center gap-4"
                >
                  <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
                  <p className="text-sm font-black tracking-widest uppercase text-blue-200">Menerapkan Format Baru...</p>
                </motion.div>
             )}
           </AnimatePresence>

           <div className="flex flex-col md:flex-row gap-10 items-center relative z-10">
              <div className="flex-1 space-y-3">
                 <div className="inline-flex items-center gap-2 bg-blue-500/20 px-3 py-1 rounded-full border border-blue-400/30">
                    <Layout className="w-3.5 h-3.5 text-blue-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-300">Konfigurasi Template</span>
                 </div>
                 <h3 className="text-3xl font-black tracking-tight leading-none">FORMAT DOKUMEN <span className="text-blue-400">SKL</span></h3>
                 <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-md">Pilih struktur tampilan dokumen yang akan dicetak. Perubahan ini akan segera menyesuaikan tata letak SKL siswa secara otomatis.</p>
              </div>
              <div className="flex bg-white/5 p-2 rounded-[1.75rem] border border-white/10 shrink-0">
                 <button
                    type="button"
                    onClick={() => handleTemplateChange('FORMAT_1')}
                    className={`px-8 py-4 rounded-2xl font-black text-sm transition-all tracking-wider ${settings.sklFormat === 'FORMAT_1' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
                 >
                    FORMAT 1
                 </button>
                 <button
                    type="button"
                    onClick={() => handleTemplateChange('FORMAT_2')}
                    className={`px-8 py-4 rounded-2xl font-black text-sm transition-all tracking-wider ${settings.sklFormat === 'FORMAT_2' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
                 >
                    FORMAT 2
                 </button>
              </div>
           </div>
        </section>

        {/* Basic Settings Section */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-black text-slate-800 uppercase tracking-tight">Konfigurasi Konten SKL</h3>
          </div>
          <div className="p-8 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <label className="text-sm font-bold text-slate-700 capitalize">1. Tampilkan Kop Surat</label>
                <div className="md:col-span-3 flex flex-col md:flex-row gap-4">
                  <select
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                    value={settings.sklShowHeader ? 'true' : 'false'}
                    onChange={e => setSettings({...settings, sklShowHeader: e.target.value === 'true'})}
                  >
                    <option value="true">Tampilkan Logo & Kop Surat</option>
                    <option value="false">Sembunyikan (Gunakan Kertas Kop)</option>
                  </select>
                  {!settings.sklShowHeader && (
                    <div className="flex-1 flex items-center gap-3">
                      <label className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">Margin Atas (CM)</label>
                      <input
                        type="number" step="0.1"
                        className="w-24 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={settings.sklHeaderMargin}
                        onChange={e => setSettings({...settings, sklHeaderMargin: parseFloat(e.target.value)})}
                      />
                    </div>
                  )}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <label className="text-sm font-bold text-slate-700 capitalize">1. Logo Kop Surat</label>
                <div className="md:col-span-3 flex items-center gap-4">
                  <p className="text-sm font-bold text-slate-500 italic">Dikelola di Menu Identitas Sekolah</p>
                  {settings.logoUrl && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <label className="text-sm font-bold text-slate-700">2. Judul Dokumen</label>
                <input
                  type="text"
                  className="md:col-span-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.sklTitle}
                  onChange={e => setSettings({...settings, sklTitle: e.target.value})}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <label className="text-sm font-bold text-slate-700">3. Template No. Surat</label>
                <input
                  type="text"
                  className="md:col-span-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.letterNumberTemplate}
                  onChange={e => setSettings({...settings, letterNumberTemplate: e.target.value})}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <label className="text-sm font-bold text-slate-700 pt-3">4. Pembuka (Isi Teks 1)</label>
                <textarea
                  rows={2}
                  className="md:col-span-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  value={settings.sklIsiTeks1}
                  onChange={e => setSettings({...settings, sklIsiTeks1: e.target.value})}
                />
             </div>

             <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between px-2 mb-2">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Urutan Identitas Siswa</p>
                   <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Pilih Label Dropdown</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[1,2,3,4,5,6,7,8].map(i => (
                    <div key={i} className="space-y-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Baris Ke-{i}</label>
                        <select
                          className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                          value={(settings as any)[`sklIdentitas${i}`]}
                          onChange={e => setSettings({...settings, [`sklIdentitas${i}`]: e.target.value})}
                        >
                          <option value="">(Kosongkan)</option>
                          <option value="Nama Peserta Didik">Nama Peserta Didik</option>
                          <option value="Tempat dan Tanggal Lahir">Tempat dan Tanggal Lahir</option>
                          <option value="Jenis Kelamin">Jenis Kelamin</option>
                          <option value="Nomor Induk Siswa">Nomor Induk Siswa</option>
                          <option value="Nomor Induk Siswa Nasional">Nomor Induk Siswa Nasional</option>
                          <option value="Nama Orang Tua">Nama Orang Tua</option>
                          <option value="Kelas">Kelas</option>
                          <option value="Peminatan / Jurusan">Peminatan / Jurusan</option>
                          <option value="Agama">Agama</option>
                        </select>
                    </div>
                  ))}
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <label className="text-sm font-bold text-slate-700 pt-3">13. Dasar Penilaian (Isi Teks 2)</label>
                <textarea
                  rows={4}
                  className="md:col-span-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  value={settings.sklIsiTeks2}
                  onChange={e => setSettings({...settings, sklIsiTeks2: e.target.value})}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
                <label className="text-sm font-bold text-slate-700">14. Tampilkan Status Lulus</label>
                <div className="md:col-span-3 flex flex-col md:flex-row gap-4">
                  <select
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                    value={settings.sklShowStatus ? 'true' : 'false'}
                    onChange={e => setSettings({...settings, sklShowStatus: e.target.value === 'true'})}
                  >
                    <option value="true">Ya, Tampilkan Status Lulus</option>
                    <option value="false">Tidak, Sembunyikan</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Label Status (Contoh: Status Kelulusan)"
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.sklStatusKelulusanLabel}
                    onChange={e => setSettings({...settings, sklStatusKelulusanLabel: e.target.value})}
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <label className="text-sm font-bold text-slate-700 pt-3">15. Penyambung (Isi Teks 3)</label>
                <textarea
                  rows={2}
                  className="md:col-span-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  value={settings.sklIsiTeks3}
                  onChange={e => setSettings({...settings, sklIsiTeks3: e.target.value})}
                />
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-center pt-4 border-t border-slate-100">
                <label className="text-sm font-bold text-slate-700">16. Konfigurasi Tabel Nilai</label>
                <div className="md:col-span-3 flex flex-col md:flex-row gap-4">
                  <select
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                    value={settings.sklAdaTabelNilai ? 'true' : 'false'}
                    onChange={e => setSettings({...settings, sklAdaTabelNilai: e.target.value === 'true'})}
                  >
                    <option value="true">Tampilkan Tabel Nilai</option>
                    <option value="false">Sembunyikan Tabel Nilai</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Judul Kolom Nilai..."
                    className="flex-1 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none italic"
                    value={settings.sklJudulKolomNilai}
                    onChange={e => setSettings({...settings, sklJudulKolomNilai: e.target.value})}
                  />
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
                <label className="text-sm font-bold text-slate-700 pt-3">17. Penutup (Isi Teks 4)</label>
                <textarea
                  rows={3}
                  className="md:col-span-3 px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none leading-relaxed"
                  value={settings.sklIsiTeks4}
                  onChange={e => setSettings({...settings, sklIsiTeks4: e.target.value})}
                />
             </div>
          </div>
        </section>

        {/* Additional sections grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
           {/* Scoring Settings */}
           <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-fit">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
                 <div className="bg-emerald-100 p-2 rounded-xl">
                    <Calculator className="w-5 h-5 text-emerald-600" />
                 </div>
                 <h3 className="font-black text-slate-800 uppercase tracking-tight">Tabel Transkrip Nilai</h3>
              </div>
              <div className="p-8 space-y-5">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Jml Angka Desimal Nilai</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.numDecimalNilai}
                      onChange={e => setSettings({...settings, numDecimalNilai: parseInt(e.target.value)})}
                    >
                      <option value={2}>2 Desimal (Contoh : 60.01)</option>
                      <option value={1}>1 Desimal (Contoh : 60.1)</option>
                      <option value={0}>Tanpa Desimal (Bulat)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Baris Rata-Rata Nilai</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.showRataRata ? 'true' : 'false'}
                      onChange={e => setSettings({...settings, showRataRata: e.target.value === 'true'})}
                    >
                      <option value="true">Tampilkan Baris Rata-Rata Nilai</option>
                      <option value="false">Sembunyikan Baris Rata-Rata Nilai</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Jml Angka Desimal Rata-Rata</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.numDecimalRataRata}
                      onChange={e => setSettings({...settings, numDecimalRataRata: parseInt(e.target.value)})}
                    >
                      <option value={2}>2 Desimal (Contoh : 70.01)</option>
                      <option value={1}>1 Desimal (Contoh : 70.1)</option>
                    </select>
                 </div>
              </div>
           </section>

           {/* Signature Settings */}
           <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-fit">
              <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
                 <div className="bg-rose-100 p-2 rounded-xl">
                    <PenTool className="w-5 h-5 text-rose-600" />
                 </div>
                 <h3 className="font-black text-slate-800 uppercase tracking-tight">Setting Tampilan Tanda Tangan</h3>
              </div>
              <div className="p-8 space-y-5">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">18. Tempat dan Tanggal</label>
                    <input
                      type="text"
                      placeholder="Contoh: Cianjur, 4 Mei 2026"
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.ttdTempatTanggal}
                      onChange={e => setSettings({...settings, ttdTempatTanggal: e.target.value})}
                    />
                 </div>
                 <div className="space-y-2 opacity-60">
                    <label className="text-xs font-bold text-slate-500 uppercase">19. Penanggung Jawab (Dikelola di Menu Identitas)</label>
                    <input
                      type="text"
                      disabled
                      placeholder="Dikelola di Menu Identitas"
                      className="w-full px-5 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold outline-none cursor-not-allowed"
                      value={`${settings.ttdJabatan} - ${settings.headmasterName}`}
                    />
                 </div>
                 <div className="hidden">
                    <label className="text-xs font-bold text-slate-500 uppercase">20. Nama Lengkap</label>
                    <input
                      type="text"
                      placeholder="Contoh: Dedi, S.Pd., Gr."
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.headmasterName}
                      onChange={e => setSettings({...settings, headmasterName: e.target.value})}
                    />
                 </div>
                 <div className="hidden">
                    <label className="text-xs font-bold text-slate-500 uppercase">21. Identitas (NIP/NPA/NIY)</label>
                    <input
                      type="text"
                      placeholder="Contoh: NPA.32032416943"
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.headmasterNip}
                      onChange={e => setSettings({...settings, headmasterNip: e.target.value})}
                    />
                 </div>
                 <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">20. Tampilkan Foto Siswa</label>
                       <select
                         className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                         value={settings.showFotoSiswa ? 'true' : 'false'}
                         onChange={e => setSettings({...settings, showFotoSiswa: e.target.value === 'true'})}
                       >
                         <option value="false">Kosongkan Foto Siswa</option>
                         <option value="true">Tampilkan Foto Siswa</option>
                       </select>
                    </div>
                    <div className="flex-1 space-y-2">
                       <label className="text-xs font-bold text-slate-500 uppercase">21. Tampilkan TTD/Cap Sekolah</label>
                       <select
                         className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                         value={settings.showTtdKepala ? 'true' : 'false'}
                         onChange={e => setSettings({...settings, showTtdKepala: e.target.value === 'true'})}
                       >
                         <option value="false">Kosongkan TTD Kepala Sekolah</option>
                         <option value="true">Tampilkan TTD Kepala Sekolah</option>
                       </select>
                    </div>
                 </div>

                 <div className="space-y-3 p-6 bg-slate-50 rounded-3xl border border-slate-100">
                    <div className="flex items-center justify-between">
                       <label className="text-xs font-bold text-slate-500 uppercase">22. Posisi Foto (Merapat ke TTD)</label>
                       <span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg text-xs font-black">
                         {settings.sklFotoSpacing || 0} CM
                       </span>
                    </div>
                    <div className="flex items-center gap-4">
                       <input
                         type="range"
                         min="-5"
                         max="10"
                         step="0.1"
                         className="flex-1 accent-indigo-600 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                         value={settings.sklFotoSpacing || 0}
                         onChange={e => setSettings({...settings, sklFotoSpacing: parseFloat(e.target.value)})}
                       />
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold italic uppercase tracking-wider">Gunakan nilai negatif untuk merapatkan/menimpakan foto ke area Cap.</p>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-orange-600 uppercase">Tanda Tangan & Cap Sekolah</label>
                    <p className="text-xs font-bold text-slate-500 italic bg-orange-50 p-3 rounded-xl border border-orange-100 uppercase tracking-widest">Aset TTD & Cap dikelola di Menu Identitas Sekolah</p>
                 </div>
              </div>
           </section>
        </div>

        {/* Formatting Section */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-fit">
           <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center gap-3">
              <div className="bg-indigo-100 p-2 rounded-xl">
                 <Type className="w-5 h-5 text-indigo-600" />
              </div>
              <h3 className="font-black text-slate-800 uppercase tracking-tight">Setting Tampilan Cetak & Tipografi</h3>
           </div>
           <div className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tampilan Nama Siswa</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.namaSiswaKapital ? 'true' : 'false'}
                      onChange={e => setSettings({...settings, namaSiswaKapital: e.target.value === 'true'})}
                    >
                      <option value="true">Kapital Semua (Contoh : ARYA WIGUNA)</option>
                      <option value="false">Kapital di Awal Kata (Contoh : Arya Wiguna)</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Template Default (Pilihan Siswa)</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.sklTemplate || 'V1'}
                      onChange={e => setSettings({...settings, sklTemplate: e.target.value as 'V1' | 'V2'})}
                    >
                      <option value="V1">Template Classic (V1)</option>
                      <option value="V2">Template Modern Compact (V2)</option>
                    </select>
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Fine-Tuning Ukuran Font & Spasi (A4/F4 Optimasi)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Ukuran Font Utama (pt)</label>
                      <input 
                        type="number" step="0.5"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={settings.sklFontSize || 11}
                        onChange={e => setSettings({...settings, sklFontSize: parseFloat(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Jarak Baris (Multiplier)</label>
                      <input 
                        type="number" step="0.05"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={settings.sklLineHeight || 1.3}
                        onChange={e => setSettings({...settings, sklLineHeight: parseFloat(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Font Tabel (pt)</label>
                      <input 
                        type="number" step="0.5"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={settings.sklTableFontSize || 9.5}
                        onChange={e => setSettings({...settings, sklTableFontSize: parseFloat(e.target.value)})}
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Spasi Tabel</label>
                      <input 
                        type="number" step="0.05"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                        value={settings.sklTableLineHeight || 1.15}
                        onChange={e => setSettings({...settings, sklTableLineHeight: parseFloat(e.target.value)})}
                      />
                   </div>
                </div>
                <p className="mt-3 text-[10px] text-slate-400 italic">*) Sesuaikan nilai di atas jika konten SKL terpotong atau lebih dari 1 halaman.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-slate-100">
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tampilkan kolom identitas kurikulum</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.showIdentitasKurikulum ? 'true' : 'false'}
                      onChange={e => setSettings({...settings, showIdentitasKurikulum: e.target.value === 'true'})}
                    >
                      <option value="true">Tampilkan Identitas Kurikulum</option>
                      <option value="false">Sembunyikan Identitas Kurikulum</option>
                    </select>
                 </div>
                 <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase">Tampilkan Peminatan (K13)</label>
                    <select
                      className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none"
                      value={settings.showPeminatanSKL ? 'true' : 'false'}
                      onChange={e => setSettings({...settings, showPeminatanSKL: e.target.value === 'true'})}
                    >
                      <option value="true">Tampilkan Peminatan</option>
                      <option value="false">Sembunyikan Peminatan</option>
                    </select>
                 </div>
              </div>
           </div>
        </section>

        {/* Solid Static Footer for Save Button */}
        <div className="fixed bottom-0 left-0 right-0 md:left-72 z-50 bg-white border-t border-slate-200 px-8 py-5 flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
            <div className="hidden lg:block">
            </div>
            <div className="flex gap-3 w-full lg:w-auto">
               <button
                  type="button"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                  className="flex-1 lg:flex-none border-2 border-slate-100 hover:bg-slate-50 text-slate-500 font-black py-4 px-10 rounded-2xl transition-all text-xs uppercase tracking-[0.15em]"
               >
                  KEMBALI KE ATAS
               </button>
               <button
                  type="submit"
                  disabled={saving}
                  className="flex-[2] lg:flex-none flex items-center justify-center gap-3 bg-slate-900 hover:bg-black text-white font-black py-4 px-16 rounded-2xl transition-all shadow-xl disabled:opacity-50 text-xs uppercase tracking-[0.2em]"
               >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin text-white/50" /> : <Save className="w-4 h-4" />}
                  SIMPAN SEMUA PENGATURAN
               </button>
            </div>
        </div>

        {/* Preview Modal Overlay */}
        <AnimatePresence>
          {previewType && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-lg flex items-center justify-center p-4 md:p-10"
            >
              <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white w-full max-w-5xl h-[90vh] rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/20"
              >
                <div className="bg-slate-50 px-8 py-5 border-b border-slate-200 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-100">
                      <Layout className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 uppercase tracking-tight">Pratinjau Dokumen</h4>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Contoh Tampilan Hasil Cetak</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setPreviewType(null)}
                    className="p-3 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-2xl transition-all shadow-sm border border-slate-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-10 bg-slate-100">
                   <div className="bg-white shadow-2xl mx-auto w-full max-w-[210mm] min-h-[297mm] p-0 rounded-sm">
                      {previewType === 'skl' ? (
                        <SKLPreview student={mockStudent} isAdminView={true} />
                      ) : (
                        <TranscriptPreview student={mockStudent} />
                      )}
                   </div>
                </div>

                <div className="bg-white p-6 border-t border-slate-200 flex items-center justify-center gap-4 shrink-0">
                   <div className="flex items-center gap-2 text-slate-400">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span className="text-[10px] font-black uppercase tracking-widest italic">Live Preview Active</span>
                   </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </div>
  );
}

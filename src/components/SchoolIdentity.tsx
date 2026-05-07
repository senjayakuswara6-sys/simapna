import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SchoolSettings } from '../types';
import { 
  School, 
  MapPin, 
  User, 
  Hash, 
  Save, 
  Upload, 
  Image as ImageIcon, 
  FileText,
  CheckCircle2,
  AlertCircle,
  Building
} from 'lucide-react';
import { motion } from 'motion/react';
import toast from 'react-hot-toast';

export default function SchoolIdentity() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [generalSnap, logoSnap, uiLogoSnap, signSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDoc(doc(db, 'settings', 'logo_ui')),
          getDoc(doc(db, 'settings', 'signature_stamp'))
        ]);

        if (generalSnap.exists()) {
          const data = generalSnap.data() as SchoolSettings;
          setSettings({
            ...data,
            logoUrl: logoSnap.exists() ? logoSnap.data().url : '',
            secondaryLogoUrl: uiLogoSnap.exists() ? uiLogoSnap.data().url : '',
            signatureStampUrl: signSnap.exists() ? signSnap.data().url : '',
          });
        }
      } catch (error) {
        console.error('Error fetching settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'letterhead' | 'logo' | 'signature') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      try {
        if (type === 'letterhead') {
          await setDoc(doc(db, 'settings', 'logo_header'), { url: base64 }, { merge: true });
          setSettings(prev => prev ? { ...prev, logoUrl: base64 } : null);
        } else if (type === 'logo') {
          await setDoc(doc(db, 'settings', 'logo_ui'), { url: base64 }, { merge: true });
          setSettings(prev => prev ? { ...prev, secondaryLogoUrl: base64 } : null);
        } else {
          await setDoc(doc(db, 'settings', 'signature_stamp'), { url: base64 }, { merge: true });
          setSettings(prev => prev ? { ...prev, signatureStampUrl: base64 } : null);
        }
        toast.success('File berhasil diunggah');
      } catch (error) {
        toast.error('Gagal mengunggah file');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      // Save only identity related fields to general settings
      const { logoUrl, secondaryLogoUrl, signatureStampUrl, ...generalData } = settings;
      await setDoc(doc(db, 'settings', 'general'), generalData, { merge: true });
      toast.success('Identitas sekolah berhasil diperbarui');
    } catch (error) {
      toast.error('Gagal menyimpan data');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12">Loading...</div>;
  if (!settings) return <div>Error loading data.</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <Building className="w-8 h-8 text-blue-600" />
            Identitas Sekolah
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">Kelola informasi dasar dan aset digital sekolah Anda</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 disabled:opacity-50"
        >
          {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
          Simpan Perubahan
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Basic Info Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <School className="w-4 h-4 text-blue-500" />
                Informasi Umum
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Sekolah</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.schoolName}
                    onChange={e => setSettings({...settings, schoolName: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tahun Pelajaran</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: 2025/2026"
                    value={settings.academicYear || ''}
                    onChange={e => setSettings({...settings, academicYear: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Kelulusan (di SKL)</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.graduationDate || ''}
                    onChange={e => setSettings({...settings, graduationDate: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tanggal Rapat Pleno (di Berita Acara)</label>
                  <input
                    type="date"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.plenaryDate || ''}
                    onChange={e => setSettings({...settings, plenaryDate: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">NPSN</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Contoh: 20252119"
                    value={settings.npsn || ''}
                    onChange={e => setSettings({...settings, npsn: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kecamatan</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.district}
                    onChange={e => setSettings({...settings, district: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> Alamat Lengkap Sekolah
                </label>
                <textarea
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none min-h-[80px]"
                  value={settings.address}
                  onChange={e => setSettings({...settings, address: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-1 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Kabupaten/Kota (Tempat SKL)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.regency}
                    onChange={e => setSettings({...settings, regency: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Principal Info */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="bg-slate-50/50 px-6 py-4 border-b border-slate-100">
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" />
                Penanggung Jawab / Kepala Sekolah
              </h3>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                  value={settings.headmasterName}
                  onChange={e => setSettings({...settings, headmasterName: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Identitas (NIP/NPA/NIY)</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.headmasterNip}
                    onChange={e => setSettings({...settings, headmasterNip: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Jabatan</label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                    value={settings.ttdJabatan}
                    onChange={e => setSettings({...settings, ttdJabatan: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assets Uploads */}
        <div className="space-y-6">
          {/* Logo Sekolah */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4">Logo Sekolah</h3>
            <div className="w-32 h-32 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden mb-4 relative group">
              {settings.secondaryLogoUrl ? (
                <img src={settings.secondaryLogoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <ImageIcon className="w-10 h-10 text-slate-300" />
              )}
              <label className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all cursor-pointer">
                <Upload className="w-6 h-6 text-white" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'logo')} />
              </label>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Klik untuk ganti logo sekolah (PNG/JPG)</p>
          </div>

          {/* Letterhead Preview */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center justify-between">
              Kop Surat
              <label className="p-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'letterhead')} />
              </label>
            </h3>
            <div className="w-full aspect-[4/1] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center group relative">
              {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Kop" className="w-full h-full object-contain" />
              ) : (
                <FileText className="w-8 h-8 text-slate-300" />
              )}
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-3 text-center">Kop surat ini akan digunakan secara otomatis di SKL dan Transkrip</p>
          </div>

          {/* Signature & Stamp */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-4 flex items-center justify-between">
              TTD & Cap Basah
              <label className="p-1.5 bg-blue-50 text-blue-600 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors">
                <Upload className="w-4 h-4" />
                <input type="file" accept="image/*" className="hidden" onChange={e => handleFileUpload(e, 'signature')} />
              </label>
            </h3>
            <div className="w-full aspect-[3/2] bg-slate-50 border border-slate-200 rounded-xl overflow-hidden flex items-center justify-center relative">
              {settings.signatureStampUrl ? (
                <img src={settings.signatureStampUrl} alt="Signature" className="w-full h-full object-contain" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold leading-tight">Unggah Hasil Scan TTD & Cap (Transparan)</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

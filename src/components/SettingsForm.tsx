import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SchoolSettings } from '../types';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsForm() {
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: '',
    address: '',
    district: '',
    regency: '',
    headmasterName: '',
    headmasterNip: '',
    academicYear: '2024/2025',
    graduationDate: new Date().toISOString().split('T')[0],
    plenaryDate: new Date().toISOString().split('T')[0],
    letterNumberTemplate: '243/SMA-PGRI/1.6/M/2025'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'general');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSettings(docSnap.data() as SchoolSettings);
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
    setMessage(null);
    try {
      await setDoc(doc(db, 'settings', 'general'), settings);
      setMessage({ text: 'Pengaturan berhasil disimpan!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, 'write', 'settings/general');
      setMessage({ text: 'Gagal menyimpan pengaturan.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1024 * 1024) { // 1MB limit for safety in Firestore
      setMessage({ text: 'Ukuran logo terlalu besar (maks 1MB).', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, logoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSecondaryLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) { // 512KB for UI logo
      setMessage({ text: 'Ukuran logo terlalu besar (maks 512KB).', type: 'error' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings({ ...settings, secondaryLogoUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  if (loading) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Pengaturan Sekolah</h2>
        <p className="text-slate-500">Konfigurasi ini akan digunakan sebagai header dan footer pada Surat Keterangan Lulus.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Logo Sekolah (Upload)</label>
            <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <div className="w-24 h-24 bg-white border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {settings.logoUrl ? (
                  <img src={settings.logoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-[10px] text-slate-400">Preview</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-slate-400">Gunakan format PNG/JPG transparan untuk hasil terbaik (Maks 1MB).</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Logo Sekolah untuk UI Dashboard (Upload)</label>
            <div className="flex items-center gap-6 p-4 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
              <div className="w-20 h-20 bg-white border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                {settings.secondaryLogoUrl ? (
                  <img src={settings.secondaryLogoUrl} alt="Logo Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-[10px] text-slate-400">Preview</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSecondaryLogoUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-slate-400">Gunakan logo sekolah saja (tanpa teks alamat) untuk tampilan di HP/Dashboard (Maks 512KB).</p>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Nama Sekolah</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.schoolName || ''}
              onChange={e => setSettings({ ...settings, schoolName: e.target.value })}
              placeholder="Contoh: SMA PGRI NARINGGUL"
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Alamat Lengkap</label>
            <textarea
              required
              rows={2}
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.address || ''}
              onChange={e => setSettings({ ...settings, address: e.target.value })}
              placeholder="Jalan Raya Naringgul No. 1..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Kecamatan</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.district || ''}
              onChange={e => setSettings({ ...settings, district: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Kabupaten</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.regency || ''}
              onChange={e => setSettings({ ...settings, regency: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Kepala Sekolah</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.headmasterName || ''}
              onChange={e => setSettings({ ...settings, headmasterName: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">NIP/NPA</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.headmasterNip || ''}
              onChange={e => setSettings({ ...settings, headmasterNip: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tahun Pelajaran</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.academicYear || ''}
              onChange={e => setSettings({ ...settings, academicYear: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Kelulusan</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.graduationDate || ''}
              onChange={e => setSettings({ ...settings, graduationDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Tanggal Rapat Pleno</label>
            <input
              type="date"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.plenaryDate || ''}
              onChange={e => setSettings({ ...settings, plenaryDate: e.target.value })}
            />
          </div>

          <div className="col-span-1 md:col-span-2">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Template No. Surat</label>
            <input
              type="text"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              value={settings.letterNumberTemplate || ''}
              onChange={e => setSettings({ ...settings, letterNumberTemplate: e.target.value })}
              placeholder="Contoh: 243/SMA-PGRI/1.6/M/2025"
            />
          </div>
        </div>

        <div className="bg-slate-50 p-6 flex items-center justify-between">
          <div>
            {message && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }} 
                animate={{ opacity: 1, x: 0 }}
                className={`flex items-center gap-2 text-sm font-medium ${message.type === 'success' ? 'text-emerald-600' : 'text-red-600'}`}
              >
                {message.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {message.text}
              </motion.div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-blue-200 disabled:opacity-50"
          >
            {saving ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div> : <Save className="w-5 h-5" />}
            Simpan Perubahan
          </button>
        </div>
      </form>
    </div>
  );
}

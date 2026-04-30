import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SchoolSettings } from '../types';
import { Save, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { motion } from 'motion/react';

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
    letterNumberTemplate: '243/SMA-PGRI/1.6/M/2025',
    signatureStampUrl: '',
    isCountdownActive: false,
    countdownTargetDate: (() => {
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      return now.toISOString().slice(0, 16);
    })(),
    sklFormat: 'FORMAT_1',
    f4TopMargin: 5,
    f4BottomMargin: 1,
    f4LeftMargin: 1.5,
    f4RightMargin: 1.5,
    printScale: 100
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

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
          setSettings({
            ...settings,
            ...data,
            logoUrl: logoSnap.exists() ? logoSnap.data().url : '',
            secondaryLogoUrl: uiLogoSnap.exists() ? uiLogoSnap.data().url : '',
            signatureStampUrl: signatureSnap.exists() ? signatureSnap.data().url : '',
          } as SchoolSettings);
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
      const { logoUrl, secondaryLogoUrl, signatureStampUrl, ...generalData } = settings;
      
      await Promise.all([
        setDoc(doc(db, 'settings', 'general'), generalData),
        logoUrl ? setDoc(doc(db, 'settings', 'logo_header'), { url: logoUrl }) : Promise.resolve(),
        secondaryLogoUrl ? setDoc(doc(db, 'settings', 'logo_ui'), { url: secondaryLogoUrl }) : Promise.resolve(),
        signatureStampUrl ? setDoc(doc(db, 'settings', 'signature_stamp'), { url: signatureStampUrl }) : Promise.resolve(),
      ]);

      setMessage({ text: 'Pengaturan berhasil disimpan!', type: 'success' });
    } catch (error) {
      handleFirestoreError(error, 'write', 'settings/general');
      setMessage({ text: 'Gagal menyimpan pengaturan.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const compressImage = (base64Str: string, maxWidth = 1600, maxHeight = 1600, quality = 0.9, format = 'image/png'): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64Str;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        resolve(canvas.toDataURL(format, quality));
      };
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // If file is already reasonable size (< 600KB), don't compress to keep 100% quality
    if (file.size < 600 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      // Use high resolution for header logo to avoid blur (Kop Surat)
      const compressed = await compressImage(reader.result as string, 2400, 800, 0.95, 'image/png');
      setSettings({ ...settings, logoUrl: compressed });
    };
    reader.readAsDataURL(file);
  };

  const handleSecondaryLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size < 300 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, secondaryLogoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 600, 600, 0.9, 'image/png');
      setSettings({ ...settings, secondaryLogoUrl: compressed });
    };
    reader.readAsDataURL(file);
  };

  const handleStampUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size < 500 * 1024) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, signatureStampUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string, 1200, 1200, 0.9, 'image/png');
      setSettings({ ...settings, signatureStampUrl: compressed });
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
            <label className="block text-sm font-semibold text-slate-700 mb-2">Upload Cap & TTD Kepala Sekolah (JPG/PNG Transparan)</label>
            <div className="flex items-center gap-6 p-4 border-2 border-dashed border-blue-200 rounded-xl bg-blue-50/30 text-left">
              <div className="w-48 h-32 bg-white border border-slate-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0 shadow-sm relative">
                {settings.signatureStampUrl ? (
                  <img src={settings.signatureStampUrl} alt="Stamp Preview" className="w-full h-full object-contain" />
                ) : (
                  <div className="text-xs text-slate-400 text-center p-2 italic">Belum ada file diupload</div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleStampUpload}
                  className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-slate-400 font-medium">Gunakan foto cap dan tanda tangan yang sudah di-crop transparan (format .png) agar menindih nama dengan rapi.</p>
                {settings.signatureStampUrl && (
                  <button 
                    type="button"
                    onClick={() => setSettings({...settings, signatureStampUrl: ''})}
                    className="text-xs text-red-500 font-semibold hover:underline"
                  >
                    Hapus Cap
                  </button>
                )}
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


          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Tipe ID (NIP/NPA/NIY)</label>
              <select
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={settings.headmasterIdType || 'NIP'}
                onChange={e => setSettings({ ...settings, headmasterIdType: e.target.value })}
              >
                <option value="NIP">NIP (PNS)</option>
                <option value="NPA">NPA (PGRI)</option>
                <option value="NIY">NIY (Yayasan)</option>
                <option value="NIK">NIK (Personal)</option>
                <option value="NIP/NPA">NIP/NPA</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nomor Identitas</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                value={settings.headmasterNip || ''}
                onChange={e => setSettings({ ...settings, headmasterNip: e.target.value })}
              />
            </div>
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

          <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </span>
              Pengaturan Format SKL & Kertas
            </h3>
            
            <div className="bg-blue-50/50 rounded-xl p-6 space-y-6 border border-blue-100">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">Format SKL Default</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sklFormat: 'FORMAT_1' })}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${settings.sklFormat === 'FORMAT_1' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                  >
                    <span className="font-bold">FORMAT 1 (Versi 1)</span>
                    <span className="text-[10px] opacity-80">Layout standar A4 dengan Kop Surat elektronik. Menggunakan daftar mapel sederhana.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setSettings({ ...settings, sklFormat: 'FORMAT_2' })}
                    className={`p-4 rounded-xl border-2 transition-all text-left flex flex-col gap-2 ${settings.sklFormat === 'FORMAT_2' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-300'}`}
                  >
                    <span className="font-bold">FORMAT 2 (Tabel Mapel & F4)</span>
                    <span className="text-[10px] opacity-80">Layout F4 untuk kertas ber-kop (pre-printed). Menggunakan tabel nilai terstruktur (Umum/Pilihan/Mulok).</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 border-t border-blue-100">
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-lg text-white">
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Tampilkan Stempel di Publik</p>
                      <p className="text-xs text-slate-500">Siswa dapat melihat stempel & TTD saat cek hasil / download</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={settings.publicShowStamp ?? true}
                      onChange={e => setSettings({ ...settings, publicShowStamp: e.target.checked })}
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              {settings.sklFormat === 'FORMAT_2' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 italic">Jarak Atas (Top)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg"
                          value={settings.f4TopMargin || 0}
                          onChange={e => setSettings({ ...settings, f4TopMargin: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-xs text-slate-500">cm</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 italic">Jarak Bawah (Bottom)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg"
                          value={settings.f4BottomMargin || 0}
                          onChange={e => setSettings({ ...settings, f4BottomMargin: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-xs text-slate-500">cm</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 italic">Jarak Kiri (Left)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg"
                          value={settings.f4LeftMargin || 0}
                          onChange={e => setSettings({ ...settings, f4LeftMargin: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-xs text-slate-500">cm</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-slate-700 italic">Jarak Kanan (Right)</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="number"
                          step="0.1"
                          className="w-24 px-3 py-2 border border-slate-200 rounded-lg"
                          value={settings.f4RightMargin || 0}
                          onChange={e => setSettings({ ...settings, f4RightMargin: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-xs text-slate-500">cm</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-blue-100">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Skala Cetak (Zoom)</label>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min="50"
                        max="100"
                        step="1"
                        className="flex-1"
                        value={settings.printScale || 100}
                        onChange={e => setSettings({ ...settings, printScale: parseInt(e.target.value) })}
                      />
                      <span className="bg-white px-4 py-2 border border-slate-200 rounded-lg font-bold text-blue-600 min-w-[80px] text-center">
                        {settings.printScale || 100}%
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Kecilkan skala jika dokumen terpotong atau terlalu panjang ke bawah (Disarankan 95-100%).</p>
                  </div>

                  <p className="text-xs text-slate-400 p-2 bg-white rounded border border-blue-100 italic">
                    * Margin ini khusus untuk Format 2 (F4). Atur sesuai ukuran fisik Kop Surat Anda.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 pt-4 border-t border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              Pengaturan Countdown (Waktu Mundur)
            </h3>
            
            <div className="bg-orange-50/50 rounded-xl p-6 space-y-6 border border-orange-100">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-semibold text-slate-700 block">Status Countdown</label>
                  <p className="text-xs text-slate-500">Aktifkan untuk menunda akses pencarian sampai waktu yang ditentukan.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSettings({ ...settings, isCountdownActive: !settings.isCountdownActive })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${settings.isCountdownActive ? 'bg-blue-600' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.isCountdownActive ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>

              {settings.isCountdownActive && (
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Waktu Target Pengumuman</label>
                  <input
                    type="datetime-local"
                    required={settings.isCountdownActive}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    value={settings.countdownTargetDate || ''}
                    onChange={e => setSettings({ ...settings, countdownTargetDate: e.target.value })}
                  />
                  <p className="text-xs text-orange-600">Siswa tidak akan bisa mengecek NISN sebelum waktu ini tiba.</p>
                </div>
              )}
            </div>
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

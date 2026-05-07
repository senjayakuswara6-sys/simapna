import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Loader2, Printer, MapPin, Calendar, Clock } from 'lucide-react';
import { GraduationInvitationSettings, GraduationMinutesSettings, SchoolSettings as SchoolInfo } from '../../types';
import { formatDate } from '../../lib/utils';

export default function InvitePreview() {
  const [settings, setSettings] = useState<GraduationInvitationSettings | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [headerLogo, setHeaderLogo] = useState<string | null>(null);
  const [minutesSettings, setMinutesSettings] = useState<GraduationMinutesSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [inviteSnap, schoolSnap, logoSnap, minSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'graduation_invitation')),
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDoc(doc(db, 'settings', 'graduation_minutes'))
        ]);
        
        if (inviteSnap.exists()) setSettings(inviteSnap.data() as GraduationInvitationSettings);
        if (schoolSnap.exists()) setSchoolInfo(schoolSnap.data() as SchoolInfo);
        if (logoSnap.exists()) setHeaderLogo(logoSnap.data().url);
        if (minSnap.exists()) setMinutesSettings(minSnap.data() as GraduationMinutesSettings);
      } catch (error) {
        handleFirestoreError(error, 'get', 'invite_preview_data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!settings || !schoolInfo) return <div className="p-8 text-center text-slate-500 italic">Data tidak ditemukan.</div>;

  return (
    <div className="bg-slate-100 min-h-screen py-10 print:bg-white print:p-0">
       <div className="fixed top-6 right-6 print:hidden z-50">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl transition-all text-sm">
            <Printer className="w-5 h-5" /> CETAK UNDANGAN
          </button>
        </div>

      <div 
        className="max-w-[21cm] mx-auto bg-white shadow-2xl p-[2cm] print:shadow-none print:max-w-none print:w-full min-h-[29.7cm] font-serif transition-all text-black"
        style={{
          fontSize: `${settings.fontSize || 11}pt`,
          lineHeight: settings.lineHeight || 1.4,
          paddingTop: settings.showHeader ? '1cm' : `${(settings.headerMargin || 0) + 1}cm`
        }}
      >
        {/* Header */}
        {settings.showHeader && (
          <div className="mb-8">
              {headerLogo ? (
                  <img src={headerLogo} alt="KOP Surat" className="w-full h-auto object-contain" />
              ) : (
                  <div className="text-center border-b-4 border-double border-black pb-4">
                      <h1 className="text-2xl font-bold">{schoolInfo.schoolName}</h1>
                      <p className="text-sm">{schoolInfo.address}</p>
                  </div>
              )}
          </div>
        )}

        {/* Date & Number Section */}
        <div className="flex justify-between items-start mb-8 font-bold">
           <div className="space-y-1 text-sm">
              <div className="flex">
                <span className="w-20">Nomor</span>
                <span>: {settings.number}</span>
              </div>
              <div className="flex">
                <span className="w-20">Lampiran</span>
                <span>: {settings.attachment}</span>
              </div>
              <div className="flex">
                <span className="w-20">Perihal</span>
                <span className="font-bold">: {settings.subject}</span>
              </div>
           </div>
        </div>

        {/* Recipient */}
        <div className="mb-10 font-bold">
          <p>Kepada Yth,</p>
          <p>Bapak/Ibu Pendidik dan Tenaga Kependidikan</p>
          <p>Di</p>
          <p className="pl-6">Tempat</p>
        </div>

        {/* Content */}
        <div className="space-y-6 text-justify">
          <p className="italic">Assalamu’alaikum Warahmatullahi Wabarakatuh,</p>
          <p style={{ textIndent: `${settings.indentation || 1}cm` }}>
            Salam sejahtera kami sampaikan, semoga kita selalu berada dalam lindungan 
            Allah SWT, serta sukses dalam menjalankan aktivitas sehari-hari. Aamiin.
          </p>
          <p style={{ textIndent: `${settings.indentation || 1}cm` }}>
            Sehubungan dengan telah selesainya seluruh rangkaian kegiatan pembelajaran 
            Tahun Pelajaran {schoolInfo.academicYear}, kami bermaksud mengundang 
            Bapak/Ibu/Saudara dalam acara Rapat Pleno Penetapan dan Pengumuman 
            Kelulusan Siswa Kelas {minutesSettings?.defaultProgramLabel || 'XII'} yang akan dilaksanakan pada:
          </p>

          <div className="pl-12 space-y-1 font-bold">
             <div className="flex">
               <span className="w-24">Hari</span>
               <span>: {settings.day}</span>
             </div>
             <div className="flex">
               <span className="w-24">Tanggal</span>
               <span>: {formatDate(settings.date) || settings.date}</span>
             </div>
             <div className="flex">
               <span className="w-24">Tempat</span>
               <span>: {settings.venue}</span>
             </div>
             <div className="flex">
               <span className="w-24">Waktu</span>
               <span>: {settings.time}</span>
             </div>
          </div>

          <p style={{ textIndent: `${settings.indentation || 1}cm` }}>
            Mengingat sangat pentingnya acara tersebut, kami sangat mengharapkan 
            kehadiran Bapak/Ibu tepat pada waktunya. Demikian undangan ini kami sampaikan, 
            atas perhatian dan kehadirannya kami ucapkan terima kasih.
          </p>
          <p className="italic">Wassalamu’alaikum Warahmatullahi Wabarakatuh.</p>
        </div>

        {/* Signature */}
        <div className="mt-12 flex justify-end">
          <div className="text-left relative min-w-[250px]">
            <p className="mb-0">{schoolInfo.regency.split(' ').pop()}, {formatDate(settings.signDate) || settings.signDate || new Date().toLocaleDateString('id-ID')}</p>
            <p className="mb-20 font-bold">Kepala {schoolInfo.schoolName},</p>
            
            {settings.showStamp && schoolInfo.signatureStampUrl && (
              <div className="absolute top-[1.2cm] left-[-0.5cm] w-[200px] h-[120px] pointer-events-none z-10 print:block">
                <img src={schoolInfo.signatureStampUrl} alt="Stamp" className="w-full h-full object-contain opacity-90" />
              </div>
            )}

            <p className="font-bold underline relative z-20 text-[12pt]">{schoolInfo.headmasterName}</p>
            <p className="relative z-20 font-bold">
              {(() => {
                const type = schoolInfo.headmasterIdType || 'NPA';
                const cleanType = type.replace(/\.$/, '');
                if (schoolInfo.headmasterNip.toLowerCase().includes(cleanType.toLowerCase())) {
                  return schoolInfo.headmasterNip;
                }
                return `${cleanType}. ${schoolInfo.headmasterNip}`;
              })()}
            </p>
          </div>
        </div>

        {settings.tembusan.length > 0 && (
          <div className="pt-12 text-[10pt]">
            <p className="font-bold italic">Tembusan:</p>
            <ol className="list-decimal ml-5 font-medium">
              {settings.tembusan.filter(t => t.trim()).map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Loader2, Printer } from 'lucide-react';
import { GraduationSKSettings, GraduationMinutesSettings, SchoolSettings as SchoolInfo, Student } from '../../types';
import { formatDate } from '../../lib/utils';

const fieldNames = ['KESATU', 'KEDUA', 'KETIGA', 'KEEMPAT', 'KELIMA', 'KEENAM'];

export default function DecisionPreview() {
  const [settings, setSettings] = useState<GraduationSKSettings | null>(null);
  const [minutesSettings, setMinutesSettings] = useState<GraduationMinutesSettings | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [headerLogo, setHeaderLogo] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [skSnap, minSnap, schoolSnap, logoSnap, studentsSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'graduation_decision')),
          getDoc(doc(db, 'settings', 'graduation_minutes')),
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDocs(query(collection(db, 'students'), orderBy('name', 'asc')))
        ]);
        
        if (skSnap.exists()) setSettings(skSnap.data() as GraduationSKSettings);
        if (minSnap.exists()) setMinutesSettings(minSnap.data() as GraduationMinutesSettings);
        if (schoolSnap.exists()) setSchoolInfo(schoolSnap.data() as SchoolInfo);
        if (logoSnap.exists()) setHeaderLogo(logoSnap.data().url);
        
        setStudents(studentsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Student)));
      } catch (error) {
        handleFirestoreError(error, 'get', 'sk_preview_data');
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

  const PageHeader = () => (
    settings.showHeader ? (
      <div className="mb-6">
          {headerLogo ? (
              <img src={headerLogo} alt="KOP Surat" className="w-full h-auto object-contain" />
          ) : (
              <div className="text-center border-b-4 border-double border-black pb-4">
                  <h1 className="text-2xl font-bold">{schoolInfo.schoolName}</h1>
                  <p className="text-sm">{schoolInfo.address}</p>
              </div>
          )}
      </div>
    ) : null
  );

  const getPageStyle = () => ({
    fontSize: `${settings.fontSize || 11}pt`,
    lineHeight: settings.lineHeight || 1.3,
    paddingTop: settings.showHeader ? '1cm' : `${(settings.headerMargin || 0) + 1}cm`
  });

  return (
    <div className="bg-slate-100 min-h-screen py-10 print:bg-white print:p-0 font-serif text-black">
      <div className="fixed top-6 right-6 print:hidden z-50">
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl transition-all text-sm">
          <Printer className="w-5 h-5" /> CETAK SELURUH SK & LAMPIRAN
        </button>
      </div>

      <div className="space-y-8 max-w-[21cm] mx-auto print:max-w-none print:w-full">
        {/* PAGE 1: SURAT KEPUTUSAN */}
        <div 
          className="bg-white shadow-2xl p-[2cm] print:shadow-none min-h-[29.7cm] flex flex-col page-break-after border border-slate-200 print:border-none"
          style={getPageStyle()}
        >
          <PageHeader />
          <div className="text-center mb-8">
            <h2 className="text-[14pt] font-black uppercase">SURAT KEPUTUSAN</h2>
            <h2 className="text-[14pt] font-black">Kepala {schoolInfo.schoolName}</h2>
            <div className="flex justify-center gap-1 font-bold">
               <span>Nomor :</span>
               <span>{settings.number}</span>
            </div>
            <p className="font-bold mt-4 tracking-widest text-center">TENTANG</p>
            <p className="font-black uppercase px-12 leading-tight text-center">{settings.subject}</p>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <p className="font-bold w-[120px] shrink-0 uppercase">Menimbang</p>
              <p className="w-4 shrink-0">:</p>
              <div className="flex-1 space-y-3 text-justify">
                {settings.considering.map((c, i) => (
                  <p key={i}>{c}</p>
                ))}
              </div>
            </div>

            <div className="flex gap-4">
              <p className="font-bold w-[120px] shrink-0 uppercase">Mengingat</p>
              <p className="w-4 shrink-0">:</p>
              <div className="flex-1 space-y-2 text-justify">
                {settings.bearing.map((b, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-6 shrink-0">{i + 1}.</span>
                    <p>{b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* PAGE 2: MEMPERHATIKAN & MEMUTUSKAN */}
        <div 
          className="bg-white shadow-2xl p-[2cm] print:shadow-none min-h-[29.7cm] flex flex-col page-break-after border border-slate-200 print:border-none"
          style={getPageStyle()}
        >
          <PageHeader />
          <div className="space-y-6">
            <div className="flex gap-4">
              <p className="font-bold w-[120px] shrink-0 uppercase">Memperhatikan</p>
              <p className="w-4 shrink-0">:</p>
              <div className="flex-1 space-y-2 text-justify">
                {settings.observing.map((o, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="w-6 shrink-0">{i + 1}.</span>
                    <p>{o}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="text-center py-6">
              <p className="font-black text-[15pt] tracking-[0.4em] uppercase">MEMUTUSKAN</p>
            </div>

            <div className="flex gap-4">
              <p className="font-bold w-[120px] shrink-0 uppercase">Menetapkan</p>
              <p className="w-4 shrink-0">:</p>
              <div className="flex-1 space-y-3 text-justify">
                {settings.deciding.map((d, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="w-[100px] shrink-0 font-bold uppercase">{fieldNames[i] || (i + 1) + '.'}</span>
                    <p className="flex-1">{d}</p>
                  </div>
                ))}
              </div>
            </div>

            <p className="italic pt-6 text-justify">Petikan: disampaikan kepada masing-masing bersangkutan untuk diketahui dan dilaksanakan dengan semestinya.</p>

            <div className="pt-10 flex gap-12 justify-between items-start">
               <div className="text-left">
                   <p className="font-bold mb-16">Mengetahui,<br/>Pengawas Pembina,</p>
                  <p className="font-bold">{settings.pengawasName || '................................................'}</p>
                  <p className="font-bold">NIP. {settings.pengawasNip || '................................................'}</p>
               </div>

               <div className="text-right w-1/2">
                  <div className="inline-block text-left relative min-w-[250px]">
                    <div className="flex">
                      <span className="w-32 uppercase font-bold text-[10px]">Ditetapkan di</span>
                      <span className="font-bold">: {schoolInfo.regency.split(' ').pop()}</span>
                    </div>
                    <div className="flex border-b border-black pb-4 mb-4">
                      <span className="w-32 uppercase font-bold text-[10px]">Pada Tanggal</span>
                      <span className="font-bold">: {formatDate(schoolInfo.graduationDate) || schoolInfo.graduationDate}</span>
                    </div>
                    <p className="font-black mb-16">Kepala {schoolInfo.schoolName},</p>
                    
                    {schoolInfo.showTtdKepala && schoolInfo.signatureStampUrl && (
                      <div className="absolute top-[3cm] left-[-0.5cm] w-[180px] h-[100px] pointer-events-none z-10 print:block">
                        <img src={schoolInfo.signatureStampUrl} alt="Stamp" className="w-full h-full object-contain opacity-80" />
                      </div>
                    )}

                    <p className="font-extrabold text-[12pt] relative z-20">{schoolInfo.headmasterName}</p>
                    <p className="font-bold relative z-20 text-[10pt]">
                      {(() => {
                        const type = schoolInfo.headmasterIdType || 'NIP';
                        const cleanType = type.replace(/\.$/, '');
                        if (schoolInfo.headmasterNip.toLowerCase().includes(cleanType.toLowerCase())) {
                          return schoolInfo.headmasterNip;
                        }
                        return `${cleanType}. ${schoolInfo.headmasterNip}`;
                      })()}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* PAGE 3: LAMPIRAN KRITERIA */}
        {settings.showLampiranKriteria && (
          <div 
            className="bg-white shadow-2xl p-[2cm] print:shadow-none min-h-[29.7cm] flex flex-col page-break-after border border-slate-200 print:border-none"
            style={getPageStyle()}
          >
            <PageHeader />
            <div className="mb-8 text-sm">
              <p className="font-bold">Lampiran Surat Keputusan Kepala {schoolInfo.schoolName}</p>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 font-bold">Nomor</span>
                <span>: {settings.number}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 shrink-0 font-bold">Tentang</span>
                <span>: {settings.subject}</span>
              </div>
            </div>

            <div className="space-y-4">
               <p className="font-bold">Peserta didik dinyatakan lulus apabila memenuhi kriteria sebagai berikut :</p>
               <ol className="list-decimal ml-5 space-y-3 text-justify">
                 {settings.appendix1Content?.map((item, idx) => (
                   <li key={idx} className="pl-2">
                     <p>{item.text}</p>
                     {item.subItems && item.subItems.length > 0 && (
                       <ol className="list-[lower-alpha] ml-6 mt-2 space-y-2">
                         {item.subItems.map((sub, sIdx) => (
                           <li key={sIdx}>{sub}</li>
                         ))}
                       </ol>
                     )}
                   </li>
                 ))}
               </ol>
            </div>
            
            <div className="pt-10 mt-auto flex gap-12 justify-between items-start">
               <div className="text-left">
                  <p className="font-bold mb-16">Mengetahui,<br/>Pengawas Pembina,</p>
                  <p className="font-bold">{settings.pengawasName || '................................................'}</p>
                  <p className="font-bold">NIP. {settings.pengawasNip || '................................................'}</p>
               </div>

               <div className="text-right w-1/2">
                  <div className="inline-block text-left min-w-[250px]">
                    <div className="flex">
                      <span className="w-32 uppercase font-bold text-[10px]">Ditetapkan di</span>
                      <span className="font-bold">: {schoolInfo.regency.split(' ').pop()}</span>
                    </div>
                    <div className="flex border-b border-black pb-4 mb-4">
                      <span className="w-32 uppercase font-bold text-[10px]">Pada Tanggal</span>
                      <span className="font-bold">: {formatDate(schoolInfo.graduationDate) || schoolInfo.graduationDate}</span>
                    </div>
                    <p className="font-black mb-16">Kepala {schoolInfo.schoolName},</p>
                    <p className="font-extrabold text-[12pt]">{schoolInfo.headmasterName}</p>
                    <p className="font-bold text-[10pt]">
                      {(() => {
                        const type = schoolInfo.headmasterIdType || 'NIP';
                        const cleanType = type.replace(/\.$/, '');
                        if (schoolInfo.headmasterNip.toLowerCase().includes(cleanType.toLowerCase())) {
                          return schoolInfo.headmasterNip;
                        }
                        return `${cleanType}. ${schoolInfo.headmasterNip}`;
                      })()}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}

        {/* PAGE 4+: LAMPIRAN DAFTAR SISWA */}
        {settings.showLampiranDaftar && (
          <div 
            className="bg-white shadow-2xl p-[2cm] print:shadow-none min-h-[29.7cm] flex flex-col border border-slate-200 print:border-none"
            style={getPageStyle()}
          >
            <PageHeader />
            <div className="mb-8 text-sm">
              <p className="font-bold">Lampiran II Surat Keputusan Kepala {schoolInfo.schoolName}</p>
              <div className="flex gap-2 text-xs">
                <span className="w-20 shrink-0 font-bold">Nomor</span>
                <span>: {settings.number}</span>
              </div>
            </div>

            <div className="text-center mb-8">
              <h2 className="text-[13pt] font-black uppercase">DAFTAR PESERTA DIDIK YANG DINYATAKAN LULUS</h2>
              <h2 className="text-[13pt] font-black uppercase">TAHUN PELAJARAN {schoolInfo.academicYear}</h2>
            </div>

            <table className="w-full border-collapse border border-black text-[10pt]">
              <thead>
                <tr className="bg-slate-100 uppercase font-black">
                  <th className="border border-black p-1.5 w-10">{settings.tableNoLabel || 'No'}</th>
                  <th className="border border-black p-1.5 w-24">{settings.tableNisLabel || 'NIS'}</th>
                  <th className="border border-black p-1.5 w-28">{settings.tableNisnLabel || 'NISN'}</th>
                  <th className="border border-black p-1.5">{settings.tableNameLabel || 'Nama Peserta Didik'}</th>
                  <th className="border border-black p-1.5 w-20">{settings.tableGenderLabel || 'L/P'}</th>
                  <th className="border border-black p-1.5 w-32">{settings.tableResultLabel || 'Keputusan'}</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, i) => (
                  <tr key={s.id}>
                    <td className="border border-black p-1.5 text-center">{i + 1}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{s.nis}</td>
                    <td className="border border-black p-1.5 text-center font-mono">{s.nisn}</td>
                    <td className="border border-black p-1.5 font-medium">{s.name}</td>
                    <td className="border border-black p-1.5 text-center">{s.gender}</td>
                    <td className="border border-black p-1.5 text-center font-black uppercase">{s.status === 'LULUS' ? 'LULUS' : 'TIDAK LULUS'}</td>
                  </tr>
                 ))}
              </tbody>
            </table>

            <div className="pt-10 mt-auto flex gap-12 justify-between items-start">
               <div className="text-left">
                  <p className="font-bold mb-16">Mengetahui,<br/>Pengawas Pembina,</p>
                  <p className="font-bold">{settings.pengawasName || '................................................'}</p>
                  <p className="font-bold">NIP. {settings.pengawasNip || '................................................'}</p>
               </div>

               <div className="text-right w-1/2">
                  <div className="inline-block text-left min-w-[250px]">
                    <div className="flex">
                      <span className="w-32 uppercase font-bold text-[10px]">Ditetapkan di</span>
                      <span className="font-bold">: {schoolInfo.regency.split(' ').pop()}</span>
                    </div>
                    <div className="flex border-b border-black pb-4 mb-4">
                      <span className="w-32 uppercase font-bold text-[10px]">Pada Tanggal</span>
                      <span className="font-bold">: {formatDate(schoolInfo.graduationDate) || schoolInfo.graduationDate}</span>
                    </div>
                    <p className="font-black mb-16">Kepala {schoolInfo.schoolName},</p>
                    <p className="font-extrabold text-[12pt]">{schoolInfo.headmasterName}</p>
                    <p className="font-bold text-[10pt]">
                      {(() => {
                        const type = schoolInfo.headmasterIdType || 'NIP';
                        const cleanType = type.replace(/\.$/, '');
                        if (schoolInfo.headmasterNip.toLowerCase().includes(cleanType.toLowerCase())) {
                          return schoolInfo.headmasterNip;
                        }
                        return `${cleanType}. ${schoolInfo.headmasterNip}`;
                      })()}
                    </p>
                  </div>
               </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError } from '../../lib/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { Loader2, Printer } from 'lucide-react';
import { GraduationMinutesSettings, SchoolSettings as SchoolInfo, Student } from '../../types';
import { formatDate } from '../../lib/utils';

export default function MinutesPreview() {
  const [settings, setSettings] = useState<GraduationMinutesSettings | null>(null);
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
  const [headerLogo, setHeaderLogo] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [minSnap, schoolSnap, logoSnap, studentsSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'graduation_minutes')),
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDocs(collection(db, 'students'))
        ]);
        
        if (minSnap.exists()) setSettings(minSnap.data() as GraduationMinutesSettings);
        if (schoolSnap.exists()) setSchoolInfo(schoolSnap.data() as SchoolInfo);
        if (logoSnap.exists()) setHeaderLogo(logoSnap.data().url);

        const students = studentsSnap.docs.map(doc => doc.data() as Student);
        const currentSettings = minSnap.exists() ? (minSnap.data() as GraduationMinutesSettings) : null;
        const defaultProg = currentSettings?.defaultProgramLabel || 'XII';

        let finalProgramStats = [];

        if (currentSettings?.useManualStats && currentSettings.manualStats && currentSettings.manualStats.length > 0) {
          // Use manual stats from settings
          finalProgramStats = currentSettings.manualStats.map(ms => ({
            prog: ms.program,
            male: Number(ms.male || 0),
            female: Number(ms.female || 0),
            total: Number(ms.total || 0),
            passedMale: Number(ms.passedMale || 0),
            passedFemale: Number(ms.passedFemale || 0),
            passedTotal: Number(ms.passedTotal || 0)
          }));
        } else {
          // Calculate stats by Program/Stream automatically
          const programs = Array.from(new Set(students.map(s => s.peminatan?.trim() || defaultProg)));
          
          finalProgramStats = programs.map(prog => {
            const progStudents = students.filter(s => (s.peminatan?.trim() || defaultProg) === prog);
            
            // Robust gender check
            const male = progStudents.filter(s => s.gender === 'L').length;
            const female = progStudents.filter(s => s.gender === 'P').length;
            const total = progStudents.length;
            
            const passed = progStudents.filter(s => s.status === 'LULUS');
            const passedMale = passed.filter(s => s.gender === 'L').length;
            const passedFemale = passed.filter(s => s.gender === 'P').length;
            const passedTotal = passed.length;

            return { prog, male, female, total, passedMale, passedFemale, passedTotal };
          });
        }

        setStats({
          programStats: finalProgramStats.length > 0 ? finalProgramStats : [{ prog: defaultProg, male: 0, female: 0, total: 0, passedMale: 0, passedFemale: 0, passedTotal: 0 }],
          totalMale: finalProgramStats.reduce((a, b) => a + b.male, 0),
          totalFemale: finalProgramStats.reduce((a, b) => a + b.female, 0),
          total: finalProgramStats.reduce((a, b) => a + b.total, 0),
          totalPassedMale: finalProgramStats.reduce((a, b) => a + b.passedMale, 0),
          totalPassedFemale: finalProgramStats.reduce((a, b) => a + b.passedFemale, 0),
          totalPassed: finalProgramStats.reduce((a, b) => a + b.passedTotal, 0)
        });

      } catch (error) {
        handleFirestoreError(error, 'get', 'minutes_preview_data');
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

  if (!settings || !schoolInfo || !stats) {
    return <div className="p-8 text-center text-slate-500 italic">Data tidak ditemukan.</div>;
  }

  const replaceVariables = (text: string) => {
    if (!text) return '';
    return text
      .replace(/{day}/g, settings.day)
      .replace(/{dateSpelled}/g, settings.dateSpelled)
      .replace(/{month}/g, settings.month)
      .replace(/{yearSpelled}/g, settings.yearSpelled)
      .replace(/{startTime}/g, settings.startTime)
      .replace(/{endTime}/g, settings.endTime)
      .replace(/{room}/g, settings.room)
      .replace(/{district}/g, schoolInfo.district)
      .replace(/{regency}/g, schoolInfo.regency)
      .replace(/{headmasterTitle}/g, settings.headmasterTitle)
      .replace(/{schoolName}/g, schoolInfo.schoolName)
      .replace(/{academicYear}/g, schoolInfo.academicYear);
  };

  return (
    <div className={`bg-slate-100 min-h-screen py-10 print:bg-white print:p-0 ${settings.fontFamily === 'sans' ? 'font-sans' : 'font-serif'}`}>
       <div className="fixed top-6 right-6 print:hidden z-50 flex gap-2">
          <button onClick={() => window.print()} className="flex items-center gap-2 bg-slate-900 text-white px-6 py-3 rounded-full font-bold shadow-2xl transition-all text-sm">
            <Printer className="w-5 h-5" /> CETAK SEMUA
          </button>
        </div>

      <div className="space-y-[1cm] print:space-y-0">
        {/* PAGE 1: BERITA ACARA */}
        <div 
          className="max-w-[21cm] mx-auto bg-white shadow-2xl p-[2cm] print:shadow-none print:max-w-none print:w-full min-h-[29.7cm] text-black page-break-after-always"
          style={{
            fontSize: `${settings.fontSize || 11}pt`,
            lineHeight: settings.lineHeight || 1.3,
            paddingTop: settings.showHeader ? '1cm' : `${(settings.headerMargin || 0) + 1}cm`
          }}
        >
          {/* Header */}
          {settings.showHeader && (
            <div className="mb-2">
                {headerLogo ? (
                    <img src={headerLogo} alt="KOP Surat" className="w-full h-auto object-contain" />
                ) : (
                    <div className="text-center">
                        <h1 className="text-2xl font-bold">{schoolInfo.schoolName}</h1>
                        <p className="text-sm">{schoolInfo.address}</p>
                    </div>
                )}
            </div>
          )}

          <div className="text-center mb-4 space-y-0.5">
              <h2 className="text-[12pt] font-black uppercase">BERITA ACARA RAPAT PLENO</h2>
              <h2 className="text-[12pt] font-black uppercase">PENETAPAN KELULUSAN SISWA</h2>
              <h2 className="text-[12pt] font-black">Kepala {schoolInfo.schoolName}</h2>
              <h2 className="text-[12pt] font-black uppercase">TAHUN PELAJARAN {schoolInfo.academicYear}</h2>
          </div>

          <div className="space-y-4">
            <p className="text-justify" style={{ textIndent: '1cm' }}>
              {replaceVariables(settings.openingParagraph)}
            </p>

            <p className="text-justify" style={{ textIndent: '1cm' }}>
              {replaceVariables(settings.secondParagraph)}
            </p>

            {settings.showTableStats && (
              <div className="space-y-2">
                <table className="w-full border-collapse border border-black mb-4 text-center text-[10pt]">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 w-10">{settings.tableNoLabel}</th>
                      <th className="border border-black p-1">{settings.tableProgramLabel}</th>
                      <th className="border border-black p-1">{settings.tableMaleLabel}</th>
                      <th className="border border-black p-1">{settings.tableFemaleLabel}</th>
                      <th className="border border-black p-1">{settings.tableTotalLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.programStats.map((ps: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-black p-1">{i + 1}.</td>
                        <td className="border border-black p-1 text-left px-2">{ps.prog}</td>
                        <td className="border border-black p-1">{ps.male}</td>
                        <td className="border border-black p-1">{ps.female}</td>
                        <td className="border border-black p-1">{ps.total}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-left px-2">{settings.tableTotalLabel}</td>
                      <td className="border border-black p-1">{stats.totalMale}</td>
                      <td className="border border-black p-1">{stats.totalFemale}</td>
                      <td className="border border-black p-1 font-black">{stats.total}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {settings.showTablePassed && (
              <div className="space-y-2">
                <p className="font-bold">{settings.passedLabel} :</p>
                <table className="w-full border-collapse border border-black mb-4 text-center text-[10pt]">
                  <thead>
                    <tr>
                      <th className="border border-black p-1 w-10">{settings.tableNoLabel}</th>
                      <th className="border border-black p-1">{settings.tableProgramLabel}</th>
                      <th className="border border-black p-1">{settings.tableMaleLabel}</th>
                      <th className="border border-black p-1">{settings.tableFemaleLabel}</th>
                      <th className="border border-black p-1">{settings.tableTotalLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.programStats.map((ps: any, i: number) => (
                      <tr key={i}>
                        <td className="border border-black p-1">{i + 1}.</td>
                        <td className="border border-black p-1 text-left px-2">{ps.prog}</td>
                        <td className="border border-black p-1">{ps.passedMale}</td>
                        <td className="border border-black p-1">{ps.passedFemale}</td>
                        <td className="border border-black p-1">{ps.passedTotal}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td className="border border-black p-1"></td>
                      <td className="border border-black p-1 text-left px-2">{settings.tableTotalLabel}</td>
                      <td className="border border-black p-1">{stats.totalPassedMale}</td>
                      <td className="border border-black p-1">{stats.totalPassedFemale}</td>
                      <td className="border border-black p-1 font-black">{stats.totalPassed}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            <p className="font-bold">{settings.notPassedLabel} : {settings.defaultProgramLabel || 'XII'} = {stats.total - stats.totalPassed > 0 ? (stats.total - stats.totalPassed) + ' Orang' : 'Nihil'}</p>
            <p className="text-justify px-1">{settings.appendixLabel}</p>
            
            <p className="text-justify" style={{ textIndent: '1cm' }}>
              {replaceVariables(settings.closingParagraph)}
            </p>

            <div className="pt-8 space-y-12">
              <div className="flex justify-between items-start">
                <div className="text-center w-[45%]">
                   <p className="font-bold">Mengetahui</p>
                    {settings.witnesses.length > 0 ? (
                      <div className="space-y-1">
                        <p className="font-bold">{settings.witnesses[0].role}</p>
                        <div className="h-24"></div>
                        <p className="font-bold">{settings.witnesses[0].name}</p>
                        <p className="text-[10pt] font-bold">
                          {(() => {
                            const type = settings.witnesses[0].idType || 'NIP';
                            const cleanType = type.replace(/\.$/, '');
                            const val = settings.witnesses[0].idNumber;
                            if (val.toLowerCase().includes(cleanType.toLowerCase())) {
                              return val;
                            }
                            return `${cleanType}. ${val}`;
                          })()}
                        </p>
                      </div>
                   ) : (
                      <div className="space-y-1">
                        <p className="font-bold italic">Pengawas Bina</p>
                        <div className="h-24"></div>
                        <p className="font-bold">............................................</p>
                        <p className="text-[10pt] font-bold">NIP. ............................................</p>
                      </div>
                   )}
                </div>

                <div className="text-center w-[45%] relative">
                  <p className="font-bold">{schoolInfo.regency.split(' ').pop()}, {formatDate(schoolInfo.plenaryDate) || schoolInfo.plenaryDate || '02 Mei 2026'}</p>
                  <p className="font-bold">Kepala {schoolInfo.schoolName},</p>

                  {schoolInfo.showTtdKepala && schoolInfo.signatureStampUrl && (
                    <div className="absolute top-[1cm] left-[-0.5cm] w-[180px] h-[100px] pointer-events-none z-10 print:block">
                      <img src={schoolInfo.signatureStampUrl} alt="Stamp" className="w-full h-full object-contain opacity-80" />
                    </div>
                  )}

                  <div className="h-24"></div>
                  <p className="font-bold relative z-20">{schoolInfo.headmasterName}</p>
                  <p className="text-[10pt] relative z-20 font-bold">
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

        {/* PAGE 2: NOTULEN */}
        {settings.showNotule && (
          <div 
            className="max-w-[21cm] mx-auto bg-white shadow-2xl p-[2cm] print:shadow-none print:max-w-none print:w-full min-h-[29.7cm] text-black print:mt-0"
            style={{
              fontSize: `${settings.fontSize || 11}pt`,
              lineHeight: settings.lineHeight || 1.3,
              paddingTop: settings.showHeader ? '1cm' : `${(settings.headerMargin || 0) + 1}cm`
            }}
          >
            {/* Header */}
            {settings.showHeader && (
              <div className="mb-2">
                  {headerLogo ? (
                      <img src={headerLogo} alt="KOP Surat" className="w-full h-auto object-contain" />
                  ) : (
                      <div className="text-center">
                          <h2 className="text-xl font-bold">{schoolInfo.schoolName}</h2>
                          <p className="text-sm">{schoolInfo.address}</p>
                      </div>
                  )}
              </div>
            )}

            <div className="text-center mb-4 space-y-0.5">
                <h2 className="text-[12pt] font-black uppercase">NOTULEN RAPAT PLENO</h2>
                <h2 className="text-[12pt] font-black uppercase">KELULUSAN SISWA KELAS {settings.defaultProgramLabel || 'XII'}</h2>
                <h2 className="text-[12pt] font-black">Kepala {schoolInfo.schoolName}</h2>
                <h2 className="text-[12pt] font-black uppercase">TAHUN PELAJARAN {schoolInfo.academicYear}</h2>
            </div>

            <div className="space-y-2 mb-6">
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">Nama Sekolah</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold">{schoolInfo.schoolName}</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">Alamat Sekolah</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold">{schoolInfo.address}</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">Rapat diadakan di</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold uppercase">{settings.meetingLocation}</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">1. Hari / Tanggal</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold">{settings.day}, {formatDate(schoolInfo.plenaryDate) || schoolInfo.plenaryDate || '02 Mei 2026'}</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">2. Pimpinan Sidang</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold underline">{settings.leaderName}</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">3. Hadir</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold">{settings.attendees}</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">4. Rapat dimulai</span>
                  <span className="font-bold">:</span>
                  <span className="font-bold">{settings.startTime} – {settings.endTime} WIB</span>
               </div>
               <div className="grid grid-cols-[180px_10px_1fr] items-start">
                  <span className="font-bold">5. Keputusan rapat</span>
                  <span className="font-bold">:</span>
                  <span className="">{settings.meetingResult}</span>
               </div>
            </div>

            <div className="space-y-4">
              <p className="text-center font-bold italic">dari peserta Ujian Sekolah Tahun Pelajaran {schoolInfo.academicYear} yang terdiri dari :</p>
              
              <table className="w-full border-collapse border border-black mb-4 text-center text-[10pt]">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-10">{settings.tableNoLabel}</th>
                    <th className="border border-black p-1">{settings.tableProgramLabel}</th>
                    <th className="border border-black p-1">{settings.tableMaleLabel}</th>
                    <th className="border border-black p-1">{settings.tableFemaleLabel}</th>
                    <th className="border border-black p-1">{settings.tableTotalLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.programStats.map((ps: any, i: number) => (
                    <tr key={i}>
                      <td className="border border-black p-1">{i + 1}.</td>
                      <td className="border border-black p-1 text-left px-2">{ps.prog}</td>
                      <td className="border border-black p-1">{ps.male}</td>
                      <td className="border border-black p-1">{ps.female}</td>
                      <td className="border border-black p-1">{ps.total}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 text-left px-2">{settings.tableTotalLabel}</td>
                    <td className="border border-black p-1">{stats.totalMale}</td>
                    <td className="border border-black p-1">{stats.totalFemale}</td>
                    <td className="border border-black p-1 font-black">{stats.total}</td>
                  </tr>
                </tbody>
              </table>

              <p className="font-bold italic">{settings.passedLabel} :</p>
              <table className="w-full border-collapse border border-black mb-4 text-center text-[10pt]">
                <thead>
                  <tr>
                    <th className="border border-black p-1 w-10">{settings.tableNoLabel}</th>
                    <th className="border border-black p-1">{settings.tableProgramLabel}</th>
                    <th className="border border-black p-1">{settings.tableMaleLabel}</th>
                    <th className="border border-black p-1">{settings.tableFemaleLabel}</th>
                    <th className="border border-black p-1">{settings.tableTotalLabel}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.programStats.map((ps: any, i: number) => (
                    <tr key={i}>
                      <td className="border border-black p-1">{i + 1}.</td>
                      <td className="border border-black p-1 text-left px-2">{ps.prog}</td>
                      <td className="border border-black p-1">{ps.passedMale}</td>
                      <td className="border border-black p-1">{ps.passedFemale}</td>
                      <td className="border border-black p-1">{ps.passedTotal}</td>
                    </tr>
                  ))}
                  <tr className="font-bold">
                    <td className="border border-black p-1"></td>
                    <td className="border border-black p-1 text-left px-2">{settings.tableTotalLabel}</td>
                    <td className="border border-black p-1">{stats.totalPassedMale}</td>
                    <td className="border border-black p-1">{stats.totalPassedFemale}</td>
                    <td className="border border-black p-1 font-black">{stats.totalPassed}</td>
                  </tr>
                </tbody>
              </table>

              <div className="space-y-1">
                <p className="font-bold">{settings.notPassedLabel} : {settings.defaultProgramLabel || 'XII'} = {stats.total - stats.totalPassed > 0 ? (stats.total - stats.totalPassed) + ' Orang' : 'Nihil'}</p>
                <p className="font-bold italic">{settings.appendixLabel}</p>
                <p className="font-bold italic">Rapat ditutup dengan bacaan Alhamdulillah atas keberhasilan siswa kelas {settings.defaultProgramLabel || 'XII'}.</p>
              </div>

              <div className="pt-12 flex justify-between items-start">
                <div className="text-center w-[45%] relative">
                  <p className="font-bold mb-1">Mengetahui</p>
                  <p className="font-bold">Kepala {schoolInfo.schoolName},</p>

                  {schoolInfo.showTtdKepala && schoolInfo.signatureStampUrl && (
                    <div className="absolute top-[1cm] left-[-0.5cm] w-[180px] h-[100px] pointer-events-none z-10 print:block">
                      <img src={schoolInfo.signatureStampUrl} alt="Stamp" className="w-full h-full object-contain opacity-80" />
                    </div>
                  )}

                  <div className="h-24"></div>
                  <p className="font-bold relative z-20">{schoolInfo.headmasterName}</p>
                  <p className="text-[10pt] relative z-20 font-bold">
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

                <div className="text-center w-[45%]">
                   <p className="font-bold mb-1">{schoolInfo.regency.split(' ').pop()}, {formatDate(schoolInfo.plenaryDate) || schoolInfo.plenaryDate || '02 Mei 2026'}</p>
                   <p className="font-bold">Notulis</p>
                   <div className="h-24"></div>
                   <p className="font-bold">{settings.notaryName}</p>
                   <p className="text-[10pt] font-bold">
                    {(() => {
                      const type = settings.notaryIdType || 'NIP';
                      const cleanType = type.replace(/\.$/, '');
                      const val = settings.notaryIdNumber;
                      if (val.toLowerCase().includes(cleanType.toLowerCase())) {
                        return val;
                      }
                      return `${cleanType}. ${val}`;
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

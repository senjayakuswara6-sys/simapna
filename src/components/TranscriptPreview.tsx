import { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Student, SchoolSettings, Subject } from '../types';
import { formatDate } from '../lib/utils';

interface TranscriptPreviewProps {
  student: Student;
}

export default function TranscriptPreview({ student }: TranscriptPreviewProps) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [generalSnap, logoSnap, signatureSnap, subjectsSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDoc(doc(db, 'settings', 'signature_stamp')),
          getDocs(query(collection(db, 'subjects'), orderBy('order', 'asc')))
        ]);

        if (generalSnap.exists()) {
          const data = generalSnap.data() as SchoolSettings;
          setSettings({
            ...data,
            logoUrl: logoSnap.exists() ? logoSnap.data().url : '',
            signatureStampUrl: signatureSnap.exists() ? signatureSnap.data().url : '',
          });
        }

        const subjectsData = subjectsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Subject));
        setAllSubjects(subjectsData);
        setLoading(false);
      } catch (error) {
        handleFirestoreError(error, 'get', 'TranscriptPreview/data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !settings) return <div className="p-8 text-center text-slate-400 font-medium">Mempersiapkan Pratinjau Transkrip...</div>;

  const relevantSubjects = allSubjects.filter(s => {
    const studentClass = (student.className || '').trim().toUpperCase();
    const subjectClass = (s.className || 'SEMUA').trim().toUpperCase();
    return subjectClass === 'SEMUA' || subjectClass === studentClass;
  });

  const subjectsByCategory = {
    UMUM: relevantSubjects.filter(s => s.category === 'UMUM'),
    PILIHAN: relevantSubjects.filter(s => s.category === 'PILIHAN'),
    MULOK: relevantSubjects.filter(s => s.category === 'MULOK'),
  };

  const getScore = (name: string) => {
    const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
    const normalizedTarget = normalize(name);
    
    const found = student.subjects?.find(s => normalize(s.subjectName) === normalizedTarget);
    if (!found) return '-';
    
    const numDecimals = settings.numDecimalNilai ?? 2;
    return found.score.toLocaleString('id-ID', { 
      minimumFractionDigits: numDecimals, 
      maximumFractionDigits: numDecimals 
    });
  };

  return (
    <div className="transcript-preview-root">
       <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* FONT FAMILY */
          @font-face {
            font-family: 'Times New Roman';
            src: local('Times New Roman');
          }

          /* HIDE EVERYTHING BY DEFAULT */
          body * {
            visibility: hidden !important;
          }
          
          /* HIDE ALL STYLE AND SCRIPT TAGS CONTENT */
          style, script {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* ONLY SHOW THE PRINTABLE AREA AND ITS CONTENT */
          .transcript-printable-area, 
          .transcript-printable-area * {
            visibility: visible !important;
          }

          /* RESET LAYOUT FOR PRINT */
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            height: auto !important;
            overflow: visible !important;
            width: 100% !important;
          }

          #root, .simapna-app, main, .print-modal-root, .print-modal-content, .print-all-container {
            visibility: visible !important;
            display: block !important;
            position: static !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            width: 100% !important;
            background: transparent !important;
          }

          .transcript-printable-area {
            display: block !important;
            position: relative !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            width: 210mm !important;
            height: auto !important;
            padding: 2cm !important;
            box-sizing: border-box !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}} />
       <div className="bg-white mx-auto p-[2cm] w-[210mm] min-h-[297mm] shadow-lg text-[11pt] transcript-printable-area" style={{ fontFamily: '"Times New Roman", "Tinos", "Liberation Serif", Times, serif' }}>
        {/* Header/Kop Surat */}
        <div className="mb-4 w-full">
            {settings.logoUrl ? (
                <img src={settings.logoUrl} alt="Kop Surat" className="w-full object-contain" referrerPolicy="no-referrer" />
            ) : (
                <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 print:hidden text-xs uppercase tracking-tighter font-bold">
                    [ BELUM ADA KOP SURAT ]
                </div>
            )}
        </div>

        <div className="text-center mb-6">
            <h2 className="text-[13pt] font-bold uppercase m-0">TRANSKRIP NILAI</h2>
            <p className="text-[10pt] italic m-0">Nomor : {student.transkripNilaiNumber || '...........................................'}</p>
        </div>

        <div className="mb-6 grid grid-cols-[220px_10px_1fr] gap-x-2 leading-tight text-[10pt]">
            <span>Satuan Pendidikan</span><span>:</span><span className="font-bold">{settings.schoolName}</span>
            <span>Nomor Pokok Sekolah Nasional</span><span>:</span><span>{settings.npsn || '-'}</span>
            <span>Nama Lengkap</span><span>:</span><span className="font-bold">{student.name}</span>
            <span>Tempat, Tanggal Lahir</span><span>:</span><span>{student.birthPlace}, {formatDate(student.birthDate)}</span>
            <span>Nomor Induk Siswa Nasional</span><span>:</span><span>{student.nisn}</span>
            <span>Nomor Ijazah</span><span>:</span><span>{student.ijazahNasionalNumber || '...........................................'}</span>
            <span>Tanggal Kelulusan</span><span>:</span><span>{settings.ttdTempatTanggal ? settings.ttdTempatTanggal.split(',')[1]?.trim() : '-'}</span>
            <span>Kurikulum</span><span>:</span><span>Kurikulum Merdeka</span>
        </div>

        <table className="w-full border-collapse border border-black mb-6 text-[10pt]">
            <thead>
                <tr className="bg-slate-50/10">
                  <th className="border border-black px-2 py-1 w-12 text-center">No</th>
                  <th className="border border-black px-4 py-1 text-center font-bold">Mata Pelajaran</th>
                  <th className="border border-black px-2 py-1 w-24 text-center font-bold">Nilai</th>
                </tr>
            </thead>
            <tbody>
                <tr className="bg-slate-50/20">
                  <td className="border border-black px-2 py-0.5" colSpan={3}><b>Mata Pelajaran Wajib</b></td>
                </tr>
                {subjectsByCategory.UMUM.concat(subjectsByCategory.MULOK).map((s, idx) => (
                  <tr key={s.id}>
                      <td className="border border-black px-2 py-0.5 text-center">{idx + 1}</td>
                      <td className="border border-black px-4 py-0.5">{s.name}</td>
                      <td className="border border-black px-2 py-0.5 text-center font-bold">{getScore(s.name)}</td>
                  </tr>
                ))}
                
                <tr className="bg-slate-50/20">
                  <td className="border border-black px-2 py-0.5" colSpan={3}><b>Mata Pelajaran Pilihan</b></td>
                </tr>
                {subjectsByCategory.PILIHAN.map((s, idx) => (
                  <tr key={s.id}>
                      <td className="border border-black px-2 py-0.5 text-center">{subjectsByCategory.UMUM.length + subjectsByCategory.MULOK.length + idx + 1}</td>
                      <td className="border border-black px-4 py-0.5">{s.name}</td>
                      <td className="border border-black px-2 py-0.5 text-center font-bold">{getScore(s.name)}</td>
                  </tr>
                ))}

                <tr className="font-bold">
                  <td colSpan={2} className="border border-black px-4 py-1 text-center italic">Rata-Rata</td>
                  <td className="border border-black px-2 py-1 text-center bg-slate-50/10">
                    {student.averageScore.toLocaleString('id-ID', { 
                      minimumFractionDigits: settings.numDecimalRataRata ?? 2, 
                      maximumFractionDigits: settings.numDecimalRataRata ?? 2 
                    })}
                  </td>
                </tr>
            </tbody>
        </table>

        <div className="flex justify-end mt-10 px-8">
            {/* Student Photo */}
            {settings.showFotoSiswa && (
                <div 
                    className="w-[120px] h-[150px] relative flex-shrink-0"
                    style={{ marginRight: `${settings.sklFotoSpacing ?? 3}cm`, zIndex: 1 }}
                >
                    <div className="w-full h-full border border-black flex items-center justify-center text-[8pt] text-center p-2 bg-white/50">
                        {student.photoBase64 ? (
                            <img src={student.photoBase64} alt="Foto Siswa" className="w-full h-full object-cover grayscale" />
                        ) : (
                            <span className="italic">Pas Foto 3x4</span>
                        )}
                    </div>
                </div>
            )}

            <div className="w-[300px] text-center flex flex-col items-center relative flex-shrink-0">
              <p className="m-0 text-[10pt]">{settings.ttdTempatTanggal}</p>
              <p className="mb-14 leading-tight text-[10pt]">{settings.ttdJabatan || 'Kepala Sekolah'},</p>
              
              {settings.showTtdKepala && settings.signatureStampUrl && (
                <div className="absolute top-[20px] left-[10px] w-[200px] h-[120px] pointer-events-none z-10 transition-all">
                  <img 
                    src={settings.signatureStampUrl} 
                    alt="Stamp" 
                    className="w-full h-full object-contain" 
                    referrerPolicy="no-referrer"
                  />
                </div>
              )}

              <p className="font-bold underline relative z-20 text-[11pt] leading-none">{settings.headmasterName}</p>
              <p className="relative z-20 text-[10pt] leading-none mt-1">{settings.headmasterNip}</p>
            </div>
        </div>
      </div>
    </div>
  );
}

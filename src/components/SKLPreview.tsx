import { useEffect, useState } from 'react';
import { db, handleFirestoreError } from '../lib/firebase';
import { doc, getDoc, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { Student, SchoolSettings, Subject } from '../types';
import { formatDate } from '../lib/utils';
import { Check, X, FileText } from 'lucide-react';

interface SKLPreviewProps {
  student: Student;
  isAdminView?: boolean;
  forcedShowStamp?: boolean;
}

export default function SKLPreview({ student, isAdminView = false, forcedShowStamp }: SKLPreviewProps) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [localShowStamp, setLocalShowStamp] = useState(true);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  const showStamp = forcedShowStamp !== undefined ? forcedShowStamp : localShowStamp;

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
        handleFirestoreError(error, 'get', 'SKLPreview/data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading || !settings) return (
    <div className="bg-white p-12 text-center text-slate-400 font-medium">
      Mempersiapkan Pratinjau SKL...
    </div>
  );

  const format = settings.sklFormat || 'FORMAT_1';

  // Filter subjects for Format 2 based on student's class
  const studentClass = student.className?.toUpperCase();
  const relevantSubjects = allSubjects.filter(s => 
    s.className === 'SEMUA' || s.className === studentClass
  );

  const subjectsByCategory = {
    UMUM: relevantSubjects.filter(s => s.category === 'UMUM'),
    PILIHAN: relevantSubjects.filter(s => s.category === 'PILIHAN'),
    MULOK: relevantSubjects.filter(s => s.category === 'MULOK'),
  };

  const getScoreForSubject = (name: string) => {
    const found = student.subjects?.find(s => s.subjectName === name);
    return found ? found.score.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-';
  };

  const scale = (settings.printScale || 100) / 100;
  const topMargin = format === 'FORMAT_2' ? (settings.f4TopMargin || 2) : 1.5;
  const bottomMargin = format === 'FORMAT_2' ? (settings.f4BottomMargin || 1) : 1.5;
  const leftMargin = format === 'FORMAT_2' ? (settings.f4LeftMargin || 1.5) : 1.5;
  const rightMargin = format === 'FORMAT_2' ? (settings.f4RightMargin || 1.5) : 1.5;

  const paperStyle = {
    paddingTop: `${topMargin}cm`,
    paddingBottom: `${bottomMargin}cm`,
    paddingLeft: `${leftMargin}cm`,
    paddingRight: `${rightMargin}cm`,
    transform: `scale(${scale})`,
    transformOrigin: 'top center'
  };

  return (
    <div className="relative group">
      {/* Admin Toggle - Hidden during print */}
      {isAdminView && (
        <div className="flex flex-col items-center gap-4 mb-8 print:hidden max-w-[215mm] mx-auto">
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-6 py-2 shadow-sm font-bold text-slate-400 text-xs uppercase tracking-widest">
            <FileText className="w-4 h-4" />
            Mode Preview: {format.replace('_', ' ')}
          </div>
          
          <div className="bg-white border border-slate-200 rounded-full p-1.5 shadow-xl flex items-center gap-1">
            <button
              onClick={() => setLocalShowStamp(true)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all ${
                showStamp 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <Check className="w-3 h-3" />
              DENGAN CAP & TTD
            </button>
            <button
              onClick={() => setLocalShowStamp(false)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black transition-all ${
                !showStamp 
                ? 'bg-orange-600 text-white shadow-lg shadow-orange-200' 
                : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              <X className="w-3 h-3" />
              TANPA CAP & TTD
            </button>
          </div>
        </div>
      )}

      {/* PAPER CONTAINER */}
      <div 
        className={`bg-white shadow-2xl mx-auto text-black font-['Times_New_Roman',_serif] text-[11pt] print:shadow-none print:m-0 skl-printable-area ${
          format === 'FORMAT_1' 
          ? 'w-[210mm] min-h-[297mm]' 
          : 'w-[215mm] min-h-[330mm]' // F4 is 215x330mm
        }`}
        style={paperStyle}
      >
        {/* Header - Format 1 only */}
        {format === 'FORMAT_1' && (
          <div className="mb-6 w-full">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Kop Surat" className="w-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
                Belum ada Kop Surat diunggah di Pengaturan
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-[14pt] font-bold underline uppercase tracking-tight leading-tight">Surat Keterangan Lulus</h2>
          <p className="font-bold text-[11pt]">Nomor : {student.sklNumber || settings.letterNumberTemplate}</p>
        </div>

        {/* Opening Info */}
        <div className="mb-3 text-justify" style={{ lineHeight: '1.3' }}>
          <p>Kepala SMAS PGRI Naringgul, Tahun Pelajaran {settings.academicYear}, dengan berdasarkan:</p>
          <ol className="list-decimal ml-8 mt-1 space-y-0 text-[10.5pt]">
            <li>Penyelesaian seluruh program pembelajaran pada Kurikulum Merdeka;</li>
            <li>Kriteria kelulusan dari satuan pendidikan sesuai dengan peraturan perundang-undangan;</li>
            <li>Rapat Pleno Dewan Guru tentang Penetapan Kelulusan pada tanggal {formatDate(settings.plenaryDate)};</li>
          </ol>
        </div>

        <p className="mb-1 text-[10.5pt] font-medium">Menerangkan bahwa :</p>

        {/* Student Profile Info */}
        <div className="ml-8 space-y-0 mb-4 text-[10.5pt]">
          <div className="grid grid-cols-[200px_10px_1fr] leading-tight">
            <span>Nama</span><span>:</span><span className="font-bold uppercase tracking-tight">{student.name}</span>
          </div>
          <div className="grid grid-cols-[200px_10px_1fr] leading-tight">
            <span>Tempat dan Tanggal Lahir</span><span>:</span><span>{student.birthPlace}, {formatDate(student.birthDate)}</span>
          </div>
          <div className="grid grid-cols-[200px_10px_1fr] leading-tight">
            <span>Nama Orang Tua</span><span>:</span><span>{student.parentName}</span>
          </div>
          <div className="grid grid-cols-[200px_10px_1fr] leading-tight">
            <span>Nomor Induk Siswa</span><span>:</span><span>{student.nis}</span>
          </div>
          <div className="grid grid-cols-[200px_10px_1fr] leading-tight">
            <span>Nomor Induk Siswa Nasional</span><span>:</span><span>{student.nisn}</span>
          </div>
          <div className="grid grid-cols-[200px_10px_1fr] items-center pt-1">
            <span className="font-bold">Dinyatakan</span>
            <span className="font-bold">:</span>
            <span className="font-bold text-[11.5pt] tracking-[0.4em]">L U L U S</span>
          </div>
        </div>

        {/* Format 2 Subjects Table */}
        {format === 'FORMAT_2' ? (
          <>
            <p className="mb-1 text-[10.5pt]">Dengan nilai sebagai berikut :</p>
            <table className="w-full border-collapse border border-black mb-3 text-[10pt]">
              <thead className="bg-slate-50/20">
                <tr className="leading-tight">
                  <th className="border border-black px-1 py-1 w-10 text-center italic">No</th>
                  <th className="border border-black px-2 py-1 text-center">Mata Pelajaran</th>
                  <th className="border border-black px-2 py-1 w-24 text-center">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {/* Kelompok Umum */}
                <tr>
                  <td colSpan={3} className="border border-black px-2 py-0 font-bold text-[9.5pt] bg-slate-50/30">Kelompok Mata Pelajaran Umum</td>
                </tr>
                {subjectsByCategory.UMUM.map((s, idx) => (
                  <tr key={s.id}>
                    <td className="border border-black px-1 py-0 text-center text-[10pt] leading-normal">{idx + 1}</td>
                    <td className="border border-black px-2 py-0 text-[10pt] leading-normal">{s.name}</td>
                    <td className="border border-black px-2 py-0 text-center tabular-nums text-[10pt] leading-normal">{getScoreForSubject(s.name)}</td>
                  </tr>
                ))}

                {/* Kelompok Pilihan */}
                {subjectsByCategory.PILIHAN.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={3} className="border border-black px-2 py-0 font-bold text-[9.5pt] bg-slate-50/30">Kelompok Mata Pelajaran Pilihan</td>
                    </tr>
                    {subjectsByCategory.PILIHAN.map((s, idx) => (
                      <tr key={s.id}>
                        <td className="border border-black px-1 py-0 text-center text-[10pt] leading-normal">{subjectsByCategory.UMUM.length + idx + 1}</td>
                        <td className="border border-black px-2 py-0 text-[10pt] leading-normal">{s.name}</td>
                        <td className="border border-black px-2 py-0 text-center tabular-nums text-[10pt] leading-normal">{getScoreForSubject(s.name)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Kelompok Mulok */}
                {subjectsByCategory.MULOK.length > 0 && (
                  <>
                    <tr>
                      <td colSpan={3} className="border border-black px-2 py-0 font-bold text-[9.5pt] bg-slate-50/30">Muatan Lokal</td>
                    </tr>
                    {subjectsByCategory.MULOK.map((s, idx) => (
                      <tr key={s.id}>
                        <td className="border border-black px-1 py-0 text-center text-[10pt] leading-normal">{subjectsByCategory.UMUM.length + subjectsByCategory.PILIHAN.length + idx + 1}</td>
                        <td className="border border-black px-2 py-0 text-[10pt] leading-normal">{s.name}</td>
                        <td className="border border-black px-2 py-0 text-center tabular-nums text-[10pt] leading-normal">{getScoreForSubject(s.name)}</td>
                      </tr>
                    ))}
                  </>
                )}


                {/* Total Average */}
                <tr className="bg-slate-50 font-bold">
                  <td colSpan={2} className="border border-black px-2 py-1 text-center tracking-[0.2em] italic uppercase">Rata - rata</td>
                  <td className="border border-black px-2 py-1 text-center tabular-nums">{student.averageScore.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              </tbody>
            </table>
          </>
        ) : (
          /* Format 1 Simple Info */
          <>
            <div className="mb-4">
              <div className="grid grid-cols-[200px_10px_1fr]">
                <span>Peminatan/Mapel Pilihan</span><span>:</span>
                <div className="space-y-0">
                  {student.subjects?.map((item, idx) => (
                    <p key={idx}>{idx + 1}. {item.subjectName}</p>
                  ))}
                </div>
              </div>
            </div>
            <div className="mb-6 font-bold">
              <p>dengan Rata-rata Nilai*: {student.averageScore.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </>
        )}

        <div className="mb-6 italic text-[9pt] leading-tight">
          <p>Surat Keterangan Lulus (SKL) ini diterbitkan pada tanggal {formatDate(settings.graduationDate)} dan bersifat sementara hingga murid menerima ijazah dan transkrip nilai.</p>
        </div>

        {/* Signature Section - PRESERVED AS PER USER REQUEST */}
        <div className="flex justify-end mt-4 px-8">
          <div className="w-[300px] text-center flex flex-col items-center relative">
            <p className="mb-0 text-[10.5pt]">{settings.regency}, {formatDate(settings.graduationDate)}</p>
            <p className="mb-16 leading-tight text-[10.5pt]">Kepala SMAS PGRI Naringgul,</p>
            
            {showStamp && settings.signatureStampUrl && (
              <div className="absolute top-[25px] left-[15px] w-[200px] h-[120px] pointer-events-none z-10 transition-all">
                <img 
                  src={settings.signatureStampUrl} 
                  alt="Stamp" 
                  className="w-full h-full object-contain opacity-90" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <p className="font-bold underline text-[11pt] relative z-20 leading-none">{settings.headmasterName}</p>
            <p className="text-[10pt] relative z-20 leading-none mt-1">Pembina {settings.headmasterNip}</p>
          </div>
        </div>

        {format === 'FORMAT_2' && (
           <div className="mt-4 text-[8.5pt] leading-tight opacity-70 italic">
             <p>Keterangan: *) rata-rata nilai murid yang sama dengan nilai yang akan ditulis dalam Transkrip Nilai Ijazah.</p>
           </div>
        )}

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: ${format === 'FORMAT_1' ? 'A4 portrait' : '215mm 330mm portrait'};
              margin: 0 !important;
            }
            
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              height: auto !important;
              overflow: visible !important;
            }

            body * {
              visibility: hidden !important;
            }

            .skl-printable-area, 
            .skl-printable-area * {
              visibility: visible !important;
            }

            .skl-printable-area {
              visibility: visible !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: ${format === 'FORMAT_1' ? '210mm' : '215mm'} !important;
              min-height: ${format === 'FORMAT_1' ? '297mm' : '330mm'} !important;
              display: block !important;
              background: white !important;
              padding-top: ${paperStyle.paddingTop} !important;
              padding-bottom: ${paperStyle.paddingBottom} !important;
              padding-left: ${paperStyle.paddingLeft} !important;
              padding-right: ${paperStyle.paddingRight} !important;
              transform: scale(${scale}) !important;
              transform-origin: top center !important;
              box-sizing: border-box !important;
              margin: 0 !important;
              border: none !important;
              box-shadow: none !important;
              break-after: avoid !important;
            }

            /* Fix blank pages caused by outer containers */
            #root, #root > div, main, .App, .print-modal-root {
              visibility: visible !important;
              display: block !important;
              position: static !important;
              height: auto !important;
              min-height: 0 !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }

            .print-hide, 
            button, 
            aside, 
            header, 
            nav, 
            footer,
            .bg-black\\/60,
            .backdrop-blur-sm {
              display: none !important;
            }
          }

          .skl-printable-area {
            font-family: "Times New Roman", Times, serif;
            box-sizing: border-box;
            background: white;
            line-height: normal;
          }
          .tabular-nums {
            font-variant-numeric: tabular-nums;
          }
        `}} />
      </div>
    </div>
  );
}

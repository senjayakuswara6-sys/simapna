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
  forceShowHeader?: boolean;
}

export default function SKLPreview({ student, isAdminView = false, forcedShowStamp, forceShowHeader = false }: SKLPreviewProps) {
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
  const showHeader = format === 'FORMAT_1' || forceShowHeader;
  
  const effectiveTopMargin = (format === 'FORMAT_2' && !forceShowHeader) ? (settings.f4TopMargin || 5) : 0.5;
  const effectiveBottomMargin = (format === 'FORMAT_2' && !forceShowHeader) ? (settings.f4BottomMargin || 1) : 1;
  const effectiveLeftMargin = (format === 'FORMAT_2' && !forceShowHeader) ? (settings.f4LeftMargin || 1.5) : 1.5;
  const effectiveRightMargin = (format === 'FORMAT_2' && !forceShowHeader) ? (settings.f4RightMargin || 1.5) : 1.5;

  const paperStyle = {
    paddingTop: `${effectiveTopMargin}cm`,
    paddingBottom: `${effectiveBottomMargin}cm`,
    paddingLeft: `${effectiveLeftMargin}cm`,
    paddingRight: `${effectiveRightMargin}cm`,
    // Use zoom for preview, but we'll use a different strategy for print
    zoom: scale,
  };

  return (
    <div className="relative group skl-preview-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
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
          .skl-printable-area, 
          .skl-printable-area * {
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
            min-height: 0 !important;
            width: 100% !important;
            overflow: visible !important;
            background: transparent !important;
          }

          .skl-printable-area {
            display: block !important;
            position: relative !important;
            margin: 0 auto !important;
            break-after: page !important;
            page-break-after: always !important;
            page-break-inside: avoid !important;
            width: ${format === 'FORMAT_2' ? '215mm' : '210mm'} !important;
            height: ${format === 'FORMAT_2' ? '330mm' : '297mm'} !important;
            padding-top: ${paperStyle.paddingTop} !important;
            padding-bottom: ${paperStyle.paddingBottom} !important;
            padding-left: ${paperStyle.paddingLeft} !important;
            padding-right: ${paperStyle.paddingRight} !important;
            zoom: ${scale} !important;
            box-sizing: border-box !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
          }

          .print-hide {
            display: none !important;
            visibility: hidden !important;
          }
        }

        .skl-preview-root {
          line-height: normal;
        }

        .skl-printable-area {
          font-family: "Times New Roman", Times, serif;
          box-sizing: border-box;
          background: white;
          color: black;
          line-height: 1.25;
        }
        
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }

        /* Tight table styles */
        .skl-table td, .skl-table th {
          padding-top: 1px !important;
          padding-bottom: 1px !important;
          line-height: 1.1 !important;
        }
      `}} />
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
          format === 'FORMAT_2'
          ? 'w-[215mm] min-h-[330mm]' 
          : 'w-[210mm] min-h-[297mm]'
        }`}
        style={paperStyle}
      >
        {/* Header - Shown if digital or FORMAT_1 */}
        {showHeader && (
          <div className="mb-0 w-full">
            {settings.logoUrl ? (
              <img src={settings.logoUrl} alt="Kop Surat" className="w-full object-contain" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400 print:hidden">
                Belum ada Kop Surat diunggah di Pengaturan
              </div>
            )}
          </div>
        )}

        {/* Title */}
        <div className="text-center mb-1 space-y-0">
          <h2 className="text-[13pt] font-bold underline uppercase tracking-tight leading-none m-0">Surat Keterangan Lulus</h2>
          <p className="font-bold text-[11pt] m-0 leading-none mt-1">Nomor : {student.sklNumber || settings.letterNumberTemplate}</p>
        </div>

        {/* Opening Info */}
        <div className="mb-2 text-justify" style={{ lineHeight: '1.2' }}>
          <p>Kepala SMAS PGRI Naringgul, Tahun Pelajaran {settings.academicYear}, dengan berdasarkan:</p>
          <ol className="list-decimal ml-8 mt-1 space-y-0 text-[10.5pt]">
            <li>Penyelesaian seluruh program pembelajaran pada Kurikulum Merdeka;</li>
            <li>Kriteria kelulusan dari satuan pendidikan sesuai dengan peraturan perundang-undangan;</li>
            <li>Rapat Pleno Dewan Guru tentang Penetapan Kelulusan pada tanggal {formatDate(settings.plenaryDate)};</li>
          </ol>
        </div>

        <p className="mb-0 text-[10.5pt] font-medium">Menerangkan bahwa :</p>

        {/* Student Profile Info */}
        <div className="ml-8 space-y-0.5 mb-2 text-[10.5pt]">
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
            <p className="mb-0.5 text-[10pt]">Dengan nilai sebagai berikut :</p>
            <table className="w-full border-collapse border border-black mb-1 text-[9.5pt] skl-table">
              <thead className="bg-slate-50/10">
                <tr className="h-[20px]">
                  <th className="border border-black px-1 py-0 w-8 text-center italic">No</th>
                  <th className="border border-black px-2 py-0 text-center uppercase text-[9pt]">Mata Pelajaran</th>
                  <th className="border border-black px-2 py-0 w-20 text-center">Nilai</th>
                </tr>
              </thead>
              <tbody>
                {/* Kelompok Umum */}
                <tr className="h-[16px]">
                  <td colSpan={3} className="border border-black px-2 py-0 font-bold text-[8.5pt] bg-slate-50/5 italic leading-none">Kelompok Mata Pelajaran Umum</td>
                </tr>
                {subjectsByCategory.UMUM.map((s, idx) => (
                  <tr key={s.id} className="h-[16px]">
                    <td className="border border-black px-1 py-0 text-center text-[9.5pt] leading-none">{idx + 1}</td>
                    <td className="border border-black px-2 py-0 text-[9.5pt] leading-none">{s.name}</td>
                    <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt] leading-none">{getScoreForSubject(s.name)}</td>
                  </tr>
                ))}

                {/* Kelompok Pilihan */}
                {subjectsByCategory.PILIHAN.length > 0 && (
                  <>
                    <tr className="h-[16px]">
                      <td colSpan={3} className="border border-black px-2 py-0 font-bold text-[8.5pt] bg-slate-50/5 italic leading-none">Kelompok Mata Pelajaran Pilihan</td>
                    </tr>
                    {subjectsByCategory.PILIHAN.map((s, idx) => (
                      <tr key={s.id} className="h-[16px]">
                        <td className="border border-black px-1 py-0 text-center text-[9.5pt] leading-none">{subjectsByCategory.UMUM.length + idx + 1}</td>
                        <td className="border border-black px-2 py-0 text-[9.5pt] leading-none">{s.name}</td>
                        <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt] leading-none">{getScoreForSubject(s.name)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Kelompok Mulok */}
                {subjectsByCategory.MULOK.length > 0 && (
                  <>
                    <tr className="h-[16px]">
                      <td colSpan={3} className="border border-black px-2 py-0 font-bold text-[8.5pt] bg-slate-50/5 italic leading-none">Muatan Lokal</td>
                    </tr>
                    {subjectsByCategory.MULOK.map((s, idx) => (
                      <tr key={s.id} className="h-[16px]">
                        <td className="border border-black px-1 py-0 text-center text-[9.5pt] leading-none">{subjectsByCategory.UMUM.length + subjectsByCategory.PILIHAN.length + idx + 1}</td>
                        <td className="border border-black px-2 py-0 text-[9.5pt] leading-none">{s.name}</td>
                        <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt] leading-none">{getScoreForSubject(s.name)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Total Average */}
                <tr className="bg-slate-50/5 font-bold h-[20px]">
                  <td colSpan={2} className="border border-black px-2 py-0 text-center tracking-[0.2em] italic uppercase text-[9pt]">Rata - rata</td>
                  <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt]">{student.averageScore.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
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

        <div className="mb-2 italic text-[9pt] leading-tight">
          <p>Surat Keterangan Lulus (SKL) ini diterbitkan pada tanggal {formatDate(settings.graduationDate)} dan bersifat sementara hingga murid menerima ijazah dan transkrip nilai.</p>
        </div>

        {/* Signature Section - PRESERVED AS PER USER REQUEST */}
        <div className="flex justify-end mt-2 px-8">
          <div className="w-[300px] text-center flex flex-col items-center relative">
            <p className="mb-0 text-[10.5pt]">{settings.regency}, {formatDate(settings.graduationDate)}</p>
            <p className="mb-14 leading-tight text-[10.5pt]">Kepala SMAS PGRI Naringgul,</p>
            
        {showStamp && settings.signatureStampUrl && (
          <div className="absolute top-[20px] left-[10px] w-[180px] h-[100px] pointer-events-none z-10 transition-all opacity-80">
            <img 
              src={settings.signatureStampUrl} 
              alt="Stamp" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
        )}

            <p className="font-bold underline text-[11pt] relative z-20 leading-none">{settings.headmasterName}</p>
            <p className="text-[10pt] relative z-20 leading-none mt-1">{settings.headmasterIdType || 'NIP'}. {settings.headmasterNip}</p>
          </div>
        </div>

        {format === 'FORMAT_2' && (
           <div className="mt-2 text-[8pt] leading-tight opacity-70 italic">
             <p>Keterangan: *) rata-rata nilai murid yang sama dengan nilai yang akan ditulis dalam Transkrip Nilai Ijazah.</p>
           </div>
        )}
      </div>
    </div>
  );
}

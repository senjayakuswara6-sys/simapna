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
  const relevantSubjects = allSubjects.filter(s => {
    const studentCls = (student.className || '').trim().toUpperCase();
    const subjectCls = (s.className || 'SEMUA').trim().toUpperCase();
    return subjectCls === 'SEMUA' || subjectCls === studentCls;
  });

  const subjectsByCategory = {
    UMUM: relevantSubjects.filter(s => s.category === 'UMUM'),
    PILIHAN: relevantSubjects.filter(s => s.category === 'PILIHAN'),
    MULOK: relevantSubjects.filter(s => s.category === 'MULOK'),
  };

  const getScoreForSubject = (name: string) => {
    if (!student.subjects) return '-';
    
    // 1. Exact match (fastest and most accurate)
    let found = student.subjects.find(s => s.subjectName === name);
    
    // 2. Fallback: If no exact match, try a normalized match
    // This handles cases like renaming "Matematika (Umum)" to "Matematika"
    if (!found) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedTarget = normalize(name);
      
      found = student.subjects.find(s => {
        const normalizedSource = normalize(s.subjectName);
        return normalizedSource.includes(normalizedTarget) || normalizedTarget.includes(normalizedSource);
      });
    }

    const numDecimals = settings.numDecimalNilai ?? 2;
    return found ? found.score.toLocaleString('id-ID', { minimumFractionDigits: numDecimals, maximumFractionDigits: numDecimals }) : '-';
  };

  const scale = (settings.printScale || 100) / 100;
  const showHeader = settings.sklShowHeader !== false;
  const showStamp = settings.showTtdKepala;
  
  const effectiveTopMargin = !showHeader ? (settings.sklHeaderMargin || 5) : (settings.f4TopMargin || 0.5);
  const effectiveBottomMargin = settings.f4BottomMargin || 1;
  const effectiveLeftMargin = settings.f4LeftMargin || 1.5;
  const effectiveRightMargin = settings.f4RightMargin || 1.5;

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
            page-break-inside: avoid !important;
            width: ${format === 'FORMAT_2' ? '215mm' : '210mm'} !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: ${format === 'FORMAT_2' ? '329mm' : '296mm'} !important;
            padding-top: ${paperStyle.paddingTop} !important;
            padding-bottom: ${paperStyle.paddingBottom} !important;
            padding-left: ${paperStyle.paddingLeft} !important;
            padding-right: ${paperStyle.paddingRight} !important;
            zoom: ${scale} !important;
            box-sizing: border-box !important;
            background: white !important;
            border: none !important;
            box-shadow: none !important;
            overflow: hidden !important;
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
        <div className="text-center mb-4 space-y-0">
          <h2 className="text-[13pt] font-bold underline uppercase tracking-tight leading-none m-0">{settings.sklTitle || 'SURAT KETERANGAN LULUS'}</h2>
          <p className="font-bold text-[11pt] m-0 leading-none mt-1">Nomor : {student.sklNumber || settings.letterNumberTemplate}</p>
        </div>

        {/* Opening Info */}
        <div className="mb-2 text-justify" style={{ lineHeight: '1.2' }}>
          <p className="whitespace-pre-wrap">{settings.sklIsiTeks1}</p>
        </div>

        <p className="mb-1 text-[10.5pt] font-medium">Menerangkan bahwa :</p>

        {/* Student Profile Info */}
        <div className="ml-8 space-y-0.5 mb-2 text-[10.5pt]">
          {[1,2,3,4,5,6,7,8].map(i => {
            const label = (settings as any)[`sklIdentitas${i}`];
            if (!label) return null;

            let value = '';
            const lowLabel = label.toLowerCase();
            
            if (lowLabel.includes('kelamin')) value = student.gender === 'L' ? 'Laki-laki' : 'Perempuan';
            else if (lowLabel.includes('nisn') || lowLabel.includes('nasional')) value = student.nisn;
            else if (lowLabel.includes('nis') || lowLabel.includes('nomor induk')) value = student.nis;
            else if (lowLabel.includes('nama') && lowLabel.includes('tua')) value = student.parentName;
            else if (lowLabel.includes('nama')) value = student.name;
            else if (lowLabel.includes('tempat') || lowLabel.includes('lahir')) value = `${student.birthPlace}, ${formatDate(student.birthDate)}`;
            else if (lowLabel.includes('kelas')) value = student.className;
            else if (lowLabel.includes('peminatan') || lowLabel.includes('jurusan')) {
               if (settings.showPeminatanSKL === false) return null;
               value = student.peminatan;
            }
            else if (lowLabel.includes('agama')) value = 'Islam'; 

            return (
              <div key={i} className="grid grid-cols-[200px_10px_1fr] leading-tight">
                <span>{label}</span><span>:</span><span className={lowLabel.includes('nama') && !lowLabel.includes('tua') ? 'font-bold tracking-tight' : ''}>{value}</span>
              </div>
            );
          })}
        </div>

        {/* Basis Penilaian */}
        <div className="mb-2 text-justify" style={{ lineHeight: '1.2' }}>
          <p className="whitespace-pre-wrap">{settings.sklIsiTeks2}</p>
        </div>

        {(settings.sklShowStatus !== false) && (
          <div className="mb-4 flex flex-col items-center">
              <span className="font-black text-[14pt] tracking-[0.2em] border-2 border-black px-8 py-1 mt-1 uppercase">
                {student.status === 'TIDAK LULUS' ? 'TIDAK LULUS' : 'L U L U S'}
              </span>
          </div>
        )}

        <div className="mb-2 text-justify" style={{ lineHeight: '1.2' }}>
          <p className="whitespace-pre-wrap">{settings.sklIsiTeks3}</p>
        </div>

        {/* Format 2 Subjects Table */}
        {settings.sklAdaTabelNilai && (
          <div className="mb-2">
            <table className="w-full border-collapse border border-black text-[9pt] skl-table table-fixed">
              <thead className="bg-slate-50/10">
                <tr className="h-[20px]">
                  <th className="border border-black px-1 py-0 w-[40px] text-center italic">No</th>
                  <th className="border border-black px-4 py-0 text-left">MATA PELAJARAN</th>
                  {settings.showIdentitasKurikulum && (
                    <th className="border border-black px-1 py-0 w-[80px] text-center italic">Kurikulum</th>
                  )}
                  <th className="border border-black px-1 py-0 w-[80px] text-center italic">{settings.sklJudulKolomNilai || 'Nilai'}</th>
                </tr>
              </thead>
              <tbody>
                {/* Kelompok Umum */}
                <tr className="h-[16px]">
                  <td colSpan={settings.showIdentitasKurikulum ? 4 : 3} className="border border-black px-2 py-0 font-bold text-[8.5pt] bg-slate-50/5 italic leading-none">Kelompok Mata Pelajaran Umum</td>
                </tr>
                {subjectsByCategory.UMUM.map((s, idx) => (
                  <tr key={s.id} className="h-[16px]">
                    <td className="border border-black px-1 py-0 text-center text-[9.5pt] leading-none">{idx + 1}</td>
                    <td className="border border-black px-2 py-0 text-[9.5pt] leading-none">{s.name}</td>
                    {settings.showIdentitasKurikulum && (
                      <td className="border border-black px-2 py-0 text-center text-[8pt] leading-none">{settings.academicYear ? 'Kurikulum Merdeka' : '-'}</td>
                    )}
                    <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt] leading-none">{getScoreForSubject(s.name)}</td>
                  </tr>
                ))}

                {/* Kelompok Pilihan */}
                {subjectsByCategory.PILIHAN.length > 0 && (
                  <>
                    <tr className="h-[16px]">
                      <td colSpan={settings.showIdentitasKurikulum ? 4 : 3} className="border border-black px-2 py-0 font-bold text-[8.5pt] bg-slate-50/5 italic leading-none">Kelompok Mata Pelajaran Pilihan</td>
                    </tr>
                    {subjectsByCategory.PILIHAN.map((s, idx) => (
                      <tr key={s.id} className="h-[16px]">
                        <td className="border border-black px-1 py-0 text-center text-[9.5pt] leading-none">{subjectsByCategory.UMUM.length + idx + 1}</td>
                        <td className="border border-black px-2 py-0 text-[9.5pt] leading-none">{s.name}</td>
                        {settings.showIdentitasKurikulum && (
                          <td className="border border-black px-2 py-0 text-center text-[8pt] leading-none">{settings.academicYear ? 'Kurikulum Merdeka' : '-'}</td>
                        )}
                        <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt] leading-none">{getScoreForSubject(s.name)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Kelompok Mulok */}
                {subjectsByCategory.MULOK.length > 0 && (
                  <>
                    <tr className="h-[16px]">
                      <td colSpan={settings.showIdentitasKurikulum ? 4 : 3} className="border border-black px-2 py-0 font-bold text-[8.5pt] bg-slate-50/5 italic leading-none">Muatan Lokal</td>
                    </tr>
                    {subjectsByCategory.MULOK.map((s, idx) => (
                      <tr key={s.id} className="h-[16px]">
                        <td className="border border-black px-1 py-0 text-center text-[9.5pt] leading-none">{subjectsByCategory.UMUM.length + subjectsByCategory.PILIHAN.length + idx + 1}</td>
                        <td className="border border-black px-2 py-0 text-[9.5pt] leading-none">{s.name}</td>
                        {settings.showIdentitasKurikulum && (
                          <td className="border border-black px-2 py-0 text-center text-[8pt] leading-none">{settings.academicYear ? 'Kurikulum Merdeka' : '-'}</td>
                        )}
                        <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt] leading-none">{getScoreForSubject(s.name)}</td>
                      </tr>
                    ))}
                  </>
                )}

                {/* Total Average */}
                {settings.showRataRata && (
                  <tr className="bg-slate-50/5 font-bold h-[20px]">
                    <td colSpan={settings.showIdentitasKurikulum ? 3 : 2} className="border border-black px-2 py-0 text-center tracking-[0.2em] italic uppercase text-[9pt]">Rata - rata</td>
                    <td className="border border-black px-2 py-0 text-center tabular-nums text-[9.5pt]">{student.averageScore.toLocaleString('id-ID', { minimumFractionDigits: settings.numDecimalRataRata || 2, maximumFractionDigits: settings.numDecimalRataRata || 2 })}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mb-4 text-justify" style={{ lineHeight: '1.2' }}>
          <p className="whitespace-pre-wrap">{settings.sklIsiTeks4}</p>
        </div>

        {/* Signature Section */}
        <div className="flex justify-end mt-2 px-8">
          {settings.showFotoSiswa && (
            <div 
              className="w-[120px] h-[150px] relative flex-shrink-0"
              style={{ marginRight: `${settings.sklFotoSpacing ?? 3}cm`, zIndex: 1 }}
            >
              <div className="w-full h-full border border-black flex items-center justify-center text-[8pt] text-center p-2 bg-white/50">
                {student.photoBase64 ? (
                  <img src={student.photoBase64} alt="Foto Siswa" className="w-full h-full object-cover" />
                ) : (
                  <span>Pas Foto 3x4</span>
                )}
              </div>
            </div>
          )}

          <div className="w-[300px] text-center flex flex-col items-center relative flex-shrink-0">
            <p className="mb-0 text-[10pt]">{settings.ttdTempatTanggal}</p>
            <p className="mb-14 leading-tight text-[10pt]">{settings.ttdJabatan || 'Kepala Sekolah'},</p>
            
            {(showStamp && settings.signatureStampUrl && settings.showTtdKepala) ? (
              <div className="absolute top-[20px] left-[10px] w-[200px] h-[120px] pointer-events-none z-10 transition-all">
                <img 
                  src={settings.signatureStampUrl} 
                  alt="Stamp" 
                  className="w-full h-full object-contain" 
                  referrerPolicy="no-referrer"
                />
              </div>
            ) : (
                <div className="h-14"></div>
            )}

            <p className="font-bold underline text-[11pt] relative z-20 leading-none">{settings.headmasterName}</p>
            <p className="text-[10pt] relative z-20 leading-none mt-1">{settings.headmasterNip}</p>
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

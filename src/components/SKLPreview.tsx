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
  template?: 'V1' | 'V2';
}

export default function SKLPreview({ student, isAdminView = false, forcedShowStamp, forceShowHeader, template: propTemplate }: SKLPreviewProps) {
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

  const activeTemplate = propTemplate || settings.sklTemplate || 'V1';
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

  const totalSubjects = relevantSubjects.length;

  const getScoreForSubject = (name: string) => {
    if (!student.subjects) return '-';
    
    let found = student.subjects.find(s => s.subjectName === name);
    
    if (!found) {
      const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
      const normalizedTarget = normalize(name);
      found = student.subjects.find(s => normalize(s.subjectName).includes(normalizedTarget) || normalizedTarget.includes(normalize(s.subjectName)));
    }

    const numDecimals = settings.numDecimalNilai ?? 2;
    return found ? found.score.toLocaleString('id-ID', { minimumFractionDigits: numDecimals, maximumFractionDigits: numDecimals }) : '-';
  };

  const scale = (settings.printScale || 100) / 100;
  
  // LOGIC: If on Public View (not isAdminView), we MUST respect the settings if they are FALSE.
  // Unless it's explicitly forced by prop.
  let showHeader = settings.sklShowHeader !== false;
  if (forceShowHeader !== undefined) showHeader = forceShowHeader;
  
  let showStamp = settings.showTtdKepala;
  if (forcedShowStamp !== undefined) showStamp = forcedShowStamp;
  
  const effectiveTopMargin = !showHeader ? (settings.sklHeaderMargin || 5) : (settings.f4TopMargin || 0.5);
  const effectiveBottomMargin = settings.f4BottomMargin || 1;
  const effectiveLeftMargin = settings.f4LeftMargin || 1.5;
  const effectiveRightMargin = settings.f4RightMargin || 1.5;

  // Dynamic adjustments for fitting 1 page
  const baseFontSize = settings.sklFontSize || (activeTemplate === 'V2' ? 10 : 11);
  const tableFontSize = settings.sklTableFontSize || (totalSubjects > 15 ? 8.5 : 9.5);
  const tableLineHeight = settings.sklTableLineHeight || (totalSubjects > 15 ? 1.0 : 1.15);

  const paperStyle = {
    paddingTop: `${effectiveTopMargin}cm`,
    paddingBottom: `${effectiveBottomMargin}cm`,
    paddingLeft: `${effectiveLeftMargin}cm`,
    paddingRight: `${effectiveRightMargin}cm`,
    zoom: scale,
    fontSize: `${baseFontSize}pt`,
  };

  return (
    <div className="relative group skl-preview-root">
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body * { visibility: hidden !important; }
          .skl-printable-area, .skl-printable-area * { visibility: visible !important; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto !important; overflow: visible !important; width: 100% !important; }
          #root, .simapna-app, main, .print-modal-root, .print-modal-content, .print-all-container {
             visibility: visible !important; display: block !important; position: static !important;
             margin: 0 !important; padding: 0 !important; height: auto !important; width: 100% !important; overflow: visible !important;
          }
          .skl-printable-area {
            display: block !important;
            position: relative !important;
            margin: 0 auto !important;
            page-break-inside: avoid !important;
            width: ${format === 'FORMAT_2' ? '215mm' : '210mm'} !important;
            height: auto !important;
            min-height: 0 !important;
            max-height: ${format === 'FORMAT_2' ? '330mm' : '297mm'} !important;
            padding-top: ${paperStyle.paddingTop} !important;
            padding-bottom: ${paperStyle.paddingBottom} !important;
            padding-left: ${paperStyle.paddingLeft} !important;
            padding-right: ${paperStyle.paddingRight} !important;
            zoom: ${scale} !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
          }
        }
        .skl-printable-area {
          font-family: "Times New Roman", Times, serif;
          line-height: ${settings.sklLineHeight || 1.3};
        }
        .skl-table td, .skl-table th {
          padding-top: 1px !important;
          padding-bottom: 1px !important;
          line-height: ${tableLineHeight} !important;
          font-size: ${tableFontSize}pt !important;
        }
        .tabular-nums { font-variant-numeric: tabular-nums; }
      `}} />

      <div 
        className={`bg-white shadow-2xl mx-auto text-black print:shadow-none print:m-0 skl-printable-area ${
          format === 'FORMAT_2' ? 'w-[215mm] min-h-[330mm]' : 'w-[210mm] min-h-[297mm]'
        }`}
        style={paperStyle}
      >
        {showHeader && settings.logoUrl && (
          <div className={`${activeTemplate === 'V2' ? 'mb-2' : 'mb-4'} w-full`}>
            <img src={settings.logoUrl} alt="Kop Surat" className="w-full object-contain" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className={`text-center ${activeTemplate === 'V2' ? 'mb-2' : 'mb-4'}`}>
          <h2 className={`${activeTemplate === 'V2' ? 'text-[12pt]' : 'text-[13pt]'} font-bold underline uppercase m-0`}>
            {settings.sklTitle || 'SURAT KETERANGAN LULUS'}
          </h2>
          <p className="font-bold m-0 mt-1">Nomor : {student.sklNumber || settings.letterNumberTemplate}</p>
        </div>

        <div className={`${activeTemplate === 'V2' ? 'mb-1' : 'mb-2'} text-justify`}>
          <p className="whitespace-pre-wrap leading-tight">{settings.sklIsiTeks1}</p>
        </div>

        <p className={`${activeTemplate === 'V2' ? 'mb-0.5' : 'mb-1'} font-medium`}>Menerangkan bahwa :</p>

        <div className={`ml-8 space-y-0.5 ${activeTemplate === 'V2' ? 'mb-1' : 'mb-2'}`}>
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
              <div key={i} className="grid grid-cols-[220px_15px_1fr] leading-tight">
                <span>{label}</span><span>:</span><span className={lowLabel.includes('nama') && !lowLabel.includes('tua') ? 'font-bold' : ''}>{value}</span>
              </div>
            );
          })}
        </div>

        <div className={`${activeTemplate === 'V2' ? 'mb-1' : 'mb-2'} text-justify`}>
          <p className="whitespace-pre-wrap leading-tight">{settings.sklIsiTeks2}</p>
        </div>

        {settings.sklShowStatus !== false && (
          <div className={`${activeTemplate === 'V2' ? 'mb-2' : 'mb-4'} flex flex-col items-center`}>
              <span className="font-black text-[14pt] tracking-[0.2em] border-2 border-black px-8 py-1 uppercase">
                {student.status === 'TIDAK LULUS' ? 'TIDAK LULUS' : 'L U L U S'}
              </span>
          </div>
        )}

        <div className={`${activeTemplate === 'V2' ? 'mb-1' : 'mb-2'} text-justify`}>
          <p className="whitespace-pre-wrap leading-tight">{settings.sklIsiTeks3}</p>
        </div>

        {settings.sklAdaTabelNilai && (
          <div className={`${activeTemplate === 'V2' ? 'mb-2' : 'mb-3'}`}>
            <table className="w-full border-collapse border border-black skl-table table-fixed">
              <thead>
                <tr className="h-[20px]">
                  <th className="border border-black w-[40px] text-center italic">No</th>
                  <th className="border border-black px-4 text-left uppercase">Mata Pelajaran</th>
                  {settings.showIdentitasKurikulum && <th className="border border-black w-[90px] text-center italic">Kurikulum</th>}
                  <th className="border border-black w-[80px] text-center italic">{settings.sklJudulKolomNilai || 'Nilai'}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="bg-slate-50/5"><td colSpan={settings.showIdentitasKurikulum ? 4 : 3} className="border border-black px-2 font-bold italic h-[16px]">Kelompok Umum</td></tr>
                {subjectsByCategory.UMUM.map((s, idx) => (
                  <tr key={s.id}><td className="border border-black text-center">{idx + 1}</td><td className="border border-black px-2">{s.name}</td>{settings.showIdentitasKurikulum && <td className="border border-black text-center text-[8pt]">Kur. Merdeka</td>}<td className="border border-black text-center tabular-nums">{getScoreForSubject(s.name)}</td></tr>
                ))}
                {subjectsByCategory.PILIHAN.length > 0 && (
                  <>
                    <tr className="bg-slate-50/5"><td colSpan={settings.showIdentitasKurikulum ? 4 : 3} className="border border-black px-2 font-bold italic h-[16px]">Kelompok Pilihan</td></tr>
                    {subjectsByCategory.PILIHAN.map((s, idx) => (
                      <tr key={s.id}><td className="border border-black text-center">{subjectsByCategory.UMUM.length + idx + 1}</td><td className="border border-black px-2">{s.name}</td>{settings.showIdentitasKurikulum && <td className="border border-black text-center text-[8pt]">Kur. Merdeka</td>}<td className="border border-black text-center tabular-nums">{getScoreForSubject(s.name)}</td></tr>
                    ))}
                  </>
                )}
                {subjectsByCategory.MULOK.length > 0 && (
                  <>
                    <tr className="bg-slate-50/5"><td colSpan={settings.showIdentitasKurikulum ? 4 : 3} className="border border-black px-2 font-bold italic h-[16px]">Muatan Lokal</td></tr>
                    {subjectsByCategory.MULOK.map((s, idx) => (
                      <tr key={s.id}><td className="border border-black text-center">{subjectsByCategory.UMUM.length + subjectsByCategory.PILIHAN.length + idx + 1}</td><td className="border border-black px-2">{s.name}</td>{settings.showIdentitasKurikulum && <td className="border border-black text-center text-[8pt]">Kur. Merdeka</td>}<td className="border border-black text-center tabular-nums">{getScoreForSubject(s.name)}</td></tr>
                    ))}
                  </>
                )}
                {settings.showRataRata && (
                  <tr className="bg-slate-50/5 font-bold"><td colSpan={settings.showIdentitasKurikulum ? 3 : 2} className="border border-black px-2 text-center tracking-widest italic uppercase">Rata - rata</td><td className="border border-black text-center tabular-nums">{student.averageScore?.toFixed(settings.numDecimalRataRata || 2)}</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className={`${activeTemplate === 'V2' ? 'mb-2' : 'mb-4'} text-justify`}>
          <p className="whitespace-pre-wrap leading-tight">{settings.sklIsiTeks4}</p>
        </div>

        <div className="flex justify-between items-start mt-2 px-4">
          <div className="flex flex-col items-center">
            {settings.showFotoSiswa && (
               <div className="w-[3cm] h-[4cm] border border-black flex items-center justify-center text-[8pt] p-2 mb-2">
                 {student.photoBase64 ? <img src={student.photoBase64} className="w-full h-full object-cover" /> : <span>Pas Foto 3x4</span>}
               </div>
            )}
            {format === 'FORMAT_2' && <p className="text-[7.5pt] italic opacity-80 max-w-[200px]">*) Disesuaikan dengan pangkalan data sekolah.</p>}
          </div>

          <div className="w-[280px] text-center relative">
            <p className="m-0 text-[10pt]">{settings.ttdTempatTanggal}</p>
            <p className="mb-14 text-[10pt]">{settings.ttdJabatan || 'Kepala Sekolah'},</p>
            
            {showStamp && settings.signatureStampUrl && (
              <div className="absolute top-[20px] left-[10px] w-[180px] h-[100px] pointer-events-none z-10">
                <img src={settings.signatureStampUrl} alt="Stamp" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
              </div>
            )}

            <p className="font-bold underline text-[11pt] relative z-20 m-0 leading-tight">{settings.headmasterName}</p>
            <p className="text-[10pt] relative z-20 m-0 mt-1">
              {(() => {
                const type = settings.headmasterIdType || 'NIP';
                const val = settings.headmasterNip;
                return val ? `${type.replace(/\.$/, '')}. ${val}` : '';
              })()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

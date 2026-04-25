import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Student, SchoolSettings } from '../types';
import { formatDate } from '../lib/utils';
import { Check, X } from 'lucide-react';

interface SKLPreviewProps {
  student: Student;
  isAdminView?: boolean;
  forcedShowStamp?: boolean;
}

export default function SKLPreview({ student, isAdminView = false, forcedShowStamp }: SKLPreviewProps) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [localShowStamp, setLocalShowStamp] = useState(true);

  const showStamp = forcedShowStamp !== undefined ? forcedShowStamp : localShowStamp;

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [generalSnap, logoSnap, signatureSnap] = await Promise.all([
          getDoc(doc(db, 'settings', 'general')),
          getDoc(doc(db, 'settings', 'logo_header')),
          getDoc(doc(db, 'settings', 'signature_stamp'))
        ]);

        if (generalSnap.exists()) {
          const data = generalSnap.data() as SchoolSettings;
          setSettings({
            ...data,
            logoUrl: logoSnap.exists() ? logoSnap.data().url : '',
            signatureStampUrl: signatureSnap.exists() ? signatureSnap.data().url : '',
          });
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchSettings();
  }, []);

  if (!settings) return null;

  return (
    <div className="relative group">
      {/* Admin Toggle - Hidden during print */}
      {isAdminView && (
        <div className="flex justify-center mb-6 print:hidden">
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

      <div className="bg-white shadow-2xl p-[1.5cm] w-[210mm] min-h-[297mm] mx-auto text-black font-['Times_New_Roman',_serif] text-[11pt] leading-relaxed print:shadow-none print:m-0 print:w-full skl-printable-area">
        {/* Header - Full Image */}
        <div className="mb-6 w-full">
           {settings.logoUrl ? (
             <img src={settings.logoUrl} alt="Kop Surat" className="w-full object-contain" referrerPolicy="no-referrer" />
           ) : (
             <div className="w-full h-32 flex items-center justify-center border-2 border-dashed border-slate-200 bg-slate-50 text-slate-400">
               Belum ada Kop Surat diunggah di Pengaturan
             </div>
           )}
        </div>

        {/* Title */}
        <div className="text-center mb-4">
          <h2 className="text-[14pt] font-bold underline uppercase">Surat Keterangan Lulus</h2>
          <p className="font-bold">No. {settings.letterNumberTemplate}</p>
        </div>

        {/* Opening */}
        <div className="mb-4" style={{ lineHeight: '1.5' }}>
          <p>Kepala {settings.schoolName} Tahun Pelajaran {settings.academicYear}, dengan berdasarkan:</p>
          <ol className="list-decimal ml-8 mt-1" style={{ lineHeight: '1' }}>
            <li>Penyelesaian seluruh program pembelajaran pada kurikulum merdeka;</li>
            <li>Kriteria kelulusan dari satuan pendidikan sesuai dengan peraturan perundang-undangan;</li>
            <li>Rapat Pleno Dewan Guru tentang Penetapan Kelulusan pada tanggal {formatDate(settings.plenaryDate || settings.graduationDate)};</li>
          </ol>
        </div>

        <p className="mb-2 leading-none">Menerangkan bahwa:</p>

        {/* Student Profile Info */}
        <div className="ml-8 space-y-0.5 mb-4" style={{ lineHeight: '1.15' }}>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Nama</span><span>:</span><span className="font-bold uppercase">{student.name}</span>
          </div>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Tempat dan Tanggal Lahir</span><span>:</span><span>{student.birthPlace}, {formatDate(student.birthDate)}</span>
          </div>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Nama Orang Tua</span><span>:</span><span>{student.parentName}</span>
          </div>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Nomor Induk Siswa</span><span>:</span><span>{student.nis}</span>
          </div>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Nomor Induk Siswa Nasional</span><span>:</span><span>{student.nisn}</span>
          </div>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Kelas</span><span>:</span><span className="tabular-nums font-bold uppercase">{student.className || '-'}</span>
          </div>
          <div className="grid grid-cols-[200px_20px_1fr]">
            <span>Peminatan/Mapel Pilihan</span><span>:</span>
            <div className="space-y-0">
              {student.subjects && (Array.isArray(student.subjects) ? student.subjects : Object.keys(student.subjects)).map((name, idx) => (
                <p key={idx}>{idx + 1}. {name}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Declaration */}
        <div className="mb-4">
          <div className="grid grid-cols-[200px_20px_1fr] items-center">
            <span className="font-bold">Dinyatakan</span>
            <span className="font-bold">:</span>
            <span className="font-bold text-[12pt] tracking-[0.2em]">
              <span className={student.status === 'TIDAK LULUS' ? 'line-through decoration-2' : ''}>LULUS</span>
              <span> / </span>
              <span className={student.status === 'LULUS' ? 'line-through decoration-2' : ''}>TIDAK LULUS</span>
            </span>
          </div>
        </div>

        <div className="mb-4 font-bold">
          <p>dengan Rata-rata Nilai*: {student.averageScore.toLocaleString('id-ID', { minimumFractionDigits: 2 })}</p>
        </div>

        <div className="mb-4 italic text-[9pt] leading-tight">
          <p>Surat Keterangan Lulus (SKL) ini diterbitkan pada tanggal {formatDate(settings.graduationDate)} dan bersifat sementara hingga murid menerima ijazah dan transkrip nilai.</p>
        </div>

        {/* Signature Section */}
        <div className="flex justify-end mt-4 px-8">
          <div className="w-[300px] text-center flex flex-col items-center relative">
            <p>{settings.regency}, {formatDate(settings.graduationDate)}</p>
            <p className="mb-16">Kepala Sekolah,</p>
            
            {showStamp && settings.signatureStampUrl && (
              <div className="absolute top-[35px] left-[10px] w-[210px] h-[140px] pointer-events-none z-10 transition-all">
                <img 
                  src={settings.signatureStampUrl} 
                  alt="Stamp" 
                  className="w-full h-full object-contain opacity-90" 
                  referrerPolicy="no-referrer"
                />
              </div>
            )}

            <p className="font-bold underline text-[11pt] relative z-20">{settings.headmasterName}</p>
            <p className="text-[10pt] relative z-20">NPA. {settings.headmasterNip}</p>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-4 text-[8pt] leading-none">
          <p>Keterangan:</p>
          <p>*) rata-rata nilai murid yang sama dengan nilai yang akan ditulis dalam Transkrip Nilai Ijazah.</p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            @page {
              size: A4;
              margin: 0;
            }
            
            body { 
              visibility: hidden !important; 
              background: white !important;
            }

            .print-modal-root {
              visibility: visible !important;
              position: absolute !important;
              top: 0 !important;
              left: 0 !important;
              width: 100% !important;
              height: auto !important;
              display: block !important;
              z-index: 99999 !important;
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
            }

            .print-modal-root * {
              visibility: visible !important;
            }

            /* Hide specific UI elements inside the modal */
            .print-modal-root button,
            .print-modal-root .print-hide,
            .print-modal-content > div:first-child {
              display: none !important;
              visibility: hidden !important;
            }

            /* Main document area style */
            .skl-printable-area {
              margin: 0 auto !important;
              padding: 1.5cm !important;
              width: 210mm !important;
              height: 297mm !important;
              page-break-after: always !important;
              page-break-inside: avoid !important;
              background: white !important;
              box-sizing: border-box !important;
              display: block !important;
              position: relative !important;
            }

            /* Ensure all parent containers are visible and don't clip */
            #root, #root > div, main, div[key] {
              visibility: visible !important;
              overflow: visible !important;
              height: auto !important;
              display: block !important;
              position: static !important;
              transform: none !important;
              opacity: 1 !important;
              min-height: 0 !important;
              padding: 0 !important;
              margin: 0 !important;
            }
          }

          .skl-printable-area {
            font-family: "Times New Roman", Times, serif;
            box-sizing: border-box;
            background: white;
          }
          .tabular-nums {
            font-variant-numeric: tabular-nums;
          }
        `}} />
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Student, SchoolSettings } from '../types';
import { formatDate } from '../lib/utils';

interface SKLPreviewProps {
  student: Student;
  isAdminView?: boolean;
}

export default function SKLPreview({ student, isAdminView = false }: SKLPreviewProps) {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);

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
    <div className="bg-white shadow-2xl p-[1.5cm] w-[210mm] min-h-[297mm] mx-auto text-black font-['Times_New_Roman',_serif] text-[11pt] leading-relaxed print:shadow-none print:m-0 print:w-full" id="skl-printable">
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
          
          {settings.signatureStampUrl && (
            <div className="absolute top-[35px] left-[10px] w-[180px] h-[130px] pointer-events-none z-10">
              <img 
                src={settings.signatureStampUrl} 
                alt="Stamp" 
                className="w-full h-full object-contain opacity-90 transition-opacity" 
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
          body * { visibility: hidden; }
          #skl-printable, #skl-printable * { visibility: visible; }
          #skl-printable {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 1.5cm;
            box-shadow: none;
            font-family: "Times New Roman", Times, serif;
          }
        }
        @page {
          size: A4;
          margin: 0;
        }
        #skl-printable {
          font-family: "Times New Roman", Times, serif;
          box-sizing: border-box;
        }
        .tabular-nums {
          font-variant-numeric: tabular-nums;
        }
      `}} />
    </div>
  );
}

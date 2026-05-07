export type SubjectCategory = 'UMUM' | 'PILIHAN' | 'MULOK';

export interface Subject {
  id?: string;
  name: string;
  category: SubjectCategory;
  className: string; // Relevant class (e.g. XII-1) or 'SEMUA'
  order: number;
}

export interface StudentSubjectScore {
  subjectName: string;
  score: number;
  category: SubjectCategory;
}

export interface Student {
  id?: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  parentName: string;
  nis: string;
  nisn: string;
  gender: 'L' | 'P';
  className: string;
  peminatan: string;
  subjects: StudentSubjectScore[]; // Structured scores
  averageScore: number;
  status: 'LULUS' | 'TIDAK LULUS';
  sklNumber?: string;
  ijazahNasionalNumber?: string;
  transkripNilaiNumber?: string;
  photoBase64?: string;
  graduationDate?: string; // Individual graduation date if different
  updatedAt?: string;
}

export interface SchoolSettings {
  // Basic info (maintained)
  schoolName: string;
  npsn?: string;
  logoUrl?: string; // Full Letterhead
  secondaryLogoUrl?: string; // Simple Logo
  address: string;
  district: string;
  regency: string;
  headmasterName: string;
  headmasterNip: string;
  headmasterIdType?: 'NIP' | 'NPA' | 'NIY' | 'NIK' | string;
  publicShowStamp?: boolean;
  academicYear: string;
  graduationDate: string;
  plenaryDate: string;
  letterNumberTemplate: string;
  signatureStampUrl?: string;
  isCountdownActive?: boolean;
  countdownTargetDate?: string;
  sklFormat: 'FORMAT_1' | 'FORMAT_2';
  sklTemplate?: 'V1' | 'V2'; // Student choice template
  
  // Printing Margins (maintained)
  f4TopMargin: number; // in cm
  f4BottomMargin?: number;
  f4LeftMargin?: number;
  f4RightMargin?: number;
  printScale?: number; // percentage
  sklFontSize?: number; // in pt
  sklLineHeight?: number; // multiplier
  sklTableFontSize?: number; // in pt
  sklTableLineHeight?: number; // multiplier

  // NEW: Dynamic SKL Settings
  sklShowHeader?: boolean;
  sklHeaderMargin?: number; // margin top when header is hidden (in cm)
  sklTitle?: string;
  sklIsiTeks1?: string;
  sklIdentitas1?: string;
  sklIdentitas2?: string;
  sklIdentitas3?: string;
  sklIdentitas4?: string;
  sklIdentitas5?: string;
  sklIdentitas6?: string;
  sklIdentitas7?: string;
  sklIdentitas8?: string;
  sklIsiTeks2?: string;
  sklStatusKelulusanLabel?: string;
  sklShowStatus?: boolean;
  sklIsiTeks3?: string;
  sklAdaTabelNilai?: boolean;
  sklJudulKolomNilai?: string;
  sklIsiTeks4?: string;
  
  // Scoring Settings
  numDecimalNilai?: number;
  showRataRata?: boolean;
  numDecimalRataRata?: number;

  // Signature Settings
  ttdTempatTanggal?: string;
  ttdJabatan?: string;
  showFotoSiswa?: boolean;
  showTtdKepala?: boolean;
  sklFotoSpacing?: number; // Spacing between photo and signature in cm

  // Student Name Formatting
  namaSiswaKapital?: boolean;
  
  // Curriculum
  showIdentitasKurikulum?: boolean;
  showPeminatanSKL?: boolean;
}

export interface GraduationInvitationSettings {
  number: string;
  attachment: string;
  subject: string;
  date: string;
  day: string;
  time: string;
  venue: string;
  agenda: string;
  signDate: string; // "Cianjur, 30 April 2026" or auto
  tembusan: string[];
  // Detailed Layout Settings
  showHeader: boolean;
  headerMargin: number; // in cm
  fontSize: number; // in pt
  lineHeight: number; // multiplier
  showStamp: boolean;
  indentation: number; // in cm
}

export interface GraduationMinutesSettings {
  day: string;
  dateSpelled: string; // "Dua"
  month: string; // "Mei"
  yearSpelled: string; // "Dua Ribu Dua Puluh Enam"
  startTime: string;
  endTime: string;
  room: string;
  witnesses: { name: string; idType: string; idNumber: string; role: string }[];
  
  // Notule Specific
  meetingLocation: string; // Rapat diadakan di
  leaderName: string; // Pimpinan Sidang
  attendees: string; // Hadir
  meetingResult: string; // Keputusan rapat
  notaryName: string; // Notulis
  notaryIdType: string;
  notaryIdNumber: string;

  // Detailed Layout Settings
  showHeader: boolean;
  headerMargin: number;
  fontSize: number;
  lineHeight: number;
  showTableStats: boolean;
  showTablePassed: boolean;
  showWitnesses: boolean;
  showNotule: boolean; // Toggle for second page
  
  // Custom Sentences
  openingParagraph: string;
  secondParagraph: string;
  closingParagraph: string;
  
  // Custom Labels
  tableNoLabel: string;
  tableProgramLabel: string;
  tableMaleLabel: string;
  tableFemaleLabel: string;
  tableTotalLabel: string;
  passedLabel: string;
  notPassedLabel: string;
  appendixLabel: string;
  defaultProgramLabel: string;
  
  // Headmaster Title
  headmasterTitle: string; // e.g., "Kepala SMAS PGRI NARINGGUL" or "KEPALA SEKOLAH"
  
  // Font
  fontFamily: 'serif' | 'sans';
  
  // Manual Stats
  useManualStats: boolean;
  manualStats: {
    program: string;
    male: number;
    female: number;
    total: number;
    passedMale: number;
    passedFemale: number;
    passedTotal: number;
  }[];
}

export interface AppendixItem {
  text: string;
  subItems?: string[];
}

export interface GraduationSKSettings {
  number: string;
  subject: string;
  considering: string[];
  bearing: string[];
  observing: string[];
  deciding: string[];
  minimumScore: number;
  
  // Appendix I content
  appendix1Title: string;
  appendix1Content: AppendixItem[]; // List items for Lampiran I with optional sub-items
  
  tableNoLabel?: string;
  tableNisLabel?: string;
  tableNisnLabel?: string;
  tableNameLabel?: string;
  tableGenderLabel?: string;
  tableResultLabel?: string;

  // Detailed Layout Settings
  showHeader: boolean;
  headerMargin: number;
  fontSize: number;
  lineHeight: number;
  showLampiranKriteria: boolean;
  showLampiranDaftar: boolean;
  
  // Signatures
  pengawasName?: string;
  pengawasNip?: string;
  showPengawasSignature?: boolean;
}

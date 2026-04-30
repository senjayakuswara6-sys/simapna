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
  className: string;
  subjects: StudentSubjectScore[]; // Structured scores
  averageScore: number;
  status: 'LULUS' | 'TIDAK LULUS';
  sklNumber?: string;
  updatedAt?: string;
}

export interface SchoolSettings {
  schoolName: string;
  logoUrl?: string; // Full Letterhead
  secondaryLogoUrl?: string; // Simple Logo
  address: string;
  district: string;
  regency: string;
  headmasterName: string;
  headmasterNip: string;
  headmasterIdType?: 'NIP' | 'NPA' | 'NIY' | 'NIK' | string;
  academicYear: string;
  graduationDate: string;
  plenaryDate: string;
  letterNumberTemplate: string;
  signatureStampUrl?: string;
  isCountdownActive?: boolean;
  countdownTargetDate?: string;
  sklFormat: 'FORMAT_1' | 'FORMAT_2';
  f4TopMargin: number; // in cm
  f4BottomMargin?: number;
  f4LeftMargin?: number;
  f4RightMargin?: number;
  printScale?: number; // percentage
}

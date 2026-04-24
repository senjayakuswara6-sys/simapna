export interface Student {
  id?: string;
  name: string;
  birthPlace: string;
  birthDate: string;
  parentName: string;
  nis: string;
  nisn: string;
  className: string;
  subjects: string[];
  averageScore: number;
  status: 'LULUS' | 'TIDAK LULUS';
  sklNumber: string;
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
  academicYear: string;
  graduationDate: string;
  plenaryDate: string;
  letterNumberTemplate: string;
  signatureStampUrl?: string;
}

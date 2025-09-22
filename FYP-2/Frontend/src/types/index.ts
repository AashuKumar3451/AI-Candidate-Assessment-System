
export type UserRole = 'hr' | 'candidate';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // Added phone field
  role: UserRole;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  description: string;
  requiredSkills: string[];
  location: string;
  hrId: string;
  createdAt: string;
}

export interface CV {
  id: string;
  candidateId: string;
  candidateName: string;
  candidateEmail?: string; // Add candidate email field
  jobId: string;
  fileName: string;
  uploadedAt: string;
  score: number;
  classification: string[];
  notes: string;
  isSelectedForTest?: boolean;
  isSelectedForInterview?: boolean;
  isRejectedForTest?: boolean;
  resume?: string | null;
}

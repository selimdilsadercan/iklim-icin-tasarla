export interface StudentData {
  fullName: string;
  className: string; // Original class name for database matching (e.g., "e.6a")
  classNameClean: string; // Clean version for password (e.g., "e6a")
  studentNo: string;
  email: string;
  password: string;
  teacherName?: string; // Teacher name for PDF filename
}

export interface ProcessedFile {
  students: StudentData[];
  errors: string[];
}

export interface ApiUploadResult {
  success: number;
  failed: number;
  errors: Array<{ student: string; error: string }>;
}

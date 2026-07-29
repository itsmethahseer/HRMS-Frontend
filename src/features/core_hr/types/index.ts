export interface Department {
  id: number;
  name: string;
  description?: string;
}

export interface Employee {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_superuser: boolean;
  job_title?: string;
  department_id?: number;
  department?: Department;
  created_at: string;
  profile?: EmployeeProfile;
}

export type GenderEnum = 'male' | 'female' | 'other' | 'prefer_not_to_say';
export type EmploymentTypeEnum = 'full_time' | 'part_time' | 'contract' | 'intern' | 'freelance';
export type EmploymentStatusEnum = 'active' | 'on_leave' | 'terminated' | 'resigned' | 'probation';
export type MaritalStatusEnum = 'single' | 'married' | 'divorced' | 'widowed';

export interface EmergencyContact {
  id: number;
  profile_id: number;
  name: string;
  relation_type: string;
  phone_number: string;
  alternate_phone?: string;
  email?: string;
  address?: string;
}

export interface EmployeeDocument {
  id: number;
  profile_id: number;
  document_type: string;
  document_number?: string;
  file_url?: string;
  expiry_date?: string;
  is_verified: boolean;
  uploaded_at: string;
}

export interface EducationRecord {
  id: number;
  profile_id: number;
  degree: string;
  field_of_study?: string;
  institution: string;
  university?: string;
  start_year?: number;
  end_year?: number;
  grade_or_percentage?: string;
  is_highest: boolean;
}

export interface ExperienceRecord {
  id: number;
  profile_id: number;
  company_name: string;
  job_title: string;
  start_date?: string;
  end_date?: string;
  is_current: boolean;
  description?: string;
  location?: string;
}

export interface EmployeeProfile {
  id: number;
  user_id: number;
  employee_id?: string;
  date_of_birth?: string;
  gender?: GenderEnum;
  marital_status?: MaritalStatusEnum;
  nationality?: string;
  blood_group?: string;
  profile_photo_url?: string;
  phone_number?: string;
  alternate_phone?: string;
  personal_email?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  employment_type?: EmploymentTypeEnum;
  employment_status?: EmploymentStatusEnum;
  date_of_joining?: string;
  date_of_leaving?: string;
  probation_end_date?: string;
  notice_period_days?: number;
  manager_id?: number;
  work_location?: string;
  shift?: string;
  bio?: string;
  linkedin_url?: string;
  skills?: string;
  created_at: string;
  updated_at?: string;
  emergency_contacts: EmergencyContact[];
  documents: EmployeeDocument[];
  education_records: EducationRecord[];
  experience_records: ExperienceRecord[];
}

export interface EmployeeSummary {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  profile_photo_url?: string;
  department?: Department;
}

export interface OrgNode {
  user_id: number;
  first_name: string;
  last_name: string;
  email: string;
  job_title?: string;
  profile_photo_url?: string;
  department?: Department;
  manager_id?: number | null;  // null = root node (CEO etc.)
  employment_status?: string;
  is_active: boolean;
}

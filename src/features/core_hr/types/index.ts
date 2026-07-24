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
  job_title?: string;
  department_id?: number;
  department?: Department;
  created_at: string;
}

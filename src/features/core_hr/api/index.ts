import { apiClient } from '../../../api/apiClient';
import type {
  Department, Employee, EmployeeProfile,
  EmergencyContact, EmployeeDocument, EducationRecord, ExperienceRecord,
  EmployeeSummary, OrgNode
} from '../types';

// ─── Core HR ───────────────────────────────────────────────────────────────

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get('/core/employees/');
  return response.data;
};

export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get('/core/departments/');
  return response.data;
};

export const createDepartment = async (data: {
  name: string;
  description?: string;
}): Promise<Department> => {
  const response = await apiClient.post('/core/departments/', data);
  return response.data;
};

export const createEmployee = async (data: {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  job_title?: string;
  department_id?: number;
  is_superuser?: boolean;
}): Promise<Employee> => {
  const response = await apiClient.post('/core/employees/', data);
  return response.data;
};

// ─── Employee Directory ────────────────────────────────────────────────────

export const getEmployeeDirectory = async (params?: {
  search?: string;
  department_id?: number;
  skip?: number;
  limit?: number;
}): Promise<EmployeeSummary[]> => {
  const response = await apiClient.get('/profiles/directory/all', { params });
  return response.data;
};

export const getDirectReports = async (managerId: number): Promise<EmployeeSummary[]> => {
  const response = await apiClient.get(`/profiles/org-chart/${managerId}`);
  return response.data;
};

// ─── Employee Profile ──────────────────────────────────────────────────────

export const getMyProfile = async (): Promise<EmployeeProfile> => {
  const response = await apiClient.get('/profiles/me');
  return response.data;
};

export const getProfileById = async (profileId: number): Promise<EmployeeProfile> => {
  const response = await apiClient.get(`/profiles/${profileId}`);
  return response.data;
};

export const getProfileByUserId = async (userId: number): Promise<EmployeeProfile> => {
  const response = await apiClient.get(`/profiles/by-user/${userId}`);
  return response.data;
};

export const createProfile = async (data: Partial<EmployeeProfile> & { user_id: number }): Promise<EmployeeProfile> => {
  const response = await apiClient.post('/profiles/', data);
  return response.data;
};

export const updateProfile = async (profileId: number, data: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
  const response = await apiClient.patch(`/profiles/${profileId}`, data);
  return response.data;
};

export const updateMyProfile = async (data: Partial<EmployeeProfile>): Promise<EmployeeProfile> => {
  const response = await apiClient.patch('/profiles/me/update', data);
  return response.data;
};

export const uploadProfilePhoto = async (profileId: number, file: File): Promise<{ profile_photo_url: string }> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await apiClient.post(`/profiles/${profileId}/upload-photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
};

// ─── Emergency Contacts ────────────────────────────────────────────────────

export const addEmergencyContact = async (
  profileId: number,
  data: Omit<EmergencyContact, 'id' | 'profile_id'>
): Promise<EmergencyContact> => {
  const response = await apiClient.post(`/profiles/${profileId}/emergency-contacts`, data);
  return response.data;
};

export const updateEmergencyContact = async (
  profileId: number,
  contactId: number,
  data: Partial<EmergencyContact>
): Promise<EmergencyContact> => {
  const response = await apiClient.patch(`/profiles/${profileId}/emergency-contacts/${contactId}`, data);
  return response.data;
};

export const deleteEmergencyContact = async (profileId: number, contactId: number): Promise<void> => {
  await apiClient.delete(`/profiles/${profileId}/emergency-contacts/${contactId}`);
};

// ─── Documents ────────────────────────────────────────────────────────────

export const addDocument = async (
  profileId: number,
  data: Omit<EmployeeDocument, 'id' | 'profile_id' | 'is_verified' | 'uploaded_at'>
): Promise<EmployeeDocument> => {
  const response = await apiClient.post(`/profiles/${profileId}/documents`, data);
  return response.data;
};

export const updateDocument = async (
  profileId: number,
  docId: number,
  data: Partial<EmployeeDocument>
): Promise<EmployeeDocument> => {
  const response = await apiClient.patch(`/profiles/${profileId}/documents/${docId}`, data);
  return response.data;
};

export const deleteDocument = async (profileId: number, docId: number): Promise<void> => {
  await apiClient.delete(`/profiles/${profileId}/documents/${docId}`);
};

// ─── Education ────────────────────────────────────────────────────────────

export const addEducation = async (
  profileId: number,
  data: Omit<EducationRecord, 'id' | 'profile_id'>
): Promise<EducationRecord> => {
  const response = await apiClient.post(`/profiles/${profileId}/education`, data);
  return response.data;
};

export const updateEducation = async (
  profileId: number,
  eduId: number,
  data: Partial<EducationRecord>
): Promise<EducationRecord> => {
  const response = await apiClient.patch(`/profiles/${profileId}/education/${eduId}`, data);
  return response.data;
};

export const deleteEducation = async (profileId: number, eduId: number): Promise<void> => {
  await apiClient.delete(`/profiles/${profileId}/education/${eduId}`);
};

// ─── Experience ───────────────────────────────────────────────────────────

export const addExperience = async (
  profileId: number,
  data: Omit<ExperienceRecord, 'id' | 'profile_id'>
): Promise<ExperienceRecord> => {
  const response = await apiClient.post(`/profiles/${profileId}/experience`, data);
  return response.data;
};

export const updateExperience = async (
  profileId: number,
  expId: number,
  data: Partial<ExperienceRecord>
): Promise<ExperienceRecord> => {
  const response = await apiClient.patch(`/profiles/${profileId}/experience/${expId}`, data);
  return response.data;
};

export const deleteExperience = async (profileId: number, expId: number): Promise<void> => {
  await apiClient.delete(`/profiles/${profileId}/experience/${expId}`);
};

// ─── Org Chart ────────────────────────────────────────────────────────────

export const getOrgTree = async (): Promise<OrgNode[]> => {
  const response = await apiClient.get('/profiles/org-tree');
  return response.data;
};

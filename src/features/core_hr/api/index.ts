import { apiClient } from '../../../api/apiClient';
import type { Department, Employee } from '../types';

export const getEmployees = async (): Promise<Employee[]> => {
  const response = await apiClient.get('/core/employees/');
  return response.data;
};

export const getDepartments = async (): Promise<Department[]> => {
  const response = await apiClient.get('/core/departments/');
  return response.data;
};

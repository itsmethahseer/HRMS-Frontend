import { apiClient } from '../../../api/apiClient';

export const login = async (data: any) => {
  const response = await apiClient.post('/auth/login', data);
  return response.data;
};

export const registerCompany = async (data: any) => {
  const response = await apiClient.post('/tenants/register', data);
  return response.data;
};

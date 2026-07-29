import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { getEmployees } from '../api';

export const EmployeeList: React.FC = () => {
  const navigate = useNavigate();
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (isLoading) return <div>Loading employees...</div>;
  if (error) return <div>Error loading employees.</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>Employee Directory</h2>
        <button onClick={handleLogout} style={{ padding: '8px 15px', background: '#DC3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>
      <table border={1} cellPadding={10} style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Job Title</th>
            <th>Department</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {employees?.map((employee) => (
            <tr key={employee.id}>
              <td>{employee.first_name} {employee.last_name}</td>
              <td>{employee.email}</td>
              <td>{employee.job_title || 'N/A'}</td>
              <td>{employee.department?.name || 'Unassigned'}</td>
              <td>{employee.is_active ? 'Active' : 'Inactive'}</td>
            </tr>
          ))}
          {employees?.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center' }}>No employees found.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getEmployees } from '../api';

export const EmployeeList: React.FC = () => {
  const { data: employees, isLoading, error } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
  });

  if (isLoading) return <div>Loading employees...</div>;
  if (error) return <div>Error loading employees.</div>;

  return (
    <div>
      <h2>Employee Directory</h2>
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

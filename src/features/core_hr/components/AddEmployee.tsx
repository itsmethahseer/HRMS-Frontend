import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { createEmployee, getDepartments } from '../api';
import type { Department } from '../types';

export const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    job_title: '',
    department_id: '',
    is_superuser: false,
  });

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  const createMutation = useMutation({
    mutationFn: () => createEmployee({
      ...form,
      department_id: form.department_id ? parseInt(form.department_id) : undefined,
    }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-directory'] });
      navigate(`/employees/${data.id}`);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create employee.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    createMutation.mutate();
  };

  return (
    <Layout
      breadcrumb={[{ label: 'Employees' }, { label: 'Add Employee' }]}
      actions={
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employees')}>← Cancel</button>
      }
    >
      <div style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Add New Employee</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
            Create an employee account. They can log in using the company name + their email + password.
          </p>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Employee Details</span></div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">First Name *</label>
                  <input
                    className="form-input"
                    placeholder="John"
                    value={form.first_name}
                    onChange={e => setForm(f => ({ ...f, first_name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Last Name *</label>
                  <input
                    className="form-input"
                    placeholder="Doe"
                    value={form.last_name}
                    onChange={e => setForm(f => ({ ...f, last_name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Email */}
              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="john.doe@company.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                />
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Temporary Password *</label>
                <input
                  type="password"
                  className="form-input"
                  placeholder="Employee will use this to login"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                />
                <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Share this with the employee. They can update their profile after logging in.
                </p>
              </div>

              <hr className="divider" />

              {/* Job Info */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Job Title</label>
                  <input
                    className="form-input"
                    placeholder="Software Engineer"
                    value={form.job_title}
                    onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={form.department_id}
                    onChange={e => setForm(f => ({ ...f, department_id: e.target.value }))}
                  >
                    <option value="">No department</option>
                    {departments?.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Role */}
              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={form.is_superuser}
                    onChange={e => setForm(f => ({ ...f, is_superuser: e.target.checked }))}
                  />
                  <div>
                    <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      ⭐ Grant Administrator Access
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      Admins can manage all employees, departments, and settings
                    </div>
                  </div>
                </label>
              </div>

              {error && (
                <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? 'Creating...' : '✓ Create Employee'}
                </button>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => navigate('/employees')}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Info tip */}
        <div style={{ marginTop: '16px', padding: '14px', background: 'var(--accent-bg)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 'var(--radius-md)', fontSize: '13px', color: 'var(--text-secondary)' }}>
          💡 After creating the employee, you'll be taken to their profile where you can fill in extended details like personal info, address, emergency contacts, documents, and work history.
        </div>
      </div>
    </Layout>
  );
};

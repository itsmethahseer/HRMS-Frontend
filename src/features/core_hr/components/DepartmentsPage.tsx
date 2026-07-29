import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { getDepartments, getEmployees, createDepartment } from '../api';
import { getCurrentUser } from '../../../utils/auth';
import type { Department, Employee } from '../types';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

function AvatarSmall({ name, photoUrl }: { name: string; photoUrl?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (photoUrl) {
    return <img src={`${API_BASE}${photoUrl}`} alt={name} className="avatar avatar-sm" style={{ width: 28, height: 28 }} />;
  }
  return <div className="avatar-placeholder avatar-sm" style={{ width: 28, height: 28, fontSize: 10 }}>{initials}</div>;
}

export const DepartmentsPage: React.FC = () => {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.isAdmin ?? false;

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');

  // Fetch departments
  const { data: departments, isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  // Fetch employees to show assignment counts & members list
  const { data: employees, isLoading: employeesLoading } = useQuery<Employee[]>({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: true, // Visible to all users so they can see members
  });

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: createDepartment,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['departments'] });
      setForm({ name: '', description: '' });
      setShowAdd(false);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Failed to create department.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.name.trim()) return;
    createMutation.mutate(form);
  };

  // Group employees by department
  const employeesByDept = React.useMemo(() => {
    const map: Record<number, Employee[]> = {};
    employees?.forEach(emp => {
      if (emp.department_id) {
        if (!map[emp.department_id]) map[emp.department_id] = [];
        map[emp.department_id].push(emp);
      }
    });
    return map;
  }, [employees]);

  const isLoading = deptsLoading || employeesLoading;

  return (
    <Layout
      breadcrumb={[{ label: 'HR' }, { label: 'Departments' }]}
      actions={
        isAdmin && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? 'Hide Panel' : '+ Create Department'}
          </button>
        )
      }
    >
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Departments</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Manage your organization structure and view department teams.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: showAdd ? '1fr 340px' : '1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Department List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isLoading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading departments...</span>
            </div>
          ) : !departments?.length ? (
            <div className="empty-state">
              <div className="empty-icon">🏢</div>
              <div className="empty-title">No departments created yet</div>
              <p>Add departments to organize your workforce and hierarchy.</p>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" style={{ marginTop: '12px' }} onClick={() => setShowAdd(true)}>
                  Create First Department
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
              {departments.map(dept => {
                const members = employeesByDept[dept.id] || [];
                return (
                  <div className="card animate-fade-in" key={dept.id} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div style={{ padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                          🏢 {dept.name}
                        </h3>
                        <span className="badge badge-accent">
                          {members.length} {members.length === 1 ? 'member' : 'members'}
                        </span>
                      </div>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                        {dept.description || 'No description provided.'}
                      </p>

                      {members.length > 0 && (
                        <div>
                          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                            Team Members
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                            {members.map(emp => (
                              <div
                                key={emp.id}
                                onClick={() => navigate(`/employees/${emp.id}`)}
                                style={{
                                  display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px',
                                  borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)',
                                  cursor: 'pointer', transition: 'background 0.15s'
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'var(--border)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-elevated)'}
                              >
                                <AvatarSmall name={`${emp.first_name} ${emp.last_name}`} photoUrl={emp.profile?.profile_photo_url} />
                                <div style={{ minWidth: 0, flex: 1 }}>
                                  <div style={{ fontSize: '12.5px', fontWeight: 500, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {emp.first_name} {emp.last_name}
                                  </div>
                                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {emp.job_title || 'Employee'}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Side Panel: Create Department */}
        {showAdd && (
          <div className="card animate-slide-up" style={{ position: 'sticky', top: '24px' }}>
            <div className="card-header">
              <span className="card-title">New Department</span>
            </div>
            <div className="card-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Department Name *</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Engineering, Sales"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Brief description of department scope..."
                    style={{ height: '100px' }}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  />
                </div>

                {error && (
                  <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={createMutation.isPending}
                    style={{ flex: 1 }}
                  >
                    {createMutation.isPending ? 'Creating...' : '✓ Create'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowAdd(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

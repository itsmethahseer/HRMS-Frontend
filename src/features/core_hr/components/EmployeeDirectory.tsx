import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { getEmployees, getEmployeeDirectory, getDepartments } from '../api';
import type { Department, EmployeeSummary } from '../types';
import { getCurrentUser } from '../../../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

function AvatarOrPhoto({ name, photoUrl, size = 'md' }: { name: string; photoUrl?: string; size?: string }) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (photoUrl) {
    return <img src={`${API_BASE}${photoUrl}`} alt={name} className={`avatar avatar-${size}`} />;
  }
  return <div className={`avatar-placeholder avatar-${size}`}>{initials}</div>;
}

type ViewMode = 'grid' | 'list';

export const EmployeeDirectory: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.isAdmin ?? false;

  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<number | undefined>();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
  });

  // Admin: use /core/employees (always reliable, shows everyone even without a profile)
  // Employee: use /profiles/directory/all (searchable, has photo URLs)
  const { data: allEmployees } = useQuery({
    queryKey: ['employees'],
    queryFn: getEmployees,
    enabled: isAdmin,
  });

  const { data: profileDirectory, isLoading: profileLoading, error: profileError } = useQuery<EmployeeSummary[]>({
    queryKey: ['employee-directory', search, departmentFilter],
    queryFn: () => getEmployeeDirectory({ search: search || undefined, department_id: departmentFilter }),
    enabled: !isAdmin,
    placeholderData: (prev) => prev,
  });

  // Build the display list based on role
  const directory: EmployeeSummary[] | undefined = isAdmin
    ? allEmployees
        ?.filter(e => {
          const q = search.toLowerCase();
          if (!q) return true;
          return (
            e.first_name.toLowerCase().includes(q) ||
            e.last_name.toLowerCase().includes(q) ||
            e.email.toLowerCase().includes(q) ||
            (e.job_title ?? '').toLowerCase().includes(q)
          );
        })
        .filter(e => !departmentFilter || e.department_id === departmentFilter)
        .map(e => ({
          id: e.id,
          first_name: e.first_name,
          last_name: e.last_name,
          email: e.email,
          job_title: e.job_title,
          profile_photo_url: e.profile?.profile_photo_url,
          department: e.department,
        }))
    : profileDirectory;

  const isLoading = isAdmin ? !allEmployees && !search : profileLoading;
  const error = isAdmin ? null : profileError;

  const stats = [
    { label: 'Total Employees', value: allEmployees?.length ?? '—', icon: '👥', color: '#6366f1', bg: 'rgba(99,102,241,0.12)' },
    { label: 'Active',          value: allEmployees?.filter(e => e.is_active).length ?? '—', icon: '✅', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
    { label: 'Departments',     value: departments?.length ?? '—', icon: '🏢', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: 'Admins',          value: allEmployees?.filter(e => e.is_superuser).length ?? '—', icon: '⭐', color: '#a855f7', bg: 'rgba(168,85,247,0.12)' },
  ];

  return (
    <Layout
      breadcrumb={[{ label: 'HR' }, { label: 'Employees' }]}
      actions={
        isAdmin ? (
          <button className="btn btn-primary btn-sm" onClick={() => navigate('/employees/add')}>
            + Add Employee
          </button>
        ) : undefined
      }
    >
      {/* Stat row — admin only */}
      {isAdmin && (
        <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
          {stats.map((s) => (
            <div className="stat-card" key={s.label}>
              <div className="stat-icon" style={{ background: s.bg, color: s.color }}>{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Employee Directory</span>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            {/* View toggle */}
            <div style={{ display: 'flex', background: 'var(--bg-elevated)', borderRadius: 'var(--radius-sm)', padding: '3px', border: '1px solid var(--border)' }}>
              {(['grid', 'list'] as ViewMode[]).map(v => (
                <button
                  key={v}
                  onClick={() => setViewMode(v)}
                  style={{
                    padding: '4px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer',
                    fontSize: '12px', fontWeight: 500, fontFamily: 'var(--font)',
                    background: viewMode === v ? 'var(--accent)' : 'transparent',
                    color: viewMode === v ? 'white' : 'var(--text-muted)',
                    transition: 'all 0.15s',
                  }}
                >
                  {v === 'grid' ? '⊞ Grid' : '☰ List'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', display: 'flex', gap: '12px' }}>
          <div className="search-wrap" style={{ flex: 1 }}>
            <span className="search-icon">🔍</span>
            <input
              className="form-input"
              placeholder="Search by name, email or job title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select
            className="form-select"
            style={{ width: '200px' }}
            value={departmentFilter ?? ''}
            onChange={e => setDepartmentFilter(e.target.value ? Number(e.target.value) : undefined)}
          >
            <option value="">All Departments</option>
            {departments?.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div style={{ padding: '22px' }}>
          {isLoading ? (
            <div className="loading-center">
              <div className="spinner" />
              <span style={{ color: 'var(--text-muted)', fontSize: '13px' }}>Loading employees...</span>
            </div>
          ) : error ? (
            <div className="empty-state">
              <div className="empty-icon">⚠️</div>
              <div className="empty-title">Failed to load employees</div>
              <p>Check your connection and try again.</p>
            </div>
          ) : !directory?.length ? (
            <div className="empty-state">
              <div className="empty-icon">👥</div>
              <div className="empty-title">No employees found</div>
              <p>{search ? 'Try a different search term.' : 'Start by adding your first employee.'}</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid-cols-4" style={{ gap: '14px' }}>
              {directory.map(emp => (
                <div
                  key={emp.id}
                  className="employee-card animate-fade-in"
                  onClick={() => navigate(`/employees/${emp.id}`)}
                >
                  <AvatarOrPhoto name={`${emp.first_name} ${emp.last_name}`} photoUrl={emp.profile_photo_url} size="lg" />
                  <div className="employee-card-name">{emp.first_name} {emp.last_name}</div>
                  <div className="employee-card-title">{emp.job_title || 'No title'}</div>
                  {emp.department && <div className="employee-card-dept">{emp.department.name}</div>}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{emp.email}</div>
                </div>
              ))}
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Job Title</th>
                  <th>Department</th>
                  <th>Email</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {directory.map(emp => (
                  <tr key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <AvatarOrPhoto name={`${emp.first_name} ${emp.last_name}`} photoUrl={emp.profile_photo_url} size="sm" />
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{emp.first_name} {emp.last_name}</span>
                      </div>
                    </td>
                    <td>{emp.job_title || '—'}</td>
                    <td>
                      {emp.department
                        ? <span className="badge badge-accent">{emp.department.name}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td>{emp.email}</td>
                    <td>
                      <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); navigate(`/employees/${emp.id}`); }}>
                        View →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  );
};

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link, Navigate } from 'react-router-dom';
import { login } from '../api';
import { saveCurrentUser, getCurrentUser } from '../../../utils/auth';

export const Login: React.FC = () => {
  const navigate = useNavigate();
  const existingUser = getCurrentUser();

  // Already logged in → send to right page
  if (existingUser && localStorage.getItem('token')) {
    return existingUser.isAdmin
      ? <Navigate to="/employees" replace />
      : <Navigate to={`/employees/${existingUser.userId}`} replace />;
  }

  const [form, setForm] = useState({ company_name: '', email: '', password: '' });
  const [error, setError] = useState('');

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      // Save everything from the login response
      saveCurrentUser({
        access_token: data.access_token,
        user_id: data.user_id,
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        is_superuser: data.is_superuser,
        schema_name: data.schema_name,
        company_name: form.company_name,
      });

      // Admin → directory | Employee → own profile
      if (data.is_superuser) {
        navigate('/employees');
      } else {
        navigate(`/employees/${data.user_id}`);
      }
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Invalid credentials. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate(form);
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">
        <div className="auth-logo">
          <div className="logo-icon">H</div>
          <div>
            <div className="logo-name">HRMS</div>
            <div className="logo-sub">Human Resource Management</div>
          </div>
        </div>

        <div className="auth-title">Welcome back</div>
        <div className="auth-subtitle">Sign in to your workspace to continue</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Company Workspace</label>
            <input
              className="form-input"
              placeholder="Your company name"
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="you@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%' }}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          New to HRMS?{' '}
          <Link to="/register" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>
            Register your company
          </Link>
        </p>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { registerCompany } from '../api';

export const RegisterCompany: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    company_name: '',
    admin_first_name: '',
    admin_last_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const registerMutation = useMutation({
    mutationFn: registerCompany,
    onSuccess: () => {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    },
    onError: (err: any) => {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    registerMutation.mutate(form);
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card animate-slide-up" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '60px', marginBottom: '16px' }}>🎉</div>
          <h2>Company Registered!</h2>
          <p style={{ marginTop: '8px', marginBottom: '20px' }}>Your workspace is ready. Redirecting to login...</p>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up" style={{ maxWidth: '500px' }}>
        <div className="auth-logo">
          <div className="logo-icon">H</div>
          <div>
            <div className="logo-name">HRMS</div>
            <div className="logo-sub">Register Your Company</div>
          </div>
        </div>

        <div className="auth-title">Set up your workspace</div>
        <div className="auth-subtitle">Create your company and admin account to get started</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Company Name</label>
            <input
              className="form-input"
              placeholder="Acme Corp"
              value={form.company_name}
              onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input
                className="form-input"
                placeholder="John"
                value={form.admin_first_name}
                onChange={e => setForm(f => ({ ...f, admin_first_name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input
                className="form-input"
                placeholder="Doe"
                value={form.admin_last_name}
                onChange={e => setForm(f => ({ ...f, admin_last_name: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@yourcompany.com"
              value={form.admin_email}
              onChange={e => setForm(f => ({ ...f, admin_email: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Min 8 characters"
              value={form.admin_password}
              onChange={e => setForm(f => ({ ...f, admin_password: e.target.value }))}
              required
            />
          </div>

          {error && (
            <div style={{ background: 'var(--danger-bg)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', padding: '10px 13px', fontSize: '13px', color: 'var(--danger)', marginBottom: '14px' }}>
              ⚠️ {error}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={registerMutation.isPending}>
            {registerMutation.isPending ? 'Creating workspace...' : 'Create Workspace →'}
          </button>
        </form>

        <div className="auth-divider">or</div>
        <p style={{ textAlign: 'center', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
          Already have a workspace?{' '}
          <Link to="/login" style={{ color: 'var(--accent-light)', fontWeight: 500 }}>Sign in here</Link>
        </p>
      </div>
    </div>
  );
};

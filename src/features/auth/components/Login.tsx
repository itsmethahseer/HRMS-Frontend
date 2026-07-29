import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { login } from '../api';

export const Login: React.FC = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: (data) => {
      localStorage.setItem('token', data.access_token);
      alert(`Logged in successfully! Welcome to ${data.schema_name} schema`);
      navigate('/dashboard');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Login failed');
    }
  });

  const onSubmit = (data: any) => {
    loginMutation.mutate(data);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Sign In to Your Workspace</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Company Name (Workspace):</label><br />
          <input {...register('company_name')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Email Address:</label><br />
          <input type="email" {...register('email')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Password:</label><br />
          <input type="password" {...register('password')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" disabled={loginMutation.isPending} style={{ padding: '10px', background: '#007BFF', color: 'white', border: 'none', borderRadius: '4px' }}>
          {loginMutation.isPending ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        New company? <Link to="/register">Register here</Link>
      </p>
    </div>
  );
};

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { registerCompany } from '../api';

export const RegisterCompany: React.FC = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();

  const registerMutation = useMutation({
    mutationFn: registerCompany,
    onSuccess: () => {
      alert('Company registered successfully! You can now log in.');
      navigate('/login');
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || 'Registration failed');
    }
  });

  const onSubmit = (data: any) => {
    registerMutation.mutate(data);
  };

  return (
    <div style={{ maxWidth: '400px', margin: '50px auto', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h2>Register Your Company</h2>
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label>Company Name:</label><br />
          <input {...register('company_name')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Admin First Name:</label><br />
          <input {...register('admin_first_name')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Admin Last Name:</label><br />
          <input {...register('admin_last_name')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Admin Email:</label><br />
          <input type="email" {...register('admin_email')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <div>
          <label>Admin Password:</label><br />
          <input type="password" {...register('admin_password')} required style={{ width: '100%', padding: '8px' }} />
        </div>
        <button type="submit" disabled={registerMutation.isPending} style={{ padding: '10px', background: '#28A745', color: 'white', border: 'none', borderRadius: '4px' }}>
          {registerMutation.isPending ? 'Registering...' : 'Register Company'}
        </button>
      </form>
      <p style={{ marginTop: '15px', textAlign: 'center' }}>
        Already have an account? <Link to="/login">Login here</Link>
      </p>
    </div>
  );
};

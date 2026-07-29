import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import React from 'react';
import { Login } from './features/auth/components/Login';
import { RegisterCompany } from './features/auth/components/RegisterCompany';
import { EmployeeDirectory } from './features/core_hr/components/EmployeeDirectory';
import { EmployeeProfilePage } from './features/core_hr/components/EmployeeProfilePage';
import { AddEmployee } from './features/core_hr/components/AddEmployee';
import { OrgChart } from './features/core_hr/components/OrgChart';
import { DepartmentsPage } from './features/core_hr/components/DepartmentsPage';
import { getCurrentUser, clearCurrentUser } from './utils/auth';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

function isTokenValid(): boolean {
  const token = localStorage.getItem('token');
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    // exp is in seconds, Date.now() is ms
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

function PrivateRoute({ children }: { children: React.ReactNode }) {
  if (!isTokenValid()) {
    clearCurrentUser();
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const user = getCurrentUser();
  if (!isTokenValid()) {
    clearCurrentUser();
    return <Navigate to="/login" replace />;
  }
  if (!user?.isAdmin) return <Navigate to={`/employees/${user?.userId}`} replace />;
  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterCompany />} />

          {/* All authenticated users — directory is visible to everyone */}
          <Route path="/dashboard"  element={<PrivateRoute><EmployeeDirectory /></PrivateRoute>} />
          <Route path="/employees"  element={<PrivateRoute><EmployeeDirectory /></PrivateRoute>} />
          <Route path="/employees/:userId" element={<PrivateRoute><EmployeeProfilePage /></PrivateRoute>} />
          <Route path="/org-chart" element={<PrivateRoute><OrgChart /></PrivateRoute>} />

          {/* Admin only */}
          <Route path="/employees/add" element={<AdminRoute><AddEmployee /></AdminRoute>} />
          <Route path="/departments" element={<AdminRoute><DepartmentsPage /></AdminRoute>} />

          {/* My Profile shortcut */}
          <Route path="/profile/me" element={<PrivateRoute><MyProfileRedirect /></PrivateRoute>} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

function MyProfileRedirect() {
  const user = getCurrentUser();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={`/employees/${user.userId}`} replace />;
}

export default App;

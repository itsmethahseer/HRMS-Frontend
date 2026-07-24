import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Login } from './features/auth/components/Login';
import { RegisterCompany } from './features/auth/components/RegisterCompany';
import { EmployeeList } from './features/core_hr/components/EmployeeList';
import './App.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <div className="App">
          <header>
            <h1 style={{ textAlign: 'center', padding: '10px 0', borderBottom: '1px solid #eee' }}>HRMS Workspace</h1>
          </header>
          <main style={{ padding: '20px' }}>
            <Routes>
              <Route path="/" element={<Navigate to="/login" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<RegisterCompany />} />
              <Route path="/dashboard" element={<EmployeeList />} />
            </Routes>
          </main>
        </div>
      </Router>
    </QueryClientProvider>
  );
}

export default App;

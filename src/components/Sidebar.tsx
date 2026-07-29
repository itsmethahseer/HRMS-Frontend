import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getCurrentUser, clearCurrentUser } from '../utils/auth';

export const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getCurrentUser();

  const isAdmin = user?.isAdmin ?? false;
  const myUserId = user?.userId;

  const handleLogout = () => {
    clearCurrentUser();
    navigate('/login');
  };

  interface NavItem { icon: string; label: string; path: string; adminOnly?: boolean; }

  const navItems: NavItem[] = [
    // Admin-only items
    { icon: '⊞', label: 'Dashboard',   path: '/employees',       adminOnly: true },
    { icon: '👥', label: 'All Employees', path: '/employees',    adminOnly: true },
    { icon: '🏢', label: 'Departments', path: '/departments',    adminOnly: true },
    { icon: '➕', label: 'Add Employee', path: '/employees/add', adminOnly: true },

    // All users
    { icon: '🌳', label: 'Org Chart',   path: '/org-chart' },
    { icon: '👤', label: 'My Profile',  path: `/employees/${myUserId}` },
  ];

  const comingSoon = [
    { icon: '📅', label: 'Attendance' },
    { icon: '🌴', label: 'Leave'      },
    { icon: '💰', label: 'Payroll'    },
    { icon: '📊', label: 'Reports'    },
  ];

  const visibleNav = navItems.filter(item => !item.adminOnly || isAdmin);

  const isActive = (path: string) =>
    location.pathname === path || (path !== '/employees' && location.pathname.startsWith(path + '/'));

  const fullName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : 'User';
  const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-brand">
        <div className="brand-icon">H</div>
        <div>
          <div className="brand-name">HRMS</div>
          <div className="brand-sub">{user?.companyName || 'Workspace'}</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section-label">{isAdmin ? 'Admin Panel' : 'My Space'}</div>

        {visibleNav.map((item) => (
          <button
            key={item.path}
            className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: '16px' }}>Coming Soon</div>
        {comingSoon.map((item) => (
          <button key={item.label} className="nav-item" style={{ opacity: 0.35, cursor: 'not-allowed' }} disabled>
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* User footer */}
      <div className="sidebar-footer">
        <div style={{
          display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px',
          padding: '8px', borderRadius: 'var(--radius-sm)', background: 'var(--bg-elevated)'
        }}>
          <div className="avatar-placeholder avatar-sm">{initials}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {fullName}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {isAdmin ? '⭐ Administrator' : '👤 Employee'}
            </div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={handleLogout}>
          🚪 Sign Out
        </button>
      </div>
    </aside>
  );
};

import React from 'react';
import { Sidebar } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  breadcrumb?: { label: string; path?: string }[];
  title?: string;
  actions?: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children, breadcrumb, title, actions }) => {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-content">
        {/* Top Header */}
        <header className="top-header">
          <div className="header-left">
            {breadcrumb && (
              <nav className="breadcrumb">
                {breadcrumb.map((crumb, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <span>›</span>}
                    <span className={i === breadcrumb.length - 1 ? 'crumb-active' : ''}>
                      {crumb.label}
                    </span>
                  </React.Fragment>
                ))}
              </nav>
            )}
          </div>
          <div className="header-right">
            {actions}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </div>
          </div>
        </header>

        {/* Page Body */}
        <main className="page-body">
          {title && (
            <div className="section-header" style={{ marginBottom: '24px' }}>
              <h1 style={{ fontSize: '22px', margin: 0 }}>{title}</h1>
            </div>
          )}
          {children}
        </main>
      </div>
    </div>
  );
};

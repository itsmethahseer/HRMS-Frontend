import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import { getOrgTree } from '../api';
import type { OrgNode } from '../types';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

// ─── Tree Node interface ────────────────────────────────────────────────────
interface TreeNode extends OrgNode {
  children: TreeNode[];
  depth: number;
}

// ─── Build tree from flat list ──────────────────────────────────────────────
function buildTree(nodes: OrgNode[]): TreeNode[] {
  const map = new Map<number, TreeNode>();

  // First pass: create all nodes
  nodes.forEach(n => map.set(n.user_id, { ...n, children: [], depth: 0 }));

  const roots: TreeNode[] = [];

  // Second pass: link children to parents
  nodes.forEach(n => {
    const node = map.get(n.user_id)!;
    if (n.manager_id && map.has(n.manager_id)) {
      const parent = map.get(n.manager_id)!;
      node.depth = parent.depth + 1;
      parent.children.push(node);
    } else {
      // No manager or manager not in system = root
      roots.push(node);
    }
  });

  return roots;
}

// ─── Avatar ─────────────────────────────────────────────────────────────────
function NodeAvatar({ node, size = 48 }: { node: OrgNode; size?: number }) {
  const initials = `${node.first_name[0]}${node.last_name[0]}`.toUpperCase();
  if (node.profile_photo_url) {
    return (
      <img
        src={`${API_BASE}${node.profile_photo_url}`}
        alt={node.first_name}
        style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
      />
    );
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      background: 'linear-gradient(135deg, var(--accent), #a855f7)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'white', fontWeight: 700, fontSize: size * 0.33,
    }}>
      {initials}
    </div>
  );
}

// ─── Dept color map ──────────────────────────────────────────────────────────
const DEPT_COLORS = [
  '#6366f1', '#a855f7', '#06b6d4', '#22c55e',
  '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6'
];
function getDeptColor(name?: string): string {
  if (!name) return '#6366f1';
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return DEPT_COLORS[Math.abs(hash) % DEPT_COLORS.length];
}

// ─── Single card node ────────────────────────────────────────────────────────
function OrgCard({ node, navigate }: { node: TreeNode; navigate: (path: string) => void }) {
  const deptColor = getDeptColor(node.department?.name);
  const isRoot = !node.manager_id;
  const cardSize = isRoot ? 'lg' : node.depth === 1 ? 'md' : 'sm';

  const sizes = {
    lg: { card: 180, avatar: 64, name: 15, title: 12 },
    md: { card: 156, avatar: 52, name: 14, title: 12 },
    sm: { card: 144, avatar: 44, name: 13, title: 11 },
  };
  const s = sizes[cardSize];

  return (
    <div
      onClick={() => navigate(`/employees/${node.user_id}`)}
      style={{
        width: s.card,
        background: 'var(--bg-surface)',
        border: `1px solid var(--border)`,
        borderTop: `3px solid ${deptColor}`,
        borderRadius: 'var(--radius-md)',
        padding: '14px 12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        transition: 'all 0.18s',
        position: 'relative',
        boxShadow: isRoot ? '0 4px 24px rgba(99,102,241,0.2)' : 'var(--shadow-sm)',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = deptColor;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-3px)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 8px 24px rgba(0,0,0,0.4)`;
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLDivElement).style.borderTopColor = deptColor;
        (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)';
        (e.currentTarget as HTMLDivElement).style.boxShadow = isRoot ? '0 4px 24px rgba(99,102,241,0.2)' : 'var(--shadow-sm)';
      }}
    >
      {/* Crown for root */}
      {isRoot && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', fontSize: 20 }}>
          👑
        </div>
      )}

      <NodeAvatar node={node} size={s.avatar} />

      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontSize: s.name, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.3, marginBottom: 2 }}>
          {node.first_name} {node.last_name}
        </div>
        <div style={{ fontSize: s.title, color: 'var(--text-muted)', lineHeight: 1.3 }}>
          {node.job_title || 'No title'}
        </div>
      </div>

      {node.department && (
        <div style={{
          background: `${deptColor}22`,
          color: deptColor,
          border: `1px solid ${deptColor}44`,
          borderRadius: 99,
          fontSize: 10,
          fontWeight: 600,
          padding: '2px 8px',
          maxWidth: '100%',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {node.department.name}
        </div>
      )}

      {node.children.length > 0 && (
        <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
          {node.children.length} direct report{node.children.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

// ─── Recursive tree renderer ─────────────────────────────────────────────────
function OrgLevel({
  nodes,
  navigate,
  isRoot = false,
}: {
  nodes: TreeNode[];
  navigate: (path: string) => void;
  isRoot?: boolean;
}) {
  if (nodes.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {/* Row of cards at this level */}
      <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', flexWrap: 'wrap', justifyContent: 'center' }}>
        {nodes.map(node => (
          <div key={node.user_id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {/* The card */}
            <OrgCard node={node} navigate={navigate} />

            {/* Connector + children */}
            {node.children.length > 0 && (
              <>
                {/* Vertical line down from this card */}
                <div style={{ width: 2, height: 28, background: 'var(--border)' }} />

                {/* Children sub-tree */}
                <div style={{ position: 'relative' }}>
                  {/* Horizontal bar connecting children */}
                  {node.children.length > 1 && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      width: `calc(100% - 90px)`,
                      height: 2,
                      background: 'var(--border)',
                    }} />
                  )}
                  <OrgLevel nodes={node.children} navigate={navigate} />
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export const OrgChart: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);

  const { data: nodes, isLoading, error } = useQuery<OrgNode[]>({
    queryKey: ['org-tree'],
    queryFn: getOrgTree,
  });

  const filteredNodes = useMemo(() => {
    if (!nodes) return [];
    if (!search.trim()) return nodes;
    const q = search.toLowerCase();
    return nodes.filter(n =>
      n.first_name.toLowerCase().includes(q) ||
      n.last_name.toLowerCase().includes(q) ||
      (n.job_title ?? '').toLowerCase().includes(q) ||
      (n.department?.name ?? '').toLowerCase().includes(q)
    );
  }, [nodes, search]);

  const tree = useMemo(() => buildTree(filteredNodes), [filteredNodes]);

  // Stats
  const totalCount = nodes?.length ?? 0;
  const deptSet = new Set(nodes?.map(n => n.department?.name).filter(Boolean));
  const rootCount = tree.length;

  return (
    <Layout
      breadcrumb={[{ label: 'HR' }, { label: 'Org Chart' }]}
      actions={
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={() => setZoomLevel(z => Math.max(0.4, z - 0.1))}
            title="Zoom out"
          >🔍−</button>
          <span style={{ fontSize: 12, color: 'var(--text-muted)', minWidth: 36, textAlign: 'center' }}>
            {Math.round(zoomLevel * 100)}%
          </span>
          <button
            className="btn btn-secondary btn-sm btn-icon"
            onClick={() => setZoomLevel(z => Math.min(1.5, z + 0.1))}
            title="Zoom in"
          >🔍+</button>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setZoomLevel(1)}
          >Reset</button>
        </div>
      }
    >
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', marginBottom: '4px' }}>Organisation Chart</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
          Visual hierarchy of your organisation — {totalCount} employees · {deptSet.size} departments · {rootCount} top-level
        </p>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <div className="search-wrap" style={{ maxWidth: 320 }}>
          <span className="search-icon">🔍</span>
          <input
            className="form-input"
            placeholder="Search by name, title, or department..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        {search && (
          <button className="btn btn-ghost btn-sm" onClick={() => setSearch('')}>✕ Clear</button>
        )}
      </div>

      {/* Legend */}
      {!isLoading && nodes && nodes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
          {[...deptSet].map(dept => (
            <div key={dept} style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--bg-surface)', border: '1px solid var(--border)',
              borderRadius: 99, padding: '3px 10px', fontSize: 12,
            }}>
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                background: getDeptColor(dept),
              }} />
              <span style={{ color: 'var(--text-secondary)' }}>{dept}</span>
            </div>
          ))}
        </div>
      )}

      {/* Chart area */}
      <div
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'auto',
          padding: '40px 24px',
          minHeight: 400,
        }}
      >
        {isLoading ? (
          <div className="loading-center">
            <div className="spinner" />
            <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>Building org chart...</span>
          </div>
        ) : error ? (
          <div className="empty-state">
            <div className="empty-icon">⚠️</div>
            <div className="empty-title">Failed to load org chart</div>
            <p>Make sure employees have profiles with manager assignments.</p>
          </div>
        ) : tree.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🌳</div>
            <div className="empty-title">
              {search ? 'No results found' : 'No org hierarchy set up yet'}
            </div>
            <p>
              {search
                ? 'Try a different search term.'
                : 'Go to an employee\'s profile → Employment tab → set their Manager to build the hierarchy.'}
            </p>
          </div>
        ) : (
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s ease',
              paddingBottom: `${(1 - zoomLevel) * 200}px`,
            }}
          >
            {/* Unassigned fallback: show all employees if no manager links */}
            {tree.every(n => !n.manager_id && n.children.length === 0) ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: 28 }}>
                  <div style={{
                    display: 'inline-block',
                    background: 'var(--warning-bg)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: '8px 16px',
                    fontSize: 12.5,
                    color: 'var(--warning)',
                  }}>
                    ℹ️ No manager relationships set. Assign managers in employee profiles to build the tree.
                  </div>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
                  {tree.map(node => (
                    <OrgCard key={node.user_id} node={node} navigate={navigate} />
                  ))}
                </div>
              </div>
            ) : (
              <OrgLevel nodes={tree} navigate={navigate} isRoot />
            )}
          </div>
        )}
      </div>

      {/* Help tip */}
      <div style={{ marginTop: 16, fontSize: 12.5, color: 'var(--text-muted)', textAlign: 'center' }}>
        💡 Click any card to view the employee's full profile · Use zoom controls to resize · Assign a manager in an employee's Employment tab to place them in the hierarchy
      </div>
    </Layout>
  );
};

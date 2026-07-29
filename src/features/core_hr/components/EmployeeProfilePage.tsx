import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../../../components/Layout';
import {
  getEmployees, getProfileByUserId, createProfile, updateProfile,
  uploadProfilePhoto, addEmergencyContact, deleteEmergencyContact,
  addEducation, deleteEducation, addExperience, deleteExperience,
  addDocument, deleteDocument, getDepartments
} from '../api';
import type {
  Employee, EmployeeProfile, Department,
  EmergencyContact, EducationRecord, ExperienceRecord, EmployeeDocument
} from '../types';
import { getCurrentUser } from '../../../utils/auth';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:8000';

// ─── Avatar Component ───────────────────────────────────────────────────────
function AvatarOrPhoto({
  name, photoUrl, size = 'xl', editable, onUpload
}: {
  name: string; photoUrl?: string; size?: string;
  editable?: boolean; onUpload?: (file: File) => void;
}) {
  const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {photoUrl
        ? <img src={`${API_BASE}${photoUrl}`} alt={name} className={`avatar avatar-${size}`} />
        : <div className={`avatar-placeholder avatar-${size}`}>{initials}</div>
      }
      {editable && (
        <>
          <button
            onClick={() => inputRef.current?.click()}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: 'var(--accent)', border: '2px solid var(--bg-surface)',
              color: 'white', fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >📷</button>
          <input
            ref={inputRef} type="file" accept="image/*" hidden
            onChange={e => { if (e.target.files?.[0] && onUpload) onUpload(e.target.files[0]); }}
          />
        </>
      )}
    </div>
  );
}

// ─── Info Row ───────────────────────────────────────────────────────────────
function InfoItem({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="info-item">
      <div className="info-label">{label}</div>
      <div className={`info-value ${!value ? 'empty' : ''}`}>{value ?? 'Not provided'}</div>
    </div>
  );
}

// ─── STATUS BADGE ───────────────────────────────────────────────────────────
function StatusBadge({ status }: { status?: string }) {
  const map: Record<string, string> = {
    active: 'badge-success', on_leave: 'badge-warning',
    probation: 'badge-accent', terminated: 'badge-danger',
    resigned: 'badge-neutral',
  };
  return (
    <span className={`badge ${map[status ?? ''] ?? 'badge-neutral'}`}>
      {status?.replace('_', ' ') ?? 'Unknown'}
    </span>
  );
}

// ─── TABS ───────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'employment' | 'contacts' | 'documents' | 'education' | 'experience';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview',    label: 'Overview',    icon: '👤' },
  { id: 'employment',  label: 'Employment',  icon: '💼' },
  { id: 'contacts',    label: 'Emergency',   icon: '🆘' },
  { id: 'documents',   label: 'Documents',   icon: '📄' },
  { id: 'education',   label: 'Education',   icon: '🎓' },
  { id: 'experience',  label: 'Experience',  icon: '🏢' },
];

// ─── Main Component ─────────────────────────────────────────────────────────
export const EmployeeProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<Partial<EmployeeProfile>>({});
  const [showAddContact, setShowAddContact] = useState(false);
  const [showAddEdu, setShowAddEdu] = useState(false);
  const [showAddExp, setShowAddExp] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);

  const currentUserId = parseInt(userId ?? '0');
  const loggedInUser = getCurrentUser();
  const isAdmin = loggedInUser?.isAdmin ?? false;

  // Fetch departments
  const { data: departments } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: getDepartments,
    enabled: isAdmin,
  });

  // Fetch employee user info
  const { data: employees } = useQuery({ queryKey: ['employees'], queryFn: getEmployees });
  const employee = employees?.find(e => e.id === currentUserId);

  // Fetch profile
  const { data: profile, isLoading, error } = useQuery<EmployeeProfile>({
    queryKey: ['profile-by-user', currentUserId],
    queryFn: () => getProfileByUserId(currentUserId),
    enabled: !!currentUserId,
    retry: false,
  });

  // Create profile mutation (if none exists)
  const createMutation = useMutation({
    mutationFn: (data: { user_id: number }) => createProfile(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] }),
  });

  // Update profile mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<EmployeeProfile>) => updateProfile(profile!.id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] });
      qc.invalidateQueries({ queryKey: ['employees'] });
      qc.invalidateQueries({ queryKey: ['employee-directory'] });
      setEditMode(false);
      setEditData({});
    },
  });

  // Photo upload mutation
  const photoMutation = useMutation({
    mutationFn: (file: File) => uploadProfilePhoto(profile!.id, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] }),
  });

  const fullName = employee ? `${employee.first_name} ${employee.last_name}` : 'Employee';

  if (isLoading) return (
    <Layout breadcrumb={[{ label: 'Employees', path: '/employees' }, { label: 'Profile' }]}>
      <div className="loading-center"><div className="spinner" /></div>
    </Layout>
  );

  const noProfile = !profile && !isLoading;

  return (
    <Layout
      breadcrumb={[{ label: 'Employees' }, { label: fullName }]}
      actions={
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/employees')}>← Back</button>
          {profile && !editMode && (
            <button className="btn btn-primary btn-sm" onClick={() => { setEditMode(true); setEditData({}); }}>
              ✏️ Edit Profile
            </button>
          )}
          {editMode && (
            <>
              <button className="btn btn-secondary btn-sm" onClick={() => setEditMode(false)}>Cancel</button>
              <button
                className="btn btn-primary btn-sm"
                disabled={updateMutation.isPending}
                onClick={() => updateMutation.mutate(editData)}
              >
                {updateMutation.isPending ? 'Saving...' : '💾 Save'}
              </button>
            </>
          )}
        </div>
      }
    >
      {/* No profile prompt */}
      {noProfile && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div className="card-body" style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>👤</div>
            <h3 style={{ marginBottom: '8px' }}>No profile yet</h3>
            <p style={{ marginBottom: '20px' }}>This employee doesn't have an extended profile. Create one now.</p>
            <button
              className="btn btn-primary"
              disabled={createMutation.isPending}
              onClick={() => createMutation.mutate({ user_id: currentUserId })}
            >
              {createMutation.isPending ? 'Creating...' : '+ Create Profile'}
            </button>
          </div>
        </div>
      )}

      {/* Hero */}
      <div className="profile-hero">
        <AvatarOrPhoto
          name={fullName}
          photoUrl={profile?.profile_photo_url}
          size="xl"
          editable={!!profile}
          onUpload={file => photoMutation.mutate(file)}
        />
        <div className="profile-hero-info">
          <div className="profile-hero-name">{fullName}</div>
          <div className="profile-hero-title">{employee?.job_title || 'No job title'}</div>
          <div className="profile-hero-meta">
            {employee?.department && <span>🏢 {employee.department.name}</span>}
            {profile?.employee_id && <span>🪪 {profile.employee_id}</span>}
            {profile?.phone_number && <span>📞 {profile.phone_number}</span>}
            {profile?.city && <span>📍 {profile.city}{profile.country ? `, ${profile.country}` : ''}</span>}
            {profile?.date_of_joining && <span>📅 Joined {new Date(profile.date_of_joining).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
          <span className={`badge ${employee?.is_active ? 'badge-success' : 'badge-danger'}`}>
            {employee?.is_active ? '● Active' : '● Inactive'}
          </span>
          {profile?.employment_status && <StatusBadge status={profile.employment_status} />}
          {employee?.is_superuser && <span className="badge badge-accent">⭐ Admin</span>}
        </div>
      </div>

      {/* Tabs — only if profile exists */}
      {profile && (
        <>
          <div className="tabs">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`tab-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>

          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="card animate-fade-in">
              <div className="card-header">
                <span className="card-title">Personal Information</span>
              </div>
              <div className="card-body">
                {editMode ? (
                  <div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Phone Number</label>
                        <input className="form-input" defaultValue={profile.phone_number ?? ''} onChange={e => setEditData(d => ({ ...d, phone_number: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Alternate Phone</label>
                        <input className="form-input" defaultValue={profile.alternate_phone ?? ''} onChange={e => setEditData(d => ({ ...d, alternate_phone: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Personal Email</label>
                        <input className="form-input" defaultValue={profile.personal_email ?? ''} onChange={e => setEditData(d => ({ ...d, personal_email: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Date of Birth</label>
                        <input type="date" className="form-input" defaultValue={profile.date_of_birth ?? ''} onChange={e => setEditData(d => ({ ...d, date_of_birth: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Gender</label>
                        <select className="form-select" defaultValue={profile.gender ?? ''} onChange={e => setEditData(d => ({ ...d, gender: e.target.value as any }))}>
                          <option value="">Select...</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                          <option value="prefer_not_to_say">Prefer not to say</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Marital Status</label>
                        <select className="form-select" defaultValue={profile.marital_status ?? ''} onChange={e => setEditData(d => ({ ...d, marital_status: e.target.value as any }))}>
                          <option value="">Select...</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Nationality</label>
                        <input className="form-input" defaultValue={profile.nationality ?? ''} onChange={e => setEditData(d => ({ ...d, nationality: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Blood Group</label>
                        <select className="form-select" defaultValue={profile.blood_group ?? ''} onChange={e => setEditData(d => ({ ...d, blood_group: e.target.value }))}>
                          <option value="">Select...</option>
                          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
                        </select>
                      </div>
                    </div>
                    <hr className="divider" />
                    <h4 style={{ marginBottom: '14px' }}>Address</h4>
                    <div className="form-group">
                      <label className="form-label">Address Line 1</label>
                      <input className="form-input" defaultValue={profile.address_line1 ?? ''} onChange={e => setEditData(d => ({ ...d, address_line1: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Address Line 2</label>
                      <input className="form-input" defaultValue={profile.address_line2 ?? ''} onChange={e => setEditData(d => ({ ...d, address_line2: e.target.value }))} />
                    </div>
                    <div className="form-row-3">
                      <div className="form-group">
                        <label className="form-label">City</label>
                        <input className="form-input" defaultValue={profile.city ?? ''} onChange={e => setEditData(d => ({ ...d, city: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">State</label>
                        <input className="form-input" defaultValue={profile.state ?? ''} onChange={e => setEditData(d => ({ ...d, state: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Country</label>
                        <input className="form-input" defaultValue={profile.country ?? ''} onChange={e => setEditData(d => ({ ...d, country: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Pincode</label>
                        <input className="form-input" defaultValue={profile.pincode ?? ''} onChange={e => setEditData(d => ({ ...d, pincode: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">LinkedIn URL</label>
                        <input className="form-input" defaultValue={profile.linkedin_url ?? ''} onChange={e => setEditData(d => ({ ...d, linkedin_url: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Bio</label>
                      <textarea className="form-textarea" defaultValue={profile.bio ?? ''} onChange={e => setEditData(d => ({ ...d, bio: e.target.value }))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Skills (comma separated)</label>
                      <input className="form-input" placeholder="React, Python, SQL..." defaultValue={profile.skills ?? ''} onChange={e => setEditData(d => ({ ...d, skills: e.target.value }))} />
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="info-grid">
                      <InfoItem label="Phone" value={profile.phone_number} />
                      <InfoItem label="Alternate Phone" value={profile.alternate_phone} />
                      <InfoItem label="Personal Email" value={profile.personal_email} />
                      <InfoItem label="Date of Birth" value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('en-IN') : undefined} />
                      <InfoItem label="Gender" value={profile.gender?.replace('_', ' ')} />
                      <InfoItem label="Marital Status" value={profile.marital_status} />
                      <InfoItem label="Nationality" value={profile.nationality} />
                      <InfoItem label="Blood Group" value={profile.blood_group} />
                    </div>

                    {(profile.address_line1 || profile.city) && (
                      <>
                        <hr className="divider" />
                        <h4 style={{ marginBottom: '14px' }}>📍 Address</h4>
                        <div className="info-grid">
                          <InfoItem label="Address Line 1" value={profile.address_line1} />
                          <InfoItem label="Address Line 2" value={profile.address_line2} />
                          <InfoItem label="City" value={profile.city} />
                          <InfoItem label="State" value={profile.state} />
                          <InfoItem label="Country" value={profile.country} />
                          <InfoItem label="Pincode" value={profile.pincode} />
                        </div>
                      </>
                    )}

                    {profile.bio && (
                      <>
                        <hr className="divider" />
                        <h4 style={{ marginBottom: '10px' }}>Bio</h4>
                        <p style={{ fontSize: '14px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{profile.bio}</p>
                      </>
                    )}

                    {profile.skills && (
                      <>
                        <hr className="divider" />
                        <h4 style={{ marginBottom: '10px' }}>Skills</h4>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                          {profile.skills.split(',').map((s, i) => (
                            <span key={i} className="skill-tag">{s.trim()}</span>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Employment Tab ── */}
          {activeTab === 'employment' && (
            <div className="card animate-fade-in">
              <div className="card-header"><span className="card-title">Employment Details</span></div>
              <div className="card-body">
                {editMode ? (
                  <div>
                    {isAdmin && (
                      <div className="form-row">
                        <div className="form-group">
                          <label className="form-label">Job Title</label>
                          <input
                            className="form-input"
                            defaultValue={employee?.job_title ?? ''}
                            onChange={e => setEditData(d => ({ ...d, job_title: e.target.value }))}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Department</label>
                          <select
                            className="form-select"
                            defaultValue={employee?.department_id ?? ''}
                            onChange={e => setEditData(d => ({ ...d, department_id: e.target.value ? parseInt(e.target.value) : null as any }))}
                          >
                            <option value="">No department</option>
                            {departments?.map(d => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Employment Type</label>
                        <select className="form-select" defaultValue={profile.employment_type ?? ''} onChange={e => setEditData(d => ({ ...d, employment_type: e.target.value as any }))}>
                          <option value="">Select...</option>
                          <option value="full_time">Full Time</option>
                          <option value="part_time">Part Time</option>
                          <option value="contract">Contract</option>
                          <option value="intern">Intern</option>
                          <option value="freelance">Freelance</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Employment Status</label>
                        <select className="form-select" defaultValue={profile.employment_status ?? ''} onChange={e => setEditData(d => ({ ...d, employment_status: e.target.value as any }))}>
                          <option value="">Select...</option>
                          <option value="active">Active</option>
                          <option value="on_leave">On Leave</option>
                          <option value="probation">Probation</option>
                          <option value="terminated">Terminated</option>
                          <option value="resigned">Resigned</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Date of Joining</label>
                        <input type="date" className="form-input" defaultValue={profile.date_of_joining ?? ''} onChange={e => setEditData(d => ({ ...d, date_of_joining: e.target.value }))} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Probation End Date</label>
                        <input type="date" className="form-input" defaultValue={profile.probation_end_date ?? ''} onChange={e => setEditData(d => ({ ...d, probation_end_date: e.target.value }))} />
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Work Location</label>
                        <select className="form-select" defaultValue={profile.work_location ?? ''} onChange={e => setEditData(d => ({ ...d, work_location: e.target.value }))}>
                          <option value="">Select...</option>
                          <option value="Office">Office</option>
                          <option value="Remote">Remote</option>
                          <option value="Hybrid">Hybrid</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Shift</label>
                        <select className="form-select" defaultValue={profile.shift ?? ''} onChange={e => setEditData(d => ({ ...d, shift: e.target.value }))}>
                          <option value="">Select...</option>
                          <option value="General">General</option>
                          <option value="Morning">Morning</option>
                          <option value="Evening">Evening</option>
                          <option value="Night">Night</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-row">
                      <div className="form-group">
                        <label className="form-label">Notice Period (days)</label>
                        <input type="number" className="form-input" defaultValue={profile.notice_period_days ?? 30} onChange={e => setEditData(d => ({ ...d, notice_period_days: parseInt(e.target.value) }))} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="info-grid">
                    <InfoItem label="Employee ID" value={profile.employee_id} />
                    <InfoItem label="Employment Type" value={profile.employment_type?.replace('_', ' ')} />
                    <InfoItem label="Employment Status" value={profile.employment_status?.replace('_', ' ')} />
                    <InfoItem label="Date of Joining" value={profile.date_of_joining ? new Date(profile.date_of_joining).toLocaleDateString('en-IN') : undefined} />
                    <InfoItem label="Probation End" value={profile.probation_end_date ? new Date(profile.probation_end_date).toLocaleDateString('en-IN') : undefined} />
                    <InfoItem label="Work Location" value={profile.work_location} />
                    <InfoItem label="Shift" value={profile.shift} />
                    <InfoItem label="Notice Period" value={profile.notice_period_days ? `${profile.notice_period_days} days` : undefined} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Emergency Contacts Tab ── */}
          {activeTab === 'contacts' && (
            <EmergencyContactsTab
              profile={profile}
              showAdd={showAddContact}
              setShowAdd={setShowAddContact}
              onAdd={(data) => addEmergencyContact(profile.id, data)}
              onDelete={(id) => deleteEmergencyContact(profile.id, id)}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] })}
            />
          )}

          {/* ── Documents Tab ── */}
          {activeTab === 'documents' && (
            <DocumentsTab
              profile={profile}
              showAdd={showAddDoc}
              setShowAdd={setShowAddDoc}
              onAdd={(data) => addDocument(profile.id, data)}
              onDelete={(id) => deleteDocument(profile.id, id)}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] })}
            />
          )}

          {/* ── Education Tab ── */}
          {activeTab === 'education' && (
            <EducationTab
              profile={profile}
              showAdd={showAddEdu}
              setShowAdd={setShowAddEdu}
              onAdd={(data) => addEducation(profile.id, data)}
              onDelete={(id) => deleteEducation(profile.id, id)}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] })}
            />
          )}

          {/* ── Experience Tab ── */}
          {activeTab === 'experience' && (
            <ExperienceTab
              profile={profile}
              showAdd={showAddExp}
              setShowAdd={setShowAddExp}
              onAdd={(data) => addExperience(profile.id, data)}
              onDelete={(id) => deleteExperience(profile.id, id)}
              onRefresh={() => qc.invalidateQueries({ queryKey: ['profile-by-user', currentUserId] })}
            />
          )}
        </>
      )}
    </Layout>
  );
};

// ─── Emergency Contacts Sub-component ──────────────────────────────────────
function EmergencyContactsTab({
  profile, showAdd, setShowAdd, onAdd, onDelete, onRefresh
}: {
  profile: EmployeeProfile;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  onAdd: (data: Omit<EmergencyContact, 'id' | 'profile_id'>) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({ name: '', relation_type: '', phone_number: '', alternate_phone: '', email: '', address: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name || !form.relation_type || !form.phone_number) return;
    setSaving(true);
    await onAdd(form);
    setForm({ name: '', relation_type: '', phone_number: '', alternate_phone: '', email: '', address: '' });
    setShowAdd(false);
    setSaving(false);
    onRefresh();
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <span className="card-title">Emergency Contacts</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add Contact</button>
      </div>
      <div className="card-body">
        {showAdd && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '14px' }}>New Emergency Contact</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Name *</label>
                <input className="form-input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Full name" />
              </div>
              <div className="form-group">
                <label className="form-label">Relationship *</label>
                <input className="form-input" value={form.relation_type} onChange={e => setForm(f => ({ ...f, relation_type: e.target.value }))} placeholder="e.g. Spouse, Parent" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone *</label>
                <input className="form-input" value={form.phone_number} onChange={e => setForm(f => ({ ...f, phone_number: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input className="form-input" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Address</label>
              <input className="form-input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAdd}>{saving ? 'Saving...' : 'Save Contact'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {profile.emergency_contacts.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🆘</div>
            <div className="empty-title">No emergency contacts</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {profile.emergency_contacts.map(c => (
              <div key={c.id} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</div>
                  <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '6px' }}>{c.relation_type}</div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>📞 {c.phone_number}</div>
                  {c.email && <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>✉️ {c.email}</div>}
                </div>
                <button className="btn btn-danger btn-sm" onClick={async () => { await onDelete(c.id); onRefresh(); }}>Delete</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Documents Sub-component ───────────────────────────────────────────────
function DocumentsTab({
  profile, showAdd, setShowAdd, onAdd, onDelete, onRefresh
}: {
  profile: EmployeeProfile;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  onAdd: (data: any) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({ document_type: '', document_number: '', file_url: '', expiry_date: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.document_type) return;
    setSaving(true);
    await onAdd(form);
    setForm({ document_type: '', document_number: '', file_url: '', expiry_date: '' });
    setShowAdd(false);
    setSaving(false);
    onRefresh();
  };

  const DOC_TYPES = ['Aadhaar', 'PAN', 'Passport', 'Driving License', 'Voter ID', 'Birth Certificate', 'Other'];

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <span className="card-title">Documents</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add Document</button>
      </div>
      <div className="card-body">
        {showAdd && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '14px' }}>New Document</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Document Type *</label>
                <select className="form-select" value={form.document_type} onChange={e => setForm(f => ({ ...f, document_type: e.target.value }))}>
                  <option value="">Select type...</option>
                  {DOC_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Document Number</label>
                <input className="form-input" value={form.document_number} onChange={e => setForm(f => ({ ...f, document_number: e.target.value }))} placeholder="XXXX-XXXX-XXXX" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Expiry Date</label>
                <input type="date" className="form-input" value={form.expiry_date} onChange={e => setForm(f => ({ ...f, expiry_date: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAdd}>{saving ? 'Saving...' : 'Save Document'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {profile.documents.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">📄</div><div className="empty-title">No documents added</div></div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th><th>Number</th><th>Expiry</th><th>Verified</th><th></th>
              </tr>
            </thead>
            <tbody>
              {profile.documents.map(doc => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{doc.document_type}</td>
                  <td>{doc.document_number || '—'}</td>
                  <td>{doc.expiry_date ? new Date(doc.expiry_date).toLocaleDateString('en-IN') : '—'}</td>
                  <td><span className={`badge ${doc.is_verified ? 'badge-success' : 'badge-neutral'}`}>{doc.is_verified ? '✓ Verified' : 'Pending'}</span></td>
                  <td><button className="btn btn-danger btn-sm" onClick={async () => { await onDelete(doc.id); onRefresh(); }}>Delete</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Education Sub-component ───────────────────────────────────────────────
function EducationTab({
  profile, showAdd, setShowAdd, onAdd, onDelete, onRefresh
}: {
  profile: EmployeeProfile;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  onAdd: (data: any) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({ degree: '', field_of_study: '', institution: '', university: '', start_year: '', end_year: '', grade_or_percentage: '', is_highest: false });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.degree || !form.institution) return;
    setSaving(true);
    await onAdd({ ...form, start_year: form.start_year ? parseInt(form.start_year) : null, end_year: form.end_year ? parseInt(form.end_year) : null });
    setForm({ degree: '', field_of_study: '', institution: '', university: '', start_year: '', end_year: '', grade_or_percentage: '', is_highest: false });
    setShowAdd(false);
    setSaving(false);
    onRefresh();
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <span className="card-title">Education</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>
      <div className="card-body">
        {showAdd && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '14px' }}>Add Education</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Degree *</label>
                <input className="form-input" value={form.degree} onChange={e => setForm(f => ({ ...f, degree: e.target.value }))} placeholder="B.Tech, MBA, etc." />
              </div>
              <div className="form-group">
                <label className="form-label">Field of Study</label>
                <input className="form-input" value={form.field_of_study} onChange={e => setForm(f => ({ ...f, field_of_study: e.target.value }))} placeholder="Computer Science..." />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Institution *</label>
                <input className="form-input" value={form.institution} onChange={e => setForm(f => ({ ...f, institution: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">University</label>
                <input className="form-input" value={form.university} onChange={e => setForm(f => ({ ...f, university: e.target.value }))} />
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label className="form-label">Start Year</label>
                <input type="number" className="form-input" value={form.start_year} onChange={e => setForm(f => ({ ...f, start_year: e.target.value }))} placeholder="2018" />
              </div>
              <div className="form-group">
                <label className="form-label">End Year</label>
                <input type="number" className="form-input" value={form.end_year} onChange={e => setForm(f => ({ ...f, end_year: e.target.value }))} placeholder="2022" />
              </div>
              <div className="form-group">
                <label className="form-label">Grade / %</label>
                <input className="form-input" value={form.grade_or_percentage} onChange={e => setForm(f => ({ ...f, grade_or_percentage: e.target.value }))} placeholder="8.5 CGPA / 85%" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAdd}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {profile.education_records.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🎓</div><div className="empty-title">No education records</div></div>
        ) : (
          <div className="timeline">
            {profile.education_records.map(edu => (
              <div key={edu.id} className="timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="timeline-date">{edu.start_year} — {edu.end_year ?? 'Present'}</div>
                    <div className="timeline-title">{edu.degree}{edu.field_of_study ? ` in ${edu.field_of_study}` : ''}</div>
                    <div className="timeline-sub">{edu.institution}{edu.university ? `, ${edu.university}` : ''}</div>
                    {edu.grade_or_percentage && <div className="timeline-desc">Grade: {edu.grade_or_percentage}</div>}
                    {edu.is_highest && <span className="badge badge-accent" style={{ marginTop: '4px' }}>⭐ Highest</span>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={async () => { await onDelete(edu.id); onRefresh(); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Experience Sub-component ──────────────────────────────────────────────
function ExperienceTab({
  profile, showAdd, setShowAdd, onAdd, onDelete, onRefresh
}: {
  profile: EmployeeProfile;
  showAdd: boolean;
  setShowAdd: (v: boolean) => void;
  onAdd: (data: any) => Promise<any>;
  onDelete: (id: number) => Promise<any>;
  onRefresh: () => void;
}) {
  const [form, setForm] = useState({ company_name: '', job_title: '', start_date: '', end_date: '', is_current: false, description: '', location: '' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.company_name || !form.job_title) return;
    setSaving(true);
    await onAdd(form);
    setForm({ company_name: '', job_title: '', start_date: '', end_date: '', is_current: false, description: '', location: '' });
    setShowAdd(false);
    setSaving(false);
    onRefresh();
  };

  return (
    <div className="card animate-fade-in">
      <div className="card-header">
        <span className="card-title">Work Experience</span>
        <button className="btn btn-primary btn-sm" onClick={() => setShowAdd(!showAdd)}>+ Add</button>
      </div>
      <div className="card-body">
        {showAdd && (
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '18px', marginBottom: '20px' }}>
            <h4 style={{ marginBottom: '14px' }}>Add Work Experience</h4>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Company *</label>
                <input className="form-input" value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">Job Title *</label>
                <input className="form-input" value={form.job_title} onChange={e => setForm(f => ({ ...f, job_title: e.target.value }))} />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
              </div>
              <div className="form-group">
                <label className="form-label">End Date {form.is_current && '(Current)'}</label>
                <input type="date" className="form-input" value={form.end_date} disabled={form.is_current} onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))} />
              </div>
            </div>
            <div className="form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: '13px' }}>
                <input type="checkbox" checked={form.is_current} onChange={e => setForm(f => ({ ...f, is_current: e.target.checked, end_date: '' }))} />
                Currently working here
              </label>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Location</label>
                <input className="form-input" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="City, Country" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-textarea" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Key responsibilities..." />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" disabled={saving} onClick={handleAdd}>{saving ? 'Saving...' : 'Save'}</button>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        )}

        {profile.experience_records.length === 0 ? (
          <div className="empty-state"><div className="empty-icon">🏢</div><div className="empty-title">No work experience added</div></div>
        ) : (
          <div className="timeline">
            {profile.experience_records.map(exp => (
              <div key={exp.id} className="timeline-item">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div className="timeline-date">
                      {exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : ''}
                      {' — '}
                      {exp.is_current ? 'Present' : (exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '')}
                      {exp.is_current && <span className="badge badge-success" style={{ marginLeft: '6px' }}>Current</span>}
                    </div>
                    <div className="timeline-title">{exp.job_title}</div>
                    <div className="timeline-sub">{exp.company_name}{exp.location ? ` · ${exp.location}` : ''}</div>
                    {exp.description && <div className="timeline-desc">{exp.description}</div>}
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={async () => { await onDelete(exp.id); onRefresh(); }}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

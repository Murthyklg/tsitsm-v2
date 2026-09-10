import React, { useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIncidents } from '../hooks/useIncidents';
import { useUserProfile } from '../hooks/useUserProfile';
import type { Incident } from '../types/asset';
import './RequestManagement.css';
import './IncidentManagement.css';

const emptyForm = {
  title: 'Not powering on',
  assetId: '',
  assetName: '',
  reporterEmployeeId: '',
  reporterName: '',
  reporterMobile: '',
  reporterEmail: '',
  reporterDepartment: '',
  description: '',
  severity: 'medium' as Incident['severity'],
  category: 'laptop' as Incident['category'],
};

const incidentCategories = [
  { value: 'laptop', label: 'Laptop' },
  { value: 'desktop', label: 'Desktop' },
  { value: 'network', label: 'Network' },
  { value: 'printer', label: 'Printer' },
  { value: 'sap', label: 'SAP' },
  { value: 'projector', label: 'Projector' },
  { value: 'peripherals', label: 'Peripherals' },
  { value: 'other', label: 'Other' },
] as const;

const incidentIssuesByCategory: Record<Incident['category'], string[]> = {
  laptop: ['Not powering on','MS Office issue','Outlook issue','One Drive error', 'Blue Screen Error','Battery not charging', 'Keyboard not working', 'Screen issue',  'Software crash', 'Slow performance', 'Overheating','Hardware issue', 'Other'],
  desktop: ['Not powering on','MS Office issue','Outlook issue','One Drive error','Blue Screen Error', 'Screen issue', 'Mouse or keyboard issue', 'Software crash', 'Slow performance', 'Hardware issue','Other'],
  network: ['Internet not working','NAS Connectivity issue', 'Wi-Fi not connecting', 'VPN issue', 'LAN issue', 'Fortinet client issue', 'Other'],
  printer: ['Paper jam', 'Print quality issue', 'Offline', 'Driver issue', 'Low toner', 'Other'],
  sap: ['SAP login issue', 'FortiClient VPN login issue','RDP connectivity issue','Unable to print from SAP'],
  projector: ['No display', 'Connection issue', 'Remote not working', 'Poor image quality', 'Other'],
  peripherals: ['Mouse', 'Keyboard',  'Monitor', 'BarCode Scanner', 'Other'],
  other: ['Other'],
};

export const IncidentManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { profile } = useUserProfile(user?.uid || undefined);
  const { incidents, createIncident } = useIncidents(user?.uid, isAdmin);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  const initializeIncidentForm = () => {
    if (!user) {
      setForm(emptyForm);
      setIsFormOpen(true);
      return;
    }

    const pendingProfile = typeof window !== 'undefined'
      ? (() => {
          try {
            const raw = window.localStorage.getItem('pendingProfile');
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })()
      : null;

    const profileName = profile?.employeeName || profile?.displayName || pendingProfile?.displayName || user.displayName || '';
    const profileDepartment = profile?.department || pendingProfile?.department || '';
    const profileEmployeeId = profile?.employeeId || pendingProfile?.employeeId || '';
    const profileMobile = (profile?.mobile ?? pendingProfile?.mobile ?? user.phoneNumber ?? 'N/A').trim();

    setForm({
      ...emptyForm,
      reporterEmployeeId: profileEmployeeId,
      reporterName: profileName,
      reporterEmail: user.email || '',
      reporterDepartment: profileDepartment,
      reporterMobile: profileMobile || 'N/A',
    });
    setIsFormOpen(true);
  };

  React.useEffect(() => {
    if (!user) {
      return;
    }

    const pendingProfile = typeof window !== 'undefined'
      ? (() => {
          try {
            const raw = window.localStorage.getItem('pendingProfile');
            return raw ? JSON.parse(raw) : null;
          } catch {
            return null;
          }
        })()
      : null;

    const profileName = profile?.employeeName || profile?.displayName || pendingProfile?.displayName || user.displayName || '';
    const profileDepartment = profile?.department || pendingProfile?.department || '';
    const profileEmployeeId = profile?.employeeId || pendingProfile?.employeeId || '';
    const profileMobile = (profile?.mobile ?? pendingProfile?.mobile ?? user.phoneNumber ?? 'N/A').trim();

    setForm((current) => ({
      ...current,
      reporterEmployeeId: profileEmployeeId,
      reporterName: profileName,
      reporterEmail: user.email || '',
      reporterDepartment: profileDepartment,
      reporterMobile: profileMobile || current.reporterMobile || 'N/A',
    }));
  }, [profile, user]);

  const formatDate = (date: Date | undefined): string => {
    if (!date) return '';
    return new Date(date).toLocaleString();
  };

  const getReportData = (period: string) => {
    const [year, month] = period.split('-').map(Number);
    return incidents.filter((incident) => {
      const createdAt = incident.createdAt instanceof Date ? incident.createdAt : new Date(incident.createdAt);
      return createdAt.getFullYear() === year && createdAt.getMonth() + 1 === month;
    });
  };

  const downloadReport = () => {
    const data = getReportData(reportPeriod);
    const headers = [
      'Incident Number',
      'Title',
      'Reporter Name',
      'Reporter Email',
      'Reporter Employee ID',
      'Reporter Mobile',
      'Reporter Department',
      'Category',
      'Severity',
      'Status',
      'Asset ID',
      'Asset Name',
      'Created At',
      'Updated At',
      'Comments Count',
      'Admin Notes',
      'Description',
    ];

    const rows = data.map((incident) => [
      incident.incidentNumber ?? '',
      incident.title,
      incident.reporterName,
      incident.reporterEmail,
      incident.reporterEmployeeId,
      incident.reporterMobile,
      incident.reporterDepartment,
      incident.category,
      incident.severity,
      incident.status,
      incident.assetId ?? '',
      incident.assetName ?? '',
      formatDate(incident.createdAt),
      formatDate(incident.updatedAt),
      incident.comments?.length.toString() ?? '0',
      incident.adminNotes ?? '',
      incident.description,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `incident-report-${reportPeriod}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const incidentStats = useMemo(() => {
    const today = new Date();
    const total = incidents.length;
    const open = incidents.filter((incident) => incident.status === 'open').length;
    const inProgress = incidents.filter((incident) => incident.status === 'work in progress').length;
    const resolved = incidents.filter((incident) => incident.status === 'resolved').length;
    const resolvedToday = incidents.filter((incident) => {
      const updatedAt = incident.updatedAt instanceof Date ? incident.updatedAt : new Date(incident.updatedAt);
      return incident.status === 'resolved' && updatedAt.toDateString() === today.toDateString();
    }).length;

    return { total, open, inProgress, resolved, resolvedToday };
  }, [incidents]);

  const incidentTrends = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        label: date.toLocaleDateString('en-US', { month: 'short' }),
        year: date.getFullYear(),
        month: date.getMonth(),
      };
    });

    return months.map((month) => {
      const count = incidents.filter((incident) => {
        const createdAt = incident.createdAt instanceof Date ? incident.createdAt : new Date(incident.createdAt);
        return createdAt.getFullYear() === month.year && createdAt.getMonth() === month.month;
      }).length;
      return { ...month, count };
    });
  }, [incidents]);

  const handleCategoryChange = (nextCategory: Incident['category']) => {
    setForm((current) => {
      const nextOptions = incidentIssuesByCategory[nextCategory];
      const fallbackTitle = nextOptions[0] || '';

      return {
        ...current,
        category: nextCategory,
        title: nextOptions.includes(current.title) ? current.title : fallbackTitle,
      };
    });
  };

  const handleCreateIncident = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!user) return;

    if (!form.title.trim() || !form.description.trim()) {
      alert('Title and description are required.');
      return;
    }

    try {
      setSubmitting(true);
      await createIncident({
        reporterId: user.uid,
        reporterEmail: form.reporterEmail.trim() || user.email || '',
        reporterName: form.reporterName?.trim() || profile?.employeeName || profile?.displayName || user.displayName || 'User',
        reporterEmployeeId: profile?.employeeId || form.reporterEmployeeId.trim(),
        reporterMobile:
          (profile?.mobile?.trim() || form.reporterMobile.trim() || user.phoneNumber?.trim() || '').trim(),
        reporterDepartment: profile?.department || form.reporterDepartment.trim(),
        title: form.title.trim(),
        assetId: form.assetId.trim(),
        assetName: form.assetName.trim(),
        description: form.description.trim(),
        severity: form.severity,
        category: form.category,
        status: 'open',
        comments: [],
      });
      setForm(emptyForm);
      setIsFormOpen(false);
      setSubmitting(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create incident');
      setSubmitting(false);
    }
  };

  return (
    <div className="incident-management">
      <div className="incident-dashboard-header">
        <div className="incident-dashboard-title">
          <h2>Incident Dashboard</h2>
        </div>

        <div className="header-actions">
          {isAdmin && (
            <div className="incident-report-controls">
              <label>
                Month:
                <input
                  type="month"
                  value={reportPeriod}
                  onChange={(event) => setReportPeriod(event.target.value)}
                />
              </label>
              <button type="button" className="download-report-btn" onClick={downloadReport}>
                Download Monthly Report
              </button>
            </div>
          )}
          <button type="button" className="open-request-form-btn" onClick={initializeIncidentForm}>
            Report a New Incident
          </button>
        </div>
      </div>

      <div className="incident-stats-grid">
        <div className="stat-card">
          <span className="stat-card-label">Open Tickets</span>
          <strong>{incidentStats.open}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">In Progress</span>
          <strong>{incidentStats.inProgress}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Resolved Today</span>
          <strong>{incidentStats.resolvedToday}</strong>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">Total Tickets</span>
          <strong>{incidentStats.total}</strong>
        </div>
      </div>

      <div className="incident-dashboard-grid">
        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h3 className="panel-card-title">Tickets Overview</h3>
              <p className="panel-card-description">Recent incident volume across the last six months.</p>
            </div>
            <span className="panel-chip">Trend</span>
          </div>
          <div className="line-chart">
            {incidentTrends.map((point) => (
              <div className="chart-column" key={`${point.label}-${point.year}`}>
                <div className="chart-count">{point.count}</div>
                <div className="chart-column-bar-wrapper">
                  <div
                    className="chart-column-bar"
                    style={{ height: `${Math.max(12, point.count * 12)}px` }}
                  />
                </div>
                <div className="chart-column-label">{point.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel-card">
          <div className="panel-card-header">
            <div>
              <h3 className="panel-card-title">Tickets by Status</h3>
              <p className="panel-card-description">Open, in progress, and resolved ticket breakdown.</p>
            </div>
            <span className="panel-chip">Status</span>
          </div>

          <div className="status-ring-wrapper">
            <div
              className="status-ring"
              style={{
                background:
                  incidentStats.total === 0
                    ? 'conic-gradient(#e5e7eb 0 100%)'
                    : `conic-gradient(
                        #dc2626 0 ${Math.round((incidentStats.open / incidentStats.total) * 100)}%,
                        #fd5000 ${Math.round((incidentStats.open / incidentStats.total) * 100)}% ${Math.round(((incidentStats.open + incidentStats.inProgress) / incidentStats.total) * 100)}%,
                        #01530f ${Math.round(((incidentStats.open + incidentStats.inProgress) / incidentStats.total) * 100)}% 100%
                      )`,
              }}
            >
              <div className="status-ring-inner">
                <strong>{incidentStats.total}</strong>
                <span>Total</span>
              </div>
            </div>

            <div className="status-legend">
              <div className="status-legend-item">
                <span className="status-dot status-open" />
                <span>Open</span>
                <strong>{incidentStats.open}</strong>
              </div>
              <div className="status-legend-item">
                <span className="status-dot status-in-progress" />
                <span>Work in Progress</span>
                <strong>{incidentStats.inProgress}</strong>
              </div>
              <div className="status-legend-item">
                <span className="status-dot status-resolved" />
                <span>Resolved</span>
                <strong>{incidentStats.resolved}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="incident-modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="incident-modal incident-form-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-header">
              <h3>Report a New Incident</h3>
              <button className="close-btn" onClick={() => setIsFormOpen(false)}>✕</button>
            </div>

            <form className="request-form" onSubmit={handleCreateIncident}>
              <div className="request-form-grid four-column">
                <div className="form-cell">
                  <select
                    value={form.category}
                    onChange={(event) => handleCategoryChange(event.target.value as Incident['category'])}
                    required
                  >
                    {incidentCategories.map((option) => (
                      <option value={option.value} key={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-cell">
                  <input
                    value={form.reporterName}
                    onChange={(event) => setForm({ ...form, reporterName: event.target.value })}
                    placeholder="Employee Name"
                    required
                    disabled={!!profile}
                  />
                </div>

                <div className="form-cell">
                  <select
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    required
                  >
                    {incidentIssuesByCategory[form.category].map((option) => (
                      <option value={option} key={option}>{option}</option>
                    ))}
                  </select>
                </div>
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-cell">
                  <input
                    value={form.reporterEmail}
                    onChange={(event) => setForm({ ...form, reporterEmail: event.target.value })}
                    placeholder="Employee Email ID"
                    required
                    disabled={!!profile}
                  />
                </div>

                <div className="form-cell">
                  <select
                    value={form.severity}
                    onChange={(event) => setForm({ ...form, severity: event.target.value as Incident['severity'] })}
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                    <option value="critical">Critical Priority</option>
                  </select>
                </div>
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-cell">
                  <input
                    value={form.reporterDepartment}
                    onChange={(event) => setForm({ ...form, reporterDepartment: event.target.value })}
                    placeholder="Employee Department"
                    required
                    disabled={!!profile}
                  />
                </div>

                <div className="form-cell">
                  <input
                    value={form.assetName}
                    onChange={(event) => setForm({ ...form, assetName: event.target.value })}
                    placeholder="Laptop brand + model"
                  />
                </div>
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-spacer" aria-hidden="true" />
                <div className="form-cell">
                  <input
                    value={form.reporterMobile}
                    onChange={(event) => setForm({ ...form, reporterMobile: event.target.value })}
                    placeholder="Employee Mobile Number"
                    required
                  />
                </div>
              </div>
              <textarea
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Describe the incident"
                rows={4}
                required
              />
              <div className="modal-form-actions">
                <button type="button" className="cancel-form-btn" onClick={() => setIsFormOpen(false)}>
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="add-request-btn">
                  {submitting ? 'Submitting...' : 'Report Incident'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useIncidents } from '../hooks/useIncidents';
import type { Incident } from '../types/asset';
import './Dashboard.css';
import './IncidentList.css';

interface IncidentListProps {
  statusFilter?: 'all' | 'open' | 'work in progress' | 'resolved';
}

export const IncidentList: React.FC<IncidentListProps> = ({ statusFilter = 'all' }) => {
  const { user, isAdmin } = useAuth();
  const { incidents, loading, updateIncidentStatus, addComment } = useIncidents(user?.uid, isAdmin);
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [commentText, setCommentText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return '#e74c3c';
      case 'work in progress':
        return '#f39c12';
      case 'monitoring':
        return '#3498db';
      case 'resolved':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return '#c0392b';
      case 'high':
        return '#e74c3c';
      case 'medium':
        return '#f39c12';
      case 'low':
        return '#27ae60';
      default:
        return '#95a5a6';
    }
  };

  const getReporterDisplayName = (incident: Incident) => {
    return (incident.reporterName || '').trim() || (incident.reporterEmail || '').split('@')[0] || 'Unknown Employee';
  };

  const handleStatusUpdate = async (incidentId: string, newStatus: string) => {
    try {
      setSubmitting(true);
      await updateIncidentStatus(incidentId, newStatus as Incident['status'], adminNote || undefined);
      setStatusUpdate('');
      setAdminNote('');
      setSelectedIncident(null);
      setSubmitting(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update incident');
      setSubmitting(false);
    }
  };

  const filteredIncidents = incidents.filter((incident) => {
    if (statusFilter === 'all') return true;
    return incident.status === statusFilter;
  });

  const handleAddComment = async (incidentId: string) => {
    if (!commentText.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await addComment(incidentId, {
        authorId: user?.uid || '',
        authorName: user?.displayName || user?.email || 'User',
        authorEmail: user?.email || '',
        authorRole: isAdmin ? 'admin' : 'user',
        text: commentText,
      });
      setCommentText('');
      setSubmitting(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment');
      setSubmitting(false);
    }
  };

  return (
    <div className="incident-list-page">
      <div className="incident-list-header">
        <div>
          <h2>Incident List</h2>
          <p className="dashboard-summary">Access every incident record from one dedicated page.</p>
        </div>
        <div className="incident-list-controls">
          <button
            type="button"
            className="view-toggle-btn"
            onClick={() => setViewMode((mode) => (mode === 'grid' ? 'list' : 'grid'))}
            aria-label={`Switch to ${viewMode === 'grid' ? 'list' : 'grid'} view`}
          >
            <span className="view-icon">{viewMode === 'grid' ? '≡' : '▦'}</span>
            <span className="sr-only">Switch to {viewMode === 'grid' ? 'list' : 'grid'} view</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading incidents...</div>
      ) : incidents.length === 0 ? (
        <div className="empty-state">No incidents available.</div>
      ) : viewMode === 'grid' ? (
        <div className="incident-list-grid">
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="incident-card" onClick={() => setSelectedIncident(incident)}>
              <div className="incident-card-header">
                <div>
                  <h3>{incident.title}</h3>
                  <p>#{incident.incidentNumber} · {incident.category}</p>
                </div>
                <div className="status-chip" style={{ backgroundColor: getStatusColor(incident.status) }}>
                  {incident.status}
                </div>
              </div>
              <div className="incident-card-body">
                <div className="card-row">
                  <strong>Priority:</strong>
                  <span style={{ color: getSeverityColor(incident.severity) }}>{incident.severity}</span>
                </div>
                <div className="card-row">
                  <strong>Reported:</strong>
                  <span>{incident.createdAt ? new Date(incident.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="card-row">
                  <strong>Reporter:</strong>
                  <span>{getReporterDisplayName(incident)}</span>
                </div>
                <div className="card-row">
                  <strong>Asset:</strong>
                  <span>{incident.assetName || incident.assetId || 'Unassigned'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="incident-list-table">
          <div className="incident-table-header">
            <span>Title</span>
            <span>Status</span>
            <span>Severity</span>
            <span>Category</span>
            <span>Reporter</span>
            <span>Reported</span>
            <span>Asset</span>
          </div>
          {filteredIncidents.map((incident) => (
            <div key={incident.id} className="incident-table-row" onClick={() => setSelectedIncident(incident)}>
              <span className="incident-table-cell incident-title-cell">
                <strong>{incident.title}</strong>
                <span className="incident-subtitle">#{incident.incidentNumber}</span>
              </span>
              <span className="incident-table-cell">
                <span className="status-chip" style={{ backgroundColor: getStatusColor(incident.status) }}>
                  {incident.status}
                </span>
              </span>
              <span className="incident-table-cell" style={{ color: getSeverityColor(incident.severity) }}>{incident.severity}</span>
              <span className="incident-table-cell">{incident.category}</span>
              <span className="incident-table-cell">{getReporterDisplayName(incident)}</span>
              <span className="incident-table-cell">{incident.createdAt ? new Date(incident.createdAt).toLocaleDateString() : 'N/A'}</span>
              <span className="incident-table-cell">{incident.assetName || incident.assetId || 'Unassigned'}</span>
            </div>
          ))}
        </div>
      )}

      {selectedIncident && (
        <div className="incident-modal-overlay" onClick={() => setSelectedIncident(null)}>
          <div className="incident-modal" onClick={(event) => event.stopPropagation()}>
            <div className="details-header">
              <h3>Incident Details</h3>
              <button className="close-btn" onClick={() => setSelectedIncident(null)}>✕</button>
            </div>

            <div className="details-content">
              <div className="detail-group">
                <h4>Reporter Information</h4>
                <div className="detail-row"><span className="label">Incident #:</span><span className="value">{selectedIncident.incidentNumber}</span></div>
                <div className="detail-row"><span className="label">Name:</span><span className="value">{getReporterDisplayName(selectedIncident)}</span></div>
                <div className="detail-row"><span className="label">Email:</span><span className="value">{selectedIncident.reporterEmail}</span></div>
                <div className="detail-row"><span className="label">Employee ID:</span><span className="value">{selectedIncident.reporterEmployeeId}</span></div>
                <div className="detail-row"><span className="label">Mobile:</span><span className="value">{selectedIncident.reporterMobile}</span></div>
                <div className="detail-row"><span className="label">Department:</span><span className="value">{selectedIncident.reporterDepartment}</span></div>
                <div className="detail-row"><span className="label">Asset:</span><span className="value">{selectedIncident.assetName || selectedIncident.assetId || 'N/A'}</span></div>
              </div>

              <div className="detail-group">
                <h4>Incident Summary</h4>
                <div className="detail-row"><span className="label">Severity:</span><span className="value" style={{ color: getSeverityColor(selectedIncident.severity) }}>{selectedIncident.severity}</span></div>
                <div className="detail-row"><span className="label">Category:</span><span className="value">{selectedIncident.category}</span></div>
                <div className="detail-row"><span className="label">Status:</span><span className="value" style={{ color: getStatusColor(selectedIncident.status) }}>{selectedIncident.status}</span></div>
                <div className="detail-row"><span className="label">Issue:</span><span className="value">{selectedIncident.title}</span></div>
                <p className="text-content">{selectedIncident.description}</p>
              </div>

              {selectedIncident.adminNotes && (
                <div className="detail-group admin-notes">
                  <h4>Admin Notes</h4>
                  <p className="text-content">{selectedIncident.adminNotes}</p>
                </div>
              )}

              <div className="detail-group">
                <h4>Comments ({selectedIncident.comments?.length || 0})</h4>
                <div className="comments-list">
                  {selectedIncident.comments && selectedIncident.comments.length > 0 ? (
                    selectedIncident.comments.map((comment, idx) => (
                      <div key={idx} className="comment">
                        <div className="comment-header">
                          <strong>{comment.authorName}</strong>
                          <span className="comment-role">{comment.authorRole}</span>
                          <span className="comment-time">{comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'N/A'}</span>
                        </div>
                        <p className="comment-text">{comment.text}</p>
                      </div>
                    ))
                  ) : (
                    <p className="no-comments">No comments yet</p>
                  )}
                </div>

                <div className="add-comment">
                  <textarea value={commentText} onChange={(event) => setCommentText(event.target.value)} placeholder="Add a comment..." rows={3} />
                  <button onClick={() => handleAddComment(selectedIncident.id || '')} disabled={submitting || !commentText.trim()} className="add-comment-btn">
                    Add Comment
                  </button>
                </div>
              </div>

              {isAdmin && (
                <div className="detail-group status-update">
                  <h4>Update Status</h4>
                  <select value={statusUpdate} onChange={(event) => setStatusUpdate(event.target.value)} className="status-select">
                    <option value="">-- Select New Status --</option>
                    <option value="open">Open</option>
                    <option value="work in progress">Work in Progress</option>
                    <option value="monitoring">Monitoring</option>
                    <option value="resolved">Resolved</option>
                  </select>
                  {statusUpdate && (
                    <textarea value={adminNote} onChange={(event) => setAdminNote(event.target.value)} placeholder="Admin notes (optional)..." rows={3} className="admin-note-input" />
                  )}
                  {statusUpdate && (
                    <button onClick={() => handleStatusUpdate(selectedIncident.id || '', statusUpdate)} disabled={submitting} className="update-status-btn">
                      {submitting ? 'Updating...' : 'Update Status'}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

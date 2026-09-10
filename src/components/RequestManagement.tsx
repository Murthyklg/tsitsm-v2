import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAssetRequests } from '../hooks/useAssetRequests';
import type { AssetRequest } from '../types/asset';
import './RequestManagement.css';

export const RequestManagement: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const { requests, loading, updateRequestStatus, addComment } = useAssetRequests(user?.uid, isAdmin);
  const [selectedRequest, setSelectedRequest] = useState<AssetRequest | null>(null);
  const [commentText, setCommentText] = useState('');
  const [statusUpdate, setStatusUpdate] = useState<string>('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isAdmin) {
    return (
      <div className="request-management">
        <p className="warning-message">Only admin users can manage requests.</p>
      </div>
    );
  }

  const handleStatusUpdate = async (requestId: string, newStatus: string) => {
    try {
      setSubmitting(true);
      await updateRequestStatus(requestId, newStatus as AssetRequest['status'], adminNote || undefined);
      setStatusUpdate('');
      setAdminNote('');
      setSelectedRequest(null);
      setSubmitting(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update status');
      setSubmitting(false);
    }
  };

  const handleAddComment = async (requestId: string) => {
    if (!commentText.trim()) {
      alert('Comment cannot be empty');
      return;
    }

    try {
      setSubmitting(true);
      await addComment(requestId, {
        authorId: user?.uid || '',
        authorName: user?.displayName || 'Admin',
        authorEmail: user?.email || '',
        authorRole: 'admin',
        text: commentText,
      });
      setCommentText('');
      setSubmitting(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add comment');
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#f39c12';
      case 'approved':
        return '#27ae60';
      case 'rejected':
        return '#e74c3c';
      case 'completed':
        return '#3498db';
      default:
        return '#95a5a6';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
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

  return (
    <div className="request-management">
      <div className="request-management-header">
        <h2>Asset Request Management</h2>
        <div className="request-stats">
          <span className="stat">
            Total: <strong>{requests.length}</strong>
          </span>
          <span className="stat">
            Pending: <strong>{requests.filter((r) => r.status === 'pending').length}</strong>
          </span>
        </div>
      </div>

      {loading ? (
        <div className="loading">Loading requests...</div>
      ) : requests.length === 0 ? (
        <div className="empty-state">No asset requests found.</div>
      ) : (
        <div className="requests-container">
          <div className="requests-list">
            {requests.map((request) => (
              <div
                key={request.id}
                className={`request-item ${selectedRequest?.id === request.id ? 'active' : ''}`}
                onClick={() => setSelectedRequest(request)}
              >
                <div className="request-item-header">
                  <div className="request-item-title">
                    <h3>{request.requesterName}</h3>
                    <span className="employee-id">{request.employeeId}</span>
                  </div>
                  <div className="request-item-badges">
                    <span className="status-badge" style={{ backgroundColor: getStatusColor(request.status) }}>
                      {request.status}
                    </span>
                    <span className="priority-badge" style={{ backgroundColor: getPriorityColor(request.priority) }}>
                      {request.priority}
                    </span>
                  </div>
                </div>
                <div className="request-item-details">
                  <p>
                    <strong>Category:</strong> {request.category}
                  </p>
                  <p>
                    <strong>Requested:</strong> {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {selectedRequest && (
            <div className="request-details-panel">
              <div className="details-header">
                <h3>Request Details</h3>
                <button className="close-btn" onClick={() => setSelectedRequest(null)}>
                  ✕
                </button>
              </div>

              <div className="details-content">
                <div className="detail-group">
                  <h4>Requester Information</h4>
                  <div className="detail-row">
                    <span className="label">Name:</span>
                    <span className="value">{selectedRequest.requesterName}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Email:</span>
                    <span className="value">{selectedRequest.requesterEmail}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Employee ID:</span>
                    <span className="value">{selectedRequest.employeeId}</span>
                  </div>
                </div>

                <div className="detail-group">
                  <h4>Asset Request Details</h4>
                  <div className="detail-row">
                    <span className="label">Category:</span>
                    <span className="value">{selectedRequest.category}</span>
                  </div>
                  <div className="detail-row">
                    <span className="label">Priority:</span>
                    <span className="value" style={{ color: getPriorityColor(selectedRequest.priority) }}>
                      {selectedRequest.priority}
                    </span>
                  </div>
                  {selectedRequest.manufacturer && (
                    <div className="detail-row">
                      <span className="label">Preferred Manufacturer:</span>
                      <span className="value">{selectedRequest.manufacturer}</span>
                    </div>
                  )}
                  {selectedRequest.model && (
                    <div className="detail-row">
                      <span className="label">Preferred Model:</span>
                      <span className="value">{selectedRequest.model}</span>
                    </div>
                  )}
                </div>

                {selectedRequest.specifications && (
                  <div className="detail-group">
                    <h4>Technical Specifications</h4>
                    <p className="text-content">{selectedRequest.specifications}</p>
                  </div>
                )}

                <div className="detail-group">
                  <h4>Justification</h4>
                  <p className="text-content">{selectedRequest.justification}</p>
                </div>

                {selectedRequest.adminNotes && (
                  <div className="detail-group admin-notes">
                    <h4>Admin Notes</h4>
                    <p className="text-content">{selectedRequest.adminNotes}</p>
                  </div>
                )}

                <div className="detail-group">
                  <h4>Comments ({selectedRequest.comments?.length || 0})</h4>
                  <div className="comments-list">
                    {selectedRequest.comments && selectedRequest.comments.length > 0 ? (
                      selectedRequest.comments.map((comment, idx) => (
                        <div key={idx} className="comment">
                          <div className="comment-header">
                            <strong>{comment.authorName}</strong>
                            <span className="comment-role">{comment.authorRole}</span>
                            <span className="comment-time">
                              {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'N/A'}
                            </span>
                          </div>
                          <p className="comment-text">{comment.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="no-comments">No comments yet</p>
                    )}
                  </div>

                  <div className="add-comment">
                    <textarea
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Add a comment..."
                      rows={3}
                    />
                    <button
                      onClick={() => handleAddComment(selectedRequest.id || '')}
                      disabled={submitting || !commentText.trim()}
                      className="add-comment-btn"
                    >
                      Add Comment
                    </button>
                  </div>
                </div>

                <div className="detail-group status-update">
                  <h4>Update Status</h4>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    className="status-select"
                  >
                    <option value="">-- Select New Status --</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>

                  {statusUpdate === 'rejected' && (
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Reason for rejection..."
                      rows={3}
                      className="admin-note-input"
                    />
                  )}

                  {statusUpdate === 'approved' && (
                    <textarea
                      value={adminNote}
                      onChange={(e) => setAdminNote(e.target.value)}
                      placeholder="Approval notes (optional)..."
                      rows={3}
                      className="admin-note-input"
                    />
                  )}

                  {statusUpdate && (
                    <button
                      onClick={() => handleStatusUpdate(selectedRequest.id || '', statusUpdate)}
                      disabled={submitting}
                      className="update-status-btn"
                    >
                      {submitting ? 'Updating...' : 'Update Status'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

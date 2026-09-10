import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchActivityLogs, type ActivityLogEntry, type ActivityModule } from '../utils/activityLogs';

interface ActivityLogsPanelProps {
  moduleFilter?: ActivityModule | 'all';
  extraModules?: ActivityModule[];
  title?: string;
}

const formatActivityDate = (date?: Date) => {
  if (!date) return 'N/A';
  try {
    return new Date(date).toLocaleString();
  } catch {
    return 'N/A';
  }
};

export const ActivityLogsPanel: React.FC<ActivityLogsPanelProps> = ({
  moduleFilter = 'all',
  extraModules = [],
  title = 'Activity Logs',
}) => {
  const { isAdmin } = useAuth();
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLogs = async () => {
      if (!isAdmin) {
        setLogs([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const entries = await fetchActivityLogs();
        const filteredEntries = moduleFilter === 'all'
          ? entries
          : entries.filter((entry) => {
              const allowedModules = new Set<ActivityModule>([...(extraModules || []), moduleFilter as ActivityModule]);
              return allowedModules.has(entry.module);
            });
        setLogs(filteredEntries);
      } finally {
        setLoading(false);
      }
    };

    loadLogs();

    const handleLogsUpdated = () => {
      void loadLogs();
    };

    window.addEventListener('asset-management-logs-updated', handleLogsUpdated);
    window.addEventListener('storage', handleLogsUpdated);

    return () => {
      window.removeEventListener('asset-management-logs-updated', handleLogsUpdated);
      window.removeEventListener('storage', handleLogsUpdated);
    };
  }, [isAdmin, moduleFilter, extraModules]);

  if (!isAdmin) {
    return null;
  }

  const handleDownloadCsv = () => {
    const rows = [
      ['Timestamp', 'Module', 'Action', 'Description', 'Target', 'Performed By', 'Email'],
    ];

    logs.forEach((log) => {
      rows.push([
        formatActivityDate(log.createdAt),
        log.module,
        log.action,
        log.description,
        log.targetName || '',
        log.performedBy,
        log.performedByEmail || '',
      ]);
    });

    const csvContent = rows
      .map((row) => row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${title.replace(/\s+/g, '-').toLowerCase()}-export.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <section className="assets-section">
      <div className="section-header">
        <h2>{title}</h2>
        <button className="add-asset-btn" onClick={handleDownloadCsv}>
          ⬇️ Download CSV
        </button>
      </div>

      {loading ? (
        <p>Loading activity logs...</p>
      ) : logs.length === 0 ? (
        <div className="empty-requests">
          <p>No activity has been recorded yet.</p>
        </div>
      ) : (
        <div className="activity-log-list">
          {logs.map((log) => (
            <div key={log.id} className="activity-log-item">
              <div className="activity-log-main">
                <div className="activity-log-title-row">
                  <strong>{log.module === 'incident' ? 'Incident' : log.module === 'auth' ? 'Authentication' : 'Asset'} • {log.action}</strong>
                  <span className="activity-log-time">{formatActivityDate(log.createdAt)}</span>
                </div>
                <div className="activity-log-details">
                  <span>{log.description}</span>
                  {log.targetName && <span>Target: {log.targetName}</span>}
                  <span>By: {log.performedBy}</span>
                  {log.performedByEmail && <span>Email: {log.performedByEmail}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

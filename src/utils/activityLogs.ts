import { apiRequest } from '../api';

export type ActivityModule = 'asset' | 'incident' | 'auth';

export interface ActivityLogEntry {
  id?: string;
  module: ActivityModule;
  action: string;
  description: string;
  performedBy: string;
  performedByEmail?: string;
  targetName?: string;
  targetId?: string;
  createdAt?: Date;
}

const LOCAL_ACTIVITY_LOGS_KEY = 'asset-management-local-activity-logs';
const ACTIVITY_LOGS_UPDATED_EVENT = 'asset-management-logs-updated';
const LOG_RETENTION_DAYS = 30;
const LOG_RETENTION_MS = LOG_RETENTION_DAYS * 24 * 60 * 60 * 1000;

const normalizeLogEntry = (entry: Partial<ActivityLogEntry> & { createdAt?: Date | { toDate?: () => Date } | string | null }, fallbackId?: string): ActivityLogEntry => {
  const createdAt = entry.createdAt instanceof Date
    ? entry.createdAt
    : typeof entry.createdAt === 'string'
      ? new Date(entry.createdAt)
      : entry.createdAt && typeof entry.createdAt === 'object'
        ? (() => {
            const maybeTimestamp = entry.createdAt as { toDate?: () => Date };
            return typeof maybeTimestamp.toDate === 'function' ? maybeTimestamp.toDate() : new Date();
          })()
        : new Date();

  return {
    id: entry.id || fallbackId || `${createdAt.getTime()}`,
    module: (entry.module as ActivityLogEntry['module']) || 'asset',
    action: entry.action || 'activity',
    description: entry.description || '',
    performedBy: entry.performedBy || 'System',
    performedByEmail: entry.performedByEmail || '',
    targetName: entry.targetName,
    targetId: entry.targetId,
    createdAt,
  };
};

const readLocalActivityLogs = (): ActivityLogEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_ACTIVITY_LOGS_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((entry, index) => normalizeLogEntry(entry as Partial<ActivityLogEntry> & { createdAt?: Date | { toDate?: () => Date } | string }, `local-${index}`))
      .filter((entry) => (Date.now() - (entry.createdAt?.getTime?.() ?? 0)) <= LOG_RETENTION_MS);
  } catch (error) {
    console.error('Failed to read local activity logs', error);
    return [];
  }
};

const writeLocalActivityLogs = (entries: ActivityLogEntry[]) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(LOCAL_ACTIVITY_LOGS_KEY, JSON.stringify(entries));
    window.dispatchEvent(new CustomEvent(ACTIVITY_LOGS_UPDATED_EVENT));
  } catch (error) {
    console.error('Failed to save local activity logs', error);
  }
};

export const logActivityEvent = async (entry: Omit<ActivityLogEntry, 'id' | 'createdAt'>) => {
  const localEntry: ActivityLogEntry = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    createdAt: new Date(),
  };

  const existingLocalLogs = readLocalActivityLogs();
  const nextLocalLogs = [localEntry, ...existingLocalLogs]
    .filter((entry) => (Date.now() - (entry.createdAt?.getTime?.() ?? 0)) <= LOG_RETENTION_MS)
    .slice(0, 200);
  writeLocalActivityLogs(nextLocalLogs);
  try {
    await apiRequest('/activity-logs', { method: 'POST', body: JSON.stringify(entry) });
  } catch (error) {
    console.error('Failed to persist activity log', error);
  }
};

export const fetchActivityLogs = async (): Promise<ActivityLogEntry[]> => {
  const remoteLogs: ActivityLogEntry[] = [];
  try {
    const entries = await apiRequest<Array<Partial<ActivityLogEntry> & { CreatedAt?: string; Id?: string }>>('/activity-logs');
    remoteLogs.push(...entries.map((entry) => normalizeLogEntry({ ...entry, id: entry.id || entry.Id, createdAt: entry.createdAt ? new Date(entry.createdAt) : entry.CreatedAt ? new Date(entry.CreatedAt) : undefined })));
  } catch (error) {
    console.error('Failed to fetch activity logs from SQL API', error);
  }

  const localLogs = readLocalActivityLogs();
  const mergedLogs = [...remoteLogs, ...localLogs];
  const uniqueLogs = mergedLogs.reduce<ActivityLogEntry[]>((acc, log) => {
    const key = log.id || `${log.module}-${log.action}-${log.description}-${log.performedBy}-${log.createdAt?.getTime()}`;
    if (!acc.some((entry) => (entry.id && entry.id === key) || (!entry.id && !log.id && entry.description === log.description && entry.performedBy === log.performedBy && entry.createdAt?.getTime() === log.createdAt?.getTime()))) {
      acc.push(log);
    }
    return acc;
  }, []);

  return uniqueLogs
    .filter((entry) => (Date.now() - (entry.createdAt?.getTime?.() ?? 0)) <= LOG_RETENTION_MS)
    .sort((a, b) => (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0));
};

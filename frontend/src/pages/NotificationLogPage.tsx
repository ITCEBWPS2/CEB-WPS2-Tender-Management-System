import { useEffect, useState } from 'react';
import { Search, Bell, Play, RefreshCw, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { apiFetch } from '../utils/api';
import { Button } from '../components/ui/Button';

export interface NotificationLogItem {
  id: string;
  recordId: string;
  notificationType: 'deadline_15' | 'deadline_10' | 'deadline_5' | 'deadline_1' | string;
  recipientEmail: string;
  recipientRole?: string;
  status: 'sent' | 'failed' | 'skipped' | string;
  errorMessage?: string | null;
  sentAt: string;
  tenderNumber: string;
  category?: string;
  bidClosingDate?: string | null;
}

export function NotificationLogPage() {
  const [logs, setLogs] = useState<NotificationLogItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testSummary, setTestSummary] = useState<any | null>(null);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiFetch('/api/notifications');
      if (!res.ok) {
        throw new Error('Failed to fetch notification logs from server');
      }
      const data = await res.json();
      setLogs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load notification logs', err);
      setError(err.message || 'Failed to load notification logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRunTestNow = async () => {
    setIsRunningTest(true);
    setTestSummary(null);
    try {
      const res = await apiFetch('/api/notifications/test-run', {
        method: 'POST'
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to run test' }));
        throw new Error(err.message || 'Failed to execute test run');
      }
      const summary = await res.json();
      setTestSummary(summary);
      await loadLogs();
    } catch (err: any) {
      console.error('Test run failed:', err);
      alert(err.message || 'Failed to execute notification test run');
    } finally {
      setIsRunningTest(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch =
      (log.tenderNumber || '').toLowerCase().includes(searchLower) ||
      (log.recipientEmail || '').toLowerCase().includes(searchLower) ||
      (log.recipientRole || '').toLowerCase().includes(searchLower);

    const typeMatch = typeFilter === 'All' || log.notificationType === typeFilter;
    const statusMatch = statusFilter === 'All' || log.status.toLowerCase() === statusFilter.toLowerCase();

    return searchMatch && typeMatch && statusMatch;
  });

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'deadline_15':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">15 Days Left</span>;
      case 'deadline_10':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">10 Days Left</span>;
      case 'deadline_5':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-800">5 Days Left</span>;
      case 'deadline_1':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">1 Day Left</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">{type}</span>;
    }
  };

  const getStatusBadge = (status: string, errorMsg?: string | null) => {
    const s = (status || '').toLowerCase();
    if (s === 'sent') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
          <CheckCircle2 className="w-3.5 h-3.5" /> Sent
        </span>
      );
    }
    if (s === 'failed') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800" title={errorMsg || 'Send failed'}>
          <AlertCircle className="w-3.5 h-3.5" /> Failed
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
        <Clock className="w-3.5 h-3.5" /> {status}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-amber-700" />
            <h2 className="text-2xl font-bold text-slate-900">Notification Log</h2>
          </div>
          <p className="text-slate-500 text-sm mt-1">
            Track scheduled email deadline reminders sent to administrators and personnel
          </p>
        </div>

        <Button
          onClick={handleRunTestNow}
          disabled={isRunningTest}
          className="flex items-center justify-center gap-2 bg-[#bd5d2a] hover:bg-[#a34f22] text-white shadow-sm"
        >
          {isRunningTest ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Running Check...
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Run Test Now
            </>
          )}
        </Button>
      </div>

      {/* Summary Alert after manual test run */}
      {testSummary && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-emerald-900">
            <p className="font-bold">Deadline Reminder Check Completed!</p>
            <p className="mt-1">
              Checked <strong>{testSummary.recordsChecked || 0}</strong> record(s):{' '}
              <span className="text-emerald-700 font-semibold">{testSummary.emailsSent || 0} email(s) sent</span>,{' '}
              <span className="text-red-700 font-semibold">{testSummary.emailsFailed || 0} failed</span>,{' '}
              <span className="text-slate-600">{testSummary.skippedAlreadySent || 0} skipped (already sent)</span>.
            </p>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by tender number, email, or role..."
              className="w-full h-10 pl-9 rounded-md border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>

          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
          >
            <option value="All">All Types</option>
            <option value="deadline_15">15 Days</option>
            <option value="deadline_10">10 Days</option>
            <option value="deadline_5">5 Days</option>
            <option value="deadline_1">1 Day</option>
          </select>

          <select
            className="h-10 rounded-md border border-slate-300 px-3 text-sm focus:ring-2 focus:ring-amber-500 focus:border-transparent outline-none bg-white"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-600" />
            Loading notification logs...
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 bg-red-50">
            {error}
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notification log entries found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4">Tender Number</th>
                  <th className="py-3 px-4">Reminder Type</th>
                  <th className="py-3 px-4">Recipient</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Sent Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {log.tenderNumber}
                    </td>
                    <td className="py-3 px-4">
                      {getTypeBadge(log.notificationType)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{log.recipientEmail}</div>
                      {log.recipientRole && (
                        <div className="text-xs text-slate-500">{log.recipientRole}</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(log.status, log.errorMessage)}
                      {log.errorMessage && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate" title={log.errorMessage}>
                          {log.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-xs">
                      {log.sentAt ? new Date(log.sentAt).toLocaleString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit, Eye, CheckSquare, Clock } from 'lucide-react';
import { DataTable } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/Button';
import { Record as TmsRecord } from '../../utils/types';
import { apiFetch } from '../../utils/api';

export function ClerkDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<TmsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadClerkTasks = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch('/api/records');
        if (!res.ok) {
          throw new Error('Failed to load task queue records');
        }
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Clerk dashboard load error', err);
        setError(err.message || 'Failed to load task queue');
      } finally {
        setIsLoading(false);
      }
    };
    loadClerkTasks();
  }, []);

  // Filter records needing data entry/updates
  const pendingTasks = records.filter(r => {
    const s = (r.status || '').toString().toLowerCase();
    return s.includes('evaluation') || s.includes('doc review') || s.includes('retender') || s.includes('re-evaluation');
  });

  const columns = [
    {
      header: 'Tender No',
      accessorKey: 'tenderNumber' as keyof TmsRecord,
      cell: (record: TmsRecord) => (
        <span className="font-semibold text-slate-900">{record.tenderNumber}</span>
      )
    },
    {
      header: 'Description',
      accessorKey: 'description' as keyof TmsRecord,
      cell: (record: TmsRecord) => (
        <span className="text-slate-700 max-w-xs truncate block" title={record.description}>
          {record.description}
        </span>
      )
    },
    {
      header: 'Department',
      accessorKey: 'relevantTo' as keyof TmsRecord
    },
    {
      header: 'Closing Date',
      accessorKey: 'bidClosingDate' as keyof TmsRecord,
      cell: (record: TmsRecord) => (
        <span className="text-slate-600 text-sm">
          {record.bidClosingDate ? new Date(record.bidClosingDate).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status' as keyof TmsRecord,
      cell: (record: TmsRecord) => (
        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
          {record.status}
        </span>
      )
    },
    {
      header: 'Quick Action',
      accessorKey: ((record: TmsRecord) => record.id) as any,
      cell: (record: TmsRecord) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => navigate(`/clerk/records/edit/${record.id}`)}
            className="flex items-center gap-1 text-xs text-slate-700 border-slate-300 hover:bg-slate-50"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Data
          </Button>
          <button
            onClick={() => navigate(`/clerk/records/view/${record.id}`)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Record"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Prominent Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Clerk Work Queue</h2>
          <p className="text-slate-500 text-sm mt-1">Pending data entry and tender record maintenance queue</p>
        </div>
        <Button
          onClick={() => navigate('/clerk/records/add')}
          size="lg"
          className="flex items-center justify-center gap-2 bg-[#bd5d2a] hover:bg-[#a34f22] text-white shadow-md"
        >
          <Plus className="w-5 h-5" /> Add New Record
        </Button>
      </div>

      {/* Task Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600 flex-shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Data Entry / Updates</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{pendingTasks.length} tasks</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
            <CheckSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Records in System</p>
            <p className="text-2xl font-bold text-slate-900 mt-0.5">{records.length} records</p>
          </div>
        </div>
      </div>

      {/* Focused Task List Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-800">My Assigned Records (Action Required)</h3>
          <span className="text-xs text-slate-500 font-medium">{pendingTasks.length} items requiring update</span>
        </div>
        <DataTable
          data={pendingTasks}
          columns={columns}
          searchKey="tenderNumber"
          searchPlaceholder="Search by Tender Number..."
          isLoading={isLoading}
          error={error}
          emptyMessage="All data entry tasks complete! No pending records."
        />
      </div>
    </div>
  );
}

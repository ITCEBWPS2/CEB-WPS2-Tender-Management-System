import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, AlertCircle, Plus, Eye, Edit } from 'lucide-react';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { DataTable } from '../../components/shared/DataTable';
import { Button } from '../../components/ui/Button';
import { Record as TmsRecord } from '../../utils/types';
import { apiFetch } from '../../utils/api';

export function ProcurementDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<TmsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProcurementData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await apiFetch('/api/records');
        if (!res.ok) {
          throw new Error('Failed to load procurement records');
        }
        const data = await res.json();
        setRecords(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Procurement dashboard load error', err);
        setError(err.message || 'Failed to load procurement data');
      } finally {
        setIsLoading(false);
      }
    };
    loadProcurementData();
  }, []);

  // Procurement KPIs
  const awaitingCommittee = records.filter(r => !r.tecCommitteeNumber || r.tecCommitteeNumber.trim() === '').length;
  const openForBidding = records.filter(r => {
    const s = (r.status || '').toString().toLowerCase();
    return s.includes('doc review') || s.includes('draft') || (r.bidClosingDate && new Date(r.bidClosingDate) > new Date());
  }).length;
  const underEvaluation = records.filter(r => {
    const s = (r.status || '').toString().toLowerCase();
    return s.includes('evaluation') || s.includes('re-evaluation');
  }).length;
  const pendingBidderApproval = records.filter(r => {
    const s = (r.status || '').toString().toLowerCase();
    return !r.awardedTo || s.includes('negotiate');
  }).length;

  // Upcoming Tenders (sorted by closing date)
  const upcomingTenders = [...records].sort((a, b) => {
    const dateA = a.bidClosingDate ? new Date(a.bidClosingDate).getTime() : Infinity;
    const dateB = b.bidClosingDate ? new Date(b.bidClosingDate).getTime() : Infinity;
    return dateA - dateB;
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
      header: 'Category',
      accessorKey: 'category' as keyof TmsRecord
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
      cell: (record: TmsRecord) => {
        const s = record.status || '';
        let colorClass = 'bg-slate-100 text-slate-700';
        if (s === 'Awarded') colorClass = 'bg-green-100 text-green-800';
        else if (s.includes('Evaluation')) colorClass = 'bg-blue-100 text-blue-800';
        else if (s === 'Retender') colorClass = 'bg-orange-100 text-orange-800';
        else if (s === 'Reject' || s === 'Rejected') colorClass = 'bg-red-100 text-red-800';
        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
            {s}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      accessorKey: ((record: TmsRecord) => record.id) as any,
      cell: (record: TmsRecord) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(`/procurement/records/view/${record.id}`)}
            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            title="View Record"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate(`/procurement/records/edit/${record.id}`)}
            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
            title="Edit Record"
          >
            <Edit className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header & Quick Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Procurement Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Active tender lifecycle tracking & deadline management</p>
        </div>
        <Button
          onClick={() => navigate('/procurement/records/add')}
          className="flex items-center justify-center gap-2 bg-[#bd5d2a] hover:bg-[#a34f22] text-white"
        >
          <Plus className="w-4 h-4" /> Create New Tender
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Awaiting Committee Assignment"
          value={awaitingCommittee}
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Open for Bidding"
          value={openForBidding}
          icon={FileText}
          color="blue"
        />
        <KpiCard
          title="Under Evaluation"
          value={underEvaluation}
          icon={CheckCircle}
          color="green"
        />
        <KpiCard
          title="Pending Bidder Award"
          value={pendingBidderApproval}
          icon={AlertCircle}
          color="red"
        />
      </div>

      {/* Upcoming Closing Tenders Table */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-800">Upcoming Tenders & Deadlines</h3>
        <DataTable
          data={upcomingTenders}
          columns={columns}
          searchKey="tenderNumber"
          searchPlaceholder="Search by Tender Number..."
          isLoading={isLoading}
          error={error}
          emptyMessage="No active tenders found."
        />
      </div>
    </div>
  );
}

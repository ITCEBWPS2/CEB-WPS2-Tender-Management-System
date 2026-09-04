import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gavel, Clock, CheckCircle, Eye } from 'lucide-react';
import { KpiCard } from '../../components/dashboard/KpiCard';
import { DataTable } from '../../components/shared/DataTable';
import { Record as TmsRecord, Committee } from '../../utils/types';
import { apiFetch } from '../../utils/api';

interface CommitteeWorkload extends Committee {
  assignedCount: number;
}

export function CecomDashboard() {
  const navigate = useNavigate();
  const [records, setRecords] = useState<TmsRecord[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCecomData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [recordsRes, committeesRes] = await Promise.all([
          apiFetch('/api/records'),
          apiFetch('/api/committees')
        ]);

        if (!recordsRes.ok || !committeesRes.ok) {
          throw new Error('Failed to load CECOM committee data');
        }

        const recordsData = await recordsRes.json();
        const committeesData = await committeesRes.json();

        setRecords(Array.isArray(recordsData) ? recordsData : []);
        setCommittees(Array.isArray(committeesData) ? committeesData : []);
      } catch (err: any) {
        console.error('CECOM dashboard load error', err);
        setError(err.message || 'Failed to load CECOM data');
      } finally {
        setIsLoading(false);
      }
    };
    loadCecomData();
  }, []);

  // CECOM KPIs
  const activeCommittees = committees.length;
  const pendingReview = records.filter(r => {
    const s = (r.status || '').toString().toLowerCase();
    return s.includes('evaluation') || s.includes('doc review');
  }).length;
  const awardedCount = records.filter(r => (r.status || '').toString().toLowerCase() === 'awarded').length;

  // Compute workload for each committee
  const committeeWorkloads: CommitteeWorkload[] = committees.map(c => {
    const assignedCount = records.filter(r => {
      if (r.tecCommitteeNumber && c.committeeNumber) {
        return r.tecCommitteeNumber.trim().toLowerCase() === c.committeeNumber.trim().toLowerCase();
      }
      return (
        r.tecChairman === c.member1 ||
        r.tecMember1 === c.member2 ||
        r.tecMember2 === c.member3
      );
    }).length;

    return {
      ...c,
      assignedCount
    };
  });

  const columns = [
    {
      header: 'Committee No',
      accessorKey: 'committeeNumber' as keyof CommitteeWorkload,
      cell: (item: CommitteeWorkload) => (
        <span className="font-semibold text-slate-900">{item.committeeNumber}</span>
      )
    },
    {
      header: 'Chairman',
      accessorKey: 'member1' as keyof CommitteeWorkload,
      cell: (item: CommitteeWorkload) => (
        <span className="text-slate-800">{item.member1}</span>
      )
    },
    {
      header: 'Members',
      accessorKey: ((item: CommitteeWorkload) => item.id) as any,
      cell: (item: CommitteeWorkload) => (
        <span className="text-slate-600 text-sm">
          {[item.member2, item.member3].filter(Boolean).join(', ')}
        </span>
      )
    },
    {
      header: 'Assigned Tenders',
      accessorKey: 'assignedCount' as keyof CommitteeWorkload,
      cell: (item: CommitteeWorkload) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.assignedCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'}`}>
          {item.assignedCount} records
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: ((item: CommitteeWorkload) => item.id) as any,
      cell: (item: CommitteeWorkload) => (
        <button
          onClick={() => navigate('/cecom/bid-opening')}
          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
        >
          <Eye className="w-4 h-4" /> View Details
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">CECOM Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Committee workload allocation and evaluation review overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KpiCard
          title="Active Committees"
          value={activeCommittees}
          icon={Gavel}
          color="blue"
        />
        <KpiCard
          title="Records Pending Committee Review"
          value={pendingReview}
          icon={Clock}
          color="amber"
        />
        <KpiCard
          title="Awarded Records"
          value={awardedCount}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Committee Workload Table */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-slate-800">Committee Workload Allocation</h3>
        <DataTable
          data={committeeWorkloads}
          columns={columns}
          searchKey="committeeNumber"
          searchPlaceholder="Search Committee Number..."
          isLoading={isLoading}
          error={error}
          emptyMessage="No committees found."
        />
      </div>
    </div>
  );
}

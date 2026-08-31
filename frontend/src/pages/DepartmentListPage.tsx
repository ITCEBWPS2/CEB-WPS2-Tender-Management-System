import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '../components/shared/DataTable';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { Department } from '../utils/types';
import { apiFetch } from '../utils/api';

export function DepartmentListPage() {
  const navigate = useNavigate();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('All');

  // Fetch and clean user role from session storage
  const getCleanRole = (): string => {
    const storedUser = sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed && parsed.role) return parsed.role.toLowerCase().trim();
      } catch (e) {}
    }
    return 'guest'; 
  };

  const userRole = getCleanRole();

  const handleDelete = () => {
    (async () => {
      if (!deleteId) return;

      // Restrict delete access for Clerk role
      if (userRole === 'clerk') {
        alert('Access Denied: Clerks are not authorized to delete units! Only Admins can perform this action. 🛑');
        setDeleteId(null);
        return;
      }

      try {
        const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
        const res = await apiFetch(`/api/departments/${deleteId}`, {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (res.ok) {
          setDepartments(prev => prev.filter(d => d.id !== deleteId));
        } else {
          const err = await res.json().catch(() => ({ message: 'Failed to delete' }));
          alert(err.message || 'Error: Failed to delete unit.');
        }
      } catch (err) {
        console.error(err);
        alert('Error: Failed to delete unit.');
      } finally {
        setDeleteId(null);
      }
    })();
  };

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
        const res = await apiFetch('/api/departments', {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!res.ok) throw new Error('Failed to fetch units from server');
        const data = await res.json();
        const mapped = Array.isArray(data) ? data.map((d: any) => ({ ...d, id: d._id || d.id })) : [];
        setDepartments(mapped);
      } catch (err: any) {
        console.error('Failed to load departments', err);
        setError(err.message || 'Failed to load units');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const filteredDepartments = departments.filter(department => {
    return statusFilter === 'All' || department.status === statusFilter;
  });

  // Table columns configuration with updated English headers
  const columns = [{
    header: 'Unit Name', 
    accessorKey: 'name' as keyof Department
  }, {
    header: 'Code',
    accessorKey: 'code' as keyof Department
  }, {
    header: 'Description',
    accessorKey: 'description' as keyof Department,
    cell: (item: Department) => <span className="block max-w-md truncate" title={item.description}>
          {item.description}
        </span>
  }, {
    header: 'Head of Unit', 
    accessorKey: 'headOfDepartment' as keyof Department
  }, {
    header: 'Status',
    accessorKey: 'status' as keyof Department,
    cell: (item: Department) => {
      const colors = {
        Active: 'bg-green-100 text-green-800',
        Inactive: 'bg-gray-100 text-gray-800'
      };
      return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[item.status]}`}>
            {item.status}
          </span>;
    }
  }, {
    header: 'Actions',
    accessorKey: 'id' as keyof Department,
    cell: (item: Department) => <div className="flex items-center gap-2">
          
          {/* Restrict Edit/Modification access to Admins only */}
          <button 
            onClick={() => {
              if (userRole === 'clerk') {
                alert('Access Denied: Clerks are not authorized to edit units! Only Admins can perform this action. 🛑');
                return;
              }
              navigate(`/departments/edit/${item.id}`);
            }} 
            className="p-1 text-slate-400 hover:text-blue-600 transition-colors" 
            title="Edit"
          >
            <Edit2 className="w-4 h-4" />
          </button>

          <button onClick={() => setDeleteId(item.id)} className="p-1 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
  }];

  return <div className="space-y-6">
      {/* Top Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Unit Management
          </h2>
          <p className="text-slate-500">
            Manage organizational units
          </p>
        </div>
        <Button onClick={() => navigate('/departments/add')} leftIcon={<Plus className="w-4 h-4" />}>
          Add New Unit
        </Button>
      </div>

      {/* Main Data Table View */}
      <DataTable 
        data={filteredDepartments} 
        columns={columns} 
        searchKey="name" 
        searchPlaceholder="Search by unit name..." 
        isLoading={isLoading}
        error={error}
        emptyMessage="No units found."
        filters={<Select className="w-32" options={[{
          value: 'All',
          label: 'All Status'
        }, {
          value: 'Active',
          label: 'Active'
        }, {
          value: 'Inactive',
          label: 'Inactive'
        }]} value={statusFilter} onChange={e => setStatusFilter(e.target.value)} />} 
      />

      {/* Confirmation Modal for Deletion */}
      <Modal isOpen={!!deleteId} onClose={() => setDeleteId(null)} title="Delete Unit" footer={<>
            <Button variant="ghost" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Unit
            </Button>
          </>}>
        <p className="text-slate-600">
          Are you sure you want to delete this unit? This action cannot be undone.
        </p>
      </Modal>
    </div>;
}
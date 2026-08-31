import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Staff } from '../utils/types';
import { apiFetch } from '../utils/api';
export function AddEditStaffPage() {
  const navigate = useNavigate();
  const {
    id
  } = useParams();
  const isEdit = !!id;
  const [formData, setFormData] = useState<Partial<Staff>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
        const res = await apiFetch(`/api/staff/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!res.ok) throw new Error('Failed to fetch staff member details');
        const data = await res.json();
        const normalized = { ...data, id: data._id || data.id };
        setFormData(normalized);
      } catch (err: any) {
        console.error('Failed to load staff', err);
        setFetchError(err.message || 'Failed to load staff member details');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      setErrors({
        name: 'Name is required',
        email: 'Email is required'
      });
      return;
    }
    (async () => {
      try {
        const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
        const url = isEdit ? `/api/staff/${id}` : '/api/staff';
        const method = isEdit ? 'PUT' : 'POST';
        const body = { ...formData } as any;
        Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
        const res = await apiFetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to save staff' }));
          alert(err.message || 'Failed to save staff');
          return;
        }
        navigate('/tec-staff');
      } catch (err) {
        console.error(err);
        alert('Failed to save staff');
      }
    })();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading staff details...</span>
      </div>
    );
  }

  return <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate('/tec-staff')} className="p-2 hover:bg-slate-100 rounded-full">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h2 className="text-2xl font-bold text-slate-900">
          {isEdit ? 'Edit Staff' : 'Add New Staff'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 space-y-6">
        {fetchError && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4">
            {fetchError}
          </div>
        )}
        <Input label="Full Name" name="name" value={formData.name || ''} onChange={handleChange} error={errors.name} />
        <Input label="Email Address" name="email" type="email" value={formData.email || ''} onChange={handleChange} error={errors.email} />
        <Input label="Department / Area" name="area" value={formData.area || ''} onChange={handleChange} />
        <Input label="Designation" name="designation" value={formData.designation || ''} onChange={handleChange} />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate('/tec-staff')}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Save Member
          </Button>
        </div>
      </form>
    </div>;
}
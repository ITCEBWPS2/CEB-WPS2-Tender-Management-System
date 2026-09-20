import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Staff } from '../utils/types';
import { apiFetch } from '../utils/api';
import { useRolePath } from '../utils/rolePath';

export const STAFF_TITLES = ['Eng.', 'Mr.', 'Mrs.', 'Miss'] as const;

const TITLE_OPTIONS = [
  { value: '', label: 'Title' },
  ...STAFF_TITLES.map(t => ({ value: t, label: t }))
];

export function parseStaffName(fullName = '') {
  const trimmed = fullName.trim();
  for (const t of STAFF_TITLES) {
    if (trimmed === t) {
      return { title: t, name: '' };
    }
    if (trimmed.startsWith(t + ' ')) {
      return {
        title: t,
        name: trimmed.slice(t.length).trim()
      };
    }
  }
  return { title: '', name: trimmed };
}

export function formatStaffName(title: string, name: string) {
  const cleanTitle = title.trim();
  const cleanName = name.trim();
  if (cleanTitle && cleanName) {
    return `${cleanTitle} ${cleanName}`;
  }
  return cleanName || cleanTitle;
}

export function AddEditStaffPage() {
  const navigate = useNavigate();
  const { path } = useRolePath();
  const { id } = useParams();
  const isEdit = !!id;

  const [formData, setFormData] = useState<Partial<Staff>>({});
  const [selectedTitle, setSelectedTitle] = useState('');
  const [nameOnly, setNameOnly] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      if (!isEdit) return;
      setIsLoading(true);
      setFetchError(null);
      try {
        const res = await apiFetch(`/api/staff/${id}`);
        if (!res.ok) throw new Error('Failed to fetch staff member details');
        const data = await res.json();
        const normalized = { ...data, id: data._id || data.id };
        const { title, name } = parseStaffName(normalized.name || '');
        setSelectedTitle(title);
        setNameOnly(name);
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
    if (errors[e.target.name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[e.target.name];
        return newErrors;
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNameOnly = nameOnly.trim();
    if (!trimmedNameOnly) {
      setErrors({
        name: 'Name is required'
      });
      return;
    }

    const combinedName = formatStaffName(selectedTitle, trimmedNameOnly);

    (async () => {
      try {
        const url = isEdit ? `/api/staff/${id}` : '/api/staff';
        const method = isEdit ? 'PUT' : 'POST';
        const cleanEmail = formData.email && formData.email.trim() !== '' ? formData.email.trim() : null;
        const body: Record<string, any> = {
          ...formData,
          name: combinedName,
          email: cleanEmail
        };
        Object.keys(body).forEach(k => body[k] === undefined && delete body[k]);
        const res = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to save staff' }));
          alert(err.message || 'Failed to save staff');
          return;
        }
        navigate(path('/tec-staff'));
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

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <button onClick={() => navigate(path('/tec-staff'))} className="p-2 hover:bg-slate-100 rounded-full">
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 items-start">
            <div className="w-28 flex-shrink-0">
              <Select
                name="title"
                value={selectedTitle}
                onChange={(e) => setSelectedTitle(e.target.value)}
                options={TITLE_OPTIONS}
              />
            </div>
            <div className="flex-1">
              <Input
                name="name"
                value={nameOnly}
                onChange={(e) => {
                  setNameOnly(e.target.value);
                  if (errors.name) {
                    setErrors(prev => ({ ...prev, name: '' }));
                  }
                }}
                error={errors.name}
                placeholder="e.g. Nimal Perera"
              />
            </div>
          </div>
        </div>

        <Input
          label="Email Address (Optional)"
          name="email"
          type="email"
          value={formData.email || ''}
          onChange={handleChange}
          error={errors.email}
          placeholder="e.g. nimal.perera@ceb.lk"
        />

        <Input
          label="Unit"
          name="area"
          value={formData.area || ''}
          onChange={handleChange}
          placeholder="e.g. Transmission Planning"
        />

        <Input
          label="Designation"
          name="designation"
          value={formData.designation || ''}
          onChange={handleChange}
          placeholder="e.g. Chief Engineer"
        />

        <div className="flex justify-end gap-4 pt-4">
          <Button type="button" variant="secondary" onClick={() => navigate(path('/tec-staff'))}>
            Cancel
          </Button>
          <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
            Save Member
          </Button>
        </div>
      </form>
    </div>
  );
}
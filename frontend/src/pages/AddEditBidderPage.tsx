import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Textarea } from '../components/ui/Textarea';
import { Bidder } from '../utils/types';
import { apiFetch } from '../utils/api';

export function AddEditBidderPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = !!id;
  const [formData, setFormData] = useState<Partial<Bidder>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(isEdit);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const getBidderListPath = () => {
    const storedUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (storedUser) {
      try {
        const role = (JSON.parse(storedUser).role || '').toLowerCase().trim();
        if (role === 'procurement') return '/procurement/bidders';
        if (role === 'cecom') return '/cecom/bidders';
        if (role === 'clerk') return '/clerk/bidders';
      } catch (e) {}
    }
    return '/admin/bidders';
  };

  useEffect(() => {
    if (isEdit) {
      (async () => {
        setIsLoading(true);
        setFetchError(null);
        try {
          const res = await apiFetch(`/api/bidders/${id}`);
          if (!res.ok) throw new Error('Failed to fetch supplier details');
          const data = await res.json();
          setFormData({ ...data, id: data._id || data.id });
        } catch (err: any) {
          console.error('Failed to load supplier', err);
          setFetchError(err.message || 'Failed to load supplier details');
        } finally {
          setIsLoading(false);
        }
      })();
    }
  }, [id, isEdit]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Supplier name is required';
    if (formData.contact && formData.contact.trim() && !/^\+94\d{9}$/.test(formData.contact.trim())) {
      newErrors.contact = 'Contact number must be in Sri Lankan +94 format (e.g. +94771234567)';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    (async () => {
      try {
        const payload = {
          name: formData.name,
          email: formData.email,
          contact: formData.contact,
          address: formData.address
        };
        const url = isEdit ? `/api/bidders/${id}` : '/api/bidders';
        const method = isEdit ? 'PUT' : 'POST';
        const res = await apiFetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({ message: 'Failed to save' }));
          setErrors({ submit: err.message || 'Failed to save supplier' });
          return;
        }
        navigate(getBidderListPath());
      } catch (err) {
        console.error(err);
        setErrors({ submit: 'Failed to save supplier due to a network error' });
      }
    })();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-slate-600 font-medium">Loading supplier details...</span>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      <div className="flex-shrink-0 flex items-center gap-4 mb-6">
        <button onClick={() => navigate(getBidderListPath())} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            {isEdit ? 'Edit Supplier' : 'Add New Supplier'}
          </h2>
          <p className="text-slate-500">
            {isEdit ? `Editing ${formData.name}` : 'Create a new supplier / bidder'}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8 space-y-6">
          {(fetchError || errors.submit) && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
              {fetchError || errors.submit}
            </div>
          )}

          <Input
            label="Supplier / Company Name"
            name="name"
            value={formData.name || ''}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Lanka Electrical Co."
            required
          />

          <Input
            label="Email Address"
            name="email"
            type="email"
            value={formData.email || ''}
            onChange={handleChange}
            error={errors.email}
            placeholder="e.g. info@lankaelectrical.lk"
          />

          <Input
            label="Contact Number (+94 Sri Lankan format)"
            name="contact"
            value={formData.contact || ''}
            onChange={handleChange}
            error={errors.contact}
            placeholder="e.g. +94771234567"
          />

          <Textarea
            label="Address"
            name="address"
            value={formData.address || ''}
            onChange={handleChange}
            error={errors.address}
            placeholder="Detailed company address..."
            rows={3}
          />

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
            <Button type="button" variant="secondary" onClick={() => navigate(getBidderListPath())}>
              Cancel
            </Button>
            <Button type="submit" leftIcon={<Save className="w-4 h-4" />}>
              {isEdit ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
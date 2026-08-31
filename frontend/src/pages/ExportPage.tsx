import { useState } from 'react';
import { Download, FileText, FileSpreadsheet, Calendar } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { DatePicker } from '../components/ui/DatePicker';
import { apiFetch } from '../utils/api';

export function ExportPage() {
  const [exportFormat, setExportFormat] = useState('excel');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const handleExportRecords = async () => {
    setIsExporting(true);
    setExportError(null);
    try {
      console.log('Exporting system records...', {
        exportFormat,
        dateFrom,
        dateTo,
        category,
        status
      });

      const token = sessionStorage.getItem('mock-auth-token') || sessionStorage.getItem('authToken');
      const res = await apiFetch('/api/records', {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!res.ok) throw new Error('Failed to fetch records for export');
      
      const allRecords: any[] = await res.json();
      let filtered: any[] = Array.isArray(allRecords) ? allRecords : [];

      // Frontend filtering engines
      if (category !== 'All') {
        filtered = filtered.filter((r: any) => (r.category || '').toString().toLowerCase() === category.toLowerCase());
      }

      if (status !== 'All') {
        filtered = filtered.filter((r: any) => {
          const s = (r.status || '').toString().toLowerCase();
          if (status === 'Under Evaluation') {
            return s.includes('evaluation') || s.includes('evacuation');
          }
          return s === status.toLowerCase();
        });
      }

      if (dateFrom) {
        filtered = filtered.filter((r: any) => new Date(r.date) >= new Date(dateFrom));
      }

      if (dateTo) {
        filtered = filtered.filter((r: any) => new Date(r.date) <= new Date(dateTo));
      }

      if (filtered.length === 0) {
        setExportError('No records match the selected export criteria.');
        return;
      }

      // Generate the real styled spreadsheet blob
      if (exportFormat === 'excel') {
        const excelHtml = `
          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
          <head>
            <style>
              th { background-color: #bd5d2a; color: white; font-weight: bold; padding: 8px; }
              td { padding: 6px; border: 1px solid #cbd5e1; }
            </style>
          </head>
          <body>
            <table border="1">
              <thead>
                <tr>
                  <th>Tender ID</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Delay (Days)</th>
                </tr>
              </thead>
              <tbody>
                ${filtered.map((r: any) => `
                  <tr>
                    <td>${r.id || ''}</td>
                    <td>${r.title || ''}</td>
                    <td>${r.category || ''}</td>
                    <td>${r.status || ''}</td>
                    <td>${r.date || ''}</td>
                    <td>${r.supplier || ''}</td>
                    <td>${r.delay || 0}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
          </html>
        `;
        const blob = new Blob([excelHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tender_Records_${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      } else {
        const headers = ['Tender ID', 'Title', 'Category', 'Status', 'Date', 'Supplier', 'Delay (Days)'];
        const csvRows = filtered.map((r: any) => [
          r.id || '',
          `"${(r.title || '').replace(/"/g, '""')}"`,
          r.category || '',
          r.status || '',
          r.date || '',
          `"${(r.supplier || '').replace(/"/g, '""')}"`,
          r.delay || 0
        ]);
        const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Tender_Records_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      console.error('Export Error:', error);
      setExportError(error.message || 'Failed to export records');
    } finally {
      setIsExporting(false);
    }
  };

  // 📝 2️⃣ Static document template downloads
  const handleDownloadTechnicalGood = () => {
    console.log('Downloading Technical Evaluation Good document...');
    const a = document.createElement('a');
    a.href = '/templates/Technical_Evaluation_Good.docx';
    a.download = 'Technical_Evaluation_Good.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadTechnicalService = () => {
    console.log('Downloading Final Technical Evaluation Service document...');
    const a = document.createElement('a');
    a.href = '/templates/Final_Technical_Evaluation_Service.docx';
    a.download = 'Final_Technical_Evaluation_Service.docx';
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return <div className="space-y-6">
      {/* Download System Records */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-blue-100 rounded-lg">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Download System Records
            </h3>
            <p className="text-sm text-slate-500">
              Export all tender records with customizable filters and date ranges
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Select label="Export Format" value={exportFormat} onChange={e => setExportFormat(e.target.value)} options={[{
            value: 'excel',
            label: 'Excel (.xls)'
          }, {
            value: 'csv',
            label: 'CSV (.csv)'
          }]} />

            <Select label="Category Filter" value={category} onChange={e => setCategory(e.target.value)} options={[{
            value: 'All',
            label: 'All Categories'
          }, {
            value: 'Goods',
            label: 'Goods'
          }, {
            value: 'Services',
            label: 'Services'
          }, {
            value: 'Works',
            label: 'Works'
          }, {
            value: 'Consultancy',
            label: 'Consultancy'
          }]} />

            <Select label="Status Filter" value={status} onChange={e => setStatus(e.target.value)} options={[{
            value: 'All',
            label: 'All Status'
          }, {
            value: 'Under Evaluation',
            label: 'Under Evaluation'
          }, {
            value: 'Doc Review',
            label: 'Doc Review'
          }, {
            value: 'Awarded',
            label: 'Awarded'
          }, {
            value: 'Reject',
            label: 'Reject'
          }, {
            value: 'Close',
            label: 'Close'
          }]} />

            <div className="flex items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date Range (Optional)
                </label>
                <p className="text-xs text-slate-500">
                  Leave empty for all records
                </p>
              </div>
            </div>

            <DatePicker label="From Date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />

            <DatePicker label="To Date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
          </div>

          {exportError && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm mb-4">
              {exportError}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <Button onClick={handleExportRecords} isLoading={isExporting} leftIcon={<Download className="w-4 h-4" />}>
              Download System Records
            </Button>
          </div>
        </div>
      </div>

      {/* Technical Evaluation Documents */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Technical Evaluation Good */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-green-100 rounded-lg">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Technical Evaluation Good
              </h3>
              <p className="text-sm text-slate-500">
                Download the technical evaluation template for goods procurement
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">File Format:</span>
              <span className="font-medium text-slate-900">
                Microsoft Word (.docx)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-600">Template Type:</span>
              <span className="font-medium text-slate-900">
                Goods Evaluation
              </span>
            </div>
          </div>

          <Button onClick={handleDownloadTechnicalGood} leftIcon={<Download className="w-4 h-4" />} className="w-full" variant="secondary">
            Download Template
          </Button>
        </div>

        {/* Final Technical Evaluation Service */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 bg-purple-100 rounded-lg">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">
                Final Technical Evaluation Service
              </h3>
              <p className="text-sm text-slate-500">
                Download the final technical evaluation template for service contracts
              </p>
            </div>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">File Format:</span>
              <span className="font-medium text-slate-900">
                Microsoft Word (.docx)
              </span>
            </div>
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-slate-600">Template Type:</span>
              <span className="font-medium text-slate-900">
                Service Evaluation
              </span>
            </div>
          </div>

          <Button onClick={handleDownloadTechnicalService} leftIcon={<Download className="w-4 h-4" />} className="w-full" variant="secondary">
            Download Template
          </Button>
        </div>
      </div>
    </div>;
}
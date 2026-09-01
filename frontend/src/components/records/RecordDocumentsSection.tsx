import React, { useState, useRef } from 'react';
import { 
  Paperclip, 
  UploadCloud, 
  Download, 
  Trash2, 
  FileText, 
  Image as ImageIcon, 
  FileCheck, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  Loader2 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { RecordDocument } from '../../utils/types';
import { apiFetch } from '../../utils/api';

interface RecordDocumentsSectionProps {
  recordId: string;
  documents: RecordDocument[];
  canDelete: boolean;
  onDocumentsChange: (docs: RecordDocument[]) => void;
}

export function RecordDocumentsSection({
  recordId,
  documents = [],
  canDelete,
  onDocumentsChange
}: RecordDocumentsSectionProps) {
  const [stagedFiles, setStagedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [deleteDoc, setDeleteDoc] = useState<RecordDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const allowedExtensions = ['.pdf', '.docx', '.doc', '.jpg', '.jpeg', '.png'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return 'Recent';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return String(dateStr);
    }
  };

  const getDocIcon = (filename: string, mimeType: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (ext === 'pdf' || mimeType.includes('pdf')) {
      return (
        <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 font-black text-xs">
          PDF
        </div>
      );
    }
    if (['doc', 'docx'].includes(ext) || mimeType.includes('word')) {
      return (
        <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 font-black text-xs">
          DOC
        </div>
      );
    }
    if (['jpg', 'jpeg', 'png'].includes(ext) || mimeType.includes('image')) {
      return (
        <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
          <ImageIcon className="w-5 h-5" />
        </div>
      );
    }
    return (
      <div className="w-10 h-10 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center flex-shrink-0">
        <FileText className="w-5 h-5" />
      </div>
    );
  };

  const validateFiles = (files: File[]): boolean => {
    setUploadError(null);
    for (const file of files) {
      if (file.size > maxFileSize) {
        setUploadError(`"${file.name}" exceeds the 10MB file limit.`);
        return false;
      }
      const ext = '.' + (file.name.split('.').pop() || '').toLowerCase();
      if (!allowedExtensions.includes(ext)) {
        setUploadError(`"${file.name}" has an unsupported format. Allowed: PDF, DOCX, DOC, JPG, PNG.`);
        return false;
      }
    }
    return true;
  };

  const handleFileSelection = (newFiles: FileList | null) => {
    if (!newFiles || newFiles.length === 0) return;
    const fileArray = Array.from(newFiles);
    if (validateFiles(fileArray)) {
      setStagedFiles(prev => [...prev, ...fileArray]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelection(e.dataTransfer.files);
  };

  const removeStagedFile = (index: number) => {
    setStagedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (stagedFiles.length === 0) {
      setUploadError('Please select at least one document to upload.');
      return;
    }

    if (!validateFiles(stagedFiles)) return;

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
      const formData = new FormData();
      stagedFiles.forEach(file => {
        formData.append('files', file);
      });

      const res = await apiFetch(`/api/records/${recordId}/documents`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Document upload failed' }));
        throw new Error(err.message || 'Document upload failed');
      }

      const data = await res.json();
      const updatedDocs = data.documents || [];
      onDocumentsChange(updatedDocs);
      setStagedFiles([]);
      setUploadSuccess(`Successfully uploaded ${stagedFiles.length} document(s).`);
      setTimeout(() => setUploadSuccess(null), 4000);
    } catch (err: any) {
      console.error('Failed to upload document:', err);
      setUploadError(err.message || 'Failed to upload document.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (doc: RecordDocument) => {
    const docId = doc._id || doc.id;
    if (!docId) return;

    try {
      const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
      const res = await apiFetch(`/api/records/${recordId}/documents/${docId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Download failed' }));
        throw new Error(err.message || 'Download failed');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.originalName || 'document';
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (err: any) {
      console.error('Download error:', err);
      alert(err.message || 'Failed to download document');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDoc) return;
    const docId = deleteDoc._id || deleteDoc.id;
    if (!docId) return;

    setIsDeleting(true);
    try {
      const token = sessionStorage.getItem('authToken') || sessionStorage.getItem('mock-auth-token');
      const res = await apiFetch(`/api/records/${recordId}/documents/${docId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Failed to delete document' }));
        throw new Error(err.message || 'Failed to delete document');
      }

      const data = await res.json();
      onDocumentsChange(data.documents || []);
      setDeleteDoc(null);
    } catch (err: any) {
      console.error('Delete error:', err);
      alert(err.message || 'Failed to delete document');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Paperclip className="w-5 h-5 text-[#bd5d2a]" />
          Documents & Attachments
        </h3>
        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
          {documents.length} {documents.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      {/* Upload Dropzone */}
      <div className="space-y-4">
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200 ${
            isDragOver 
              ? 'border-[#bd5d2a] bg-[#bd5d2a]/5 scale-[0.99]' 
              : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
            className="hidden"
            onChange={(e) => handleFileSelection(e.target.files)}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-[#bd5d2a] flex items-center justify-center">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-800">
                Click to browse or drag & drop documents here
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Supports proposals, meeting minutes, and verifications (PDF, DOCX, JPG, PNG up to 10MB)
              </p>
            </div>
          </div>
        </div>

        {/* Staged files for upload */}
        {stagedFiles.length > 0 && (
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Selected Files ({stagedFiles.length})
              </span>
              <button
                onClick={() => setStagedFiles([])}
                className="text-xs text-red-600 hover:underline font-medium"
              >
                Clear all
              </button>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
              {stagedFiles.map((file, idx) => (
                <div 
                  key={idx} 
                  className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCheck className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="font-semibold text-slate-800 truncate">{file.name}</span>
                    <span className="text-slate-400">({formatFileSize(file.size)})</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeStagedFile(idx);
                    }}
                    className="p-1 text-slate-400 hover:text-red-600 rounded-full transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2">
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                leftIcon={isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
              >
                {isUploading ? 'Uploading Files...' : `Upload ${stagedFiles.length} File${stagedFiles.length > 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        )}

        {/* Alerts */}
        {uploadError && (
          <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-500" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="p-3.5 bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600" />
            <span>{uploadSuccess}</span>
          </div>
        )}
      </div>

      {/* Documents List */}
      <div className="space-y-3 pt-2">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Attached Files
        </h4>

        {documents.length === 0 ? (
          <div className="text-center py-8 px-4 bg-slate-50/50 rounded-xl border border-slate-100">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-600">No documents attached yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Upload scanned tender proposals, technical evaluations, or meeting minutes above.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden bg-white">
            {documents.map((doc) => {
              const docId = doc._id || doc.id || '';
              return (
                <div
                  key={docId}
                  className="flex items-center justify-between p-4 hover:bg-slate-50/80 transition-colors gap-4"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    {getDocIcon(doc.originalName || doc.filename, doc.mimeType || '')}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 truncate" title={doc.originalName}>
                        {doc.originalName}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5 font-medium">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>•</span>
                        <span>Uploaded by {doc.uploadedByName || doc.uploadedByEmail || 'Staff'}</span>
                        <span>•</span>
                        <span>{formatDate(doc.uploadedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-2 text-slate-600 hover:text-[#bd5d2a] hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                      title="Download document"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Download</span>
                    </button>

                    {canDelete && (
                      <button
                        onClick={() => setDeleteDoc(doc)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-semibold"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteDoc}
        onClose={() => setDeleteDoc(null)}
        title="Delete Document"
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeleteDoc(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              disabled={isDeleting}
              onClick={handleDeleteConfirm}
              leftIcon={isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            >
              {isDeleting ? 'Deleting...' : 'Delete Document'}
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600 leading-relaxed">
          Are you sure you want to permanently delete the document{' '}
          <strong className="text-slate-900 font-bold">"{deleteDoc?.originalName}"</strong>?
          This action cannot be undone and will be recorded in the system audit log.
        </p>
      </Modal>
    </div>
  );
}

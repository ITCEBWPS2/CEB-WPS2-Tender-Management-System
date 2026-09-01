import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ViewRecordPage } from '../pages/ViewRecordPage';
import * as apiModule from '../utils/api';

describe('ViewRecordPage & Documents Section Smoke Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  const mockRecordWithDocs = {
    _id: 'rec_doc_123',
    tenderNumber: 'CEB/WPS2/2026/DOC-001',
    relevantTo: 'Distribution',
    category: 'Goods',
    description: 'Procurement of switchgear with scanned attachments',
    status: 'In Progress',
    documents: [
      {
        _id: 'doc_1',
        filename: 'proposal-1234.pdf',
        originalName: 'Proposal_Scanned.pdf',
        mimeType: 'application/pdf',
        size: 1048576, // 1 MB
        uploadedByName: 'Clerk User',
        uploadedByEmail: 'clerk@ceb-tms.local',
        uploadedAt: new Date().toISOString()
      },
      {
        _id: 'doc_2',
        filename: 'minutes-5678.docx',
        originalName: 'Meeting_Minutes.docx',
        mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        size: 524288, // 512 KB
        uploadedByName: 'Procurement Officer',
        uploadedByEmail: 'proc@ceb.lk',
        uploadedAt: new Date().toISOString()
      }
    ]
  };

  it('renders record details and documents section with upload dropzone', async () => {
    sessionStorage.setItem('user', JSON.stringify({ role: 'Clerk', email: 'clerk@ceb-tms.local' }));

    vi.spyOn(apiModule, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => mockRecordWithDocs
    } as Response);

    render(
      <MemoryRouter initialEntries={['/records/view/rec_doc_123']}>
        <Routes>
          <Route path="/records/view/:id" element={<ViewRecordPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Verify record header
    await waitFor(() => {
      expect(screen.getByText('CEB/WPS2/2026/DOC-001')).toBeInTheDocument();
    });

    // Verify Documents section header
    expect(screen.getByText('Documents & Attachments')).toBeInTheDocument();
    expect(screen.getByText('Click to browse or drag & drop documents here')).toBeInTheDocument();

    // Verify document items rendered
    expect(screen.getByText('Proposal_Scanned.pdf')).toBeInTheDocument();
    expect(screen.getByText('Meeting_Minutes.docx')).toBeInTheDocument();
    expect(screen.getAllByTitle('Download document')).toHaveLength(2);

    // Verify Delete button is NOT rendered for Clerk role
    expect(screen.queryByTitle('Delete document')).not.toBeInTheDocument();
  });

  it('renders Delete button for Admin role', async () => {
    sessionStorage.setItem('user', JSON.stringify({ role: 'Admin', email: 'abc@gmail.com' }));

    vi.spyOn(apiModule, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => mockRecordWithDocs
    } as Response);

    render(
      <MemoryRouter initialEntries={['/records/view/rec_doc_123']}>
        <Routes>
          <Route path="/records/view/:id" element={<ViewRecordPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CEB/WPS2/2026/DOC-001')).toBeInTheDocument();
    });

    // Verify Delete button IS rendered for Admin role
    expect(screen.getAllByTitle('Delete document')).toHaveLength(2);
  });
});

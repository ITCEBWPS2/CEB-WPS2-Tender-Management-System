import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../components/layout/Sidebar';
import { TecStaffPage } from '../pages/TecStaffPage';
import { DepartmentListPage } from '../pages/DepartmentListPage';
import { CategoryListPage } from '../pages/CategoryListPage';
import { BidderListPage } from '../pages/BidderListPage';
import { BidOpeningCommitteePage } from '../pages/BidOpeningCommitteePage';
import { RecordsPage } from '../pages/RecordsPage';
import { ViewRecordPage } from '../pages/ViewRecordPage';
import { AddEditCommitteePage } from '../pages/AddEditCommitteePage';
import { AuthProvider } from '../context/AuthContext';
import * as apiModule from '../utils/api';

describe('Role-based access & Full Permission Matrix', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  // ---------------------------------------------------------------------------
  // 1. Sidebar Item Visibility
  // ---------------------------------------------------------------------------
  describe('Sidebar item visibility across all 6 roles', () => {
    const rolesWithAdd = ['Admin', 'Super Admin', 'Procurement', 'Clerk'];
    const rolesReadOnly = ['CECOM', 'User'];

    rolesWithAdd.forEach((role) => {
      it(`shows Add sub-items for ${role}`, () => {
        localStorage.setItem('user', JSON.stringify({ role, name: `${role} User`, email: `${role}@ceb.lk` }));

        render(
          <MemoryRouter>
            <AuthProvider>
              <Sidebar isOpen={true} setIsOpen={() => { /* noop */ }} />
            </AuthProvider>
          </MemoryRouter>
        );

        expect(screen.getByText('Add Record')).toBeInTheDocument();
        expect(screen.getByText('Add Staff')).toBeInTheDocument();
        expect(screen.getByText('Add Unit')).toBeInTheDocument();
        expect(screen.getByText('Add Category')).toBeInTheDocument();
        expect(screen.getByText('Add Supplier')).toBeInTheDocument();
        expect(screen.getByText('Add Committee')).toBeInTheDocument();
      });
    });

    rolesReadOnly.forEach((role) => {
      it(`hides Add sub-items for ${role} but shows view list links`, () => {
        localStorage.setItem('user', JSON.stringify({ role, name: `${role} User`, email: `${role}@ceb.lk` }));

        render(
          <MemoryRouter>
            <AuthProvider>
              <Sidebar isOpen={true} setIsOpen={() => { /* noop */ }} />
            </AuthProvider>
          </MemoryRouter>
        );

        // Parent items visible
        expect(screen.getByText('Records')).toBeInTheDocument();
        expect(screen.getByText('Staff')).toBeInTheDocument();
        expect(screen.getByText('Units')).toBeInTheDocument();
        expect(screen.getByText('Categories')).toBeInTheDocument();
        expect(screen.getByText('Bidders')).toBeInTheDocument();
        expect(screen.getByText('TEC Committee')).toBeInTheDocument();

        // View list sub-items visible
        expect(screen.getByText('All Records')).toBeInTheDocument();
        expect(screen.getByText('Staff List')).toBeInTheDocument();
        expect(screen.getByText('Unit List')).toBeInTheDocument();
        expect(screen.getByText('Category List')).toBeInTheDocument();
        expect(screen.getByText('Supplier List')).toBeInTheDocument();
        expect(screen.getByText('View All Committees')).toBeInTheDocument();

        // Add sub-items MUST be hidden
        expect(screen.queryByText('Add Record')).not.toBeInTheDocument();
        expect(screen.queryByText('Add Staff')).not.toBeInTheDocument();
        expect(screen.queryByText('Add Unit')).not.toBeInTheDocument();
        expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
        expect(screen.queryByText('Add Supplier')).not.toBeInTheDocument();
        expect(screen.queryByText('Add Committee')).not.toBeInTheDocument();
      });
    });

    it('shows User Management, Audit Log, Notification Log ONLY for Admin and Super Admin', () => {
      const noop = () => { /* noop */ };
      // Super Admin
      localStorage.setItem('user', JSON.stringify({ role: 'Super Admin', name: 'Super Admin', email: 'sa@ceb.lk' }));
      const { unmount } = render(
        <MemoryRouter>
          <AuthProvider>
            <Sidebar isOpen={true} setIsOpen={noop} />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
      expect(screen.getByText('Notification Log')).toBeInTheDocument();
      unmount();

      // Clerk, Procurement, CECOM, User must NOT see them
      ['Procurement', 'Clerk', 'CECOM', 'User'].forEach((role) => {
        localStorage.setItem('user', JSON.stringify({ role, name: `${role} User`, email: `${role}@ceb.lk` }));
        const { unmount: u } = render(
          <MemoryRouter>
            <AuthProvider>
              <Sidebar isOpen={true} setIsOpen={noop} />
            </AuthProvider>
          </MemoryRouter>
        );
        expect(screen.queryByText('User Management')).not.toBeInTheDocument();
        expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
        expect(screen.queryByText('Notification Log')).not.toBeInTheDocument();
        u();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 2. RecordsPage Permissions
  // ---------------------------------------------------------------------------
  describe('RecordsPage permission enforcement', () => {
    const mockRecord = {
      id: 'rec-1',
      tenderNumber: 'CEB/TEST/2026/01',
      category: 'Transformers',
      relevantTo: 'Transmission',
      description: 'Test record',
      status: 'Under Evaluation',
      documents: []
    };

    beforeEach(() => {
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string) => {
        if (url.includes('/api/records')) {
          return { ok: true, json: async () => [mockRecord] } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      });
    });

    it('allows Admin full CRUD actions (Add, Edit, Delete, View)', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', name: 'Admin User', email: 'admin@ceb.lk' }));
      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.getByText('Add New Record')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument());
      expect(screen.getByTitle('View Record')).toBeInTheDocument();
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('allows Super Admin full CRUD actions (Add, Edit, Delete, View)', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Super Admin', name: 'Super Admin', email: 'sa@ceb.lk' }));
      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.getByText('Add New Record')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.getByTitle('Delete')).toBeInTheDocument();
    });

    it('allows Procurement Add and Edit, but hides Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Procurement', name: 'Proc User', email: 'proc@ceb.lk' }));
      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.getByText('Add New Record')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('allows Clerk Add and Edit, but hides Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));
      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.getByText('Add New Record')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('restricts CECOM to View only (no Add, no Edit, no Delete)', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'CECOM', name: 'CECOM User', email: 'cecom@ceb.lk' }));
      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.queryByText('Add New Record')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument());
      expect(screen.getByTitle('View Record')).toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('restricts User role to View only (no Add, no Edit, no Delete)', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'User', name: 'Standard User', email: 'user@ceb.lk' }));
      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );
      expect(screen.queryByText('Add New Record')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument());
      expect(screen.getByTitle('View Record')).toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Business Resources List Pages (Staff, Units, Categories, Bidders, Committees)
  // ---------------------------------------------------------------------------
  describe('Resource list pages permission matrix', () => {
    it('allows Clerk Add and Edit on TecStaffPage but denies Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Eng. John Doe', email: 'john@ceb.lk', area: 'Unit A', designation: 'Engineer' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <TecStaffPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Eng. John Doe')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('allows Procurement Add and Edit on TecStaffPage but denies Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Procurement', name: 'Proc User', email: 'proc@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Eng. John Doe', email: 'john@ceb.lk', area: 'Unit A', designation: 'Engineer' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <TecStaffPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Add Staff Member')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Eng. John Doe')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('denies CECOM Add, Edit, Delete on TecStaffPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'CECOM', name: 'CECOM User', email: 'cecom@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Eng. John Doe', email: 'john@ceb.lk', area: 'Unit A', designation: 'Engineer' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <TecStaffPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add Staff Member')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Eng. John Doe')).toBeInTheDocument());
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('denies User Add, Edit, Delete on TecStaffPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'User', name: 'User 1', email: 'user@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Eng. John Doe', email: 'john@ceb.lk', area: 'Unit A', designation: 'Engineer' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <TecStaffPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add Staff Member')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Eng. John Doe')).toBeInTheDocument());
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('allows Clerk Add and Edit on DepartmentListPage but denies Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Finance Unit', code: 'FIN', description: 'Finance', headOfDepartment: 'HOD', status: 'Active' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <DepartmentListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Add New Unit')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Finance Unit')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('allows Clerk Add and Edit on CategoryListPage but denies Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Transformers', description: 'Power equipment', status: 'Active' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <CategoryListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Add New Category')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Transformers')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('allows Clerk Add and Edit on BidderListPage but denies Delete', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [{ id: '1', name: 'Acme Supplies', email: 'acme@test.com', contact: '0112345678', address: 'Colombo' }]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <BidderListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Add supplier')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('Acme Supplies')).toBeInTheDocument());
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 4. ViewRecordPage & Document Actions
  // ---------------------------------------------------------------------------
  describe('ViewRecordPage & Document actions', () => {

    const mockDoc = {
      _id: 'doc-1',
      originalName: 'specs.pdf',
      mimeType: 'application/pdf',
      fileSize: 1024,
      uploadedAt: '2026-09-01T00:00:00Z',
      uploadedByName: 'Uploader'
    };

    const mockRecordDetail = {
      id: 'rec-123',
      tenderNumber: 'CEB/VIEW/01',
      category: 'Cables',
      relevantTo: 'Distribution',
      status: 'Awarded',
      documents: [mockDoc]
    };

    beforeEach(() => {
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string) => {
        if (url.includes('/documents')) {
          return { ok: true, json: async () => [mockDoc] } as Response;
        }
        return { ok: true, json: async () => mockRecordDetail } as Response;
      });
    });

    it('allows Admin to Edit record, Upload document, and Delete document', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', email: 'admin@ceb.lk' }));
      render(
        <MemoryRouter initialEntries={['/admin/records/view/rec-123']}>
          <AuthProvider>
            <Routes>
              <Route path="/admin/records/view/:id" element={<ViewRecordPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('CEB/VIEW/01')).toBeInTheDocument());
      expect(screen.getByText('Edit Record')).toBeInTheDocument();
      expect(screen.getByText('Click to browse or drag & drop documents here')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByTitle('Delete document')).toBeInTheDocument());
    });

    it('allows Clerk to Edit record and Upload document, but hides Delete document', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', email: 'clerk@ceb.lk' }));
      render(
        <MemoryRouter initialEntries={['/clerk/records/view/rec-123']}>
          <AuthProvider>
            <Routes>
              <Route path="/clerk/records/view/:id" element={<ViewRecordPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('CEB/VIEW/01')).toBeInTheDocument());
      expect(screen.getByText('Edit Record')).toBeInTheDocument();
      expect(screen.getByText('Click to browse or drag & drop documents here')).toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('specs.pdf')).toBeInTheDocument());
      expect(screen.queryByTitle('Delete document')).not.toBeInTheDocument();
    });

    it('restricts CECOM to View/Download document, hiding Edit record, Upload, and Delete document', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'CECOM', email: 'cecom@ceb.lk' }));
      render(
        <MemoryRouter initialEntries={['/cecom/records/view/rec-123']}>
          <AuthProvider>
            <Routes>
              <Route path="/cecom/records/view/:id" element={<ViewRecordPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('CEB/VIEW/01')).toBeInTheDocument());
      expect(screen.queryByText('Edit Record')).not.toBeInTheDocument();
      expect(screen.queryByText('Click to browse or drag & drop documents here')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('specs.pdf')).toBeInTheDocument());
      expect(screen.getByTitle('Download document')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete document')).not.toBeInTheDocument();
    });

    it('restricts User role to View/Download document, hiding Edit record, Upload, and Delete document', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'User', email: 'user@ceb.lk' }));
      render(
        <MemoryRouter initialEntries={['/user/records/view/rec-123']}>
          <AuthProvider>
            <Routes>
              <Route path="/user/records/view/:id" element={<ViewRecordPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('CEB/VIEW/01')).toBeInTheDocument());
      expect(screen.queryByText('Edit Record')).not.toBeInTheDocument();
      expect(screen.queryByText('Click to browse or drag & drop documents here')).not.toBeInTheDocument();
      await waitFor(() => expect(screen.getByText('specs.pdf')).toBeInTheDocument());
      expect(screen.getByTitle('Download document')).toBeInTheDocument();
      expect(screen.queryByTitle('Delete document')).not.toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // 5. TEC Committee Appointed Date Optionality & Display
  // ---------------------------------------------------------------------------
  describe('TEC Committee Appointed Date', () => {
    it('displays "-" on BidOpeningCommitteePage when appointedDate is missing or null', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', email: 'admin@ceb.lk' }));
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => ({
        ok: true,
        json: async () => [
          {
            id: 'com-1',
            committeeNumber: 'COM-001',
            appointedDate: null,
            member1: 'Chair',
            member2: 'M1',
            member3: 'M2',
            status: 'Active'
          }
        ]
      } as Response));

      render(
        <MemoryRouter>
          <AuthProvider>
            <BidOpeningCommitteePage />
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => expect(screen.getByText('COM-001')).toBeInTheDocument());
      // "-" should be rendered in the table for appointedDate
      expect(screen.getAllByText('-').length).toBeGreaterThan(0);
    });

    it('labels Appointed Date as optional and submits null when left blank on AddEditCommitteePage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Admin', email: 'admin@ceb.lk' }));

      // Mock staff fetch for dropdowns
      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string, options?: RequestInit) => {
        if (url.includes('/api/staff')) {
          return {
            ok: true,
            json: async () => [
              { id: 'st-1', name: 'Member One' },
              { id: 'st-2', name: 'Member Two' },
              { id: 'st-3', name: 'Member Three' }
            ]
          } as Response;
        }
        if (options && options.method === 'POST') {
          return {
            ok: true,
            json: async () => ({ id: 'com-new' })
          } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      });

      render(
        <MemoryRouter initialEntries={['/admin/bid-opening/add']}>
          <AuthProvider>
            <Routes>
              <Route path="/admin/bid-opening/add" element={<AddEditCommitteePage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      // Verify the label explicitly states "(Optional)"
      expect(screen.getByText('Appointed Date (Optional)')).toBeInTheDocument();

      // Fill in required fields
      fireEvent.change(screen.getByPlaceholderText('e.g. TEC/2023/001'), {
        target: { value: 'COM-TEST-999' }
      });

      // Select members
      await waitFor(() => {
        const selects = screen.getAllByRole('combobox');
        expect(selects.length).toBeGreaterThanOrEqual(3);
      });

      const memberSelects = screen.getAllByRole('combobox');
      fireEvent.change(memberSelects[0], { target: { value: 'Member One' } });
      fireEvent.change(memberSelects[1], { target: { value: 'Member Two' } });
      fireEvent.change(memberSelects[2], { target: { value: 'Member Three' } });

      // Leave Appointed Date empty and submit
      const saveBtn = screen.getByRole('button', { name: /create committee/i });
      fireEvent.click(saveBtn);

      await waitFor(() => {
        expect(apiModule.apiFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/committees'),
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"appointedDate":null')
          })
        );
      });
    });
  });
});

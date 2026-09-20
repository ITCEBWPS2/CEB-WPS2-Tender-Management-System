import { render, screen, waitFor } from '@testing-library/react';
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
import { ClerkDashboard } from '../pages/clerk/ClerkDashboard';
import { AuthProvider } from '../context/AuthContext';
import * as apiModule from '../utils/api';

describe('Role-based access & Clerk restrictions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Sidebar item visibility', () => {
    it('hides Add Record, Add Staff, Add Unit, Add Category, Add Supplier, Add Committee for Clerk', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      render(
        <MemoryRouter>
          <AuthProvider>
            <Sidebar isOpen={true} setIsOpen={() => { /* noop */ }} />
          </AuthProvider>
        </MemoryRouter>
      );

      // Parent items should be visible
      expect(screen.getByText('Records')).toBeInTheDocument();
      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Units')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Bidders')).toBeInTheDocument();
      expect(screen.getByText('TEC Committee')).toBeInTheDocument();

      // Sub-items for viewing lists should be visible
      expect(screen.getByText('All Records')).toBeInTheDocument();
      expect(screen.getByText('Staff List')).toBeInTheDocument();
      expect(screen.getByText('Unit List')).toBeInTheDocument();
      expect(screen.getByText('Category List')).toBeInTheDocument();
      expect(screen.getByText('Supplier List')).toBeInTheDocument();
      expect(screen.getByText('View All Committees')).toBeInTheDocument();

      // Add sub-items MUST be hidden from Clerk
      expect(screen.queryByText('Add Record')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Staff')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Unit')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Supplier')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Committee')).not.toBeInTheDocument();
    });

    it('hides User Management, Audit Log, and Notification Log for CECOM', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'CECOM', name: 'CECOM User', email: 'cecom@ceb.lk' }));

      render(
        <MemoryRouter>
          <AuthProvider>
            <Sidebar isOpen={true} setIsOpen={() => { /* noop */ }} />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('User Management')).not.toBeInTheDocument();
      expect(screen.queryByText('Audit Log')).not.toBeInTheDocument();
      expect(screen.queryByText('Notification Log')).not.toBeInTheDocument();
    });

    it('shows Add sub-items, User Management, Audit Log, Notification Log for Admin and treats Super Admin as Admin', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Super Admin', name: 'Super Admin', email: 'admin@ceb.lk' }));

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
      expect(screen.getByText('User Management')).toBeInTheDocument();
      expect(screen.getByText('Audit Log')).toBeInTheDocument();
      expect(screen.getByText('Notification Log')).toBeInTheDocument();
    });
  });

  describe('RecordsPage role restrictions', () => {
    const mockRecord = {
      id: 'rec-1',
      tenderNumber: 'CEB/TEST/2026/01',
      category: 'Transformers',
      relevantTo: 'Transmission',
      description: 'Test record',
      status: 'Under Evaluation',
      documents: []
    };

    it('hides Add New Record and Edit/Delete buttons for Clerk, keeps View and Documents', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string) => {
        if (url.includes('/api/records')) {
          return { ok: true, json: async () => [mockRecord] } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Add New Record must NOT be shown to Clerk
      expect(screen.queryByText('Add New Record')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument();
      });

      // View and Documents buttons must be present
      expect(screen.getByTitle('View Record')).toBeInTheDocument();
      expect(screen.getByTitle('Documents (0)')).toBeInTheDocument();

      // Edit and Delete buttons must NOT be present for Clerk
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('allows Add New Record and Edit for Procurement, but hides Delete button', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Procurement', name: 'Proc User', email: 'proc@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string) => {
        if (url.includes('/api/records')) {
          return { ok: true, json: async () => [mockRecord] } as Response;
        }
        return { ok: true, json: async () => [] } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <RecordsPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Add New Record MUST be shown to Procurement
      expect(screen.getByText('Add New Record')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('CEB/TEST/2026/01')).toBeInTheDocument();
      });

      // Edit button must be present for Procurement
      expect(screen.getByTitle('Edit')).toBeInTheDocument();

      // Delete button must NOT be present for Procurement
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });
  });

  describe('ClerkDashboard restrictions', () => {
    it('hides Add New Record and Edit Data, keeping View Record', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{
            id: 'task-1',
            tenderNumber: 'CEB/TASK/01',
            description: 'Task under evaluation',
            relevantTo: 'Civil',
            bidClosingDate: '2026-10-01',
            status: 'Under Evaluation'
          }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <ClerkDashboard />
          </AuthProvider>
        </MemoryRouter>
      );

      // Add New Record must NOT be present
      expect(screen.queryByText('Add New Record')).not.toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('CEB/TASK/01')).toBeInTheDocument();
      });

      // Edit Data must NOT be present
      expect(screen.queryByText(/edit data/i)).not.toBeInTheDocument();

      // View Record must be present
      expect(screen.getByText('View Record')).toBeInTheDocument();
    });
  });

  describe('ViewRecordPage Clerk restrictions', () => {
    it('hides Edit Record button for Clerk while allowing view', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string) => {
        if (url.includes('/api/records/rec-123/documents')) {
          return { ok: true, json: async () => [] } as Response;
        }
        return {
          ok: true,
          json: async () => ({
            id: 'rec-123',
            tenderNumber: 'CEB/VIEW/01',
            category: 'Cables',
            relevantTo: 'Distribution',
            status: 'Awarded'
          })
        } as Response;
      });

      render(
        <MemoryRouter initialEntries={['/clerk/records/view/rec-123']}>
          <AuthProvider>
            <Routes>
              <Route path="/clerk/records/view/:id" element={<ViewRecordPage />} />
            </Routes>
          </AuthProvider>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('CEB/VIEW/01')).toBeInTheDocument();
      });

      // Edit Record button must NOT be present for Clerk
      expect(screen.queryByText('Edit Record')).not.toBeInTheDocument();
      // Close View must be present
      expect(screen.getByText('Close View')).toBeInTheDocument();
    });
  });

  describe('List pages Clerk read-only restrictions', () => {
    it('hides Add button and Actions for Clerk on TecStaffPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{ id: '1', name: 'Eng. John Doe', email: 'john@ceb.lk', area: 'Unit A', designation: 'Engineer' }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <TecStaffPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add Staff Member')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Eng. John Doe')).toBeInTheDocument();
      });
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('hides Add button and Actions for Clerk on DepartmentListPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{ id: '1', name: 'Finance Unit', code: 'FIN', description: 'Finance', headOfDepartment: 'HOD', status: 'Active' }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <DepartmentListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add New Unit')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Finance Unit')).toBeInTheDocument();
      });
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('hides Add button and Actions for Clerk on CategoryListPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{ id: '1', name: 'Transformers', description: 'Power equipment', status: 'Active' }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <CategoryListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add New Category')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Transformers')).toBeInTheDocument();
      });
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('hides Add button and Actions for Clerk on BidderListPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{ id: '1', name: 'Acme Supplies', email: 'acme@test.com', contact: '0112345678', address: 'Colombo' }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <BidderListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add supplier')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Acme Supplies')).toBeInTheDocument();
      });
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });

    it('hides Add button and Actions for Clerk on BidOpeningCommitteePage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{ id: '1', committeeNumber: 'COM-001', member1: 'Chair', member2: 'M1', member3: 'M2', status: 'Active' }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <BidOpeningCommitteePage />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.queryByText('Add New Committee')).not.toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('COM-001')).toBeInTheDocument();
      });
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
    });
  });

  describe('Procurement role permissions', () => {
    it('allows Add and Edit but hides Delete for Procurement on CategoryListPage', async () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Procurement', name: 'Proc User', email: 'proc@ceb.lk' }));

      vi.spyOn(apiModule, 'apiFetch').mockImplementation(async () => {
        return {
          ok: true,
          json: async () => [{ id: '1', name: 'Transformers', description: 'Power equipment', status: 'Active' }]
        } as Response;
      });

      render(
        <MemoryRouter>
          <AuthProvider>
            <CategoryListPage />
          </AuthProvider>
        </MemoryRouter>
      );

      // Procurement CAN add categories
      expect(screen.getByText('Add New Category')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Transformers')).toBeInTheDocument();
      });

      // Actions column should be present
      expect(screen.getByText('Actions')).toBeInTheDocument();
      // Edit button should be present
      expect(screen.getByTitle('Edit')).toBeInTheDocument();
      // Delete button must NOT be present for Procurement
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });
  });
});

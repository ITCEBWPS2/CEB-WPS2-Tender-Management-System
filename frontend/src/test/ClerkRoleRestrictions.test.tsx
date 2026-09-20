import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Sidebar } from '../components/layout/Sidebar';
import { TecStaffPage } from '../pages/TecStaffPage';
import { DepartmentListPage } from '../pages/DepartmentListPage';
import { CategoryListPage } from '../pages/CategoryListPage';
import { BidderListPage } from '../pages/BidderListPage';
import { BidOpeningCommitteePage } from '../pages/BidOpeningCommitteePage';
import { AuthProvider } from '../context/AuthContext';
import * as apiModule from '../utils/api';

describe('Role-based access & Clerk restrictions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('Sidebar item visibility', () => {
    it('hides Add Staff, Add Unit, Add Category, Add Supplier, Add Committee for Clerk', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Clerk', name: 'Clerk User', email: 'clerk@ceb.lk' }));

      render(
        <MemoryRouter>
          <AuthProvider>
            <Sidebar isOpen={true} setIsOpen={() => {}} />
          </AuthProvider>
        </MemoryRouter>
      );

      // Parent items should be visible
      expect(screen.getByText('Staff')).toBeInTheDocument();
      expect(screen.getByText('Units')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Bidders')).toBeInTheDocument();
      expect(screen.getByText('TEC Committee')).toBeInTheDocument();

      // Sub-items for viewing lists should be visible
      expect(screen.getByText('Staff List')).toBeInTheDocument();
      expect(screen.getByText('Unit List')).toBeInTheDocument();
      expect(screen.getByText('Category List')).toBeInTheDocument();
      expect(screen.getByText('Supplier List')).toBeInTheDocument();
      expect(screen.getByText('View All Committees')).toBeInTheDocument();

      // Add sub-items MUST be hidden from Clerk
      expect(screen.queryByText('Add Staff')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Unit')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Category')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Supplier')).not.toBeInTheDocument();
      expect(screen.queryByText('Add Committee')).not.toBeInTheDocument();
    });

    it('shows Add sub-items for Admin and treats Super Admin as Admin', () => {
      localStorage.setItem('user', JSON.stringify({ role: 'Super Admin', name: 'Super Admin', email: 'admin@ceb.lk' }));

      render(
        <MemoryRouter>
          <AuthProvider>
            <Sidebar isOpen={true} setIsOpen={() => {}} />
          </AuthProvider>
        </MemoryRouter>
      );

      expect(screen.getByText('Add Staff')).toBeInTheDocument();
      expect(screen.getByText('Add Unit')).toBeInTheDocument();
      expect(screen.getByText('Add Category')).toBeInTheDocument();
      expect(screen.getByText('Add Supplier')).toBeInTheDocument();
      expect(screen.getByText('Add Committee')).toBeInTheDocument();
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

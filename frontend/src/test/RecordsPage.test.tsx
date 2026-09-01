import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RecordsPage } from '../pages/RecordsPage';
import * as apiModule from '../utils/api';

describe('RecordsPage Smoke Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders records page and displays empty state when no records exist', async () => {
    vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/api/records')) {
        return {
          ok: true,
          json: async () => []
        } as Response;
      }
      if (endpoint.includes('/api/categories')) {
        return {
          ok: true,
          json: async () => []
        } as Response;
      }
      return {
        ok: true,
        json: async () => []
      } as Response;
    });

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>
    );

    // Verify header renders
    expect(screen.getByText('Records Management')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Search by Tender Number...')).toBeInTheDocument();

    // Verify empty state is rendered in table
    await waitFor(() => {
      expect(screen.getByText('No records found.')).toBeInTheDocument();
    });
  });

  it('renders records list correctly when data is returned', async () => {
    const mockRecord = {
      _id: 'rec123',
      tenderNumber: 'CEB/WPS2/2026/TEST-099',
      relevantTo: 'Transmission',
      category: 'Transformers',
      description: 'Procurement of 132kV transformers',
      status: 'Awarded'
    };

    vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (endpoint: string) => {
      if (endpoint.includes('/api/records')) {
        return {
          ok: true,
          json: async () => [mockRecord]
        } as Response;
      }
      return {
        ok: true,
        json: async () => []
      } as Response;
    });

    render(
      <MemoryRouter>
        <RecordsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('CEB/WPS2/2026/TEST-099')).toBeInTheDocument();
      expect(screen.getByText('Procurement of 132kV transformers')).toBeInTheDocument();
    });
  });
});

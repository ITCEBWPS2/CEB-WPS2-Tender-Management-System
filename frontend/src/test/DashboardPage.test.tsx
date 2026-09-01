import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardPage } from '../pages/DashboardPage';
import * as apiModule from '../utils/api';

describe('DashboardPage Smoke Test', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('renders dashboard page and displays KPI cards after mock apiFetch resolves', async () => {
    // Mock apiFetch to return empty records array
    vi.spyOn(apiModule, 'apiFetch').mockResolvedValue({
      ok: true,
      json: async () => []
    } as Response);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    // Wait for async load to finish and verify dashboard content renders
    await waitFor(() => {
      expect(screen.getByText('Total Records')).toBeInTheDocument();
    });

    expect(screen.getByText('Record Status Distribution')).toBeInTheDocument();
    expect(screen.getByText('Monthly Record Volume')).toBeInTheDocument();
    expect(screen.getByText('Pending Records Aging Analysis')).toBeInTheDocument();
  });

  it('renders error state gracefully when apiFetch fails', async () => {
    vi.spyOn(apiModule, 'apiFetch').mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'Server error' })
    } as Response);

    render(
      <MemoryRouter>
        <DashboardPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Failed to load dashboard/i)).toBeInTheDocument();
    });
  });
});

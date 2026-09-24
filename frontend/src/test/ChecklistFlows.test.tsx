import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider } from '../context/AuthContext';
import { AppRoutes } from '../App';
import * as apiModule from '../utils/api';
import { STAFF_TITLES, parseStaffName, formatStaffName } from '../pages/AddEditStaffPage';

// Helper component to track current router location
function LocationDisplay() {
  const location = useLocation();
  return <div data-testid="location-display">{location.pathname}</div>;
}

// Helper to render real AppRoutes inside MemoryRouter with seeded session
function renderAppAt(initialUrl: string, role = 'Admin') {
  cleanup();
  localStorage.setItem('user', JSON.stringify({
    id: 'usr-1',
    role,
    name: `${role} User`,
    email: `${role.toLowerCase().replace(/\s+/g, '')}@ceb.lk`
  }));
  sessionStorage.setItem('authToken', 'mock-valid-jwt-token');

  return render(
    <MemoryRouter initialEntries={[initialUrl]}>
      <AuthProvider>
        <LocationDisplay />
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>
  );
}

// Mock data sets containing both { _id } and { id } shapes
const mockRecords = [
  {
    _id: 'rec-001',
    tenderNumber: 'CEB/REC/2026/01',
    category: 'Transformers',
    relevantTo: 'Transmission',
    description: '132kV Power Transformers',
    status: 'Under Evaluation',
    documents: [{ id: 'doc-1', filename: 'spec.pdf', mimeType: 'application/pdf' }]
  },
  {
    id: 'rec-002',
    tenderNumber: 'CEB/REC/2026/02',
    category: 'Cables',
    relevantTo: 'Distribution',
    description: '33kV Underground Cables',
    status: 'Awarded',
    documents: []
  }
];

const mockCategories = [
  { _id: 'cat-001', name: 'Transformers', description: 'Step up and down transformers', status: 'Active' },
  { id: 'cat-002', name: 'Cables', description: 'Transmission and distribution cables', status: 'Active' }
];

const mockDepartments = [
  { _id: 'dept-001', name: 'Transmission Unit', code: 'TU', description: 'Grid transmission division', headOfDepartment: 'Chief Eng. Perera', status: 'Active' },
  { id: 'dept-002', name: 'Distribution Unit', code: 'DU', description: 'Provincial distribution network', headOfDepartment: 'DGM Silva', status: 'Active' }
];

const mockStaff = [
  { _id: 'staff-001', name: 'Eng. Nimal Perera', email: 'nimal@ceb.lk', area: 'Transmission Unit', designation: 'Chief Engineer' },
  { id: 'staff-002', name: 'Kamal Silva', email: '', area: 'Distribution Unit', designation: 'Technical Officer' }
];

const mockBidders = [
  { _id: 'bidder-001', name: 'Alpha Supplies Ltd', email: 'sales@alphasupplies.lk', contact: '0112345678', address: 'Colombo 03' },
  { id: 'bidder-002', name: 'Beta Power Solutions', email: 'contact@betapower.lk', contact: '0118765432', address: 'Kandy' }
];

const mockCommittees = [
  { _id: 'com-001', committeeNumber: 'TEC/COM/2026/01', member1: 'Eng. Nimal Perera', member2: 'Kamal Silva', member3: 'Sunil Dias', status: 'Active', additionalMembers: [] },
  { id: 'com-002', committeeNumber: 'TEC/COM/2026/02', member1: 'Sunil Dias', member2: 'Kamal Silva', member3: 'Eng. Nimal Perera', status: 'Active', additionalMembers: [] }
];

const mockUsers = [
  { _id: 'usr-001', name: 'Admin User', email: 'admin@ceb.lk', role: 'Admin', status: 'Active', epfNumber: '11111' },
  { id: 'usr-002', name: 'Procurement Specialist', email: 'proc@ceb.lk', role: 'Procurement', status: 'Active', epfNumber: '22222' }
];

describe('21-Point QA Checklist Flow Verifications', () => {
  let postPutCalls: { url: string; method: string; body: any }[] = [];
  let userFetchCount = 0;

  beforeEach(() => {
    cleanup();
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    postPutCalls = [];
    userFetchCount = 0;

    vi.spyOn(apiModule, 'apiFetch').mockImplementation(async (url: string, init?: RequestInit) => {
      const method = (init?.method || 'GET').toUpperCase();
      if (method === 'POST' || method === 'PUT') {
        let body = {};
        try {
          body = JSON.parse((init?.body as string) || '{}');
        } catch {
          body = {};
        }
        postPutCalls.push({ url, method, body });
        return {
          ok: true,
          status: 200,
          json: async () => ({ success: true, id: 'saved-id', ...body })
        } as Response;
      }

      // GET requests
      if (url === '/api/records') return { ok: true, json: async () => mockRecords } as Response;
      if (url.startsWith('/api/records/rec-001')) return { ok: true, json: async () => mockRecords[0] } as Response;
      if (url.startsWith('/api/records/rec-002')) return { ok: true, json: async () => mockRecords[1] } as Response;
      if (url.includes('/documents')) return { ok: true, json: async () => [] } as Response;

      if (url === '/api/categories') return { ok: true, json: async () => mockCategories } as Response;
      if (url.startsWith('/api/categories/cat-001')) return { ok: true, json: async () => mockCategories[0] } as Response;

      if (url === '/api/departments') return { ok: true, json: async () => mockDepartments } as Response;
      if (url.startsWith('/api/departments/dept-001')) return { ok: true, json: async () => mockDepartments[0] } as Response;

      if (url === '/api/staff') return { ok: true, json: async () => mockStaff } as Response;
      if (url.startsWith('/api/staff/staff-001')) return { ok: true, json: async () => mockStaff[0] } as Response;

      if (url === '/api/bidders') return { ok: true, json: async () => mockBidders } as Response;
      if (url.startsWith('/api/bidders/bidder-001')) return { ok: true, json: async () => mockBidders[0] } as Response;

      if (url === '/api/committees') return { ok: true, json: async () => mockCommittees } as Response;
      if (url.startsWith('/api/committees/com-001')) return { ok: true, json: async () => mockCommittees[0] } as Response;

      if (url === '/api/users') {
        userFetchCount++;
        return { ok: true, json: async () => mockUsers } as Response;
      }
      if (url.startsWith('/api/users/usr-001')) return { ok: true, json: async () => mockUsers[0] } as Response;

      return { ok: true, json: async () => [] } as Response;
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 1: Records Add Navigation
  // ---------------------------------------------------------------------------
  it('1. Records: "Add New Record" button opens the Add Record page (/<role>/records/add)', async () => {
    for (const role of ['Admin', 'Procurement', 'Clerk']) {
      const prefix = role.toLowerCase();
      renderAppAt(`/${prefix}/records`, role);

      const addBtn = await screen.findByRole('button', { name: /add new record/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByTestId('location-display').textContent).toBe(`/${prefix}/records/add`);
      });
      expect(screen.getByRole('heading', { name: 'Add New Record' })).toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 2: Records Row Actions (View, Edit, Documents) with real ID
  // ---------------------------------------------------------------------------
  it('2. Records: row action buttons (View, Edit, Documents) navigate with real ID (never undefined)', async () => {
    // Test for item with _id ('rec-001')
    renderAppAt('/admin/records', 'Admin');

    await screen.findByText('CEB/REC/2026/01');
    const viewButtons = screen.getAllByTitle('View Record');

    // Click View on first record
    fireEvent.click(viewButtons[0]);
    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/records/view/rec-001');
      expect(screen.getByTestId('location-display').textContent).not.toContain('undefined');
    });

    // Test Edit navigation on second record (which uses { id: 'rec-002' })
    renderAppAt('/admin/records', 'Admin');
    await screen.findByText('CEB/REC/2026/02');
    const editButtons2 = screen.getAllByTitle('Edit');
    fireEvent.click(editButtons2[1]);
    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/records/edit/rec-002');
      expect(screen.getByTestId('location-display').textContent).not.toContain('undefined');
    });

    // Test Documents action button
    renderAppAt('/admin/records', 'Admin');
    await screen.findByText('CEB/REC/2026/01');
    const docButtons2 = screen.getAllByTitle(/documents/i);
    fireEvent.click(docButtons2[0]);
    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/records/view/rec-001');
      expect(screen.getByTestId('location-display').textContent).not.toContain('undefined');
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 3: Categories Add Navigation
  // ---------------------------------------------------------------------------
  it('3. Categories: "Add Category" (page button and sidebar item) opens Add Category page', async () => {
    for (const role of ['Admin', 'Procurement', 'Clerk']) {
      const prefix = role.toLowerCase();
      renderAppAt(`/${prefix}/categories`, role);

      // Page button
      const addBtn = await screen.findByRole('button', { name: /add new category/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByTestId('location-display').textContent).toBe(`/${prefix}/categories/add`);
      });
      expect(screen.getByRole('heading', { name: 'Add New Category' })).toBeInTheDocument();
    }

    // Sidebar sub-item
    renderAppAt('/admin/categories', 'Admin');
    const sidebarAddCategory = await screen.findByText('Add Category');
    fireEvent.click(sidebarAddCategory);
    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/categories/add');
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 4: Categories Edit Action loads data
  // ---------------------------------------------------------------------------
  it('4. Categories: row Edit action opens Edit Category page with data loaded', async () => {
    renderAppAt('/admin/categories', 'Admin');

    await screen.findByText('Transformers');
    const editBtns = screen.getAllByTitle('Edit');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/categories/edit/cat-001');
    });

    // Form inputs should contain loaded data
    await waitFor(() => {
      const nameInput = screen.getByDisplayValue('Transformers');
      expect(nameInput).toBeInTheDocument();
      expect(screen.getByDisplayValue('Step up and down transformers')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 5: Units Add Navigation
  // ---------------------------------------------------------------------------
  it('5. Units: "Add New Unit" opens the Add Unit page', async () => {
    for (const role of ['Admin', 'Procurement', 'Clerk']) {
      const prefix = role.toLowerCase();
      renderAppAt(`/${prefix}/departments`, role);

      const addBtn = await screen.findByRole('button', { name: /add new unit/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByTestId('location-display').textContent).toBe(`/${prefix}/departments/add`);
      });
      expect(screen.getByRole('heading', { name: 'Add New Unit' })).toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 6: Units Edit Action loads data
  // ---------------------------------------------------------------------------
  it('6. Units: row Edit action opens Edit Unit page with data loaded', async () => {
    renderAppAt('/admin/departments', 'Admin');

    await screen.findByText('Transmission Unit');
    const editBtns = screen.getAllByTitle('Edit');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/departments/edit/dept-001');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Transmission Unit')).toBeInTheDocument();
      expect(screen.getByDisplayValue('TU')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 7: Units Save returns to Unit list
  // ---------------------------------------------------------------------------
  it('7. Units: filling Add/Edit Unit form and clicking Save returns to Unit list', async () => {
    renderAppAt('/admin/departments/add', 'Admin');

    await screen.findByRole('heading', { name: 'Add New Unit' });
    const saveBtn = screen.getByRole('button', { name: /save unit/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/departments');
    });
    expect(screen.getByText('Unit Management')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 8: Units Cancel and Back Arrow return to Unit list
  // ---------------------------------------------------------------------------
  it('8. Units: clicking Cancel (and back arrow) on Add/Edit Unit page returns to Unit list', async () => {
    // Cancel button test
    renderAppAt('/admin/departments/add', 'Admin');
    await screen.findByRole('heading', { name: 'Add New Unit' });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/departments');
    });

    // Back arrow test
    renderAppAt('/admin/departments/add', 'Admin');
    const heading = await screen.findByRole('heading', { name: 'Add New Unit' });
    const backArrow = heading.parentElement?.previousElementSibling as HTMLButtonElement;
    expect(backArrow).toBeInTheDocument();
    fireEvent.click(backArrow);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/departments');
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 9: Staff Add Navigation
  // ---------------------------------------------------------------------------
  it('9. Staff: "Add Staff Member" opens the Add Staff page', async () => {
    for (const role of ['Admin', 'Procurement', 'Clerk']) {
      const prefix = role.toLowerCase();
      renderAppAt(`/${prefix}/tec-staff`, role);

      const addBtn = await screen.findByRole('button', { name: /add staff member/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByTestId('location-display').textContent).toBe(`/${prefix}/tec-staff/add`);
      });
      expect(screen.getByRole('heading', { name: 'Add New Staff' })).toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 10: Staff Table and Form "Unit" Labeling
  // ---------------------------------------------------------------------------
  it('10. Staff table & form: column formerly called Department/Area is now called Unit', async () => {
    // Table column header check
    renderAppAt('/admin/tec-staff', 'Admin');
    await screen.findByText('Eng. Nimal Perera');
    expect(screen.getByRole('columnheader', { name: 'Unit' })).toBeInTheDocument();
    expect(screen.queryByRole('columnheader', { name: /department\/area/i })).not.toBeInTheDocument();

    // Form label check
    renderAppAt('/admin/tec-staff/add', 'Admin');
    await screen.findByRole('heading', { name: 'Add New Staff' });
    expect(screen.getByLabelText('Unit')).toBeInTheDocument();
    expect(screen.queryByLabelText(/department \/ area/i)).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 11: Staff Save returns to Staff list
  // ---------------------------------------------------------------------------
  it('11. Staff: Save on Add/Edit Staff returns to Staff list', async () => {
    renderAppAt('/admin/tec-staff/add', 'Admin');

    await screen.findByRole('heading', { name: 'Add New Staff' });
    const nameInput = screen.getByPlaceholderText('e.g. Nimal Perera');
    fireEvent.change(nameInput, { target: { value: 'Sunil Perera' } });

    const saveBtn = screen.getByRole('button', { name: /save member/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/tec-staff');
    });
    expect(screen.getByText('Manage committee members and staff')).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 12: Staff Cancel and Back Arrow return to Staff list
  // ---------------------------------------------------------------------------
  it('12. Staff: Cancel (and back arrow) on Add/Edit Staff returns to Staff list', async () => {
    // Cancel button
    renderAppAt('/admin/tec-staff/add', 'Admin');
    await screen.findByRole('heading', { name: 'Add New Staff' });
    const cancelBtn = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/tec-staff');
    });

    // Back arrow button
    renderAppAt('/admin/tec-staff/add', 'Admin');
    const heading = await screen.findByRole('heading', { name: 'Add New Staff' });
    const backArrow = heading.previousElementSibling as HTMLButtonElement;
    expect(backArrow).toBeInTheDocument();
    fireEvent.click(backArrow);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/tec-staff');
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 13: Staff Edit loads data with title parsed and pre-selected
  // ---------------------------------------------------------------------------
  it('13. Staff: row Edit action opens Edit Staff page with title parsed out of name and pre-selected', async () => {
    renderAppAt('/admin/tec-staff', 'Admin');

    await screen.findByText('Eng. Nimal Perera');
    const editBtns = screen.getAllByTitle('Edit');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/tec-staff/edit/staff-001');
    });

    await waitFor(() => {
      // Title select should have "Eng."
      const titleSelect = screen.getByDisplayValue('Eng.');
      expect(titleSelect).toBeInTheDocument();
      // Name input should contain name without title
      const nameInput = screen.getByDisplayValue('Nimal Perera');
      expect(nameInput).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 14: TEC Staff renamed to Staff (URLs unchanged, TEC Committee unchanged)
  // ---------------------------------------------------------------------------
  it('14. "TEC Staff" is renamed to "Staff" in sidebar, header, and page heading; TEC Committee unchanged', async () => {
    renderAppAt('/admin/tec-staff', 'Admin');

    // Heading must be "Staff"
    expect(await screen.findByRole('heading', { level: 2, name: 'Staff' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { level: 2, name: 'TEC Staff' })).not.toBeInTheDocument();

    // Sidebar group must be "Staff"
    expect(screen.getByText('Staff List')).toBeInTheDocument();

    // TEC Committee must NOT be renamed
    expect(screen.getByText('TEC Committee')).toBeInTheDocument();

    // URL path must remain /tec-staff
    expect(screen.getByTestId('location-display').textContent).toBe('/admin/tec-staff');
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 15: Title selector options and string formatting logic
  // ---------------------------------------------------------------------------
  it('15. Add Staff form: Title dropdown options Eng., Mr., Mrs., Miss; formatted as "<Title> <Name>" without double spaces', () => {
    expect(STAFF_TITLES).toEqual(['Eng.', 'Mr.', 'Mrs.', 'Miss']);

    // parseStaffName tests
    expect(parseStaffName('Eng. Nimal Perera')).toEqual({ title: 'Eng.', name: 'Nimal Perera' });
    expect(parseStaffName('Mr. Kamal Silva')).toEqual({ title: 'Mr.', name: 'Kamal Silva' });
    expect(parseStaffName('Mrs. Sunila Dias')).toEqual({ title: 'Mrs.', name: 'Sunila Dias' });
    expect(parseStaffName('Miss Chathuri Fonseka')).toEqual({ title: 'Miss', name: 'Chathuri Fonseka' });
    expect(parseStaffName('Plain Name Without Title')).toEqual({ title: '', name: 'Plain Name Without Title' });
    expect(parseStaffName('')).toEqual({ title: '', name: '' });

    // formatStaffName tests
    expect(formatStaffName('Eng.', 'Nimal Perera')).toBe('Eng. Nimal Perera');
    expect(formatStaffName('', 'Nimal Perera')).toBe('Nimal Perera');
    expect(formatStaffName('Mr.', '  Nimal   ')).toBe('Mr. Nimal');
    expect(formatStaffName('  ', 'Plain Name')).toBe('Plain Name');
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 16: Email optional on Staff form (sends null when empty)
  // ---------------------------------------------------------------------------
  it('16. Add Staff form: Email is optional (label says Optional); empty email sends null', async () => {
    renderAppAt('/admin/tec-staff/add', 'Admin');

    await screen.findByRole('heading', { name: 'Add New Staff' });
    expect(screen.getByLabelText(/email address \(optional\)/i)).toBeInTheDocument();

    // Fill name and leave email blank
    const nameInput = screen.getByPlaceholderText('e.g. Nimal Perera');
    fireEvent.change(nameInput, { target: { value: 'Saman Kumara' } });

    const saveBtn = screen.getByRole('button', { name: /save member/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(postPutCalls.length).toBeGreaterThan(0);
    });

    const lastCall = postPutCalls[postPutCalls.length - 1];
    expect(lastCall.body.name).toBe('Saman Kumara');
    expect(lastCall.body.email).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 17: Suppliers Add Navigation and Save
  // ---------------------------------------------------------------------------
  it('17. Suppliers (Bidders): "Add Supplier" opens Add Supplier page; saving returns to Supplier list', async () => {
    for (const role of ['Admin', 'Procurement', 'Clerk']) {
      const prefix = role.toLowerCase();
      renderAppAt(`/${prefix}/bidders`, role);

      const addBtn = await screen.findByRole('button', { name: /add supplier/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByTestId('location-display').textContent).toBe(`/${prefix}/bidders/add`);
      });
      expect(screen.getByText('Add Supplier')).toBeInTheDocument();
    }

    // Save returns to list
    renderAppAt('/admin/bidders/add', 'Admin');
    await screen.findByRole('heading', { name: 'Add New Supplier' });
    fireEvent.change(screen.getByLabelText(/Supplier \/ Company Name/i), { target: { value: 'Alpha Power Ltd' } });
    const saveBtn = screen.getByRole('button', { name: /create supplier|save/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/bidders');
    });
    expect(screen.getByRole('heading', { name: 'Registered suppliers (bidder)' })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 18: Suppliers Edit loads data
  // ---------------------------------------------------------------------------
  it('18. Suppliers: row Edit action opens Edit Supplier page with data loaded', async () => {
    renderAppAt('/admin/bidders', 'Admin');

    await screen.findByText('Alpha Supplies Ltd');
    const editBtns = screen.getAllByTitle('Edit');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/bidders/edit/bidder-001');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Alpha Supplies Ltd')).toBeInTheDocument();
      expect(screen.getByDisplayValue('sales@alphasupplies.lk')).toBeInTheDocument();
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 19: TEC Committee Add Navigation
  // ---------------------------------------------------------------------------
  it('19. TEC Committee: "Add New Committee" opens Add Committee page', async () => {
    for (const role of ['Admin', 'Procurement', 'Clerk']) {
      const prefix = role.toLowerCase();
      renderAppAt(`/${prefix}/bid-opening`, role);

      const addBtn = await screen.findByRole('button', { name: /add new committee/i });
      fireEvent.click(addBtn);

      await waitFor(() => {
        expect(screen.getByTestId('location-display').textContent).toBe(`/${prefix}/bid-opening/add`);
      });
      expect(screen.getByText('Add New Committee')).toBeInTheDocument();
    }
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 20: TEC Committee Edit loads data
  // ---------------------------------------------------------------------------
  it('20. TEC Committee: row Edit action opens Edit Committee page with data loaded', async () => {
    renderAppAt('/admin/bid-opening', 'Admin');

    await screen.findByText('TEC/COM/2026/01');
    const editBtns = screen.getAllByTitle('Edit');
    fireEvent.click(editBtns[0]);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/bid-opening/edit/com-001');
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('TEC/COM/2026/01')).toBeInTheDocument();
      const chairmanSelect = screen.getByLabelText('Chairman') as HTMLSelectElement;
      expect(chairmanSelect.value).toBe('Eng. Nimal Perera');
    });
  });

  // ---------------------------------------------------------------------------
  // Checklist Item 21: User Management Add & Save with Refetch on Mount
  // ---------------------------------------------------------------------------
  it('21. User Management: "Add New System User" opens Add User page, and saving returns to All Users list', async () => {
    renderAppAt('/admin/users', 'Admin');
    expect(userFetchCount).toBe(1);

    const addBtn = await screen.findByRole('button', { name: /add new system user/i });
    fireEvent.click(addBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/users/add');
    });
    expect(screen.getByText('Add New System User')).toBeInTheDocument();

    // Fill the required fields in the Add User form
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Test User' } });
    fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'testuser@ceb.lk' } });
    fireEvent.change(screen.getByLabelText(/epf number/i), { target: { value: '54321' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'SecurePass123!' } });

    // Click Create User button
    const saveBtn = screen.getByRole('button', { name: /create user/i });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(screen.getByTestId('location-display').textContent).toBe('/admin/users');
    });
    expect(screen.getByRole('heading', { level: 2, name: 'User Management' })).toBeInTheDocument();
    // Verify that the list refetched on mount upon returning
    expect(userFetchCount).toBe(2);
  });

  // ---------------------------------------------------------------------------
  // Role Matrix Boundary Enforcement
  // ---------------------------------------------------------------------------
  describe('Role matrix expectations', () => {
    it('enforces User is read-only across all list pages without Add or Edit buttons', async () => {
      // Records
      renderAppAt('/user/records', 'User');
      await screen.findByText('CEB/REC/2026/01');
      expect(screen.queryByRole('button', { name: /add new record/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();

      // Categories
      renderAppAt('/user/categories', 'User');
      await screen.findByText('Transformers');
      expect(screen.queryByRole('button', { name: /add new category/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();

      // Units
      renderAppAt('/user/departments', 'User');
      await screen.findByText('Transmission Unit');
      expect(screen.queryByRole('button', { name: /add new unit/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();

      // Staff
      renderAppAt('/user/tec-staff', 'User');
      await screen.findByText('Eng. Nimal Perera');
      expect(screen.queryByRole('button', { name: /add staff member/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();

      // Bidders
      renderAppAt('/user/bidders', 'User');
      await screen.findByText('Alpha Supplies Ltd');
      expect(screen.queryByRole('button', { name: /add supplier/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();

      // Committees
      renderAppAt('/user/bid-opening', 'User');
      await screen.findByText('TEC/COM/2026/01');
      expect(screen.queryByRole('button', { name: /add new committee/i })).not.toBeInTheDocument();
      expect(screen.queryByTitle('Edit')).not.toBeInTheDocument();
    });

    it('allows Clerk and Procurement Add and Edit on Staff but denies Delete', async () => {
      renderAppAt('/clerk/tec-staff', 'Clerk');
      await screen.findByText('Eng. Nimal Perera');
      expect(screen.getByRole('button', { name: /add staff member/i })).toBeInTheDocument();
      expect(screen.getAllByTitle('Edit').length).toBeGreaterThan(0);
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();

      renderAppAt('/procurement/tec-staff', 'Procurement');
      await screen.findByText('Eng. Nimal Perera');
      expect(screen.getByRole('button', { name: /add staff member/i })).toBeInTheDocument();
      expect(screen.getAllByTitle('Edit').length).toBeGreaterThan(0);
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });

    it('denies Procurement Delete across all entities', async () => {
      renderAppAt('/procurement/records', 'Procurement');
      await screen.findByText('CEB/REC/2026/01');
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();

      renderAppAt('/procurement/categories', 'Procurement');
      await screen.findByText('Transformers');
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();

      renderAppAt('/procurement/departments', 'Procurement');
      await screen.findByText('Transmission Unit');
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();

      renderAppAt('/procurement/bidders', 'Procurement');
      await screen.findByText('Alpha Supplies Ltd');
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();

      renderAppAt('/procurement/bid-opening', 'Procurement');
      await screen.findByText('TEC/COM/2026/01');
      expect(screen.queryByTitle('Delete')).not.toBeInTheDocument();
    });
  });
});

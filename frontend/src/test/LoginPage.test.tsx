import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { LoginPage } from '../pages/LoginPage';

import { AuthProvider } from '../context/AuthContext';

describe('LoginPage Smoke Test', () => {
  it('renders login page cleanly without crashing', () => {
    render(
      <MemoryRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </MemoryRouter>
    );

    // Verify main page elements are present
    expect(screen.getByText('Tender Management System')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address or EPF Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

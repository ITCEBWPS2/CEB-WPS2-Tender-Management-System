import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { LoginPage } from '../pages/LoginPage';

describe('LoginPage Smoke Test', () => {
  it('renders login page cleanly without crashing', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );

    // Verify main page elements are present
    expect(screen.getByText('Tender Management System')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email Address or EPF Number')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});

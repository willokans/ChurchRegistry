/**
 * TDD: Baptism view page.
 * - When authenticated, fetches baptism by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import BaptismViewPage from '@/app/baptisms/[id]/page';
import { getStoredToken, getStoredUser, fetchBaptism } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptism: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Baptism view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '123' });
    (fetchBaptism as jest.Mock).mockResolvedValue({
      id: 123,
      baptismName: 'John',
      surname: 'Doe',
      gender: 'MALE',
      dateOfBirth: '2020-01-15',
      fathersName: 'James',
      mothersName: 'Mary',
      sponsorNames: 'Peter, Anne',
      parishId: 10,
    });
  });

  it('fetches baptism by id and shows name', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(fetchBaptism).toHaveBeenCalledWith(123);
    });
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('shows baptism details', async () => {
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/James/i)).toBeInTheDocument();
    expect(screen.getByText(/Mary/i)).toBeInTheDocument();
    expect(screen.getByText(/Peter, Anne/i)).toBeInTheDocument();
  });

  it('when baptism not found shows not-found message', async () => {
    (fetchBaptism as jest.Mock).mockResolvedValue(null);
    render(<BaptismViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});

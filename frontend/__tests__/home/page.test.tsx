/**
 * TDD: Home page tests.
 * - When not authenticated, redirects to login
 * - When authenticated, shows welcome and user display name
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '@/app/page';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Home page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    localStorage.clear();
  });

  it('when not authenticated redirects to login', async () => {
    render(<HomePage />);
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login');
    });
  });

  it('when authenticated shows welcome and user display name', async () => {
    localStorage.setItem('church_registry_token', 'jwt-123');
    localStorage.setItem('church_registry_user', JSON.stringify({
      username: 'admin',
      displayName: 'Administrator',
      role: 'ADMIN',
    }));

    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText(/welcome/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Administrator/)).toBeInTheDocument();
    expect(mockPush).not.toHaveBeenCalled();
  });
});

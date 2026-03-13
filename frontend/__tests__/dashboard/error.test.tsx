/**
 * Dashboard error boundary tests.
 * - Renders error message and recovery actions
 * - Try again calls reset
 * - Links navigate correctly
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DashboardError from '@/app/dashboard/error';

const mockReset = jest.fn();

beforeEach(() => {
  mockReset.mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('DashboardError', () => {
  it('renders error heading and message', () => {
    const error = new Error('Failed to fetch dashboard data');
    render(<DashboardError error={error} reset={mockReset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('The dashboard could not load. This may be a temporary issue.')).toBeInTheDocument();
    expect(screen.getByText('Failed to fetch dashboard data')).toBeInTheDocument();
  });

  it('displays fallback message when error has no message', () => {
    const error = new Error();
    render(<DashboardError error={error} reset={mockReset} />);

    expect(screen.getByText('An unexpected error occurred.')).toBeInTheDocument();
  });

  it('calls reset when Try again is clicked', async () => {
    const error = new Error('Network error');
    render(<DashboardError error={error} reset={mockReset} />);

    await userEvent.click(screen.getByRole('button', { name: /Try again/i }));

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('Back to dashboard link has correct href', () => {
    const error = new Error('API error');
    render(<DashboardError error={error} reset={mockReset} />);

    const link = screen.getByRole('link', { name: /Back to dashboard/i });
    expect(link).toHaveAttribute('href', '/dashboard');
  });

  it('Go home link has correct href', () => {
    const error = new Error('API error');
    render(<DashboardError error={error} reset={mockReset} />);

    const link = screen.getByRole('link', { name: /Go home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('has accessible alert role', () => {
    const error = new Error('Test error');
    render(<DashboardError error={error} reset={mockReset} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});

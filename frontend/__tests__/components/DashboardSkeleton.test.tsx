/**
 * DashboardSkeleton component tests.
 */
import { render, screen } from '@testing-library/react';
import DashboardSkeleton from '@/components/DashboardSkeleton';

describe('DashboardSkeleton', () => {
  it('renders with loading accessibility attributes', () => {
    render(<DashboardSkeleton />);

    const skeleton = screen.getByTestId('dashboard-skeleton');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveAttribute('aria-busy', 'true');
    expect(skeleton).toHaveAttribute('aria-label', 'Loading dashboard');
  });

  it('renders stat card placeholders', () => {
    render(<DashboardSkeleton />);

    const cards = screen.getByTestId('dashboard-skeleton').querySelectorAll('.rounded-xl.border.border-gray-200.bg-white.p-4.shadow-sm');
    expect(cards.length).toBeGreaterThanOrEqual(4);
  });

  it('renders quick actions and chart sections', () => {
    render(<DashboardSkeleton />);

    const skeleton = screen.getByTestId('dashboard-skeleton');
    expect(skeleton.querySelectorAll('.animate-pulse').length).toBeGreaterThan(0);
  });
});

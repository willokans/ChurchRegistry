/**
 * TDD: Privacy notice page tests.
 * - Renders public privacy notice heading and processor statement
 * - Exposes key sections from the policy-derived content
 * - Provides navigation links back to login and home
 */
import { render, screen } from '@testing-library/react';
import PrivacyNoticePage from '@/app/privacy/page';

describe('Privacy notice page', () => {
  it('renders Privacy Notice heading and last updated text', () => {
    render(<PrivacyNoticePage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Privacy Notice' })).toBeInTheDocument();
    expect(screen.getByText(/Last updated:/i)).toBeInTheDocument();
  });

  it('shows the exact parish ownership and processor statement', () => {
    render(<PrivacyNoticePage />);

    expect(
      screen.getByText('All data belongs to your parish/diocese. SacramentRegistry is only a processor.')
    ).toBeInTheDocument();
  });

  it('renders key policy sections derived from the privacy notice', () => {
    render(<PrivacyNoticePage />);

    expect(screen.getByRole('heading', { level: 2, name: '1) Who We Are' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '2) Data We Process' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '6A) Data Location Transparency' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '8) Your Rights' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: '12) Changes to This Notice' })).toBeInTheDocument();
  });

  it('shows concrete hosting and data region disclosures', () => {
    render(<PrivacyNoticePage />);

    expect(screen.getByText(/Fly\.io primary region jnb/i)).toBeInTheDocument();
    expect(screen.getByText(/Supabase Postgres and private storage endpoints configured on eu-west-1/i)).toBeInTheDocument();
  });

  it('shows policy source note and footer links', () => {
    render(<PrivacyNoticePage />);

    expect(screen.getByText(/docs\/PRIVACY_NOTICE\.md/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to Login' })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: 'Back to Home' })).toHaveAttribute('href', '/');
  });
});

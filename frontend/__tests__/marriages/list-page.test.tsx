/**
 * TDD: Marriage (Holy Matrimony) list page.
 * - When authenticated, fetches marriages for parish and shows list or empty state
 * - Shows link to add new marriage
 * - When no parish available, shows message
 */
import { screen, waitFor, within } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import MarriagesPage from '@/app/marriages/page';
import { getStoredToken, getStoredUser, fetchMarriages } from '@/lib/api';
import { useParish } from '@/context/ParishContext';
import { renderWithSWR } from '../test-utils';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchMarriages: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Marriages list page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParish as jest.Mock).mockReturnValue({
      parishId: 10,
      loading: false,
      setParishId: jest.fn(),
      parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
      error: null,
    });
    (fetchMarriages as jest.Mock).mockResolvedValue({ content: [] });
    (fetchMarriages as jest.Mock).mockClear();
  });

  it('when authenticated fetches marriages and shows list heading', async () => {
    renderWithSWR(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalledWith(10);
    });
    expect(screen.getByRole('heading', { name: /marriage|holy matrimony|matrimony/i })).toBeInTheDocument();
  });

  it('shows empty state when no marriages', async () => {
    renderWithSWR(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });
    expect(screen.getByText(/no marriage records|no records/i)).toBeInTheDocument();
  });

  it('shows list of marriages when data returned', async () => {
    (fetchMarriages as jest.Mock).mockResolvedValue({
      content: [
        { id: 1, confirmationId: 7, partnersName: 'John & Jane', marriageDate: '2025-06-15', officiatingPriest: 'Fr. Smith', parish: 'St Mary' },
      ],
    });
    renderWithSWR(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });
    expect(screen.getByRole('main')).toHaveTextContent('John & Jane');
    expect(screen.getByRole('main')).toHaveTextContent('2025-06-15');
  });

  it('shows the requested matrimony grid headers on desktop table', async () => {
    (fetchMarriages as jest.Mock).mockResolvedValue({
      content: [
        {
          id: 1,
          partnersName: 'John Okeke & Jane Woods',
        marriageDate: '2026-06-25',
        officiatingPriest: 'Fr. Smith',
        parish: 'St Mary',
        diocese: 'Enugu Diocese',
        groomName: 'John Okeke',
        brideName: 'Jane Woods',
        groomFatherName: 'Matthew Okeke',
        groomMotherName: 'Rose Okeke',
        brideFatherName: 'Paul Woods',
        brideMotherName: 'Ada Woods',
        witnessesDisplay: 'Peter N, Mark O',
      },
      ],
    });
    renderWithSWR(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });

    expect(screen.getAllByText(/GROOM NAME/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BRIDE NAME/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/MARRIAGE DATE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/GROOM'S FATHER/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/GROOM'S MOTHER/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BRIDE'S FATHER/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/BRIDE'S MOTHER/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/DIOCESE/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/OFFICIATING CLERGY/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/WITNESSES/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/CERTIFICATE/i).length).toBeGreaterThan(0);
  });

  it('shows groom/bride parents, witnesses and civil certificate link', async () => {
    (fetchMarriages as jest.Mock).mockResolvedValue({
      content: [
        {
          id: 11,
        partnersName: 'Jacob Lamin & Rebecca Smith',
        marriageDate: '2026-09-14',
        officiatingPriest: 'Fr. Damian',
        parish: 'St Mary',
        diocese: 'Enugu Diocese',
        groomName: 'Jacob Lamin',
        brideName: 'Rebecca Smith',
        groomFatherName: 'Tita Tochukwu',
        groomMotherName: 'Ngozi Tochukwu',
        brideFatherName: 'David Smith',
        brideMotherName: 'Mary Smith',
        witnessesDisplay: 'Peter Nkosi, Felix Obinna',
      },
      ],
    });
    renderWithSWR(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });

    const main = screen.getByRole('main');
    expect(within(main).getAllByText(/Jacob Lamin/).length).toBeGreaterThan(0);
    expect(within(main).getAllByText(/Rebecca Smith/).length).toBeGreaterThan(0);
    expect(within(main).getByText(/Tita Tochukwu/)).toBeInTheDocument();
    expect(within(main).getByText(/Ngozi Tochukwu/)).toBeInTheDocument();
    expect(within(main).getByText(/David Smith/)).toBeInTheDocument();
    expect(within(main).getByText(/Mary Smith/)).toBeInTheDocument();
    expect(within(main).getByText(/Peter Nkosi, Felix Obinna/)).toBeInTheDocument();

    const certLink = within(main).getByRole('link', { name: /Civil Marriage Certificate/i });
    expect(certLink).toHaveAttribute('href', '/marriages/11/certificate');
  });

  it('shows link to add new marriage', async () => {
    renderWithSWR(<MarriagesPage />);
    await waitFor(() => {
      expect(fetchMarriages).toHaveBeenCalled();
    });
    const main = screen.getByRole('main');
    const addLinks = within(main).getAllByRole('link', { name: /add marriage/i });
    expect(addLinks.length).toBeGreaterThanOrEqual(1);
    expect(addLinks[0].getAttribute('href')).toMatch(/marriages\/new/);
  });

  it('when no parishes shows message and no fetch to marriages', async () => {
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      loading: false,
      setParishId: jest.fn(),
      parishes: [],
      error: null,
    });
    renderWithSWR(<MarriagesPage />);
    const main = screen.getByRole('main');
    await waitFor(() => {
      expect(within(main).getByText(/no parish available/i)).toBeInTheDocument();
    });
    expect(fetchMarriages).not.toHaveBeenCalled();
  });
});

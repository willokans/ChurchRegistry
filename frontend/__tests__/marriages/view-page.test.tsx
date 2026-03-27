/**
 * TDD: Marriage view page.
 * - When authenticated, fetches marriage by id and shows details
 * - When not found, shows not-found message
 */
import { render, screen, waitFor, within } from '@testing-library/react';
import { useRouter, useParams, usePathname } from 'next/navigation';
import MarriageViewPage from '@/app/marriages/[id]/page';
import {
  getStoredToken,
  getStoredUser,
  fetchMarriage,
  fetchBaptism,
  fetchCommunion,
  fetchConfirmation,
  fetchBaptismExternalCertificate,
  fetchCommunionCertificate,
  fetchMarriagePartyCertificate,
  fetchMarriageNoteHistory,
  updateMarriageNotes,
} from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
  usePathname: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchMarriage: jest.fn(),
  fetchBaptism: jest.fn(),
  fetchCommunion: jest.fn(),
  fetchConfirmation: jest.fn(),
  fetchBaptismExternalCertificate: jest.fn(),
  fetchCommunionCertificate: jest.fn(),
  fetchMarriagePartyCertificate: jest.fn(),
  fetchMarriageNoteHistory: jest.fn(),
  updateMarriageNotes: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: () => ({
    parishId: 10,
    setParishId: jest.fn(),
    dioceseId: null,
    setDioceseId: jest.fn(),
    parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
    dioceses: [],
    loading: false,
    error: null,
    refetch: jest.fn(),
  }),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });
(usePathname as jest.Mock).mockReturnValue('/marriages');

describe('Marriage view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '3' });
    (fetchBaptism as jest.Mock).mockResolvedValue({
      id: 5,
      baptismName: 'John',
      otherNames: '',
      surname: 'Doe',
      gender: 'MALE',
      dateOfBirth: '1990-01-01',
      fathersName: 'Father Doe',
      mothersName: 'Mother Doe',
      sponsorNames: 'Sponsor',
      officiatingPriest: 'Fr. A',
      parishId: 10,
      parishName: 'St Mary',
    });
    (fetchCommunion as jest.Mock).mockResolvedValue({
      id: 2,
      baptismId: 5,
      communionDate: '2000-06-10',
      officiatingPriest: 'Fr. B',
      parish: 'St Mary',
    });
    (fetchConfirmation as jest.Mock).mockResolvedValue({
      id: 7,
      baptismId: 5,
      communionId: 2,
      confirmationDate: '2005-03-21',
      officiatingBishop: 'Bp. C',
      parish: 'St Mary',
    });
    (fetchBaptismExternalCertificate as jest.Mock).mockResolvedValue(new Blob(['dummy'], { type: 'application/pdf' }));
    (fetchCommunionCertificate as jest.Mock).mockResolvedValue(new Blob(['dummy'], { type: 'application/pdf' }));
    (fetchMarriagePartyCertificate as jest.Mock).mockResolvedValue(new Blob(['dummy'], { type: 'application/pdf' }));
    (fetchMarriageNoteHistory as jest.Mock).mockResolvedValue([]);
    (updateMarriageNotes as jest.Mock).mockResolvedValue({});
    (fetchMarriage as jest.Mock).mockResolvedValue({
      id: 3,
      baptismId: 5,
      communionId: 2,
      confirmationId: 7,
      partnersName: 'John & Jane Doe',
      marriageDate: '2025-06-15',
      officiatingPriest: 'Fr. Smith',
      parish: 'St Mary',
      parties: [
        {
          id: 1,
          marriageId: 3,
          role: 'GROOM',
          fullName: 'John Doe',
          baptismId: 5,
          communionId: 2,
          confirmationId: 7,
        },
        {
          id: 2,
          marriageId: 3,
          role: 'BRIDE',
          fullName: 'Jane Doe',
          baptismId: 6,
          communionId: 8,
          confirmationId: 9,
        },
      ],
      witnesses: [
        { id: 1, marriageId: 3, fullName: 'Witness 1', sortOrder: 0 },
        { id: 2, marriageId: 3, fullName: 'Witness 2', sortOrder: 1 },
      ],
    });
  });

  it('fetches marriage by id and shows groom and bride details', async () => {
    render(<MarriageViewPage />);
    await waitFor(() => {
      expect(fetchMarriage).toHaveBeenCalledWith(3);
    });
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent("Groom's Information");
    expect(main).toHaveTextContent("Bride's Information");
    expect(main).toHaveTextContent('John Doe');
    expect(main).toHaveTextContent('Jane Doe');
  });

  it('shows marriage details', async () => {
    render(<MarriageViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Fr\. Smith/)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(within(main).getByText(/St Mary/)).toBeInTheDocument();
    expect(within(main).getAllByText(/June 15, 2025/).length).toBeGreaterThan(0);
    expect(within(main).getByText(/Confirmation #7|confirmation.*7/i)).toBeInTheDocument();
  });

  it('keeps Canonical And Civil Requirements below bride sacrament section', async () => {
    render(<MarriageViewPage />);
    const brideInfo = await screen.findByText(/Bride's Information/i);
    const canonical = await screen.findByText(/Canonical And Civil Requirements/i);
    const brideSacramentTitle = await screen.findByText(/Jane Doe —/i);

    expect(brideInfo).toBeInTheDocument();
    expect(brideSacramentTitle).toBeInTheDocument();
    expect(canonical).toBeInTheDocument();

    const brideSection = brideSacramentTitle.closest('section');
    const canonicalSection = canonical.closest('section');
    expect(brideSection).not.toBeNull();
    expect(canonicalSection).not.toBeNull();
    expect(
      (brideSection as HTMLElement).compareDocumentPosition(canonicalSection as HTMLElement)
        & Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });

  it('shows civil marriage certificate action link', async () => {
    render(<MarriageViewPage />);
    const civilCertLink = await screen.findByRole('link', { name: /Civil Marriage Certificate/i });
    expect(civilCertLink).toHaveAttribute('href', '/marriages/3/certificate');
  });

  it('when marriage not found shows not-found message', async () => {
    (fetchMarriage as jest.Mock).mockResolvedValue(null);
    render(<MarriageViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });
});

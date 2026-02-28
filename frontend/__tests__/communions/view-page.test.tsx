/**
 * TDD: First Holy Communion view page.
 * - When authenticated, fetches communion by id and shows details
 * - Two-column layout: communicant info, baptism record, communion details, notes; certificate and record summary
 * - When communion has baptism certificate, shows baptism cert preview and fetches external cert
 * - When not found, shows not-found message
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useRouter, useParams } from 'next/navigation';
import CommunionViewPage from '@/app/communions/[id]/page';
import { getStoredToken, getStoredUser, fetchCommunion, fetchBaptismExternalCertificate } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchCommunion: jest.fn(),
  fetchBaptismExternalCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: () => ({
    parishId: 10,
    setParishId: jest.fn(),
    parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
    loading: false,
    error: null,
  }),
}));

(useRouter as jest.Mock).mockReturnValue({ push: jest.fn() });

describe('Communion view page', () => {
  beforeEach(() => {
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useParams as jest.Mock).mockReturnValue({ id: '42' });
    (fetchCommunion as jest.Mock).mockResolvedValue({
      id: 42,
      baptismId: 5,
      communionDate: '2024-05-01',
      officiatingPriest: 'Fr. Smith',
      parish: 'St Mary',
      baptismName: 'Jacob',
      otherNames: 'Test',
      surname: 'Lamin',
      dateOfBirth: '2024-03-15',
      baptismParishName: 'St Mary',
    });
    (fetchBaptismExternalCertificate as jest.Mock).mockReset();
  });

  it('fetches communion by id and shows date', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(fetchCommunion).toHaveBeenCalledWith(42);
    });
    expect(screen.getByRole('main')).toHaveTextContent(/May 1, 2024|2024/);
  });

  it('shows Holy Communion Record title and Received at parish badge', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Holy Communion Record/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Received at St Mary/)).toBeInTheDocument();
  });

  it('shows Communicant\'s Information with full name, DOB, and Baptism Record', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Jacob Test Lamin/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Communicant's Information/i)).toBeInTheDocument();
    expect(screen.getByText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByText(/Date of Birth/i)).toBeInTheDocument();
    expect(screen.getByText(/Baptism Record/i)).toBeInTheDocument();
    const baptismLink = screen.getByRole('link', { name: /Baptism #5/i });
    expect(baptismLink).toHaveAttribute('href', '/baptisms/5');
    expect(screen.getByRole('main')).toHaveTextContent(/March 15, 2024/);
    expect(screen.getByRole('main')).toHaveTextContent(/St Mary/);
  });

  it('shows Holy Communion Details', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Fr\. Smith/)).toBeInTheDocument();
    });
    const main = screen.getByRole('main');
    expect(main).toHaveTextContent(/St Mary/);
    expect(main).toHaveTextContent(/Baptism #5/i);
    expect(screen.getByText(/Holy Communion Details/i)).toBeInTheDocument();
    expect(screen.getByText(/Communion Date/i)).toBeInTheDocument();
    expect(screen.getByText(/Officiating Priest/i)).toBeInTheDocument();
    const parishLabels = screen.getAllByText(/^Parish$/i);
    expect(parishLabels.length).toBeGreaterThanOrEqual(1);
  });

  it('shows First Holy Communion Certificate section with actions', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/First Holy Communion Certificate/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /View Fullscreen/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download PDF/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Download Image/i })).toBeInTheDocument();
  });

  it('shows Record Summary with HC id', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/Record Summary/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/Record ID/i)).toBeInTheDocument();
    expect(screen.getByText(/HC\/42/)).toBeInTheDocument();
  });

  it('shows Notes section with placeholder and Save Note', async () => {
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /notes/i })).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/follow-up actions|observations/i)).toBeInTheDocument();
    const saveButtons = screen.getAllByRole('button', { name: /save note/i });
    expect(saveButtons.length).toBeGreaterThanOrEqual(1);
  });

  it('when communion not found shows not-found message', async () => {
    (fetchCommunion as jest.Mock).mockResolvedValue(null);
    render(<CommunionViewPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  describe('when communion has baptism certificate (baptism from another parish)', () => {
    beforeEach(() => {
      (fetchCommunion as jest.Mock).mockResolvedValue({
        id: 42,
        baptismId: 5,
        communionDate: '2024-05-01',
        officiatingPriest: 'Fr. Smith',
        parish: 'St Mary',
        baptismCertificatePath: 'path/to/cert.pdf',
        baptismName: 'Jacob',
        surname: 'Lamin',
        dateOfBirth: '2024-03-15',
        baptismParishName: 'St Mary',
      });
      (fetchBaptismExternalCertificate as jest.Mock).mockResolvedValue(
        new Blob(['cert content'], { type: 'application/pdf' })
      );
    });

    it('shows Communicant\'s Baptism Certificate section', async () => {
      render(<CommunionViewPage />);
      await waitFor(() => {
        expect(screen.getByText(/Communicant's Baptism Certificate/i)).toBeInTheDocument();
      });
      const viewFullscreenLinks = screen.getAllByRole('link', { name: /View Fullscreen/i });
      expect(viewFullscreenLinks.length).toBeGreaterThanOrEqual(1);
      expect(viewFullscreenLinks.some((el) => el.getAttribute('href')?.includes('/baptisms/5'))).toBe(true);
      const downloadPdfButtons = screen.getAllByRole('button', { name: /Download PDF/i });
      expect(downloadPdfButtons.length).toBeGreaterThanOrEqual(1);
    });

    it('fetches external baptism certificate when baptismCertificatePath is set', async () => {
      render(<CommunionViewPage />);
      await waitFor(() => {
        expect(fetchCommunion).toHaveBeenCalledWith(42);
      });
      await waitFor(() => {
        expect(fetchBaptismExternalCertificate).toHaveBeenCalledWith(5);
      });
    });

    it('shows note about original certificate for sacramental continuity', async () => {
      render(<CommunionViewPage />);
      await waitFor(() => {
        expect(screen.getByText(/Original baptism certificate received and uploaded/i)).toBeInTheDocument();
      });
      expect(screen.getByText(/for reference only/i)).toBeInTheDocument();
    });
  });
});

/**
 * TDD: First Holy Communion certificate page.
 * - Fetches communion by id and renders certificate with name, date, parish, officiating priest
 * - Shows Print / Save as PDF button when not embedded
 * - Shows error when communion not found or invalid id
 */
import { render, screen, waitFor } from '@testing-library/react';
import { useParams, useSearchParams } from 'next/navigation';
import CommunionCertificatePage from '@/app/communions/[id]/certificate/page';
import { fetchCommunion } from '@/lib/api';

jest.mock('next/navigation', () => ({
  useParams: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: function MockImage({ alt, src }: { alt: string; src: string }) {
    return <img alt={alt} src={src} data-testid="church-seal" />;
  },
}));

jest.mock('@/lib/api', () => ({
  fetchCommunion: jest.fn(),
}));

(useParams as jest.Mock).mockReturnValue({ id: '42' });
(useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());

describe('Communion certificate page', () => {
  beforeEach(() => {
    (useParams as jest.Mock).mockReturnValue({ id: '42' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (fetchCommunion as jest.Mock).mockResolvedValue({
      id: 42,
      baptismId: 5,
      communionDate: '2024-05-01',
      officiatingPriest: 'Fr. Smith',
      parish: 'Holy Family Catholic Church, Life Camp, Abuja',
      baptismName: 'Jacob',
      otherNames: 'Test',
      surname: 'Lamin',
    });
  });

  it('fetches communion by id', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(fetchCommunion).toHaveBeenCalledWith(42);
    });
  });

  it('renders certificate with communicant name', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Jacob Test Lamin/)).toBeInTheDocument();
    });
  });

  it('renders certificate title and parish', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Jacob Test Lamin/)).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /Of First Holy Communion/i })).toBeInTheDocument();
    expect(screen.getAllByText(/Holy Family Catholic Church, Life Camp, Abuja/).length).toBeGreaterThanOrEqual(1);
  });

  it('renders certification text with communion date', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/This is to certify that/)).toBeInTheDocument();
    });
    expect(screen.getByText(/has received the Sacrament of First Holy Communion on/)).toBeInTheDocument();
    expect(screen.getByText(/May 1, 2024/)).toBeInTheDocument();
  });

  it('renders officiating priest', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Officiating Priest/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('article')).toHaveTextContent('Fr. Smith');
  });

  it('renders official use disclaimer', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/This certificate is issued for official use/)).toBeInTheDocument();
    });
  });

  it('renders Date Issued and Certificate No', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Date Issued:/)).toBeInTheDocument();
    });
    expect(screen.getByText(/Certificate No:/)).toBeInTheDocument();
    expect(screen.getByText(/FHC-/)).toBeInTheDocument();
  });

  it('shows Print / Save as PDF button when not embedded', async () => {
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Print \/ Save as PDF/i })).toBeInTheDocument();
    });
  });

  it('hides Print button when embed=1', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('embed=1'));
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Jacob Test Lamin/)).toBeInTheDocument();
    });
    expect(screen.queryByRole('button', { name: /Print \/ Save as PDF/i })).not.toBeInTheDocument();
  });

  it('shows error when communion not found', async () => {
    (fetchCommunion as jest.Mock).mockResolvedValue(null);
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Invalid communion or not found/i)).toBeInTheDocument();
    });
  });

  it('shows error when id is invalid', async () => {
    (useParams as jest.Mock).mockReturnValue({ id: 'abc' });
    render(<CommunionCertificatePage />);
    await waitFor(() => {
      expect(screen.getByText(/Invalid communion or not found/i)).toBeInTheDocument();
    });
  });

  it('shows loading state initially', () => {
    (fetchCommunion as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<CommunionCertificatePage />);
    expect(screen.getByText(/Loading certificate/i)).toBeInTheDocument();
  });
});

/**
 * TDD: First Holy Communion create page.
 * - When authenticated and parishId in query, shows form (baptism picker, date, priest, parish) and creates on submit
 * - Redirects to list after successful create
 */
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import CommunionCreatePage from '@/app/communions/new/page';
import { getStoredToken, getStoredUser, fetchBaptisms, createCommunion, createCommunionWithCertificate } from '@/lib/api';
import { useParish } from '@/context/ParishContext';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/lib/api', () => ({
  getStoredToken: jest.fn(),
  getStoredUser: jest.fn(),
  fetchBaptisms: jest.fn(),
  createCommunion: jest.fn(),
  createCommunionWithCertificate: jest.fn(),
}));

jest.mock('@/context/ParishContext', () => ({
  useParish: jest.fn(),
}));

const mockPush = jest.fn();
(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

describe('Communion create page', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (getStoredToken as jest.Mock).mockReturnValue('token');
    (getStoredUser as jest.Mock).mockReturnValue({ username: 'admin', displayName: 'Admin', role: 'ADMIN' });
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams('parishId=10'));
    (useParish as jest.Mock).mockReturnValue({
      parishId: 10,
      setParishId: jest.fn(),
      parishes: [{ id: 10, parishName: 'St Mary', dioceseId: 1 }],
      loading: false,
      error: null,
    });
    (fetchBaptisms as jest.Mock).mockResolvedValue([
      { id: 5, baptismName: 'Jane', surname: 'Doe', dateOfBirth: '2016-01-01' },
    ]);
    (createCommunion as jest.Mock).mockResolvedValue({ id: 99, baptismId: 5, communionDate: '2024-05-01' });
    (createCommunionWithCertificate as jest.Mock).mockResolvedValue({ id: 100, baptismId: 50, communionDate: '2024-05-01' });
    (createCommunion as jest.Mock).mockClear();
    (createCommunionWithCertificate as jest.Mock).mockClear();
  });

  it('shows form with heading and required fields', async () => {
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(fetchBaptisms).toHaveBeenCalledWith(10);
    });
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: /new holy communion/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/search baptism record/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/communion date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/officiating priest/i)).toBeInTheDocument();
    const main = screen.getByRole('main');
    expect(screen.getByRole('combobox', { name: /mass venue/i })).toBeInTheDocument();
  });

  it('on submit creates communion and redirects to list', async () => {
    const user = userEvent.setup();
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
    });
    const searchInput = screen.getByLabelText(/search baptism records/i);
    await user.click(searchInput);
    await user.keyboard('Jane');
    await waitFor(() => {
      expect(screen.getByRole('option', { name: /jane doe/i })).toBeInTheDocument();
    });
    await user.click(screen.getByRole('option', { name: /jane doe/i }));
    await user.type(screen.getByLabelText(/communion date/i), '2024-05-01');
    await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Smith');
    await user.selectOptions(screen.getByRole('combobox', { name: /mass venue/i }), 'St Mary');
    await user.click(screen.getByRole('button', { name: /save.*communion|register communion/i }));

    await waitFor(() => {
      expect(createCommunion).toHaveBeenCalledWith(
        expect.objectContaining({
          baptismId: 5,
          communionDate: '2024-05-01',
          officiatingPriest: 'Fr. Smith',
          parish: 'St Mary',
        })
      );
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/communions');
    });
  });

  it('when no parishId shows message', async () => {
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams(''));
    (useParish as jest.Mock).mockReturnValue({
      parishId: null,
      setParishId: jest.fn(),
      parishes: [],
      loading: false,
      error: null,
    });
    render(<CommunionCreatePage />);
    await waitFor(() => {
      expect(screen.getByText(/select a parish from the communions list/i)).toBeInTheDocument();
    });
  });

  describe('baptism search box', () => {
    it('shows search input and helper text when no baptism selected', async () => {
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      expect(screen.getByLabelText(/search baptism records/i)).toBeInTheDocument();
      expect(screen.getByPlaceholderText(/search by name, date of birth, or parents/i)).toBeInTheDocument();
      expect(screen.getByText(/click a result to select/i)).toBeInTheDocument();
    });

    it('typing in search shows filtered results in listbox', async () => {
      (fetchBaptisms as jest.Mock).mockResolvedValue([
        { id: 5, baptismName: 'Jane', otherNames: '', surname: 'Doe', dateOfBirth: '2016-01-01', fathersName: 'John', mothersName: 'Mary' },
        { id: 6, baptismName: 'Bob', otherNames: '', surname: 'Smith', dateOfBirth: '2017-05-15', fathersName: 'Jim', mothersName: 'Ann' },
      ]);
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      const searchInput = screen.getByLabelText(/search baptism records/i);
      await user.click(searchInput);
      await user.keyboard('Jane');
      await waitFor(() => {
        const listbox = screen.getByRole('listbox');
        expect(listbox).toBeInTheDocument();
      });
      expect(screen.getByRole('option', { name: /jane doe/i })).toBeInTheDocument();
      expect(screen.queryByRole('option', { name: /bob smith/i })).not.toBeInTheDocument();
    });

    it('clicking a result selects baptism and shows selected parishioner box', async () => {
      (fetchBaptisms as jest.Mock).mockResolvedValue([
        { id: 5, baptismName: 'Jane', otherNames: '', surname: 'Doe', dateOfBirth: '2016-01-01', fathersName: 'John', mothersName: 'Mary' },
      ]);
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search baptism records/i));
      await user.keyboard('Jane');
      await waitFor(() => {
        expect(screen.getByRole('option', { name: /jane doe/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('option', { name: /jane doe/i }));

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText(/date of baptism/i)).toBeInTheDocument();
        expect(screen.getByText(/john.*mary/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
      });
      expect(screen.queryByPlaceholderText(/search by name, date of birth/i)).not.toBeInTheDocument();
    });

    it('clicking Change clears selection and shows search box again', async () => {
      (fetchBaptisms as jest.Mock).mockResolvedValue([
        { id: 5, baptismName: 'Jane', otherNames: '', surname: 'Doe', dateOfBirth: '2016-01-01' },
      ]);
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search baptism records/i));
      await user.keyboard('Jane');
      await user.click(await screen.findByRole('option', { name: /jane doe/i }));
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /change/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('button', { name: /change/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by name, date of birth/i)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /change/i })).not.toBeInTheDocument();
      });
    });

    it('shows no matches message when search matches no baptism records', async () => {
      (fetchBaptisms as jest.Mock).mockResolvedValue([
        { id: 5, baptismName: 'Jane', surname: 'Doe', dateOfBirth: '2016-01-01' },
      ]);
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search baptism records/i));
      await user.keyboard('xyznonexistent');
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
        expect(screen.getByText(/no baptism records match your search/i)).toBeInTheDocument();
      });
    });

    it('when baptism selected shows Baptism Certificate and Parents & Sponsors sections', async () => {
      (fetchBaptisms as jest.Mock).mockResolvedValue([
        { id: 5, baptismName: 'Jane', otherNames: '', surname: 'Doe', dateOfBirth: '2016-01-01', fathersName: 'John', mothersName: 'Mary', sponsorNames: 'T. Walsh' },
      ]);
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByLabelText(/search baptism records/i));
      await user.keyboard('Jane');
      await user.click(await screen.findByRole('option', { name: /jane doe/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /baptism certificate/i })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /parents & sponsors/i })).toBeInTheDocument();
      });
      expect(screen.getByText('T. Walsh')).toBeInTheDocument();
    });
  });

  describe('Baptism from another Parish', () => {
    it('shows external baptism form when Baptism from another Parish is selected', async () => {
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('radio', { name: /baptism from another parish/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/baptism name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/^surname$/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/other names/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/father's name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/mother's name/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/baptised church address/i)).toBeInTheDocument();
        expect(screen.getByText(/upload baptism certificate/i)).toBeInTheDocument();
      });
    });

    it('Save button is disabled when external selected but required fields or certificate missing', async () => {
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('radio', { name: /baptism from another parish/i }));

      const saveBtn = screen.getByRole('button', { name: /save.*register communion|register communion/i });
      expect(saveBtn).toBeDisabled();
    });

    it('on submit with external baptism and certificate calls createCommunionWithCertificate and redirects', async () => {
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });

      await user.click(screen.getByRole('radio', { name: /baptism from another parish/i }));
      await waitFor(() => {
        expect(screen.getByLabelText(/baptism name/i)).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/baptism name/i), 'John');
      await user.type(screen.getByLabelText(/^surname$/i), 'Smith');
      await user.type(screen.getByLabelText(/other names/i), 'Paul');
      await user.selectOptions(screen.getByLabelText(/gender/i), 'MALE');
      await user.type(screen.getByLabelText(/father's name/i), 'James Smith');
      await user.type(screen.getByLabelText(/mother's name/i), 'Mary Smith');
      await user.type(screen.getByLabelText(/baptised church address/i), '123 Church St');

      const file = new File(['cert content'], 'cert.pdf', { type: 'application/pdf' });
      const fileInput = document.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      fireEvent.change(fileInput!, { target: { files: [file] } });

      await waitFor(() => {
        expect(screen.getByText('cert.pdf')).toBeInTheDocument();
      });

      await user.type(screen.getByLabelText(/communion date/i), '2024-05-01');
      await user.type(screen.getByLabelText(/officiating priest/i), 'Fr. Jones');
      await user.selectOptions(screen.getByRole('combobox', { name: /mass venue/i }), 'St Mary');

      const saveBtn = screen.getByRole('button', { name: /save.*register communion|register communion/i });
      await waitFor(() => {
        expect(saveBtn).not.toBeDisabled();
      });
      await user.click(saveBtn);

      await waitFor(() => {
        expect(createCommunionWithCertificate).toHaveBeenCalledWith(
          10,
          expect.objectContaining({
            communionDate: '2024-05-01',
            officiatingPriest: 'Fr. Jones',
            parish: 'St Mary',
          }),
          expect.any(File),
          expect.objectContaining({
            baptismName: 'John',
            surname: 'Smith',
            otherNames: 'Paul',
            gender: 'MALE',
            fathersName: 'James Smith',
            mothersName: 'Mary Smith',
            baptisedChurchAddress: '123 Church St',
          })
        );
      });
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/communions');
      });
      expect(createCommunion).not.toHaveBeenCalled();
    });

    it('switching back to Baptism in this Parish clears external fields and certificate', async () => {
      const user = userEvent.setup();
      render(<CommunionCreatePage />);
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /communion details/i })).toBeInTheDocument();
      });
      await user.click(screen.getByRole('radio', { name: /baptism from another parish/i }));
      await user.type(screen.getByLabelText(/baptism name/i), 'John');
      const fileInput = document.querySelector('input[type="file"]');
      await user.upload(fileInput!, new File(['x'], 'x.pdf', { type: 'application/pdf' }));

      await user.click(screen.getByRole('radio', { name: /baptism in this parish/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/search baptism records/i)).toBeInTheDocument();
      });
      await user.click(screen.getByRole('radio', { name: /baptism from another parish/i }));
      expect(screen.getByLabelText(/baptism name/i)).toHaveValue('');
      expect(screen.getByText(/no file chosen/i)).toBeInTheDocument();
    });
  });
});

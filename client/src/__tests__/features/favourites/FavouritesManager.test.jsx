import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FavouritesManager from '../../../features/favourites/components/FavouritesManager';
import { SUPPORTED_LEAGUES, LEAGUE_DISPLAY_NAMES } from '../../../constants/leagues';

vi.mock('../../../features/favourites/hooks/useFavourites');
vi.mock('../../../contexts/AuthContext');
vi.mock('../../../services/leagueApi');

import { useFavourites } from '../../../features/favourites/hooks/useFavourites';
import { useAuth } from '../../../contexts/AuthContext';
import { updateFollowedLeagues } from '../../../services/leagueApi';

const mockAddFavourite = vi.fn();
const mockRemoveFavourite = vi.fn();
const mockUpdateUser = vi.fn();
const mockOnClose = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  useFavourites.mockReturnValue({
    favourites: [],
    loading: false,
    addFavourite: mockAddFavourite,
    removeFavourite: mockRemoveFavourite,
  });
  useAuth.mockReturnValue({
    user: { followedLeagues: [] },
    updateUser: mockUpdateUser,
  });
  updateFollowedLeagues.mockResolvedValue({});
});

describe('FavouritesManager', () => {
  it('renders the Leagues tab and one tab per supported league', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    expect(screen.getByRole('button', { name: 'Leagues' })).toBeInTheDocument();
    SUPPORTED_LEAGUES.forEach((league) => {
      expect(screen.getByRole('button', { name: LEAGUE_DISPLAY_NAMES[league] || league })).toBeInTheDocument();
    });
  });

  it('shows Follow/Unfollow buttons for each league on the Leagues panel by default', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    const followButtons = screen.getAllByRole('button', { name: /Follow|Unfollow/ });
    expect(followButtons.length).toBeGreaterThanOrEqual(3);
  });

  it('shows Unfollow on leagues the user already follows', () => {
    useAuth.mockReturnValue({
      user: { followedLeagues: ['NBA'] },
      updateUser: mockUpdateUser,
    });
    render(<FavouritesManager onClose={mockOnClose} />);
    expect(screen.getAllByRole('button', { name: 'Unfollow' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Follow' })).toHaveLength(SUPPORTED_LEAGUES.length - 1);
  });

  it('switches to a team list when a league tab is clicked', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'NBA' }));
    expect(screen.getByText('Atlanta Hawks')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles Lakers')).toBeInTheDocument();
  });

  it('shows loading text while favourites are being fetched', () => {
    useFavourites.mockReturnValue({ favourites: [], loading: true, addFavourite: vi.fn(), removeFavourite: vi.fn() });
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'NBA' }));
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('calls addFavourite with correct args when a team Add button is clicked', async () => {
    mockAddFavourite.mockResolvedValue({});
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'NBA' }));

    const addButtons = screen.getAllByRole('button', { name: 'Add' });
    fireEvent.click(addButtons[0]); // Atlanta Hawks is first alphabetically

    await waitFor(() => expect(mockAddFavourite).toHaveBeenCalledWith({
      league: 'NBA',
      teamId: 'nba-atl',
      teamName: 'Atlanta Hawks',
    }));
  });

  it('shows Remove and calls removeFavourite for a team already in favourites', async () => {
    useFavourites.mockReturnValue({
      favourites: [{ _id: 'fav-1', teamId: 'nba-atl', league: 'NBA' }],
      loading: false,
      addFavourite: mockAddFavourite,
      removeFavourite: mockRemoveFavourite,
    });
    mockRemoveFavourite.mockResolvedValue({});

    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'NBA' }));

    const removeButton = screen.getByRole('button', { name: 'Remove' });
    fireEvent.click(removeButton);

    await waitFor(() => expect(mockRemoveFavourite).toHaveBeenCalledWith('fav-1'));
  });

  it('calls updateFollowedLeagues and updateUser when a league is toggled', async () => {
    render(<FavouritesManager onClose={mockOnClose} />);

    const followButtons = screen.getAllByRole('button', { name: 'Follow' });
    fireEvent.click(followButtons[0]);

    await waitFor(() => expect(updateFollowedLeagues).toHaveBeenCalled());
    expect(mockUpdateUser).toHaveBeenCalled();
  });

  it('calls onClose when the backdrop is clicked', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(document.querySelector('.modal-overlay'));
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('does not close when the modal content itself is clicked', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(document.querySelector('.modal'));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('shows an error message when addFavourite fails', async () => {
    mockAddFavourite.mockRejectedValue(new Error('Network error'));
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'NBA' }));
    fireEvent.click(screen.getAllByRole('button', { name: 'Add' })[0]);
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
  });

  it('shows an error message when updateFollowedLeagues fails', async () => {
    updateFollowedLeagues.mockRejectedValue(new Error('Server error'));
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getAllByRole('button', { name: 'Follow' })[0]);
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
  });

  it('clears the error when a new operation begins', async () => {
    mockAddFavourite.mockRejectedValueOnce(new Error('fail')).mockResolvedValue({});
    render(<FavouritesManager onClose={mockOnClose} />);
    fireEvent.click(screen.getByRole('button', { name: 'NBA' }));
    const addButtons = screen.getAllByRole('button', { name: 'Add' });
    fireEvent.click(addButtons[0]);
    await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
    fireEvent.click(addButtons[1]);
    await waitFor(() => expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument());
  });
});

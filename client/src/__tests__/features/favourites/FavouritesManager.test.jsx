import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FavouritesManager from '../../../features/favourites/components/FavouritesManager';
import { SUPPORTED_LEAGUES, LEAGUE_DISPLAY_NAMES } from '../../../constants/leagues';

vi.mock('../../../features/favourites/hooks/useFavourites');
vi.mock('../../../features/players/hooks/usePlayerFavourites');
vi.mock('../../../features/players/hooks/useRoster');
vi.mock('../../../contexts/AuthContext');
vi.mock('../../../services/leagueApi');

import { useFavourites } from '../../../features/favourites/hooks/useFavourites';
import { usePlayerFavourites } from '../../../features/players/hooks/usePlayerFavourites';
import { useRoster } from '../../../features/players/hooks/useRoster';
import { useAuth } from '../../../contexts/AuthContext';
import { updateFollowedLeagues } from '../../../services/leagueApi';

const mockAddFavourite = vi.fn();
const mockRemoveFavourite = vi.fn();
const mockAddPlayerFavourite = vi.fn();
const mockRemovePlayerFavourite = vi.fn();
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
  usePlayerFavourites.mockReturnValue({
    playerFavourites: [],
    loading: false,
    addPlayerFavourite: mockAddPlayerFavourite,
    removePlayerFavourite: mockRemovePlayerFavourite,
  });
  useRoster.mockReturnValue({ roster: [], status: 'idle' });
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

  it('groups the leagues list by region, with a header per region', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    expect(screen.getByText('North America')).toBeInTheDocument();
    expect(screen.getByText('Europe')).toBeInTheDocument();
    expect(screen.getByText('South America')).toBeInTheDocument();
    expect(screen.getByText('Asia')).toBeInTheDocument();
    expect(screen.getByText('Oceania')).toBeInTheDocument();
    expect(screen.getByText('International')).toBeInTheDocument();
  });

  it('lists a league under its own region section, not just anywhere on the page', () => {
    render(<FavouritesManager onClose={mockOnClose} />);
    const northAmerica = screen.getByText('North America').closest('.team-list__region');
    expect(northAmerica).not.toBeNull();
    expect(within(northAmerica).getByText('NBA')).toBeInTheDocument();
    expect(within(northAmerica).queryByText('Premier League')).not.toBeInTheDocument();
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

  describe('Players sub-tab (NFL + NBA + NHL)', () => {
    it('does not show a Teams/Players sub-tab for a league outside the player-pages rollout', () => {
      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'AFL' }));
      expect(screen.queryByRole('button', { name: 'Players' })).not.toBeInTheDocument();
    });

    it('shows a Teams/Players sub-tab for NBA too, not just the NFL pilot', () => {
      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NBA' }));
      expect(screen.getByRole('button', { name: 'Teams' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Players' })).toBeInTheDocument();
    });

    it('shows a Teams/Players sub-tab for NHL too', () => {
      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NHL' }));
      expect(screen.getByRole('button', { name: 'Teams' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Players' })).toBeInTheDocument();
    });

    it('shows a Teams/Players sub-tab for NFL and defaults to the team list', () => {
      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      expect(screen.getByRole('button', { name: 'Teams' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Players' })).toBeInTheDocument();
      expect(screen.getByText('Arizona Cardinals')).toBeInTheDocument();
    });

    it('switches to the roster picker when Players is clicked, with a team selector', () => {
      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Players' }));
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Add' })).not.toBeInTheDocument();
    });

    it('resets back to the Teams sub-tab when switching league tabs', () => {
      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Players' }));
      fireEvent.click(screen.getByRole('button', { name: 'AFL' }));
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      expect(screen.getByText('Arizona Cardinals')).toBeInTheDocument();
    });

    it('shows the roster once a team is selected and lets you follow a player', async () => {
      useRoster.mockReturnValue({
        roster: [{ id: '111', name: 'Kyler Murray', position: 'QB', headshotUrl: 'https://example.com/km.png' }],
        status: 'ready',
      });
      mockAddPlayerFavourite.mockResolvedValue({});

      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Players' }));
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nfl-ari' } });

      expect(screen.getByText('Kyler Murray')).toBeInTheDocument();
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => expect(mockAddPlayerFavourite).toHaveBeenCalledWith({
        league: 'NFL',
        playerId: '111',
        playerName: 'Kyler Murray',
        teamId: 'nfl-ari',
        teamName: 'Arizona Cardinals',
        position: 'QB',
        headshotUrl: 'https://example.com/km.png',
      }));
    });

    it('shows Remove and calls removePlayerFavourite for an already-followed player', async () => {
      useRoster.mockReturnValue({
        roster: [{ id: '111', name: 'Kyler Murray', position: 'QB', headshotUrl: '' }],
        status: 'ready',
      });
      usePlayerFavourites.mockReturnValue({
        playerFavourites: [{ _id: 'pf-1', playerId: '111', league: 'NFL' }],
        loading: false,
        addPlayerFavourite: mockAddPlayerFavourite,
        removePlayerFavourite: mockRemovePlayerFavourite,
      });
      mockRemovePlayerFavourite.mockResolvedValue({});

      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Players' }));
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nfl-ari' } });

      fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
      await waitFor(() => expect(mockRemovePlayerFavourite).toHaveBeenCalledWith('pf-1'));
    });

    it('shows an error message when addPlayerFavourite fails', async () => {
      useRoster.mockReturnValue({
        roster: [{ id: '111', name: 'Kyler Murray', position: 'QB', headshotUrl: '' }],
        status: 'ready',
      });
      mockAddPlayerFavourite.mockRejectedValue(new Error('Network error'));

      render(<FavouritesManager onClose={mockOnClose} />);
      fireEvent.click(screen.getByRole('button', { name: 'NFL' }));
      fireEvent.click(screen.getByRole('button', { name: 'Players' }));
      fireEvent.change(screen.getByRole('combobox'), { target: { value: 'nfl-ari' } });
      fireEvent.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => expect(screen.getByText(/something went wrong/i)).toBeInTheDocument());
    });
  });
});

import { useCallback, useEffect, useState } from 'react';
import {
  deleteFavouriteTeam,
  fetchFavouriteTeams,
  saveFavouriteTeam,
} from '../services/favouritesApi';

export function useFavourites() {
  const [favourites, setFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchFavouriteTeams()
      .then(({ favourites }) => setFavourites(favourites))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addFavourite(payload) {
    const { favourite } = await saveFavouriteTeam(payload);
    setFavourites((prev) => [...prev, favourite]);
  }

  async function removeFavourite(favouriteId) {
    await deleteFavouriteTeam(favouriteId);
    setFavourites((prev) => prev.filter((f) => f._id !== favouriteId));
  }

  return { favourites, loading, addFavourite, removeFavourite };
}

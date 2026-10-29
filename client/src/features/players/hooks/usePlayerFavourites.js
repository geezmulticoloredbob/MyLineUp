import { useCallback, useEffect, useState } from 'react';
import {
  deletePlayerFavourite,
  fetchPlayerFavourites,
  savePlayerFavourite,
} from '../services/playersApi';

export function usePlayerFavourites() {
  const [playerFavourites, setPlayerFavourites] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetchPlayerFavourites()
      .then(({ favourites }) => setPlayerFavourites(favourites))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function addPlayerFavourite(payload) {
    const { favourite } = await savePlayerFavourite(payload);
    setPlayerFavourites((prev) => [...prev, favourite]);
  }

  async function removePlayerFavourite(favouriteId) {
    await deletePlayerFavourite(favouriteId);
    setPlayerFavourites((prev) => prev.filter((f) => f._id !== favouriteId));
  }

  return { playerFavourites, loading, addPlayerFavourite, removePlayerFavourite };
}

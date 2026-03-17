import { createContext, useContext, useState } from 'react';

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const [refreshTick, setRefreshTick] = useState(0);

  function triggerRefresh() {
    setRefreshTick((t) => t + 1);
  }

  return (
    <FavouritesContext.Provider value={{ refreshTick, triggerRefresh }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavouritesRefresh() {
  return useContext(FavouritesContext);
}

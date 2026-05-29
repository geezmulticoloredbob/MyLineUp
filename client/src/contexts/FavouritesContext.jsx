import { createContext, useContext, useState } from 'react';

const FavouritesContext = createContext(null);

export function FavouritesProvider({ children }) {
  const [refreshTick, setRefreshTick] = useState(0);
  const [managerOpen, setManagerOpen] = useState(false);

  function triggerRefresh() {
    setRefreshTick((t) => t + 1);
  }

  function openManager() {
    setManagerOpen(true);
  }

  function closeManager(wasDirty = false) {
    setManagerOpen(false);
    if (wasDirty) triggerRefresh();
  }

  return (
    <FavouritesContext.Provider value={{ refreshTick, triggerRefresh, managerOpen, openManager, closeManager }}>
      {children}
    </FavouritesContext.Provider>
  );
}

export function useFavouritesRefresh() {
  return useContext(FavouritesContext);
}

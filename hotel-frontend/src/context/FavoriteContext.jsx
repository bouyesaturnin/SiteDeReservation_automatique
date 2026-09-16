import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../api/axios';

const FavoriteContext = createContext();

export const FavoriteProvider = ({ children }) => {
  const [favoriteIds, setFavoriteIds] = useState(new Set());
  const isLoggedIn = !!localStorage.getItem('token');

  const fetchFavorites = useCallback(() => {
    if (!localStorage.getItem('token')) { setFavoriteIds(new Set()); return; }
    api.get('favorites/')
      .then(res => setFavoriteIds(new Set(Array.isArray(res.data) ? res.data : [])))
      .catch(() => setFavoriteIds(new Set()));
  }, []);

  useEffect(() => { fetchFavorites(); }, [isLoggedIn]);

  const toggle = useCallback(async (roomId) => {
    if (!localStorage.getItem('token')) return false;
    try {
      const res = await api.post(`favorites/${roomId}/toggle/`);
      setFavoriteIds(prev => {
        const next = new Set(prev);
        res.data.is_favorited ? next.add(roomId) : next.delete(roomId);
        return next;
      });
      return res.data.is_favorited;
    } catch { return null; }
  }, []);

  const isFavorited = (roomId) => favoriteIds.has(roomId);

  return (
    <FavoriteContext.Provider value={{ favoriteIds, toggle, isFavorited, fetchFavorites }}>
      {children}
    </FavoriteContext.Provider>
  );
};

export const useFavorites = () => useContext(FavoriteContext);

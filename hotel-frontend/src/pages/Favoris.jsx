import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getRoomImage } from '../api/roomImages';
import LazyImage from '../components/LazyImage';
import Skeleton from '../components/Skeleton';
import { useFavorites } from '../context/FavoriteContext';
import { useToast } from '../context/ToastContext';
import { Heart, BedDouble, Users, Star, ArrowRight, Compass } from 'lucide-react';

const TYPE_LABELS = { SINGLE: 'Simple', DOUBLE: 'Double', SUITE: 'Suite' };
const TYPE_COLORS = {
  SINGLE: 'bg-blue-100 text-blue-700',
  DOUBLE: 'bg-purple-100 text-purple-700',
  SUITE:  'bg-amber-100 text-amber-700',
};

const Favoris = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { favoriteIds, toggle } = useFavorites();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (favoriteIds.size === 0) { setRooms([]); setLoading(false); return; }
    setLoading(true);
    api.get('rooms/')
      .then(res => {
        const all = Array.isArray(res.data) ? res.data : [];
        setRooms(all.filter(r => favoriteIds.has(r.id)));
      })
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [favoriteIds]);

  const handleToggle = async (roomId) => {
    const result = await toggle(roomId);
    if (result === false) toast('Retiré des favoris.', 'info');
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
        <div className="mb-10 space-y-2">
          <Skeleton className="h-10 w-56" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl shadow overflow-hidden">
              <Skeleton className="h-52 rounded-none" />
              <div className="p-6 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white flex items-center gap-3">
            <Heart className="text-red-500 fill-red-500" size={34} />
            Mes favoris
          </h1>
          <p className="text-gray-400 mt-1">
            {rooms.length === 0 ? 'Aucune chambre sauvegardée' : `${rooms.length} chambre${rooms.length > 1 ? 's' : ''} sauvegardée${rooms.length > 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={() => navigate('/explorer')}
          className="flex items-center gap-2 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 px-5 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition">
          <Compass size={16} /> Explorer
        </button>
      </div>

      {/* VIDE */}
      {rooms.length === 0 && (
        <div className="flex flex-col items-center justify-center py-28 text-center bg-white dark:bg-gray-900 rounded-2xl shadow">
          <div className="w-20 h-20 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <Heart size={36} className="text-red-300" />
          </div>
          <h3 className="text-xl font-bold text-gray-700 dark:text-gray-300 mb-2">Aucun favori pour le moment</h3>
          <p className="text-gray-400 mb-8 max-w-sm">
            Cliquez sur le cœur d'une chambre pour la sauvegarder ici et la retrouver facilement.
          </p>
          <button onClick={() => navigate('/explorer')}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700">
            Explorer les chambres <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* GRILLE */}
      {rooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {rooms.map(room => (
            <div key={room.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow hover:shadow-xl transition-all duration-300 overflow-hidden group">

              {/* IMAGE */}
              <div className="h-52 bg-gray-100 overflow-hidden relative cursor-pointer"
                onClick={() => navigate(`/room/${room.id}`)}>
                <LazyImage
                  src={getRoomImage(room)}
                  alt={room.name}
                  fallback={`https://picsum.photos/seed/fav-${room.id}/800/500`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${TYPE_COLORS[room.room_type] || 'bg-gray-100 text-gray-600'}`}>
                    {TYPE_LABELS[room.room_type] || room.room_type}
                  </span>
                </div>
                {/* Bouton cœur */}
                <button
                  onClick={e => { e.stopPropagation(); handleToggle(room.id); }}
                  className="absolute top-3 right-3 w-9 h-9 bg-white dark:bg-gray-900 rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                  title="Retirer des favoris"
                >
                  <Heart size={18} className="text-red-500 fill-red-500" />
                </button>
                {/* Note */}
                {room.avg_rating && (
                  <div className="absolute bottom-3 right-3 bg-white/90 dark:bg-gray-900/90 backdrop-blur rounded-lg px-2 py-1 flex items-center gap-1">
                    <Star size={12} className="text-amber-400 fill-amber-400" />
                    <span className="text-xs font-black text-gray-800 dark:text-white">{room.avg_rating}</span>
                  </div>
                )}
              </div>

              {/* CONTENU */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 transition"
                  onClick={() => navigate(`/room/${room.id}`)}>
                  {room.name}
                </h3>
                {room.avg_rating ? (
                  <p className="text-xs text-gray-400 mb-3 flex items-center gap-1">
                    <Star size={11} className="text-amber-400 fill-amber-400" />
                    {room.avg_rating} · {room.review_count} avis
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 mb-3">Pas encore d'avis</p>
                )}

                <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <span className="flex items-center gap-1"><BedDouble size={15} className="text-blue-500" />{TYPE_LABELS[room.room_type]}</span>
                  <span className="flex items-center gap-1"><Users size={15} className="text-blue-500" />{room.capacity} pers.</span>
                </div>

                <div className="flex items-baseline gap-1 mb-4">
                  <span className="text-3xl font-black text-gray-900 dark:text-white">{room.price_per_night}€</span>
                  <span className="text-gray-400 text-sm"> / nuit</span>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => navigate(`/room/${room.id}`)}
                    className="flex items-center gap-1 border border-blue-600 text-blue-600 px-3 py-2 rounded-xl font-bold text-sm hover:bg-blue-50 dark:hover:bg-blue-950 transition">
                    Détails
                  </button>
                  <button onClick={() => navigate(`/reservation/${room.id}`)}
                    disabled={room.is_available === false}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-blue-700 transition disabled:opacity-50">
                    Réserver <ArrowRight size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Favoris;
